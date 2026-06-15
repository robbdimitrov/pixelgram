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

type Repositories struct {
	SessionAuth httpx.SessionStore
	Users       users.Repository
	Sessions    sessions.Repository
	Uploads     uploads.Repository
	Posts       posts.Repository
	Comments    comments.Repository
}

func New(cfg Config, repositories Repositories) http.Handler {
	if cfg.RateLimiter == nil {
		cfg.RateLimiter = httpx.NoopRateLimiterStore{}
	}
	protected := http.NewServeMux()
	userHandler := users.NewHandler(users.NewService(repositories.Users, cfg.ImageDir))
	sessionHandler := sessions.NewHandler(sessions.NewService(repositories.Sessions))
	uploadHandler := uploads.Handler{
		Service: uploads.NewService(repositories.Uploads), ImageDir: cfg.ImageDir,
	}
	postHandler := posts.Handler{Service: posts.NewService(
		repositories.Posts, uploads.Files{ImageDir: cfg.ImageDir},
	)}
	commentHandler := comments.Handler{Service: comments.NewService(repositories.Comments)}

	public := http.NewServeMux()
	registerRoutes(
		routeMux{mux: public},
		routeMux{mux: protected, authenticated: true},
		handlers{
			users: userHandler, sessions: sessionHandler, uploads: uploadHandler,
			posts: postHandler, comments: commentHandler,
		},
	)
	protected.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
	})

	public.Handle("/", httpx.RequireSession(repositories.SessionAuth)(protected))

	return httpx.Chain(
		public,
		httpx.RequestID,
		httpx.Logger,
		httpx.SecurityHeaders,
		httpx.OriginGuard,
		httpx.RateLimit(cfg.RateLimiter),
	)
}
