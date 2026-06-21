package search

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"

	"pixelgram/backend/internal/database"
)

const (
	workerInterval  = time.Second
	workerBatchSize = 100
	workerMaxFails  = 5
)

// Worker drains the search_outbox and syncs documents to Meilisearch.
// Runs as a single goroutine per replica; SKIP LOCKED prevents duplicate work.
type Worker struct {
	db    *database.DB
	meili *MeiliClient
}

// NewWorker creates a Worker that drains search_outbox and syncs to Meilisearch.
func NewWorker(db *database.DB, meili *MeiliClient) *Worker {
	return &Worker{db: db, meili: meili}
}

// Run processes outbox rows on each tick until ctx is cancelled.
func (w *Worker) Run(ctx context.Context) {
	defer func() {
		if recovered := recover(); recovered != nil {
			slog.Error("search worker panicked", "panic", recovered)
		}
	}()

	ticker := time.NewTicker(workerInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			w.tick(ctx)
		}
	}
}

type outboxRow struct {
	id         int
	entityType string
	entityID   string
	attempts   int
}

func (w *Worker) tick(ctx context.Context) {
	defer func() {
		if recovered := recover(); recovered != nil {
			slog.Error("search worker tick panicked", "panic", recovered)
		}
	}()

	var rows []outboxRow
	err := w.db.Write(ctx, func() error {
		dbRows, err := w.db.Pool().Query(ctx,
			`SELECT id, entity_type, entity_id, attempts FROM search_outbox
			ORDER BY id FOR UPDATE SKIP LOCKED LIMIT $1`, workerBatchSize)
		if err != nil {
			return err
		}
		defer dbRows.Close()
		rows = rows[:0]
		for dbRows.Next() {
			var r outboxRow
			if err := dbRows.Scan(&r.id, &r.entityType, &r.entityID, &r.attempts); err != nil {
				return err
			}
			rows = append(rows, r)
		}
		return dbRows.Err()
	})
	if err != nil || len(rows) == 0 {
		if err != nil {
			slog.Warn("search worker: failed to fetch outbox rows", "error", err)
		}
		return
	}

	// Coalesce by (entity_type, entity_id), keeping the max id per entity so
	// a later write supersedes an earlier one for the same entity.
	type entityKey struct {
		entityType string
		entityID   string
	}
	type coalesced struct {
		maxID    int
		ids      []int
		attempts int
	}
	byEntity := make(map[entityKey]*coalesced, len(rows))
	for _, r := range rows {
		key := entityKey{r.entityType, r.entityID}
		c := byEntity[key]
		if c == nil {
			c = &coalesced{}
			byEntity[key] = c
		}
		c.ids = append(c.ids, r.id)
		if r.id > c.maxID {
			c.maxID = r.id
			c.attempts = r.attempts
		}
	}

	for key, c := range byEntity {
		if err := w.syncEntity(ctx, key.entityType, key.entityID); err != nil {
			slog.Warn("search worker: sync failed", "entity_type", key.entityType)
			if c.attempts+1 >= workerMaxFails {
				slog.Warn("search worker: dead-lettering entity", "entity_type", key.entityType, "attempts", c.attempts+1)
				w.deleteRows(ctx, c.ids)
			} else {
				w.incrementAttempts(ctx, c.ids)
			}
		} else {
			w.deleteRows(ctx, c.ids)
		}
	}
}

func (w *Worker) syncEntity(ctx context.Context, entityType, entityID string) error {
	switch entityType {
	case "post":
		return w.syncPost(ctx, entityID)
	case "user":
		return w.syncUser(ctx, entityID)
	case "hashtag":
		return w.syncHashtag(ctx, entityID)
	default:
		slog.Warn("search worker: unknown entity type", "entity_type", entityType)
		return nil
	}
}

func (w *Worker) syncPost(ctx context.Context, publicID string) error {
	var id int
	var username string
	var description sql.NullString
	var created int64
	var hashtags []string

	err := w.db.Read(ctx, func() error {
		return w.db.Pool().QueryRow(ctx,
			`SELECT p.id, u.username, p.description, extract(epoch from p.created)::bigint
			FROM posts p JOIN users u ON u.id = p.user_id
			WHERE p.public_id = $1`, publicID).
			Scan(&id, &username, &description, &created)
	})
	if err == nil {
		// Fetch hashtags for the post.
		var tagErr error
		_ = w.db.Read(ctx, func() error {
			rows, err := w.db.Pool().Query(ctx,
				`SELECT h.name FROM hashtags h
				JOIN post_hashtags ph ON ph.hashtag_id = h.id
				WHERE ph.post_id = $1`, id)
			if err != nil {
				tagErr = err
				return err
			}
			defer rows.Close()
			for rows.Next() {
				var tag string
				if err := rows.Scan(&tag); err != nil {
					tagErr = err
					return err
				}
				hashtags = append(hashtags, tag)
			}
			return rows.Err()
		})
		if tagErr != nil {
			return tagErr
		}

		doc := map[string]any{
			"id":          publicID,
			"description": database.NullableString(description),
			"username":    username,
			"hashtags":    hashtags,
			"created":     created,
		}
		return w.meili.UpsertDocuments(ctx, "posts", []map[string]any{doc})
	}

	// Post not found — remove from index.
	if isNoRows(err) {
		return w.meili.DeleteDocument(ctx, "posts", publicID)
	}
	return err
}

func (w *Worker) syncUser(ctx context.Context, userID string) error {
	var id int
	var username, name string

	err := w.db.Read(ctx, func() error {
		return w.db.Pool().QueryRow(ctx,
			`SELECT id, username, name FROM users WHERE id = $1`, userID).
			Scan(&id, &username, &name)
	})
	if err == nil {
		doc := map[string]any{
			"id":       strconv.Itoa(id),
			"username": username,
			"name":     name,
		}
		return w.meili.UpsertDocuments(ctx, "users", []map[string]any{doc})
	}

	if isNoRows(err) {
		return w.meili.DeleteDocument(ctx, "users", userID)
	}
	return err
}

func (w *Worker) syncHashtag(ctx context.Context, name string) error {
	var postCount int

	err := w.db.Read(ctx, func() error {
		// GROUP BY h.id produces no rows when the hashtag doesn't exist,
		// allowing isNoRows to detect deletion.
		return w.db.Pool().QueryRow(ctx,
			`SELECT count(ph.post_id)
			FROM hashtags h
			LEFT JOIN post_hashtags ph ON ph.hashtag_id = h.id
			WHERE h.name = $1
			GROUP BY h.id`, name).Scan(&postCount)
	})
	if err == nil {
		doc := map[string]any{
			"id":         name,
			"name":       name,
			"post_count": postCount,
		}
		return w.meili.UpsertDocuments(ctx, "hashtags", []map[string]any{doc})
	}

	if isNoRows(err) {
		return w.meili.DeleteDocument(ctx, "hashtags", name)
	}
	return err
}

func (w *Worker) deleteRows(ctx context.Context, ids []int) {
	_ = w.db.Write(ctx, func() error {
		_, err := w.db.Pool().Exec(ctx,
			`DELETE FROM search_outbox WHERE id = ANY($1)`, ids)
		return err
	})
}

func (w *Worker) incrementAttempts(ctx context.Context, ids []int) {
	_ = w.db.Write(ctx, func() error {
		_, err := w.db.Pool().Exec(ctx,
			`UPDATE search_outbox SET attempts = attempts + 1 WHERE id = ANY($1)`, ids)
		return err
	})
}

func isNoRows(err error) bool {
	return errors.Is(err, pgx.ErrNoRows)
}
