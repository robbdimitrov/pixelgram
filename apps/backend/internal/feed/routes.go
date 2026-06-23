package feed

import "net/http"

type routeRegistrar interface {
	HandleFunc(pattern string, handler func(http.ResponseWriter, *http.Request))
}

func RegisterRoutes(mux routeRegistrar, handler Handler) {
	mux.HandleFunc("GET /feed", handler.GetFeed)
}
