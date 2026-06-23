package app

import (
	"context"
	"net/http"
	"strings"
	"time"

	"pixelgram/backend/internal/comments"
	"pixelgram/backend/internal/feed"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/notifications"
	"pixelgram/backend/internal/posts"
	"pixelgram/backend/internal/search"
	"pixelgram/backend/internal/sessions"
	"pixelgram/backend/internal/uploads"
	"pixelgram/backend/internal/users"
)

type Route struct {
	Method        string
	Path          string
	Authenticated bool
}

type handlers struct {
	users         users.Handler
	sessions      sessions.Handler
	uploads       uploads.Handler
	posts         posts.Handler
	comments      comments.Handler
	search        search.Handler
	feed          feed.Handler
	notifications notifications.Handler
	readiness     func(context.Context) error
}

type routeMux struct {
	mux           *http.ServeMux
	authenticated bool
	routes        *[]Route
}

func (m routeMux) HandleFunc(pattern string, handler func(http.ResponseWriter, *http.Request)) {
	m.mux.HandleFunc(pattern, handler)
	if m.routes == nil {
		return
	}
	method, path, _ := strings.Cut(pattern, " ")
	*m.routes = append(*m.routes, Route{
		Method: method, Path: path, Authenticated: m.authenticated,
	})
}

func registerRoutes(public, protected routeMux, h handlers) {
	public.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	public.HandleFunc("GET /ready", readinessHandler(h.readiness))
	users.RegisterPublicRoutes(public, h.users)
	sessions.RegisterPublicRoutes(public, h.sessions)
	uploads.RegisterPublicRoutes(public, h.uploads)

	users.RegisterProtectedRoutes(protected, h.users)
	sessions.RegisterProtectedRoutes(protected, h.sessions)
	uploads.RegisterProtectedRoutes(protected, h.uploads)
	posts.RegisterRoutes(protected, h.posts)
	comments.RegisterRoutes(protected, h.comments)
	search.RegisterRoutes(protected, h.search)
	feed.RegisterRoutes(protected, h.feed)
	notifications.RegisterRoutes(protected, h.notifications)
}

func readinessHandler(check func(context.Context) error) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if check != nil {
			if err := check(ctx); err != nil {
				httpx.WriteMessage(w, http.StatusServiceUnavailable, "Service unavailable")
				return
			}
		}
		w.WriteHeader(http.StatusOK)
	}
}

func Routes() []Route {
	public := http.NewServeMux()
	protected := http.NewServeMux()
	routes := []Route{}
	registerRoutes(
		routeMux{mux: public, routes: &routes},
		routeMux{mux: protected, authenticated: true, routes: &routes},
		handlers{},
	)
	return routes
}
