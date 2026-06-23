package feed

import "time"

type Entry struct {
	UserID  int64
	PostID  int64
	Created time.Time
}
