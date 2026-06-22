package sessions

import "net/http"

type routeRegistrar interface {
	HandleFunc(pattern string, handler func(http.ResponseWriter, *http.Request))
}

func RegisterRoutes(public routeRegistrar, service HandlerService) {
	handler := NewHandler(service)
	RegisterPublicRoutes(public, handler)
}

func RegisterPublicRoutes(mux routeRegistrar, handler Handler) {
	mux.HandleFunc("POST /sessions", handler.CreateSession)
	mux.HandleFunc("DELETE /sessions", handler.DeleteSession)
}

func RegisterProtectedRoutes(mux routeRegistrar, handler Handler) {
	mux.HandleFunc("GET /sessions", handler.ListSessions)
	mux.HandleFunc("DELETE /sessions/{sessionId}", handler.RevokeSession)
}
