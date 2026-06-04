package store

import "errors"

var (
	ErrConflict    = errors.New("conflict")
	ErrUnavailable = errors.New("service unavailable")
)
