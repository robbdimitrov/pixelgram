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
