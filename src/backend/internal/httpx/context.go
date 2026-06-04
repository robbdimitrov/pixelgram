package httpx

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"
)

type contextKey string

const (
	userIDKey    contextKey = "userID"
	requestIDKey contextKey = "requestID"
)

func WithUserID(r *http.Request, userID string) *http.Request {
	return r.WithContext(context.WithValue(r.Context(), userIDKey, userID))
}

func UserID(r *http.Request) (string, bool) {
	userID, ok := r.Context().Value(userIDKey).(string)
	return userID, ok
}

func WithRequestID(r *http.Request, id string) *http.Request {
	return r.WithContext(context.WithValue(r.Context(), requestIDKey, id))
}

func GetRequestID(r *http.Request) string {
	v, _ := r.Context().Value(requestIDKey).(string)
	return v
}

func newRequestID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return time.Now().Format("20060102150405.000000000")
	}
	return hex.EncodeToString(b[:])
}
