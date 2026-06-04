package app

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"pixelgram/backend/internal/httpx"
)

type fakeSessionStore struct {
	refreshSession httpx.Session
	refreshErr     error
	refreshCalls   int
}

func (store *fakeSessionStore) RefreshSession(_ string) (httpx.Session, error) {
	store.refreshCalls++
	return store.refreshSession, store.refreshErr
}

func TestHealthEndpoint(t *testing.T) {
	app := New(Config{}, Stores{SessionAuth: &fakeSessionStore{}})

	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	app.ServeHTTP(res, req)

	if res.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNoContent)
	}
}

func TestNotFoundJSON(t *testing.T) {
	app := New(Config{}, Stores{SessionAuth: &fakeSessionStore{
		refreshSession: httpx.Session{ID: "hashed-session-id", UserID: "1"},
	}})

	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/unknown", nil)
	req.AddCookie(&http.Cookie{Name: "session", Value: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA"})
	app.ServeHTTP(res, req)

	if res.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNotFound)
	}
	if strings.TrimSpace(res.Body.String()) != `{"message":"Not Found"}` {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestOriginGuardRejectsCrossOriginStateChangingRequests(t *testing.T) {
	store := &fakeSessionStore{}
	app := New(Config{}, Stores{SessionAuth: store})

	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/sessions", strings.NewReader(`{}`))
	req.Host = "localhost:8080"
	req.Header.Set("Origin", "http://evil.example")
	app.ServeHTTP(res, req)

	if res.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusForbidden)
	}
	if store.refreshCalls != 0 {
		t.Fatalf("origin rejection should not hit store")
	}
}

func TestOriginGuardRejectsMalformedOrigins(t *testing.T) {
	app := New(Config{}, Stores{SessionAuth: &fakeSessionStore{}})

	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/sessions", strings.NewReader(`{}`))
	req.Header.Set("Origin", "not a url")
	app.ServeHTTP(res, req)

	if res.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusForbidden)
	}
}

func TestSessionMissingCookie(t *testing.T) {
	app := New(Config{}, Stores{SessionAuth: &fakeSessionStore{}})

	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/unknown", nil)
	app.ServeHTTP(res, req)

	if res.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusUnauthorized)
	}
}

func TestSessionMalformedCookieClearsWithoutStore(t *testing.T) {
	store := &fakeSessionStore{}
	app := New(Config{}, Stores{SessionAuth: store})

	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/unknown", nil)
	req.AddCookie(&http.Cookie{Name: "session", Value: "not-a-valid-session"})
	app.ServeHTTP(res, req)

	if res.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusUnauthorized)
	}
	if store.refreshCalls != 0 {
		t.Fatalf("malformed session should not hit store")
	}
	if got := res.Header().Get("Set-Cookie"); !strings.Contains(got, "session=") || !strings.Contains(got, "Max-Age=0") {
		t.Fatalf("expected clearing Set-Cookie header, got %q", got)
	}
}

func TestSessionStoreErrorDoesNotClearCookie(t *testing.T) {
	app := New(Config{}, Stores{SessionAuth: &fakeSessionStore{refreshErr: errors.New("database unavailable")}})

	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/unknown", nil)
	req.AddCookie(&http.Cookie{Name: "session", Value: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA"})
	app.ServeHTTP(res, req)

	if res.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusInternalServerError)
	}
	if got := res.Header().Get("Set-Cookie"); got != "" {
		t.Fatalf("server error should not clear cookie, got %q", got)
	}
}

func TestSessionInvalidClearsCookie(t *testing.T) {
	app := New(Config{}, Stores{SessionAuth: &fakeSessionStore{}})

	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/images", nil)
	req.AddCookie(&http.Cookie{Name: "session", Value: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA"})
	app.ServeHTTP(res, req)

	if res.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusUnauthorized)
	}
	if got := res.Header().Get("Set-Cookie"); !strings.Contains(got, "session=") {
		t.Fatalf("expected clearing Set-Cookie header, got %q", got)
	}
}

func TestSessionValidRefreshesCookie(t *testing.T) {
	store := &fakeSessionStore{
		refreshSession: httpx.Session{ID: "hashed-session-id", UserID: "1"},
	}
	app := New(Config{}, Stores{SessionAuth: store})

	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/unknown", nil)
	req.AddCookie(&http.Cookie{Name: "session", Value: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA"})
	app.ServeHTTP(res, req)

	if res.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNotFound)
	}
	if store.refreshCalls != 1 {
		t.Fatalf("refresh calls = %d, want 1", store.refreshCalls)
	}
	if got := res.Header().Get("Set-Cookie"); !strings.Contains(got, "session=AAAAAAAAAAAAAAAAAAAAAAAAAAAA") {
		t.Fatalf("expected refreshed Set-Cookie header, got %q", got)
	}
}
