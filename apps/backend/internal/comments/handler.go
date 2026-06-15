package comments

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/pagination"
	"pixelgram/backend/internal/store"
	"pixelgram/backend/internal/validation"
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

type Application interface {
	CreateComment(ctx context.Context, command CreateCommentCommand) (Comment, error)
	ListComments(ctx context.Context, query ListQuery) ([]Comment, *pagination.Cursor, error)
	DeleteComment(ctx context.Context, command DeleteCommentCommand) error
}

type Handler struct {
	Service Application
}

func (h Handler) CreateComment(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, _ := httpx.UserID(r)
	postID := r.PathValue("publicId")
	if !validation.ValidUUID(postID) {
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

	comment, err := h.Service.CreateComment(ctx, CreateCommentCommand{
		PublicID: postID, UserID: userID, Body: body.Body,
	})
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
	if !validation.ValidUUID(postID) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid post ID.")
		return
	}
	page, ok := pagination.ParsePagination(r.URL.Query())
	if !ok {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid pagination parameters.")
		return
	}
	items, nextCursor, err := h.Service.ListComments(ctx, ListQuery{
		PublicID: postID, Cursor: page.Cursor, Limit: page.Limit,
	})
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

	httpx.WriteJSON(w, http.StatusOK, pagination.NewCursorPage(items, nextCursor))
}

func (h Handler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, _ := httpx.UserID(r)
	postID := r.PathValue("publicId")
	commentID := r.PathValue("commentId")
	if !validation.ValidUUID(postID) || !pagination.ParseID(commentID) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid ID.")
		return
	}

	err := h.Service.DeleteComment(ctx, DeleteCommentCommand{
		PublicID: postID, CommentID: commentID, UserID: userID,
	})
	if errors.Is(err, store.ErrForbidden) {
		httpx.WriteMessage(w, http.StatusForbidden, "Forbidden")
		return
	}
	if errors.Is(err, store.ErrUnavailable) {
		httpx.WriteMessage(w, http.StatusServiceUnavailable, "Service Unavailable")
		return
	}
	if errors.Is(err, store.ErrNotFound) {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
		return
	}
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
