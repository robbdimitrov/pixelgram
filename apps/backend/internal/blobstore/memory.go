package blobstore

import (
	"bytes"
	"context"
	"io"
	"sync"
)

type blob struct {
	data        []byte
	contentType string
}

type MemoryStore struct {
	mu    sync.RWMutex
	blobs map[string]blob
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{blobs: make(map[string]blob)}
}

func (s *MemoryStore) Put(_ context.Context, key, contentType string, r io.Reader, _ int64) error {
	data, err := io.ReadAll(r)
	if err != nil {
		return err
	}
	s.mu.Lock()
	s.blobs[key] = blob{data: data, contentType: contentType}
	s.mu.Unlock()
	return nil
}

func (s *MemoryStore) Get(_ context.Context, key string) (io.ReadCloser, string, int64, error) {
	s.mu.RLock()
	b, ok := s.blobs[key]
	s.mu.RUnlock()
	if !ok {
		return nil, "", 0, ErrNotFound
	}
	return io.NopCloser(bytes.NewReader(b.data)), b.contentType, int64(len(b.data)), nil
}

func (s *MemoryStore) Delete(_ context.Context, key string) error {
	s.mu.Lock()
	delete(s.blobs, key)
	s.mu.Unlock()
	return nil
}

var _ Store = (*MemoryStore)(nil)
