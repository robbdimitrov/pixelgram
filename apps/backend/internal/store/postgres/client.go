package postgres

import (
	"context"

	"phasma/backend/internal/database"
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

// DB returns the underlying database handle for use by background workers.
func (c *Client) DB() *database.DB {
	return c.db
}

func (c *Client) Ping(ctx context.Context) error {
	return c.db.Pool().Ping(ctx)
}
