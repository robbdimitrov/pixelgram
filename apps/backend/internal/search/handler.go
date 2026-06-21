package search

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"

	"pixelgram/backend/internal/httpx"
)

// hashtagNameRe matches valid hashtag names as stored in the database.
// Using this against user input prevents filter injection into Meilisearch.
var hashtagNameRe = regexp.MustCompile(`^[A-Za-z0-9_]{1,50}$`)

const (
	maxQueryLen  = 50
	typeaheadLen = 8
	searchPage   = 20
)

type Application interface {
	SearchUsers(ctx context.Context, q string) ([]UserResult, error)
	SearchHashtags(ctx context.Context, q string) ([]HashtagResult, error)
}

type Handler struct {
	Service Application
	Meili   *MeiliClient
}

func (h Handler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if !validQuery(q) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Query must be 1 to 50 characters.")
		return
	}
	if h.Meili != nil {
		results, err := meiliSearchUsers(r.Context(), h.Meili, q)
		if err != nil {
			httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, results)
		return
	}
	results, err := h.Service.SearchUsers(r.Context(), q)
	if err != nil {
		httpx.WriteStoreError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, results)
}

func (h Handler) SearchHashtags(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if !validQuery(q) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Query must be 1 to 50 characters.")
		return
	}
	if h.Meili != nil {
		results, err := meiliSearchHashtags(r.Context(), h.Meili, q)
		if err != nil {
			httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, results)
		return
	}
	results, err := h.Service.SearchHashtags(r.Context(), q)
	if err != nil {
		httpx.WriteStoreError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, results)
}

// Search requires Meilisearch; returns 503 when not configured.
func (h Handler) Search(w http.ResponseWriter, r *http.Request) {
	if h.Meili == nil {
		httpx.WriteMessage(w, http.StatusServiceUnavailable, "Search service unavailable.")
		return
	}

	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if !validQuery(q) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Query must be 1 to 50 characters.")
		return
	}

	searchType := r.URL.Query().Get("type")
	switch searchType {
	case "users", "posts", "hashtags":
	default:
		httpx.WriteMessage(w, http.StatusBadRequest, "type must be one of: users, posts, hashtags.")
		return
	}

	offset, err := decodeCursor(r.URL.Query().Get("cursor"))
	if err != nil {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid cursor.")
		return
	}

	ctx := r.Context()
	var items any
	var count int

	switch searchType {
	case "users":
		hits, err := meiliSearch(ctx, h.Meili, "users", q, "", offset, searchPage)
		if err != nil {
			httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
		users := make([]UserResult, 0, len(hits))
		for _, hit := range hits {
			u := UserResult{Username: stringField(hit, "username")}
			if av, ok := hit["avatar"].(string); ok {
				u.Avatar = &av
			}
			users = append(users, u)
		}
		items = users
		count = len(users)

	case "hashtags":
		hits, err := meiliSearch(ctx, h.Meili, "hashtags", q, "", offset, searchPage)
		if err != nil {
			httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
		hashtags := make([]HashtagResult, 0, len(hits))
		for _, hit := range hits {
			hashtags = append(hashtags, HashtagResult{
				Name:      stringField(hit, "name"),
				PostCount: intField(hit, "post_count"),
			})
		}
		items = hashtags
		count = len(hashtags)

	case "posts":
		filter := ""
		searchQ := q
		if strings.HasPrefix(q, "#") {
			tag := q[1:]
			if !hashtagNameRe.MatchString(tag) {
				httpx.WriteMessage(w, http.StatusBadRequest, "Invalid hashtag.")
				return
			}
			filter = fmt.Sprintf(`hashtags = "%s"`, tag)
			searchQ = ""
		}
		hits, err := meiliSearch(ctx, h.Meili, "posts", searchQ, filter, offset, searchPage)
		if err != nil {
			httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
			return
		}
		posts := make([]PostResult, 0, len(hits))
		for _, hit := range hits {
			posts = append(posts, PostResult{
				ID:          stringField(hit, "id"),
				Username:    stringField(hit, "username"),
				Description: stringField(hit, "description"),
			})
		}
		items = posts
		count = len(posts)
	}

	var nextCursor *string
	if count >= searchPage {
		nc := encodeCursor(offset + searchPage)
		nextCursor = &nc
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]any{
		"items":      items,
		"nextCursor": nextCursor,
	})
}

func meiliSearchUsers(ctx context.Context, mc *MeiliClient, q string) ([]UserResult, error) {
	hits, err := meiliSearch(ctx, mc, "users", q, "", 0, typeaheadLen)
	if err != nil {
		return nil, err
	}
	results := make([]UserResult, 0, len(hits))
	for _, hit := range hits {
		u := UserResult{Username: stringField(hit, "username")}
		if av, ok := hit["avatar"].(string); ok {
			u.Avatar = &av
		}
		results = append(results, u)
	}
	return results, nil
}

func meiliSearchHashtags(ctx context.Context, mc *MeiliClient, q string) ([]HashtagResult, error) {
	hits, err := meiliSearch(ctx, mc, "hashtags", q, "", 0, typeaheadLen)
	if err != nil {
		return nil, err
	}
	results := make([]HashtagResult, 0, len(hits))
	for _, hit := range hits {
		results = append(results, HashtagResult{
			Name:      stringField(hit, "name"),
			PostCount: intField(hit, "post_count"),
		})
	}
	return results, nil
}

func meiliSearch(ctx context.Context, mc *MeiliClient, index, q, filter string, offset, limit int) ([]map[string]any, error) {
	params := map[string]any{
		"q":      q,
		"offset": offset,
		"limit":  limit,
	}
	if filter != "" {
		params["filter"] = filter
	}
	result, err := mc.Search(ctx, index, params)
	if err != nil {
		return nil, err
	}
	var hits []map[string]any
	if err := json.Unmarshal(result.Hits, &hits); err != nil {
		return nil, fmt.Errorf("search: decode hits: %w", err)
	}
	return hits, nil
}

func encodeCursor(offset int) string {
	return base64.StdEncoding.EncodeToString([]byte(strconv.Itoa(offset)))
}

// An empty cursor returns offset 0 (first page).
func decodeCursor(cursor string) (int, error) {
	if cursor == "" {
		return 0, nil
	}
	b, err := base64.StdEncoding.DecodeString(cursor)
	if err != nil {
		return 0, err
	}
	n, err := strconv.Atoi(string(b))
	if err != nil || n < 0 {
		return 0, fmt.Errorf("invalid cursor value")
	}
	return n, nil
}

func stringField(m map[string]any, key string) string {
	v, _ := m[key].(string)
	return v
}

// Meilisearch returns JSON numbers as float64.
func intField(m map[string]any, key string) int {
	v, _ := m[key].(float64)
	return int(v)
}

func validQuery(q string) bool {
	n := utf8.RuneCountInString(q)
	return n >= 1 && n <= maxQueryLen
}
