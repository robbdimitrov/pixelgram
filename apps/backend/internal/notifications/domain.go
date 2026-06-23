package notifications

import "time"

type Notification struct {
	ID         int64     `json:"id"`
	ExternalID string    `json:"externalId"`
	UserID     int64     `json:"userId"`
	ActorID    int64     `json:"actorId"`
	Type       string    `json:"type"`
	EntityID   string    `json:"entityId"`
	Read       bool      `json:"read"`
	Created    time.Time `json:"created"`
}
