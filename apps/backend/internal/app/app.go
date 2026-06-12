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
	protected := http.NewServeMux()
	userHandler := users.Handler{Store: stores.Users, ImageDir: cfg.ImageDir}
	sessionHandler := sessions.Handler{Store: stores.Sessions}
	uploadHandler := uploads.Handler{Store: stores.Uploads, ImageDir: cfg.ImageDir}
	postHandler := posts.Handler{Store: stores.Posts, ImageDir: cfg.ImageDir}
	commentHandler := comments.Handler{Store: stores.Comments}

	protected.HandleFunc("GET /users/{userId}", userHandler.GetUser)
	protected.HandleFunc("PUT /users/{userId}", userHandler.UpdateUser)
	protected.HandleFunc("DELETE /sessions", sessionHandler.DeleteSession)
	protected.HandleFunc("POST /uploads", uploadHandler.CreateFile)
	protected.HandleFunc("POST /posts", postHandler.CreatePost)
	protected.HandleFunc("GET /posts", postHandler.GetFeed)
	protected.HandleFunc("GET /users/{userId}/posts", postHandler.GetPosts)
	protected.HandleFunc("GET /users/{userId}/likes", postHandler.GetLikedPosts)
	protected.HandleFunc("GET /posts/{postId}", postHandler.GetPost)
	protected.HandleFunc("DELETE /posts/{postId}", postHandler.DeletePost)
	protected.HandleFunc("POST /posts/{postId}/likes", postHandler.LikePost)
	protected.HandleFunc("DELETE /posts/{postId}/likes", postHandler.UnlikePost)
	protected.HandleFunc("GET /posts/{postId}/comments", commentHandler.ListComments)
	protected.HandleFunc("POST /posts/{postId}/comments", commentHandler.CreateComment)
	protected.HandleFunc("DELETE /posts/{postId}/comments/{commentId}", commentHandler.DeleteComment)
	protected.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
	})

	public := http.NewServeMux()
	public.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	public.HandleFunc("POST /users", userHandler.CreateUser)
	public.HandleFunc("POST /sessions", sessionHandler.CreateSession)
	public.HandleFunc("GET /uploads/", uploadHandler.ServeFile)
	public.Handle("/", httpx.RequireSession(stores.SessionAuth)(protected))

	return httpx.Chain(
		public,
		httpx.RequestID,
		httpx.Logger,
		httpx.SecurityHeaders,
		httpx.OriginGuard,
		httpx.RateLimit(cfg.RateLimiter),
	)
}
