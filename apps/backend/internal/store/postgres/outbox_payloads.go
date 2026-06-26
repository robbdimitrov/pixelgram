package postgres

import "encoding/json"

type entityUserUpsertPayload struct {
	Table    string `json:"table"`
	Op       string `json:"op"`
	ID       int64  `json:"id"`
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Bio      string `json:"bio"`
}

type entityPostUpsertPayload struct {
	Table         string   `json:"table"`
	Op            string   `json:"op"`
	ID            int64    `json:"id"`
	PostID        string   `json:"post_id"`
	AuthorID      string   `json:"author_id"`
	Description   string   `json:"description"`
	Username      string   `json:"username"`
	Hashtags      []string `json:"hashtags"`
	Created       string   `json:"created"`
	FollowerCount int64    `json:"follower_count"`
}

type entityPostDeletePayload struct {
	Table            string   `json:"table"`
	Op               string   `json:"op"`
	ID               int64    `json:"id"`
	PostID           string   `json:"post_id"`
	AuthorID         string   `json:"author_id"`
	Filename         string   `json:"filename"`
	CommentPublicIDs []string `json:"comment_public_ids"`
}

type entityHashtagUpsertPayload struct {
	Table     string `json:"table"`
	Op        string `json:"op"`
	Name      string `json:"name"`
	PostCount int    `json:"post_count"`
}

type activityPayload struct {
	Op          string `json:"op"`
	PostID      string `json:"post_id,omitempty"`
	CommentID   string `json:"comment_id,omitempty"`
	ActorID     string `json:"actor_id"`
	RecipientID string `json:"recipient_id,omitempty"`
}

func marshalOutboxPayload(payload any) (string, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
