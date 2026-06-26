package postgres

import (
	"encoding/json"
	"testing"
)

func TestMarshalOutboxPayloadEscapesControlCharactersAsJSON(t *testing.T) {
	payload, err := marshalOutboxPayload(entityPostUpsertPayload{
		Table:         "posts",
		Op:            "upsert",
		ID:            42,
		PostID:        "post-id",
		AuthorID:      "7",
		Description:   "bell:\a vertical:\v quote:\" slash:\\",
		Username:      "user",
		Hashtags:      []string{"go\a", "json\v"},
		Created:       "2026-06-26T12:00:00Z",
		FollowerCount: 3,
	})
	if err != nil {
		t.Fatalf("marshalOutboxPayload() error = %v", err)
	}
	if !json.Valid([]byte(payload)) {
		t.Fatalf("payload is not valid JSON: %q", payload)
	}

	var decoded entityPostUpsertPayload
	if err := json.Unmarshal([]byte(payload), &decoded); err != nil {
		t.Fatalf("json.Unmarshal() error = %v", err)
	}
	if decoded.Description != "bell:\a vertical:\v quote:\" slash:\\" {
		t.Fatalf("description = %q", decoded.Description)
	}
	if len(decoded.Hashtags) != 2 || decoded.Hashtags[0] != "go\a" || decoded.Hashtags[1] != "json\v" {
		t.Fatalf("hashtags = %#v", decoded.Hashtags)
	}
}

func TestMarshalOutboxPayloadUsesEmptyArrays(t *testing.T) {
	tests := []struct {
		name    string
		payload any
		field   string
	}{
		{
			name: "post hashtags",
			payload: entityPostUpsertPayload{
				Table:    "posts",
				Op:       "upsert",
				Hashtags: []string{},
			},
			field: "hashtags",
		},
		{
			name: "deleted post comment ids",
			payload: entityPostDeletePayload{
				Table:      "posts",
				Op:         "delete",
				CommentIDs: []int64{},
			},
			field: "comment_ids",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payload, err := marshalOutboxPayload(tt.payload)
			if err != nil {
				t.Fatalf("marshalOutboxPayload() error = %v", err)
			}

			var decoded map[string]json.RawMessage
			if err := json.Unmarshal([]byte(payload), &decoded); err != nil {
				t.Fatalf("json.Unmarshal() error = %v", err)
			}
			field, ok := decoded[tt.field]
			if !ok || string(field) == "null" {
				t.Fatalf("%s missing or null in payload: %s", tt.field, payload)
			}
			var values []any
			if err := json.Unmarshal(field, &values); err != nil {
				t.Fatalf("json.Unmarshal(%s) error = %v", tt.field, err)
			}
			if len(values) != 0 {
				t.Fatalf("%s = %#v, want empty array", tt.field, values)
			}
		})
	}
}

func TestMarshalOutboxPayloadPreservesActivityContract(t *testing.T) {
	payload, err := marshalOutboxPayload(activityPayload{
		Op:        "uncomment",
		CommentID: 99,
		ActorID:   "7",
	})
	if err != nil {
		t.Fatalf("marshalOutboxPayload() error = %v", err)
	}
	if !json.Valid([]byte(payload)) {
		t.Fatalf("payload is not valid JSON: %q", payload)
	}

	var decoded map[string]any
	if err := json.Unmarshal([]byte(payload), &decoded); err != nil {
		t.Fatalf("json.Unmarshal() error = %v", err)
	}
	if _, ok := decoded["post_id"]; ok {
		t.Fatalf("post_id present in uncomment payload: %s", payload)
	}
	if _, ok := decoded["recipient_id"]; ok {
		t.Fatalf("recipient_id present in uncomment payload: %s", payload)
	}
	if decoded["comment_id"] != float64(99) {
		t.Fatalf("comment_id = %#v", decoded["comment_id"])
	}
}
