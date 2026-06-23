package feed

import "time"

const CelebThreshold int64 = 10000

type Entry struct {
	UserID  int64
	PostID  int64
	Created time.Time
}
