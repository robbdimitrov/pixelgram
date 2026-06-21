package search

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"strconv"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"

	"pixelgram/backend/internal/database"
)

const (
	workerMinInterval = time.Second
	workerMaxInterval = 30 * time.Second
	workerTickTimeout = 30 * time.Second
	workerBatchSize   = 100
	workerMaxFails    = 5
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

// Run processes outbox rows until ctx is cancelled. It holds a dedicated LISTEN
// connection so writes wake the worker immediately via pg_notify; the fallback
// timer catches any notifications missed during connection loss or restart.
func (w *Worker) Run(ctx context.Context) {
	defer func() {
		if recovered := recover(); recovered != nil {
			slog.Error("search worker panicked", "panic", recovered)
		}
	}()

	// Dedicated connection: pool connections release their LISTEN state when
	// returned to the pool, so LISTEN must live on a pinned connection.
	conn, err := w.db.Pool().Acquire(ctx)
	if err != nil {
		slog.Error("search worker: failed to acquire listen connection", "error", err)
		return
	}
	defer conn.Release()

	if _, err := conn.Exec(ctx, "LISTEN search_outbox"); err != nil {
		slog.Error("search worker: failed to listen on search_outbox", "error", err)
		return
	}

	// notifC is buffered so a burst of notifications coalesces into one pending
	// wakeup rather than queuing unbounded work items.
	notifC := make(chan struct{}, 1)
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		for {
			if _, err := conn.Conn().WaitForNotification(ctx); err != nil {
				return // ctx cancelled or connection lost; fallback timer takes over
			}
			select {
			case notifC <- struct{}{}:
			default:
			}
		}
	}()
	// wg.Wait is registered after conn.Release so it runs before it in LIFO
	// order, ensuring the goroutine exits before the connection is returned.
	defer wg.Wait()

	interval := workerMinInterval // first tick drains any rows from before startup
	timer := time.NewTimer(interval)
	defer timer.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-notifC:
			// Stop and drain the timer so it doesn't fire redundantly after we
			// handle this notification, then tick and re-arm at the new interval.
			if !timer.Stop() {
				select {
				case <-timer.C:
				default:
				}
			}
			if w.tick(ctx) {
				interval = workerMinInterval
			} else {
				interval = workerMaxInterval
			}
			timer.Reset(interval)
		case <-timer.C:
			if w.tick(ctx) {
				interval = workerMinInterval
			} else {
				interval = workerMaxInterval
			}
			timer.Reset(interval)
		}
	}
}

type outboxRow struct {
	id         int
	entityType string
	entityID   string
	attempts   int
}

// tick processes one batch. Returns true if any rows were found (so the caller
// can reset the backoff), false on an empty batch or error.
func (w *Worker) tick(ctx context.Context) (foundWork bool) {
	defer func() {
		if recovered := recover(); recovered != nil {
			slog.Error("search worker tick panicked", "panic", recovered)
		}
	}()

	// Cap total lock-hold time so a slow Meilisearch cannot park a Postgres
	// transaction — and its row locks — indefinitely.
	tickCtx, cancel := context.WithTimeout(ctx, workerTickTimeout)
	defer cancel()

	// The entire tick runs inside one transaction so the FOR UPDATE SKIP LOCKED
	// row locks are held from the SELECT through the final DELETE/UPDATE.
	// This prevents duplicate processing when multiple replicas are running.
	err := w.db.Write(tickCtx, func() error {
		tx, err := w.db.Pool().Begin(tickCtx)
		if err != nil {
			return err
		}
		defer database.Rollback(tickCtx, tx)

		dbRows, err := tx.Query(tickCtx,
			`SELECT id, entity_type, entity_id, attempts FROM search_outbox
			ORDER BY id FOR UPDATE SKIP LOCKED LIMIT $1`, workerBatchSize)
		if err != nil {
			return err
		}
		var rows []outboxRow
		for dbRows.Next() {
			var r outboxRow
			if err := dbRows.Scan(&r.id, &r.entityType, &r.entityID, &r.attempts); err != nil {
				dbRows.Close()
				return err
			}
			rows = append(rows, r)
		}
		dbRows.Close()
		if err := dbRows.Err(); err != nil {
			return err
		}
		if len(rows) == 0 {
			return nil
		}
		foundWork = true

		// Coalesce by (entity_type, entity_id), keeping the max id per entity so
		// a later write supersedes an earlier one for the same entity.
		type entityKey struct {
			entityType string
			entityID   string
		}
		type coalesced struct {
			ids      []int
			attempts int
		}
		// Rows are ordered by id ASC; overwriting attempts on each occurrence
		// means the last (highest-id) row's value is kept.
		byEntity := make(map[entityKey]*coalesced, len(rows))
		for _, r := range rows {
			key := entityKey{r.entityType, r.entityID}
			c := byEntity[key]
			if c == nil {
				c = &coalesced{}
				byEntity[key] = c
			}
			c.ids = append(c.ids, r.id)
			c.attempts = r.attempts
		}

		for key, c := range byEntity {
			if err := w.syncEntity(tickCtx, key.entityType, key.entityID); err != nil {
				slog.Warn("search worker: sync failed", "entity_type", key.entityType, "entity_id", key.entityID)
				if c.attempts+1 >= workerMaxFails {
					slog.Warn("search worker: dead-lettering entity", "entity_type", key.entityType, "entity_id", key.entityID, "attempts", c.attempts+1)
					if _, err := tx.Exec(tickCtx, `DELETE FROM search_outbox WHERE id = ANY($1)`, c.ids); err != nil {
						return err
					}
				} else {
					if _, err := tx.Exec(tickCtx, `UPDATE search_outbox SET attempts = attempts + 1 WHERE id = ANY($1)`, c.ids); err != nil {
						return err
					}
				}
			} else {
				if _, err := tx.Exec(tickCtx, `DELETE FROM search_outbox WHERE id = ANY($1)`, c.ids); err != nil {
					return err
				}
			}
		}

		return tx.Commit(tickCtx)
	})
	if err != nil {
		slog.Warn("search worker: tick failed", "error", err)
	}
	return foundWork
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
		if err := w.db.Read(ctx, func() error {
			rows, err := w.db.Pool().Query(ctx,
				`SELECT h.name FROM hashtags h
				JOIN post_hashtags ph ON ph.hashtag_id = h.id
				WHERE ph.post_id = $1`, id)
			if err != nil {
				return err
			}
			defer rows.Close()
			for rows.Next() {
				var tag string
				if err := rows.Scan(&tag); err != nil {
					return err
				}
				hashtags = append(hashtags, tag)
			}
			return rows.Err()
		}); err != nil {
			return err
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

func isNoRows(err error) bool {
	return errors.Is(err, pgx.ErrNoRows)
}
