package feed

import (
	"context"

	"phasma/backend/internal/pagination"
	"phasma/backend/internal/posts"
)

type Repository interface {
	ListFeed(ctx context.Context, userID string, cursor *pagination.Cursor, limit int) ([]posts.Post, *pagination.Cursor, error)
	InsertEntries(ctx context.Context, entries []Entry) error
	PruneByFollowee(ctx context.Context, followerID int64, followeeID int64) error
	GetFollowers(ctx context.Context, userID int64) ([]int64, error)
	GetRecentPostEntries(ctx context.Context, userID int64, limit int) ([]Entry, error)
	GetUserIsCelebrity(ctx context.Context, userID int64) (bool, error)
}
