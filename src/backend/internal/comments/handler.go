package comments

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"pixelgram/backend/internal/compat"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/store"
)

type Comment struct {
	ID       int     `json:"id"`
	ImageID  int     `json:"imageId"`
	UserID   int     `json:"userId"`
	Username string  `json:"username"`
	Avatar   *string `json:"avatar"`
	Body     string  `json:"body"`
	Created  string  `json:"created"`
}

type Store interface {
	CreateComment(ctx context.Context, imageID, userID, body string) (Comment, error)
	ListComments(ctx context.Context, imageID string, page, limit int) ([]Comment, error)
	DeleteComment(ctx context.Context, imageID, commentID, userID string) (bool, error)
}

type Handler struct {
	Store Store
}

func (h Handler) CreateComment(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, _ := httpx.UserID(r)
	imageID := r.PathValue("imageId")
	if !compat.ParseID(imageID) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid image ID.")
		return
	}

	var body struct {
		Body string `json:"body"`
	}
	if !httpx.DecodeJSON(w, r, &body) {
		return
	}
	body.Body = strings.TrimSpace(body.Body)
	if body.Body == "" {
		httpx.WriteMessage(w, http.StatusBadRequest, "Comment body is required.")
		return
	}
	if len([]rune(body.Body)) > 2200 {
		httpx.WriteMessage(w, http.StatusBadRequest, "Comment must be 2200 characters or fewer.")
		return
	}

	comment, err := h.Store.CreateComment(ctx, imageID, userID, body.Body)
	if errors.Is(err, store.ErrNotFound) {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
		return
	}
	if errors.Is(err, store.ErrUnavailable) {
		httpx.WriteMessage(w, http.StatusServiceUnavailable, "Service Unavailable")
		return
	}
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, comment)
}

func (h Handler) ListComments(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	imageID := r.PathValue("imageId")
	if !compat.ParseID(imageID) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid image ID.")
		return
	}
	pagination, ok := compat.ParsePagination(r.URL.Query())
	if !ok {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid pagination parameters.")
		return
	}

	items, err := h.Store.ListComments(ctx, imageID, pagination.Page, pagination.Limit)
	if errors.Is(err, store.ErrUnavailable) {
		httpx.WriteMessage(w, http.StatusServiceUnavailable, "Service Unavailable")
		return
	}
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string][]Comment{"items": items})
}

func (h Handler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, _ := httpx.UserID(r)
	imageID := r.PathValue("imageId")
	commentID := r.PathValue("commentId")
	if !compat.ParseID(imageID) || !compat.ParseID(commentID) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid ID.")
		return
	}

	found, err := h.Store.DeleteComment(ctx, imageID, commentID, userID)
	if errors.Is(err, store.ErrForbidden) {
		httpx.WriteMessage(w, http.StatusForbidden, "Forbidden")
		return
	}
	if errors.Is(err, store.ErrUnavailable) {
		httpx.WriteMessage(w, http.StatusServiceUnavailable, "Service Unavailable")
		return
	}
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if !found {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
