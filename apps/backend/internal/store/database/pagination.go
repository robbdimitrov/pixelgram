package database

import (
	"time"

	"phasma/backend/internal/pagination"
)

func CursorValues(cursor *pagination.Cursor) (bool, time.Time, int64) {
	if cursor == nil {
		return false, time.Time{}, 0
	}
	return true, cursor.Created, cursor.ID
}
