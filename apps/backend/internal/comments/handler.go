package comments

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"pixelgram/backend/internal/compat"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/store"
)

type Comment struct {
	ID       int       `json:"id"`
	PostID   int       `json:"postId"`
	UserID   int       `json:"userId"`
	Username string    `json:"username"`
	Avatar   *string   `json:"avatar"`
	Body     string    `json:"body"`
	Created  time.Time `json:"created"`
}

type Store interface {
	PostExists(ctx context.Context, publicID string) (bool, error)
	CreateComment(ctx context.Context, postID, userID, body string) (Comment, error)
	ListComments(ctx context.Context, postID string, cursor *compat.Cursor, limit int) ([]Comment, *compat.Cursor, error)
	DeleteComment(ctx context.Context, postID, commentID, userID string) (bool, error)
}

type Handler struct {
	Store Store
}

func (h Handler) CreateComment(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, _ := httpx.UserID(r)
	postID := r.PathValue("publicId")
	if !compat.ValidUUID(postID) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid post ID.")
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
	if len([]rune(body.Body)) > 400 {
		httpx.WriteMessage(w, http.StatusBadRequest, "Comment must be 400 characters or fewer.")
		return
	}

	comment, err := h.Store.CreateComment(ctx, postID, userID, body.Body)
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
	postID := r.PathValue("publicId")
	if !compat.ValidUUID(postID) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid post ID.")
		return
	}
	pagination, ok := compat.ParsePagination(r.URL.Query())
	if !ok {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid pagination parameters.")
		return
	}
	exists, err := h.Store.PostExists(ctx, postID)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if !exists {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
		return
	}

	items, nextCursor, err := h.Store.ListComments(ctx, postID, pagination.Cursor, pagination.Limit)
	if errors.Is(err, store.ErrUnavailable) {
		httpx.WriteMessage(w, http.StatusServiceUnavailable, "Service Unavailable")
		return
	}
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, compat.NewCursorPage(items, nextCursor))
}

func (h Handler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, _ := httpx.UserID(r)
	postID := r.PathValue("publicId")
	commentID := r.PathValue("commentId")
	if !compat.ValidUUID(postID) || !compat.ParseID(commentID) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid ID.")
		return
	}

	found, err := h.Store.DeleteComment(ctx, postID, commentID, userID)
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
