package posts

import "net/http"

type routeRegistrar interface {
	HandleFunc(pattern string, handler func(http.ResponseWriter, *http.Request))
}

func RegisterRoutes(mux routeRegistrar, handler Handler) {
	mux.HandleFunc("POST /posts", handler.CreatePost)
	mux.HandleFunc("GET /users/{username}/posts", handler.GetPosts)
	mux.HandleFunc("GET /users/{username}/likes", handler.GetLikedPosts)
	mux.HandleFunc("GET /posts/{publicId}", handler.GetPost)
	mux.HandleFunc("DELETE /posts/{publicId}", handler.DeletePost)
	mux.HandleFunc("POST /posts/{publicId}/likes", handler.LikePost)
	mux.HandleFunc("DELETE /posts/{publicId}/likes", handler.UnlikePost)
}
