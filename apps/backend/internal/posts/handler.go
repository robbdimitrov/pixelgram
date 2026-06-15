package posts

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"pixelgram/backend/internal/compat"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/store"
	"pixelgram/backend/internal/uploads"
)

type Post struct {
	ID          int       `json:"id"`
	PublicID    string    `json:"publicId"`
	UserID      int       `json:"userId"`
	Username    string    `json:"username"`
	Name        string    `json:"name"`
	Avatar      *string   `json:"avatar"`
	Filename    string    `json:"filename"`
	Description *string   `json:"description"`
	Likes       int       `json:"likes"`
	Liked       bool      `json:"liked"`
	Comments    int       `json:"comments"`
	Created     time.Time `json:"created"`
}

type Store interface {
	CreatePost(ctx context.Context, userID, filename string, description *string) (string, bool, error)
	GetFeed(ctx context.Context, cursor *compat.Cursor, limit int, currentUserID string) ([]Post, *compat.Cursor, error)
	GetPosts(ctx context.Context, userID string, cursor *compat.Cursor, limit int, currentUserID string) ([]Post, *compat.Cursor, error)
	GetLikedPosts(ctx context.Context, userID string, cursor *compat.Cursor, limit int, currentUserID string) ([]Post, *compat.Cursor, error)
	GetPost(ctx context.Context, postID, currentUserID string) (Post, bool, error)
	DeletePost(ctx context.Context, postID, userID string) (string, bool, error)
	PostExists(ctx context.Context, postID string) (bool, error)
	LikePost(ctx context.Context, postID, userID string) error
	UnlikePost(ctx context.Context, postID, userID string) error
}

type Handler struct {
	Store    Store
	ImageDir string
}

func (h Handler) CreatePost(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, _ := httpx.UserID(r)
	var body struct {
		Filename    string `json:"filename"`
		Description string `json:"description"`
	}
	if !httpx.DecodeJSON(w, r, &body) {
		return
	}
	if body.Filename == "" {
		httpx.WriteMessage(w, http.StatusBadRequest, "Post filename is required.")
		return
	}
	if len([]rune(body.Description)) > 1000 {
		httpx.WriteMessage(w, http.StatusBadRequest, "Description must be 1000 characters or fewer.")
		return
	}

	var description *string
	if body.Description != "" {
		description = &body.Description
	}
	publicID, created, err := h.Store.CreatePost(ctx, userID, body.Filename, description)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if !created {
		httpx.WriteMessage(w, http.StatusBadRequest, "Upload is invalid or expired.")
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, map[string]string{"publicId": publicID})
}

func (h Handler) GetFeed(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	currentUserID, _ := httpx.UserID(r)
	pagination, ok := compat.ParsePagination(r.URL.Query())
	if !ok {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid pagination parameters.")
		return
	}

	items, nextCursor, err := h.Store.GetFeed(ctx, pagination.Cursor, pagination.Limit, currentUserID)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	writePostPage(w, items, nextCursor)
}

func (h Handler) GetPosts(w http.ResponseWriter, r *http.Request) {
	h.getPostList(w, r, h.Store.GetPosts)
}

func (h Handler) GetLikedPosts(w http.ResponseWriter, r *http.Request) {
	h.getPostList(w, r, h.Store.GetLikedPosts)
}

func (h Handler) getPostList(w http.ResponseWriter, r *http.Request, fetch func(context.Context, string, *compat.Cursor, int, string) ([]Post, *compat.Cursor, error)) {
	ctx := r.Context()
	currentUserID, _ := httpx.UserID(r)
	pagination, ok := compat.ParsePagination(r.URL.Query())
	if !ok {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid pagination parameters.")
		return
	}

	items, nextCursor, err := fetch(ctx, strings.ToLower(r.PathValue("username")), pagination.Cursor, pagination.Limit, currentUserID)
	if errors.Is(err, store.ErrNotFound) {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
		return
	}
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	writePostPage(w, items, nextCursor)
}

func writePostPage(w http.ResponseWriter, items []Post, nextCursor *compat.Cursor) {
	httpx.WriteJSON(w, http.StatusOK, compat.NewCursorPage(items, nextCursor))
}

func (h Handler) GetPost(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	currentUserID, _ := httpx.UserID(r)
	publicID := r.PathValue("publicId")
	if !compat.ValidUUID(publicID) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid post ID.")
		return
	}
	post, found, err := h.Store.GetPost(ctx, publicID, currentUserID)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if !found {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, post)
}

func (h Handler) DeletePost(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, _ := httpx.UserID(r)
	publicID := r.PathValue("publicId")
	if !compat.ValidUUID(publicID) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid post ID.")
		return
	}
	filename, deleted, err := h.Store.DeletePost(ctx, publicID, userID)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if deleted {
		uploads.DeleteUploadFile(h.ImageDir, filename)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if _, found, err := h.Store.GetPost(ctx, publicID, userID); err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
	} else if found {
		httpx.WriteMessage(w, http.StatusForbidden, "Forbidden")
	} else {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
	}
}

func (h Handler) LikePost(w http.ResponseWriter, r *http.Request) {
	h.updateLike(w, r, h.Store.LikePost)
}

func (h Handler) UnlikePost(w http.ResponseWriter, r *http.Request) {
	h.updateLike(w, r, h.Store.UnlikePost)
}

func (h Handler) updateLike(w http.ResponseWriter, r *http.Request, update func(context.Context, string, string) error) {
	ctx := r.Context()
	userID, _ := httpx.UserID(r)
	publicID := r.PathValue("publicId")
	if !compat.ValidUUID(publicID) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid post ID.")
		return
	}
	exists, err := h.Store.PostExists(ctx, publicID)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if !exists {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
		return
	}

	if err := update(ctx, publicID, userID); err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
