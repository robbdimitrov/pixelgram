package app

import (
	"net/http"

	"pixelgram/backend/internal/comments"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/posts"
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
	Posts       posts.Store
	Comments    comments.Store
}

func New(cfg Config, stores Stores) http.Handler {
	if cfg.RateLimiter == nil {
		cfg.RateLimiter = httpx.NoopRateLimiterStore{}
	}
	mux := http.NewServeMux()
	userHandler := users.Handler{Store: stores.Users, ImageDir: cfg.ImageDir}
	sessionHandler := sessions.Handler{Store: stores.Sessions}
	uploadHandler := uploads.Handler{Store: stores.Uploads, ImageDir: cfg.ImageDir}
	postHandler := posts.Handler{Store: stores.Posts, ImageDir: cfg.ImageDir}
	commentHandler := comments.Handler{Store: stores.Comments}

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
	mux.HandleFunc("POST /posts", postHandler.CreatePost)
	mux.HandleFunc("GET /posts", postHandler.GetFeed)
	mux.HandleFunc("GET /users/{userId}/posts", postHandler.GetPosts)
	mux.HandleFunc("GET /users/{userId}/likes", postHandler.GetLikedPosts)
	mux.HandleFunc("GET /posts/{postId}", postHandler.GetPost)
	mux.HandleFunc("DELETE /posts/{postId}", postHandler.DeletePost)
	mux.HandleFunc("POST /posts/{postId}/likes", postHandler.LikePost)
	mux.HandleFunc("DELETE /posts/{postId}/likes", postHandler.UnlikePost)
	mux.HandleFunc("GET /posts/{postId}/comments", commentHandler.ListComments)
	mux.HandleFunc("POST /posts/{postId}/comments", commentHandler.CreateComment)
	mux.HandleFunc("DELETE /posts/{postId}/comments/{commentId}", commentHandler.DeleteComment)
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
