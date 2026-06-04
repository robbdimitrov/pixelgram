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
	ImageDir    string
	RateLimiter httpx.RateLimiterStore
}

type Stores struct {
	SessionAuth httpx.SessionStore
	Users       users.Store
	Sessions    sessions.Store
	Uploads     uploads.Store
	Images      images.Store
}

func New(cfg Config, stores Stores) http.Handler {
	if cfg.RateLimiter == nil {
		cfg.RateLimiter = httpx.NoopRateLimiterStore{}
	}
	mux := http.NewServeMux()
	userHandler := users.Handler{Store: stores.Users, ImageDir: cfg.ImageDir}
	sessionHandler := sessions.Handler{Store: stores.Sessions}
	uploadHandler := uploads.Handler{Store: stores.Uploads, ImageDir: cfg.ImageDir}
	imageHandler := images.Handler{Store: stores.Images, ImageDir: cfg.ImageDir}

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
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
		httpx.RequestID,
		httpx.Logger,
		httpx.SecurityHeaders,
		httpx.OriginGuard,
		httpx.RequireSession(stores.SessionAuth),
		httpx.RateLimit(cfg.RateLimiter),
	)
}
