package notifications

import (
	"context"
	"net/http"
	"strconv"

	"phasma/backend/internal/httpx"
	"phasma/backend/internal/pagination"
	"phasma/backend/internal/validation"
)

type Application interface {
	ListNotifications(ctx context.Context, query ListQuery) ([]Notification, *pagination.Cursor, error)
	MarkRead(ctx context.Context, publicID string, userID int64) error
	UnreadCount(ctx context.Context, userID int64) (int, error)
}

type Handler struct {
	Service Application
}

func (h Handler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, ok := parseUserID(r)
	if !ok {
		httpx.WriteMessage(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	page, ok := pagination.ParsePagination(r.URL.Query())
	if !ok {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid pagination parameters.")
		return
	}

	items, nextCursor, err := h.Service.ListNotifications(ctx, ListQuery{
		UserID: userID, Cursor: page.Cursor, Limit: page.Limit,
	})
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, pagination.NewCursorPage(items, nextCursor))
}

func (h Handler) UnreadCount(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, ok := parseUserID(r)
	if !ok {
		httpx.WriteMessage(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	count, err := h.Service.UnreadCount(ctx, userID)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]int{"count": count})
}

func (h Handler) MarkRead(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, ok := parseUserID(r)
	if !ok {
		httpx.WriteMessage(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	publicID := r.PathValue("id")
	if !validation.ValidUUID(publicID) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid notification ID.")
		return
	}

	if err := h.Service.MarkRead(ctx, publicID, userID); err != nil {
		httpx.WriteStoreError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func parseUserID(r *http.Request) (int64, bool) {
	raw, ok := httpx.UserID(r)
	if !ok {
		return 0, false
	}
	id, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || id <= 0 {
		return 0, false
	}
	return id, true
}
