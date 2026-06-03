package images

import (
	"net/http"

	"pixelgram/backend/internal/compat"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/uploads"
)

type Image struct {
	ID          int     `json:"id"`
	UserID      int     `json:"userId"`
	Filename    string  `json:"filename"`
	Description *string `json:"description"`
	Likes       int     `json:"likes"`
	Liked       bool    `json:"liked"`
	Created     string  `json:"created"`
}

type Store interface {
	CreateImage(userID, filename string, description *string) (int, bool, error)
	GetFeed(page, limit int, currentUserID string) ([]Image, error)
	GetImages(userID string, page, limit int, currentUserID string) ([]Image, error)
	GetLikedImages(userID string, page, limit int, currentUserID string) ([]Image, error)
	GetImage(imageID, currentUserID string) (Image, bool, error)
	DeleteImage(imageID, userID string) (string, bool, error)
	ImageExists(imageID string) (bool, error)
	LikeImage(imageID, userID string) error
	UnlikeImage(imageID, userID string) error
}

type Handler struct {
	Store    Store
	ImageDir string
}

func (h Handler) CreateImage(w http.ResponseWriter, r *http.Request) {
	userID, _ := httpx.UserID(r)
	var body struct {
		Filename    string `json:"filename"`
		Description string `json:"description"`
	}
	if !httpx.DecodeJSON(w, r, &body) {
		return
	}
	if body.Filename == "" {
		httpx.WriteMessage(w, http.StatusBadRequest, "Image filename is required.")
		return
	}

	id, created, err := h.Store.CreateImage(userID, body.Filename, &body.Description)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if !created {
		httpx.WriteMessage(w, http.StatusBadRequest, "Upload is invalid or expired.")
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, map[string]int{"id": id})
}

func (h Handler) GetFeed(w http.ResponseWriter, r *http.Request) {
	currentUserID, _ := httpx.UserID(r)
	pagination, ok := compat.ParsePagination(r.URL.Query())
	if !ok {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid pagination parameters.")
		return
	}

	images, err := h.Store.GetFeed(pagination.Page, pagination.Limit, currentUserID)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string][]Image{"items": images})
}

func (h Handler) GetImages(w http.ResponseWriter, r *http.Request) {
	h.getImageList(w, r, h.Store.GetImages)
}

func (h Handler) GetLikedImages(w http.ResponseWriter, r *http.Request) {
	h.getImageList(w, r, h.Store.GetLikedImages)
}

func (h Handler) getImageList(w http.ResponseWriter, r *http.Request, fetch func(string, int, int, string) ([]Image, error)) {
	currentUserID, _ := httpx.UserID(r)
	pagination, ok := compat.ParsePagination(r.URL.Query())
	if !ok {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid pagination parameters.")
		return
	}

	images, err := fetch(r.PathValue("userId"), pagination.Page, pagination.Limit, currentUserID)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string][]Image{"items": images})
}

func (h Handler) GetImage(w http.ResponseWriter, r *http.Request) {
	currentUserID, _ := httpx.UserID(r)
	image, found, err := h.Store.GetImage(r.PathValue("imageId"), currentUserID)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if !found {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, image)
}

func (h Handler) DeleteImage(w http.ResponseWriter, r *http.Request) {
	userID, _ := httpx.UserID(r)
	imageID := r.PathValue("imageId")
	filename, deleted, err := h.Store.DeleteImage(imageID, userID)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if deleted {
		uploads.DeleteUploadFile(h.ImageDir, filename)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if _, found, err := h.Store.GetImage(imageID, userID); err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
	} else if found {
		httpx.WriteMessage(w, http.StatusForbidden, "Forbidden")
	} else {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
	}
}

func (h Handler) LikeImage(w http.ResponseWriter, r *http.Request) {
	h.updateLike(w, r, h.Store.LikeImage)
}

func (h Handler) UnlikeImage(w http.ResponseWriter, r *http.Request) {
	h.updateLike(w, r, h.Store.UnlikeImage)
}

func (h Handler) updateLike(w http.ResponseWriter, r *http.Request, update func(string, string) error) {
	userID, _ := httpx.UserID(r)
	imageID := r.PathValue("imageId")
	exists, err := h.Store.ImageExists(imageID)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if !exists {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
		return
	}

	if err := update(imageID, userID); err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
