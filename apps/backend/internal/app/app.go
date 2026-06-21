package app

import (
	"context"
	"net/http"

	"pixelgram/backend/internal/blobstore"
	"pixelgram/backend/internal/comments"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/posts"
	"pixelgram/backend/internal/search"
	"pixelgram/backend/internal/sessions"
	"pixelgram/backend/internal/uploads"
	"pixelgram/backend/internal/users"
)

type Config struct {
	Blobs         blobstore.Store
	RateLimiter   httpx.RateLimiterStore
	LoginThrottle sessions.LoginThrottle
	Readiness     func(context.Context) error
	Meili         *search.MeiliClient
}

type Repositories struct {
	SessionAuth httpx.SessionStore
	Users       users.Repository
	Sessions    sessions.Repository
	Uploads     uploads.Repository
	Posts       posts.Repository
	Comments    comments.Repository
	Search      search.Repository
}

func New(cfg Config, repositories Repositories) http.Handler {
	if cfg.Blobs == nil {
		cfg.Blobs = blobstore.NewMemoryStore()
	}
	if cfg.RateLimiter == nil {
		cfg.RateLimiter = httpx.NoopRateLimiterStore{}
	}
	if cfg.LoginThrottle == nil {
		cfg.LoginThrottle = sessions.NoopLoginThrottle{}
	}
	protected := http.NewServeMux()
	userHandler := users.NewHandler(users.NewService(repositories.Users, cfg.Blobs))
	sessionHandler := sessions.NewHandler(sessions.NewService(repositories.Sessions, cfg.LoginThrottle))
	uploadHandler := uploads.Handler{
		Service: uploads.NewService(repositories.Uploads), Store: cfg.Blobs,
	}
	postHandler := posts.Handler{Service: posts.NewService(
		repositories.Posts, uploads.Files{Store: cfg.Blobs},
	)}
	commentHandler := comments.Handler{Service: comments.NewService(repositories.Comments)}
	searchHandler := search.Handler{Service: search.NewService(repositories.Search), Meili: cfg.Meili}

	public := http.NewServeMux()
	registerRoutes(
		routeMux{mux: public},
		routeMux{mux: protected, authenticated: true},
		handlers{
			users: userHandler, sessions: sessionHandler, uploads: uploadHandler,
			posts: postHandler, comments: commentHandler, search: searchHandler,
			readiness: cfg.Readiness,
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
