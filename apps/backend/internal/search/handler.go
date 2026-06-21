package search

import (
	"context"
	"net/http"
	"strings"
	"unicode/utf8"

	"pixelgram/backend/internal/httpx"
)

const (
	maxQueryLen = 50
)

type Application interface {
	SearchUsers(ctx context.Context, q string) ([]UserResult, error)
	SearchHashtags(ctx context.Context, q string) ([]HashtagResult, error)
}

type Handler struct {
	Service Application
	Meili   *MeiliClient
}

func (h Handler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if !validQuery(q) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Query must be 1 to 50 characters.")
		return
	}
	results, err := h.Service.SearchUsers(r.Context(), q)
	if err != nil {
		httpx.WriteStoreError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, results)
}

func (h Handler) SearchHashtags(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if !validQuery(q) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Query must be 1 to 50 characters.")
		return
	}
	results, err := h.Service.SearchHashtags(r.Context(), q)
	if err != nil {
		httpx.WriteStoreError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, results)
}

func validQuery(q string) bool {
	n := utf8.RuneCountInString(q)
	return n >= 1 && n <= maxQueryLen
}
