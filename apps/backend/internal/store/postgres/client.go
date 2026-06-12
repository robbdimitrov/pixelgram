package postgres

import (
	"context"
	"database/sql"
	"errors"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/robbdimitrov/pixelgram/apps/backend/internal/auth"
	"github.com/robbdimitrov/pixelgram/apps/backend/internal/comments"
	"github.com/robbdimitrov/pixelgram/apps/backend/internal/httpx"
	"github.com/robbdimitrov/pixelgram/apps/backend/internal/posts"
	"github.com/robbdimitrov/pixelgram/apps/backend/internal/sessions"
	"github.com/robbdimitrov/pixelgram/apps/backend/internal/store"
	"github.com/robbdimitrov/pixelgram/apps/backend/internal/users"
)

type Client struct {
	pool          *pgxpool.Pool
	sessionSecret string
	breaker       *circuitBreaker
	retryCfg      retryConfig
}

func New(ctx context.Context, databaseURL, sessionSecret string) (*Client, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}
	config.MaxConns = 10

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}

	return &Client{
		pool:          pool,
		sessionSecret: sessionSecret,
		breaker:       newCircuitBreaker("postgres"),
		retryCfg:      defaultRetryConfig(),
	}, nil
}

func (c *Client) Close() {
	c.pool.Close()
}

func (c *Client) CreateUser(ctx context.Context, name, username, email, passwordHash string) (int, error) {
	if !c.breaker.allow() {
		return 0, store.ErrUnavailable
	}
	var id int
	err := c.pool.QueryRow(
		ctx,
		`INSERT INTO users (name, username, email, password)
		VALUES ($1, $2, $3, $4) RETURNING id`,
		name, username, email, passwordHash,
	).Scan(&id)
	if err != nil {
		c.breaker.failure(err)
		if uniqueViolation(err) {
			return 0, store.ErrConflict
		}
		return 0, err
	}
	c.breaker.success()
	return id, nil
}

