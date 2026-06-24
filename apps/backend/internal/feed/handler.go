package feed

import (
	"context"
	"net/http"

	"phasma/backend/internal/httpx"
	"phasma/backend/internal/pagination"
	"phasma/backend/internal/posts"
)

type Application interface {
	ListFeed(ctx context.Context, userID string, cursor *pagination.Cursor, limit int) ([]posts.Post, *pagination.Cursor, error)
}

type Handler struct {
	Service Application
}

func (h Handler) GetFeed(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, ok := httpx.UserID(r)
	if !ok {
		httpx.WriteMessage(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	page, ok := pagination.ParsePagination(r.URL.Query())
	if !ok {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid pagination parameters.")
		return
	}

	items, nextCursor, err := h.Service.ListFeed(ctx, userID, page.Cursor, page.Limit)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, pagination.NewCursorPage(items, nextCursor))
}
