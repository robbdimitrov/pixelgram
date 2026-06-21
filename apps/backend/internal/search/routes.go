package search

import "net/http"

type routeRegistrar interface {
	HandleFunc(pattern string, handler func(http.ResponseWriter, *http.Request))
}

func RegisterRoutes(mux routeRegistrar, handler Handler) {
	mux.HandleFunc("GET /users/search", handler.SearchUsers)
	mux.HandleFunc("GET /hashtags/search", handler.SearchHashtags)
}
