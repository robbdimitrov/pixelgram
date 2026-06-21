package postgres

import (
	"context"

	"pixelgram/backend/internal/database"
)

// Client owns the shared database lifecycle and implements session
// authentication. Repository constructors retain only the underlying DB.
type Client struct {
	db *database.DB
}

func New(ctx context.Context, databaseURL, sessionSecret string) (*Client, error) {
	db, err := database.Open(ctx, databaseURL, sessionSecret)
	if err != nil {
		return nil, err
	}
	return NewWithDB(db), nil
}

func NewWithDB(db *database.DB) *Client {
	return &Client{db: db}
}

func (c *Client) Close() {
	c.db.Close()
}

func (c *Client) Ping(ctx context.Context) error {
	return c.db.Pool().Ping(ctx)
}

// usernameExists reports whether a user with the given username exists. Shared
// by the user and post repositories, which both gate lookups on it.
func usernameExists(ctx context.Context, db *database.DB, username string) (bool, error) {
	var exists bool
	err := db.Read(ctx, func() error {
		return db.Pool().QueryRow(ctx,
			`SELECT EXISTS (SELECT 1 FROM users WHERE username = $1)`, username).Scan(&exists)
	})
	return exists, err
}
