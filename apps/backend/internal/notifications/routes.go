package notifications

import "net/http"

type routeRegistrar interface {
	HandleFunc(pattern string, handler func(http.ResponseWriter, *http.Request))
}

func RegisterRoutes(mux routeRegistrar, handler Handler) {
	mux.HandleFunc("GET /notifications", handler.ListNotifications)
	mux.HandleFunc("PUT /notifications/{id}/read", handler.MarkRead)
}
