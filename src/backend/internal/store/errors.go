package store

import "errors"

var (
	ErrConflict    = errors.New("conflict")
	ErrForbidden   = errors.New("forbidden")
	ErrNotFound    = errors.New("not found")
	ErrUnavailable = errors.New("service unavailable")
)
