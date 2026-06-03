package httpx

import (
	"log/slog"
	"net/http"
	"net/url"
	"strings"

	"pixelgram/backend/internal/auth"
)

type SessionStore interface {
	GetSession(sessionID string) (Session, error)
	RefreshSession(sessionID string) (Session, error)
}

type Session struct {
	ID     string
	UserID string
}

func Chain(handler http.Handler, middleware ...func(http.Handler) http.Handler) http.Handler {
	for i := len(middleware) - 1; i >= 0; i-- {
		handler = middleware[i](handler)
	}
	return handler
}

func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "SAMEORIGIN")
		w.Header().Set("Referrer-Policy", "no-referrer")
		next.ServeHTTP(w, r)
	})
}

func OriginGuard(next http.Handler) http.Handler {
	unsafeMethods := map[string]bool{
		http.MethodPost:   true,
		http.MethodPut:    true,
		http.MethodPatch:  true,
		http.MethodDelete: true,
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !unsafeMethods[r.Method] {
			next.ServeHTTP(w, r)
			return
		}

		origin := r.Header.Get("Origin")
		if origin == "" {
			next.ServeHTTP(w, r)
			return
		}

		parsed, err := url.Parse(origin)
		if err != nil || parsed.Scheme == "" || parsed.Host == "" {
			WriteMessage(w, http.StatusForbidden, "Forbidden")
			return
		}

		if parsed.Scheme+"://"+parsed.Host != expectedOrigin(r) {
			WriteMessage(w, http.StatusForbidden, "Forbidden")
			return
		}

		next.ServeHTTP(w, r)
	})
}

func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		slog.Info("request", "method", r.Method, "path", r.URL.RequestURI())
		next.ServeHTTP(w, r)
	})
}

func RequireSession(store SessionStore) func(http.Handler) http.Handler {
	allowed := map[string]bool{
		http.MethodPost + " /sessions":   true,
		http.MethodDelete + " /sessions": true,
		http.MethodPost + " /users":      true,
		http.MethodOptions + " /":        true,
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodOptions || allowed[r.Method+" "+r.URL.Path] {
				next.ServeHTTP(w, r)
				return
			}

			cookie, err := r.Cookie("session")
			if err != nil || cookie.Value == "" {
				WriteMessage(w, http.StatusUnauthorized, "Unauthorized")
				return
			}

			if !auth.ValidSessionID(cookie.Value) {
				ClearSessionCookie(w)
				WriteMessage(w, http.StatusUnauthorized, "Unauthorized")
				return
			}

			session, err := store.GetSession(cookie.Value)
			if err != nil {
				WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
				return
			}
			if session.UserID == "" {
				ClearSessionCookie(w)
				WriteMessage(w, http.StatusUnauthorized, "Unauthorized")
				return
			}

			refreshed, err := store.RefreshSession(cookie.Value)
			if err != nil {
				WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
				return
			}
			if refreshed.UserID == "" {
				ClearSessionCookie(w)
				WriteMessage(w, http.StatusUnauthorized, "Unauthorized")
				return
			}

			SetSessionCookie(w, cookie.Value)
			next.ServeHTTP(w, WithUserID(r, refreshed.UserID))
		})
	}
}

func expectedOrigin(r *http.Request) string {
	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	}
	if forwardedProto := r.Header.Get("X-Forwarded-Proto"); forwardedProto != "" {
		scheme = strings.Split(forwardedProto, ",")[0]
	}
	return scheme + "://" + r.Host
}

func SetSessionCookie(w http.ResponseWriter, sessionID string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    sessionID,
		Path:     "/",
		MaxAge:   7 * 24 * 60 * 60,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})
}

func ClearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})
}
