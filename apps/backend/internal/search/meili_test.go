package search

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"slices"
	"strings"
	"testing"
	"time"
)

// newTestMeiliClient builds a MeiliClient that points at srv and bypasses
// key provisioning and settings so unit tests can call lower-level methods
// directly.
func newTestMeiliClient(baseURL string) *MeiliClient {
	return &MeiliClient{
		baseURL:    baseURL,
		scopedKey:  "test-key",
		httpClient: &http.Client{},
	}
}

func TestMeiliDoJSONSetsAuthHeader(t *testing.T) {
	var gotAuth string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	c := newTestMeiliClient(srv.URL)
	_ = c.doJSON(context.Background(), http.MethodGet, "/test", "my-key", nil, nil)

	if gotAuth != "Bearer my-key" {
		t.Fatalf("Authorization = %q, want %q", gotAuth, "Bearer my-key")
	}
}

func TestMeiliDoJSONSetsContentTypeForBody(t *testing.T) {
	var gotCT string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotCT = r.Header.Get("Content-Type")
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	c := newTestMeiliClient(srv.URL)
	_ = c.doJSON(context.Background(), http.MethodPost, "/test", "key", map[string]string{"a": "b"}, nil)

	if gotCT != "application/json" {
		t.Fatalf("Content-Type = %q, want application/json", gotCT)
	}
}

func TestMeiliDoJSONDecodesResponse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"key":"scoped-abc"}`))
	}))
	defer srv.Close()

	c := newTestMeiliClient(srv.URL)
	var out struct {
		Key string `json:"key"`
	}
	if err := c.doJSON(context.Background(), http.MethodGet, "/keys/1", "master", nil, &out); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if out.Key != "scoped-abc" {
		t.Fatalf("Key = %q, want %q", out.Key, "scoped-abc")
	}
}

func TestMeiliDoJSONReturnsErrorOnBadStatus(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	}))
	defer srv.Close()

	c := newTestMeiliClient(srv.URL)
	err := c.doJSON(context.Background(), http.MethodGet, "/test", "bad-key", nil, nil)
	if err == nil {
		t.Fatal("expected error for 401 response")
	}
}

func TestMeiliDoJSONErrorDoesNotLeakKey(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusForbidden)
	}))
	defer srv.Close()

	secretKey := "super-secret-master-key"
	c := newTestMeiliClient(srv.URL)
	err := c.doJSON(context.Background(), http.MethodPost, "/keys", secretKey, nil, nil)
	if err != nil && strings.Contains(err.Error(), secretKey) {
		t.Fatalf("error leaks key: %v", err)
	}
}

func TestMeiliProvisionScopedKeyLimitsScopeAndExpiry(t *testing.T) {
	var payload struct {
		Actions     []string `json:"actions"`
		Indexes     []string `json:"indexes"`
		ExpiresAt   string   `json:"expiresAt"`
		Description string   `json:"description"`
	}
	var gotAuth string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		if r.URL.Path != "/keys" || r.Method != http.MethodPost {
			t.Fatalf("request = %s %s, want POST /keys", r.Method, r.URL.Path)
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			t.Fatalf("decode key payload: %v", err)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"key":"scoped-abc"}`))
	}))
	defer srv.Close()

	before := time.Now().UTC().Add(meiliScopedKeyTTL - time.Minute)
	c := newTestMeiliClient(srv.URL)
	key, err := c.provisionScopedKey(context.Background(), "master-key")
	after := time.Now().UTC().Add(meiliScopedKeyTTL + time.Minute)
	if err != nil {
		t.Fatalf("provisionScopedKey: %v", err)
	}
	if key != "scoped-abc" {
		t.Fatalf("key = %q, want scoped-abc", key)
	}
	if gotAuth != "Bearer master-key" {
		t.Fatalf("Authorization = %q, want Bearer master-key", gotAuth)
	}
	if !slices.Equal(payload.Actions, []string{"search", "documents.add", "documents.delete"}) {
		t.Fatalf("actions = %v", payload.Actions)
	}
	if !slices.Equal(payload.Indexes, []string{"users", "posts", "hashtags"}) {
		t.Fatalf("indexes = %v", payload.Indexes)
	}
	expiresAt, err := time.Parse(time.RFC3339, payload.ExpiresAt)
	if err != nil {
		t.Fatalf("expiresAt = %q is not RFC3339: %v", payload.ExpiresAt, err)
	}
	if expiresAt.Before(before) || expiresAt.After(after) {
		t.Fatalf("expiresAt = %v, want within %v and %v", expiresAt, before, after)
	}
	if payload.Description == "" {
		t.Fatal("description should be set")
	}
}

