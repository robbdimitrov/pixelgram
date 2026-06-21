package blobstore

import (
	"context"
	"errors"
	"io"
)

var ErrNotFound = errors.New("blob not found")

type Store interface {
	Put(ctx context.Context, key, contentType string, r io.Reader, size int64) error
	Get(ctx context.Context, key string) (rc io.ReadCloser, contentType string, size int64, err error)
	Delete(ctx context.Context, key string) error
}
