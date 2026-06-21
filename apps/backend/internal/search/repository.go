package search

import "context"

type Repository interface {
	SearchUsers(ctx context.Context, q string) ([]UserResult, error)
	SearchHashtags(ctx context.Context, q string) ([]HashtagResult, error)
}
