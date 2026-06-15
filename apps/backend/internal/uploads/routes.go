package uploads

import "net/http"

type routeRegistrar interface {
	HandleFunc(pattern string, handler func(http.ResponseWriter, *http.Request))
}

func RegisterPublicRoutes(mux routeRegistrar, handler Handler) {
	mux.HandleFunc("GET /uploads/", handler.ServeFile)
}

func RegisterProtectedRoutes(mux routeRegistrar, handler Handler) {
	mux.HandleFunc("POST /uploads", handler.CreateFile)
}
