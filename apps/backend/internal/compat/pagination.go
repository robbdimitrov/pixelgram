package compat

import (
	"encoding/base64"
	"encoding/json"
	"net/url"
	"strconv"
	"time"
)

type Cursor struct {
	Created time.Time `json:"created"`
	ID      int       `json:"id"`
}

type Pagination struct {
	Cursor *Cursor
	Limit  int
}

type CursorPage[T any] struct {
	Items      []T     `json:"items"`
	NextCursor *string `json:"nextCursor"`
}

func NewCursorPage[T any](items []T, nextCursor *Cursor) CursorPage[T] {
	var encoded *string
	if nextCursor != nil {
		value := EncodeCursor(*nextCursor)
		encoded = &value
	}
	return CursorPage[T]{Items: items, NextCursor: encoded}
}

func ParsePagination(query url.Values) (Pagination, bool) {
	if query.Has("page") {
		return Pagination{}, false
	}

	limit, ok := parseIntDefault(query.Get("limit"), 10)
	if !ok || limit < 1 {
		return Pagination{}, false
	}
	if limit > 50 {
		limit = 50
	}

	cursor, ok := DecodeCursor(query.Get("cursor"))
	if !ok {
		return Pagination{}, false
	}

	return Pagination{Cursor: cursor, Limit: limit}, true
}

func EncodeCursor(cursor Cursor) string {
	payload, err := json.Marshal(cursor)
	if err != nil {
		return ""
	}
	return base64.RawURLEncoding.EncodeToString(payload)
}

func DecodeCursor(value string) (*Cursor, bool) {
	if value == "" {
		return nil, true
	}
	if len(value) > 512 {
		return nil, false
	}

	payload, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return nil, false
	}

	var cursor Cursor
	if err := json.Unmarshal(payload, &cursor); err != nil {
		return nil, false
	}
	if cursor.Created.IsZero() || cursor.ID <= 0 {
		return nil, false
	}
	return &cursor, true
}

// ParseID validates that a path segment is a positive integer string.
func ParseID(value string) bool {
	n, err := strconv.Atoi(value)
	return err == nil && n > 0
}

func parseIntDefault(value string, fallback int) (int, bool) {
	if value == "" {
		return fallback, true
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, false
	}

	return parsed, true
}
