package blobstore_test

import (
	"bytes"
	"context"
	"errors"
	"io"
	"testing"

	"pixelgram/backend/internal/blobstore"
)

func TestMemoryStoreRoundTrip(t *testing.T) {
	store := blobstore.NewMemoryStore()
	ctx := context.Background()
	content := []byte{0xff, 0xd8, 0xff, 0x00, 0x01, 0x02}

	if err := store.Put(ctx, "abc123", "image/jpeg", bytes.NewReader(content), int64(len(content))); err != nil {
		t.Fatalf("Put: %v", err)
	}

	rc, ct, size, err := store.Get(ctx, "abc123")
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	defer rc.Close()

	got, _ := io.ReadAll(rc)
	if !bytes.Equal(got, content) {
		t.Errorf("Get data = %v, want %v", got, content)
	}
	if ct != "image/jpeg" {
		t.Errorf("Get contentType = %q, want %q", ct, "image/jpeg")
	}
	if size != int64(len(content)) {
		t.Errorf("Get size = %d, want %d", size, int64(len(content)))
	}

	if err := store.Delete(ctx, "abc123"); err != nil {
		t.Fatalf("Delete: %v", err)
	}

	_, _, _, err = store.Get(ctx, "abc123")
	if !errors.Is(err, blobstore.ErrNotFound) {
		t.Errorf("Get after Delete = %v, want ErrNotFound", err)
	}
}

func TestMemoryStoreGetMissing(t *testing.T) {
	store := blobstore.NewMemoryStore()
	_, _, _, err := store.Get(context.Background(), "missing")
	if !errors.Is(err, blobstore.ErrNotFound) {
		t.Errorf("Get missing = %v, want ErrNotFound", err)
	}
}
