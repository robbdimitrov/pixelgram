package app

import (
	"net/http"

	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/images"
	"pixelgram/backend/internal/sessions"
	"pixelgram/backend/internal/uploads"
	"pixelgram/backend/internal/users"
)

type Config struct {
	ImageDir string
}

type Dependencies struct {
	Sessions httpx.SessionStore
	Users    users.Store
	Auth     sessions.Store
	Uploads  uploads.Store
	Images   images.Store
}

func New(cfg Config, deps Dependencies) http.Handler {
	mux := http.NewServeMux()
	userHandler := users.Handler{Store: deps.Users, ImageDir: cfg.ImageDir}
	sessionHandler := sessions.Handler{Store: deps.Auth}
	uploadHandler := uploads.Handler{Store: deps.Uploads, ImageDir: cfg.ImageDir}
	imageHandler := images.Handler{Store: deps.Images, ImageDir: cfg.ImageDir}

	mux.HandleFunc("POST /users", userHandler.CreateUser)
	mux.HandleFunc("GET /users/{userId}", userHandler.GetUser)
	mux.HandleFunc("PUT /users/{userId}", userHandler.UpdateUser)
	mux.HandleFunc("POST /sessions", sessionHandler.CreateSession)
	mux.HandleFunc("DELETE /sessions", sessionHandler.DeleteSession)
	mux.HandleFunc("POST /uploads", uploadHandler.CreateFile)
	mux.Handle("GET /uploads/", uploads.FileServer(cfg.ImageDir))
	mux.HandleFunc("POST /images", imageHandler.CreateImage)
	mux.HandleFunc("GET /images", imageHandler.GetFeed)
	mux.HandleFunc("GET /users/{userId}/images", imageHandler.GetImages)
	mux.HandleFunc("GET /users/{userId}/likes", imageHandler.GetLikedImages)
	mux.HandleFunc("GET /images/{imageId}", imageHandler.GetImage)
	mux.HandleFunc("DELETE /images/{imageId}", imageHandler.DeleteImage)
	mux.HandleFunc("POST /images/{imageId}/likes", imageHandler.LikeImage)
	mux.HandleFunc("DELETE /images/{imageId}/likes", imageHandler.UnlikeImage)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
	})

	return httpx.Chain(
		mux,
		httpx.SecurityHeaders,
		httpx.OriginGuard,
		httpx.RequireSession(deps.Sessions),
		httpx.RequestLogger,
	)
}
