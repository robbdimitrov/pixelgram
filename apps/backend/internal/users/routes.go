package users

import "net/http"

type routeRegistrar interface {
	HandleFunc(pattern string, handler func(http.ResponseWriter, *http.Request))
}

func RegisterPublicRoutes(mux routeRegistrar, handler Handler) {
	mux.HandleFunc("POST /users", handler.CreateUser)
}

func RegisterProtectedRoutes(mux routeRegistrar, handler Handler) {
	mux.HandleFunc("GET /users/me", handler.GetCurrentUser)
	mux.HandleFunc("GET /users/suggested", handler.ListSuggestedUsers)
	mux.HandleFunc("GET /users/{username}/followers", handler.ListFollowers)
	mux.HandleFunc("GET /users/{username}/following", handler.ListFollowing)
	mux.HandleFunc("GET /users/{username}", handler.GetUser)
	mux.HandleFunc("PUT /users/{userId}", handler.UpdateUser)
	mux.HandleFunc("POST /users/{userId}/follow", handler.FollowUser)
	mux.HandleFunc("DELETE /users/{userId}/follow", handler.UnfollowUser)
}