func (c *Client) GetUserWithEmail(ctx context.Context, email string) (sessions.UserCredentials, bool, error) {
	if !c.breaker.allow() {
		return sessions.UserCredentials{}, false, store.ErrUnavailable
	}
	var user sessions.UserCredentials
	err := withRetry(ctx, c.retryCfg, func() error {
		return c.pool.QueryRow(
			ctx,
			`SELECT id, password FROM users WHERE email = $1`,
			email,
		).Scan(&user.ID, &user.PasswordHash)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		c.breaker.success()
		return sessions.UserCredentials{}, false, nil
	}
	if err != nil {
		c.breaker.failure(err)
		return sessions.UserCredentials{}, false, err
	}
	c.breaker.success()
	return user, true, nil
}

func (c *Client) GetUserWithID(ctx context.Context, userID string) (users.UserCredentials, bool, error) {
	if !c.breaker.allow() {
		return users.UserCredentials{}, false, store.ErrUnavailable
	}
	var user users.UserCredentials
	err := withRetry(ctx, c.retryCfg, func() error {
		return c.pool.QueryRow(
			ctx,
			`SELECT id, password FROM users WHERE id = $1`,
			userID,
		).Scan(&user.ID, &user.PasswordHash)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		c.breaker.success()
		return users.UserCredentials{}, false, nil
	}
	if err != nil {
		c.breaker.failure(err)
		return users.UserCredentials{}, false, err
	}
	c.breaker.success()
	return user, true, nil
}

func (c *Client) GetUser(ctx context.Context, userID string) (users.User, bool, error) {
	if !c.breaker.allow() {
		return users.User{}, false, store.ErrUnavailable
	}
	var user users.User
	var avatar sql.NullString
	var bio sql.NullString
	err := withRetry(ctx, c.retryCfg, func() error {
		return c.pool.QueryRow(
			ctx,
			`SELECT id, name, username, email, avatar, bio,
			(SELECT count(*) FROM posts WHERE user_id = users.id) AS posts,
			(SELECT count(*) FROM likes WHERE user_id = id) AS likes,
			created
			FROM users WHERE id = $1`,
			userID,
		).Scan(
			&user.ID, &user.Name, &user.Username, &user.Email,
			&avatar, &bio, &user.Posts, &user.Likes, &user.Created,
		)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		c.breaker.success()
		return users.User{}, false, nil
	}
	if err != nil {
		c.breaker.failure(err)
		return users.User{}, false, err
	}
	c.breaker.success()
	user.Avatar = nullableString(avatar)
	user.Bio = nullableString(bio)
	return user, true, nil
}

func (c *Client) UpdateUser(ctx context.Context, userID, name, username, email, avatar string, bio *string) (users.UpdateUserResult, error) {
	if !c.breaker.allow() {
		return users.UpdateUserResult{}, store.ErrUnavailable
	}
	tx, err := c.pool.Begin(ctx)
	if err != nil {
		c.breaker.failure(err)
		return users.UpdateUserResult{}, err
	}
	defer rollback(ctx, tx)

	var oldAvatar sql.NullString
	err = tx.QueryRow(ctx, `SELECT avatar FROM users WHERE id = $1 FOR UPDATE`, userID).Scan(&oldAvatar)
	if errors.Is(err, pgx.ErrNoRows) {
		c.breaker.success()
		return users.UpdateUserResult{Updated: false}, nil
	}
	if err != nil {
		c.breaker.failure(err)
		return users.UpdateUserResult{}, err
	}

	if avatar != "" {
		var avatarExists bool
		err := tx.QueryRow(
			ctx,
			`SELECT EXISTS (
			  SELECT 1 FROM users WHERE id = $1 AND avatar = $2
			  UNION
			  SELECT 1 FROM posts WHERE user_id = $1 AND filename = $2
			) AS exists`,
			userID, avatar,
		).Scan(&avatarExists)
		if err != nil {
			c.breaker.failure(err)
			return users.UpdateUserResult{}, err
		}

		if !avatarExists {
			var consumed string
			err := tx.QueryRow(
				ctx,
				`DELETE FROM uploads WHERE user_id = $1 AND filename = $2
				RETURNING filename`,
				userID, avatar,
			).Scan(&consumed)
			if errors.Is(err, pgx.ErrNoRows) {
				c.breaker.success()
				return users.UpdateUserResult{Updated: false}, nil
			}
			if err != nil {
				c.breaker.failure(err)
				return users.UpdateUserResult{}, err
			}
		}
	}

	_, err = tx.Exec(
		ctx,
		`UPDATE users SET name = $1, username = $2,
		email = $3, avatar = NULLIF($4, ''), bio = NULLIF($5, '') WHERE id = $6`,
		name, username, email, avatar, bio, userID,
	)
	if err != nil {
		c.breaker.failure(err)
		if uniqueViolation(err) {
			return users.UpdateUserResult{}, store.ErrConflict
		}
		return users.UpdateUserResult{}, err
	}

	result := users.UpdateUserResult{Updated: true}
	if oldAvatar.Valid && oldAvatar.String != "" && oldAvatar.String != avatar {
		var stillUsed bool
		err := tx.QueryRow(
			ctx,
			`SELECT EXISTS (
			  SELECT 1 FROM posts WHERE filename = $1
			  UNION
			  SELECT 1 FROM users WHERE avatar = $1
			) AS exists`,
			oldAvatar.String,
		).Scan(&stillUsed)
		if err != nil {
			c.breaker.failure(err)
			return users.UpdateUserResult{}, err
		}
		if !stillUsed {
			result.UnusedAvatar = oldAvatar.String
		}
	}

	if err := tx.Commit(ctx); err != nil {
		c.breaker.failure(err)
		return users.UpdateUserResult{}, err
	}
	c.breaker.success()
	return result, nil
}

func (c *Client) UpdatePassword(ctx context.Context, userID, passwordHash string) error {
	if !c.breaker.allow() {
		return store.ErrUnavailable
	}
	_, err := c.pool.Exec(ctx, `UPDATE users SET password = $1 WHERE id = $2`, passwordHash, userID)
	if err != nil {
		c.breaker.failure(err)
		return err
	}
	c.breaker.success()
	return nil
}

func (c *Client) DeleteOtherSessions(ctx context.Context, userID, currentSessionID string) error {
	if !c.breaker.allow() {
		return store.ErrUnavailable
	}
	_, err := c.pool.Exec(
		ctx,
		`DELETE FROM sessions WHERE user_id = $1 AND id != $2`,
		userID, c.hashSession(currentSessionID),
	)
	if err != nil {
		c.breaker.failure(err)
		return err
	}
	c.breaker.success()
	return nil
}

const maxPendingUploads = 20

func (c *Client) CreateUpload(ctx context.Context, userID, filename string) (bool, error) {
	if !c.breaker.allow() {
		return false, store.ErrUnavailable
	}
	// Enforce the per-user cap inside the insert. This narrows the
	// check-then-insert window to a single statement; under READ COMMITTED a
	// tiny burst can still slightly exceed the cap, which is fine for a soft
	// anti-abuse limit.
	tag, err := c.pool.Exec(
		ctx,
		`INSERT INTO uploads (user_id, filename)
		SELECT $1, $2
		WHERE (SELECT count(*) FROM uploads WHERE user_id = $1) < $3`,
		userID, filename, maxPendingUploads,
	)
	if err != nil {
		c.breaker.failure(err)
		return false, err
	}
	c.breaker.success()
	return tag.RowsAffected() > 0, nil
}

func (c *Client) DeleteExpiredUploads(ctx context.Context) ([]string, error) {
	if !c.breaker.allow() {
		return nil, store.ErrUnavailable
	}
	rows, err := c.pool.Query(
		ctx,
		`DELETE FROM uploads
		WHERE created <= now() - $1::interval
		RETURNING filename`,
		"1 hour",
	)
	if err != nil {
		c.breaker.failure(err)
		return nil, err
	}
	defer rows.Close()

	filenames := []string{}
	for rows.Next() {
		var filename string
		if err := rows.Scan(&filename); err != nil {
			return nil, err
		}
		filenames = append(filenames, filename)
	}
	if err := rows.Err(); err != nil {
		c.breaker.failure(err)
		return nil, err
	}
	c.breaker.success()
	return filenames, nil
}

func (c *Client) CreatePost(ctx context.Context, userID, filename string, description *string) (int, bool, error) {
	if !c.breaker.allow() {
		return 0, false, store.ErrUnavailable
	}
	tx, err := c.pool.Begin(ctx)
	if err != nil {
		c.breaker.failure(err)
		return 0, false, err
	}
	defer rollback(ctx, tx)

	var consumed string
	err = tx.QueryRow(
		ctx,
		`DELETE FROM uploads WHERE user_id = $1 AND filename = $2
		RETURNING filename`,
		userID, filename,
	).Scan(&consumed)
	if errors.Is(err, pgx.ErrNoRows) {
		c.breaker.success()
		return 0, false, nil
	}
	if err != nil {
		c.breaker.failure(err)
		return 0, false, err
	}

	var id int
	err = tx.QueryRow(
		ctx,
		`INSERT INTO posts (user_id, filename, description)
		VALUES ($1, $2, $3) RETURNING id`,
		userID, filename, description,
	).Scan(&id)
	if err != nil {
		c.breaker.failure(err)
		return 0, false, err
	}

	if err := tx.Commit(ctx); err != nil {
		c.breaker.failure(err)
		return 0, false, err
	}
	c.breaker.success()
	return id, true, nil
}

// Shared SELECT list for post queries. $1 is the current user ID (for the
// per-row "liked" check). Joins users (u) so the author is returned inline.
const postColumns = `posts.id, posts.user_id, u.username, u.name, u.avatar,
	posts.filename, posts.description,
	(SELECT count(*) FROM likes WHERE post_id = posts.id) AS likes,
	EXISTS (SELECT 1 FROM likes
	WHERE post_id = posts.id AND likes.user_id = $1) AS liked,
	(SELECT count(*) FROM comments WHERE post_id = posts.id) AS comments,
	posts.created`

func (c *Client) GetFeed(ctx context.Context, page, limit int, currentUserID string) ([]posts.Post, error) {
	return c.queryPosts(ctx,
		`SELECT `+postColumns+`
		FROM posts
		JOIN users u ON u.id = posts.user_id
		ORDER BY posts.created DESC
		LIMIT $2 OFFSET $3`,
		currentUserID, limit, page*limit,
	)
}

func (c *Client) GetPosts(ctx context.Context, userID string, page, limit int, currentUserID string) ([]posts.Post, error) {
	return c.queryPosts(ctx,
		`SELECT `+postColumns+`
		FROM posts
		JOIN users u ON u.id = posts.user_id
		WHERE posts.user_id = $2
		ORDER BY posts.created DESC
		LIMIT $3 OFFSET $4`,
		currentUserID, userID, limit, page*limit,
	)
}

func (c *Client) GetLikedPosts(ctx context.Context, userID string, page, limit int, currentUserID string) ([]posts.Post, error) {
	return c.queryPosts(ctx,
		`SELECT `+postColumns+`
		FROM posts
		JOIN users u ON u.id = posts.user_id
		INNER JOIN likes ON likes.post_id = posts.id
		WHERE likes.user_id = $2
		ORDER BY likes.created DESC
		LIMIT $3 OFFSET $4`,
		currentUserID, userID, limit, page*limit,
	)
}

func (c *Client) GetPost(ctx context.Context, postID, currentUserID string) (posts.Post, bool, error) {
	result, err := c.queryPosts(ctx,
		`SELECT `+postColumns+`
		FROM posts
		JOIN users u ON u.id = posts.user_id
		WHERE posts.id = $2`,
		currentUserID, postID,
	)
	if err != nil {
		return posts.Post{}, false, err
	}
	if len(result) == 0 {
		return posts.Post{}, false, nil
	}
	return result[0], true, nil
}

func (c *Client) DeletePost(ctx context.Context, postID, userID string) (string, bool, error) {
	if !c.breaker.allow() {
		return "", false, store.ErrUnavailable
	}
	tx, err := c.pool.Begin(ctx)
	if err != nil {
		c.breaker.failure(err)
		return "", false, err
	}
	defer rollback(ctx, tx)

	var filename string
	err = tx.QueryRow(
		ctx,
		`DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING filename`,
		postID, userID,
	).Scan(&filename)
	if errors.Is(err, pgx.ErrNoRows) {
		c.breaker.success()
		return "", false, nil
	}
	if err != nil {
		c.breaker.failure(err)
		return "", false, err
	}

	_, err = tx.Exec(ctx, `UPDATE users SET avatar = $1 WHERE avatar = $2`, "", filename)
	if err != nil {
		c.breaker.failure(err)
		return "", false, err
	}

	if err := tx.Commit(ctx); err != nil {
		c.breaker.failure(err)
		return "", false, err
	}
	c.breaker.success()
	return filename, true, nil
}

func (c *Client) PostExists(ctx context.Context, postID string) (bool, error) {
	if !c.breaker.allow() {
		return false, store.ErrUnavailable
	}
	var exists bool
	err := withRetry(ctx, c.retryCfg, func() error {
		return c.pool.QueryRow(
			ctx,
			`SELECT EXISTS (SELECT 1 FROM posts WHERE id = $1)`,
			postID,
		).Scan(&exists)
	})
	if err != nil {
		c.breaker.failure(err)
		return false, err
	}
	c.breaker.success()
	return exists, nil
}

func (c *Client) LikePost(ctx context.Context, postID, userID string) error {
	if !c.breaker.allow() {
		return store.ErrUnavailable
	}
	_, err := c.pool.Exec(
		ctx,
		`INSERT INTO likes (user_id, post_id)
		SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM posts WHERE id = $2)
		ON CONFLICT DO NOTHING`,
		userID, postID,
	)
	if err != nil {
		c.breaker.failure(err)
		return err
	}
	c.breaker.success()
	return nil
}

func (c *Client) UnlikePost(ctx context.Context, postID, userID string) error {
	if !c.breaker.allow() {
		return store.ErrUnavailable
	}
	_, err := c.pool.Exec(ctx, `DELETE FROM likes WHERE user_id = $1 AND post_id = $2`, userID, postID)
	if err != nil {
		c.breaker.failure(err)
		return err
	}
	c.breaker.success()
	return nil
}

func (c *Client) CreateComment(ctx context.Context, postID, userID, body string) (comments.Comment, error) {
	if !c.breaker.allow() {
		return comments.Comment{}, store.ErrUnavailable
	}
	var comment comments.Comment
	var avatar sql.NullString
	err := withRetry(ctx, c.retryCfg, func() error {
		return c.pool.QueryRow(
			ctx,
			`INSERT INTO comments (post_id, user_id, body)
			SELECT $1, $2, $3 WHERE EXISTS (SELECT 1 FROM posts WHERE id = $1)
			RETURNING id, post_id, user_id,
			(SELECT username FROM users WHERE id = $2),
			(SELECT avatar FROM users WHERE id = $2),
			body, created`,
			postID, userID, body,
		).Scan(&comment.ID, &comment.PostID, &comment.UserID,
			&comment.Username, &avatar, &comment.Body, &comment.Created)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		c.breaker.success()
		return comments.Comment{}, store.ErrNotFound
	}
	if err != nil {
		c.breaker.failure(err)
		return comments.Comment{}, err
	}
	c.breaker.success()
	comment.Avatar = nullableString(avatar)
	return comment, nil
}

func (c *Client) ListComments(ctx context.Context, postID string, page, limit int) ([]comments.Comment, error) {
	if !c.breaker.allow() {
		return nil, store.ErrUnavailable
	}
	var result []comments.Comment
	err := withRetry(ctx, c.retryCfg, func() error {
		rows, err := c.pool.Query(
			ctx,
			`SELECT c.id, c.post_id, c.user_id, u.username, u.avatar, c.body, c.created
			FROM comments c
			JOIN users u ON u.id = c.user_id
			WHERE c.post_id = $1
			ORDER BY c.created ASC
			LIMIT $2 OFFSET $3`,
			postID, limit, page*limit,
		)
		if err != nil {
			return err
		}
		defer rows.Close()

		result = []comments.Comment{}
		for rows.Next() {
			var comment comments.Comment
			var avatar sql.NullString
			if err := rows.Scan(
				&comment.ID, &comment.PostID, &comment.UserID,
				&comment.Username, &avatar, &comment.Body, &comment.Created,
			); err != nil {
				return err
			}
			comment.Avatar = nullableString(avatar)
			result = append(result, comment)
		}
		return rows.Err()
	})
	if err != nil {
		c.breaker.failure(err)
		return nil, err
	}
	c.breaker.success()
	return result, nil
}

func (c *Client) DeleteComment(ctx context.Context, postID, commentID, userID string) (bool, error) {
	if !c.breaker.allow() {
		return false, store.ErrUnavailable
	}
	// Atomically delete only if the comment belongs to this post and this user.
	var deletedID int
	err := c.pool.QueryRow(
		ctx,
		`DELETE FROM comments WHERE id = $1 AND post_id = $2 AND user_id = $3 RETURNING id`,
		commentID, postID, userID,
	).Scan(&deletedID)
	if err == nil {
		c.breaker.success()
		return true, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		c.breaker.failure(err)
		return false, err
	}
	// Nothing deleted — distinguish not found from forbidden.
	var exists bool
	err = c.pool.QueryRow(
		ctx,
		`SELECT EXISTS(SELECT 1 FROM comments WHERE id = $1 AND post_id = $2)`,
		commentID, postID,
	).Scan(&exists)
	if err != nil {
		c.breaker.failure(err)
		return false, err
	}
	c.breaker.success()
	if exists {
		return true, store.ErrForbidden
	}
	return false, nil
}

func (c *Client) queryPosts(ctx context.Context, query string, args ...any) ([]posts.Post, error) {
	if !c.breaker.allow() {
		return nil, store.ErrUnavailable
	}
	var result []posts.Post
	err := withRetry(ctx, c.retryCfg, func() error {
		rows, err := c.pool.Query(ctx, query, args...)
		if err != nil {
			return err
		}
		defer rows.Close()

		result = []posts.Post{}
		for rows.Next() {
			var post posts.Post
			var description sql.NullString
			var avatar sql.NullString
			if err := rows.Scan(
				&post.ID, &post.UserID, &post.Username, &post.Name, &avatar,
				&post.Filename, &description,
				&post.Likes, &post.Liked, &post.Comments, &post.Created,
			); err != nil {
				return err
			}
			post.Avatar = nullableString(avatar)
			post.Description = nullableString(description)
			result = append(result, post)
		}
		return rows.Err()
	})
	if err != nil {
		c.breaker.failure(err)
		return nil, err
	}
	c.breaker.success()
	return result, nil
}

func (c *Client) CreateSession(ctx context.Context, sessionID string, userID int, expiresAt time.Time) (sessions.CreatedSession, error) {
	if !c.breaker.allow() {
		return sessions.CreatedSession{}, store.ErrUnavailable
	}
	var session sessions.CreatedSession
	err := c.pool.QueryRow(
		ctx,
		`INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)
		RETURNING user_id`,
		c.hashSession(sessionID), userID, expiresAt,
	).Scan(&session.UserID)
	if err != nil {
		c.breaker.failure(err)
		return sessions.CreatedSession{}, err
	}
	c.breaker.success()
	return session, nil
}

const sessionTTL = 7 * 24 * time.Hour

func (c *Client) RefreshSession(ctx context.Context, sessionID string) (httpx.Session, error) {
	if !c.breaker.allow() {
		return httpx.Session{}, store.ErrUnavailable
	}
	hashed := c.hashSession(sessionID)
	var session httpx.Session
	var userID int
	// Only write when the session is past the halfway point of its window;
	// otherwise read it. Avoids a row write on every authenticated request.
	err := withRetry(ctx, c.retryCfg, func() error {
		return c.pool.QueryRow(
			ctx,
			`WITH refreshed AS (
			  UPDATE sessions SET expires_at = $2
			  WHERE id = $1 AND expires_at > now() AND expires_at < $3
			  RETURNING id, user_id
			)
			SELECT id, user_id FROM refreshed
			UNION ALL
			SELECT id, user_id FROM sessions
			WHERE id = $1 AND expires_at > now()
			  AND NOT EXISTS (SELECT 1 FROM refreshed)
			LIMIT 1`,
			hashed,
			time.Now().Add(sessionTTL),
			time.Now().Add(sessionTTL/2),
		).Scan(&session.ID, &userID)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		c.breaker.success()
		return httpx.Session{}, nil
	}
	if err != nil {
		c.breaker.failure(err)
		return httpx.Session{}, err
	}
	c.breaker.success()
	session.UserID = strconv.Itoa(userID)
	return session, nil
}

func (c *Client) DeleteExpiredSessions(ctx context.Context) error {
	if !c.breaker.allow() {
		return store.ErrUnavailable
	}
	_, err := c.pool.Exec(ctx, `DELETE FROM sessions WHERE expires_at <= now()`)
	if err != nil {
		c.breaker.failure(err)
		return err
	}
	c.breaker.success()
	return nil
}

func (c *Client) DeleteSession(ctx context.Context, sessionID string) error {
	if !c.breaker.allow() {
		return store.ErrUnavailable
	}
	_, err := c.pool.Exec(ctx, `DELETE FROM sessions WHERE id = $1`, c.hashSession(sessionID))
	if err != nil {
		c.breaker.failure(err)
		return err
	}
	c.breaker.success()
	return nil
}

func (c *Client) DeleteExpiredLoginFailures(ctx context.Context) error {
	if !c.breaker.allow() {
		return store.ErrUnavailable
	}
	_, err := c.pool.Exec(ctx, `DELETE FROM login_failures WHERE reset_at <= now()`)
	if err != nil {
		c.breaker.failure(err)
		return err
	}
	c.breaker.success()
	return nil
}

func (c *Client) GetLoginFailures(ctx context.Context, keys []string) ([]sessions.LoginFailure, error) {
	if !c.breaker.allow() {
		return nil, store.ErrUnavailable
	}
	var failures []sessions.LoginFailure
	err := withRetry(ctx, c.retryCfg, func() error {
		rows, err := c.pool.Query(
			ctx,
			`SELECT key, count, reset_at FROM login_failures WHERE key = ANY($1)`,
			keys,
		)
		if err != nil {
			return err
		}
		defer rows.Close()

		failures = []sessions.LoginFailure{}
		for rows.Next() {
			var failure sessions.LoginFailure
			if err := rows.Scan(&failure.Key, &failure.Count, &failure.ResetAt); err != nil {
				return err
			}
			failures = append(failures, failure)
		}
		return rows.Err()
	})
	if err != nil {
		c.breaker.failure(err)
		return nil, err
	}
	c.breaker.success()
	return failures, nil
}

func (c *Client) RecordLoginFailure(ctx context.Context, key string, resetAt time.Time) error {
	if !c.breaker.allow() {
		return store.ErrUnavailable
	}
	_, err := c.pool.Exec(
		ctx,
		`INSERT INTO login_failures (key, count, reset_at) VALUES ($1, 1, $2)
		ON CONFLICT (key) DO UPDATE SET
		  count = CASE
		    WHEN login_failures.reset_at <= now() THEN 1
		    ELSE login_failures.count + 1
		  END,
		  reset_at = CASE
		    WHEN login_failures.reset_at <= now() THEN EXCLUDED.reset_at
		    ELSE login_failures.reset_at
		  END`,
		key, resetAt,
	)
	if err != nil {
		c.breaker.failure(err)
		return err
	}
	c.breaker.success()
	return nil
}

func (c *Client) ClearLoginFailures(ctx context.Context, keys []string) error {
	if !c.breaker.allow() {
		return store.ErrUnavailable
	}
	_, err := c.pool.Exec(ctx, `DELETE FROM login_failures WHERE key = ANY($1)`, keys)
	if err != nil {
		c.breaker.failure(err)
		return err
	}
	c.breaker.success()
	return nil
}

func (c *Client) hashSession(sessionID string) string {
	return auth.HashSessionToken(sessionID, c.sessionSecret)
}

func uniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func nullableString(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

func rollback(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}