func TestMeiliUpsertDocumentsSendsCorrectPath(t *testing.T) {
	var gotPath string
	var gotMethod string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		gotMethod = r.Method
		w.WriteHeader(http.StatusAccepted)
	}))
	defer srv.Close()

	c := newTestMeiliClient(srv.URL)
	docs := []map[string]string{{"id": "1", "username": "alice"}}
	if err := c.UpsertDocuments(context.Background(), "users", docs); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotPath != "/indexes/users/documents" {
		t.Fatalf("path = %q, want /indexes/users/documents", gotPath)
	}
	if gotMethod != http.MethodPost {
		t.Fatalf("method = %q, want POST", gotMethod)
	}
}

func TestMeiliDeleteDocumentSendsCorrectPath(t *testing.T) {
	var gotPath string
	var gotMethod string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		gotMethod = r.Method
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	c := newTestMeiliClient(srv.URL)
	if err := c.DeleteDocument(context.Background(), "posts", "post-42"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotPath != "/indexes/posts/documents/post-42" {
		t.Fatalf("path = %q, want /indexes/posts/documents/post-42", gotPath)
	}
	if gotMethod != http.MethodDelete {
		t.Fatalf("method = %q, want DELETE", gotMethod)
	}
}

func TestMeiliSearchReturnsHits(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"hits":[{"name":"cats","post_count":5}],"limit":20}`))
	}))
	defer srv.Close()

	c := newTestMeiliClient(srv.URL)
	result, err := c.Search(context.Background(), "hashtags", map[string]any{"q": "cat"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	var hits []map[string]any
	if err := json.Unmarshal(result.Hits, &hits); err != nil {
		t.Fatalf("unmarshal hits: %v", err)
	}
	if len(hits) != 1 || hits[0]["name"] != "cats" {
		t.Fatalf("unexpected hits: %v", hits)
	}
}

func TestMeiliApplySettingsSendsCorrectPaths(t *testing.T) {
	var paths []string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		paths = append(paths, r.URL.Path)
		w.WriteHeader(http.StatusAccepted)
	}))
	defer srv.Close()

	c := newTestMeiliClient(srv.URL)
	if err := c.ApplySettings(context.Background()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := []string{
		"/indexes/users/settings",
		"/indexes/posts/settings",
		"/indexes/hashtags/settings",
	}
	if len(paths) != len(want) {
		t.Fatalf("got %d requests, want %d: %v", len(paths), len(want), paths)
	}
	for i, p := range paths {
		if p != want[i] {
			t.Fatalf("path[%d] = %q, want %q", i, p, want[i])
		}
	}
}

// TestMeiliNewClientLive requires a live Meilisearch instance and is skipped
// unless MEILI_TEST_URL is set.
func TestMeiliNewClientLive(t *testing.T) {
	meiliURL := os.Getenv("MEILI_TEST_URL")
	if meiliURL == "" {
		t.Skip("MEILI_TEST_URL not set; skipping live Meilisearch test")
	}
	masterKey := os.Getenv("MEILI_TEST_MASTER_KEY")

	client, err := NewMeiliClient(context.Background(), meiliURL, masterKey)
	if err != nil {
		t.Fatalf("NewMeiliClient: %v", err)
	}
	if client.scopedKey == "" {
		t.Fatal("scoped key is empty after construction")
	}
}
