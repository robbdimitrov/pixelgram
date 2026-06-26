package search

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	meiliTimeout      = 5 * time.Second
	meiliMaxResponse  = 1 << 20 // 1 MiB
	meiliScopedKeyTTL = 365 * 24 * time.Hour
)

var meiliScopedIndexes = []string{"users", "posts", "hashtags"}

// MeiliClient wraps net/http to communicate with a Meilisearch instance.
// It provisions a scoped key on construction and uses it for all subsequent
// document and search operations. The master key is never used after startup.
type MeiliClient struct {
	baseURL    string
	scopedKey  string
	httpClient *http.Client
}

// NewMeiliClient creates a MeiliClient, provisions a scoped API key using the
// master key, and configures index settings for users, posts, and hashtags.
func NewMeiliClient(ctx context.Context, baseURL, masterKey string) (*MeiliClient, error) {
	c := &MeiliClient{
		baseURL:    baseURL,
		httpClient: &http.Client{},
	}

	scopedKey, err := c.provisionScopedKey(ctx, masterKey)
	if err != nil {
		return nil, fmt.Errorf("search: provision scoped key: %w", err)
	}
	c.scopedKey = scopedKey

	if err := c.ApplySettings(ctx); err != nil {
		return nil, fmt.Errorf("search: apply index settings: %w", err)
	}
	return c, nil
}

// provisionScopedKey creates a finite-lived scoped API key with document and
// search actions on the indexes owned by this service using the master key.
func (c *MeiliClient) provisionScopedKey(ctx context.Context, masterKey string) (string, error) {
	body := map[string]any{
		"actions":     []string{"search", "documents.add", "documents.delete"},
		"indexes":     meiliScopedIndexes,
		"expiresAt":   time.Now().UTC().Add(meiliScopedKeyTTL).Format(time.RFC3339),
		"description": "phasma-backend scoped key",
	}
	var result struct {
		Key string `json:"key"`
	}
	if err := c.doJSON(ctx, http.MethodPost, "/keys", masterKey, body, &result); err != nil {
		return "", err
	}
	if result.Key == "" {
		return "", fmt.Errorf("search: empty key in response")
	}
	return result.Key, nil
}

// ApplySettings configures searchable, filterable, and sortable attributes for
// each index.
func (c *MeiliClient) ApplySettings(ctx context.Context) error {
	type indexSettings struct {
		index    string
		settings map[string]any
	}
	configs := []indexSettings{
		{
			index: "users",
			settings: map[string]any{
				"searchableAttributes": []string{"username", "name"},
			},
		},
		{
			index: "posts",
			settings: map[string]any{
				"searchableAttributes": []string{"description", "username"},
				"filterableAttributes": []string{"hashtags"},
				"sortableAttributes":   []string{"created"},
			},
		},
		{
			index: "hashtags",
			settings: map[string]any{
				"searchableAttributes": []string{"name"},
				"sortableAttributes":   []string{"post_count"},
			},
		},
	}
	for _, cfg := range configs {
		if err := c.applyIndexSettings(ctx, cfg.index, cfg.settings); err != nil {
			return fmt.Errorf("search: apply settings for index %q: %w", cfg.index, err)
		}
	}
	return nil
}

func (c *MeiliClient) applyIndexSettings(ctx context.Context, index string, settings map[string]any) error {
	return c.doJSON(ctx, http.MethodPatch, "/indexes/"+index+"/settings", c.scopedKey, settings, nil)
}

// UpsertDocuments adds or replaces documents in the given index.
func (c *MeiliClient) UpsertDocuments(ctx context.Context, index string, documents any) error {
	return c.doJSON(ctx, http.MethodPost, "/indexes/"+index+"/documents", c.scopedKey, documents, nil)
}

// DeleteDocument removes a single document by its ID from the given index.
func (c *MeiliClient) DeleteDocument(ctx context.Context, index, id string) error {
	return c.doJSON(ctx, http.MethodDelete, "/indexes/"+index+"/documents/"+id, c.scopedKey, nil, nil)
}

// SearchResult holds a raw Meilisearch search response body.
type SearchResult struct {
	Hits json.RawMessage `json:"hits"`
}

// Search executes a query against the given index and returns the parsed response.
func (c *MeiliClient) Search(ctx context.Context, index string, params map[string]any) (*SearchResult, error) {
	var result SearchResult
	if err := c.doJSON(ctx, http.MethodPost, "/indexes/"+index+"/search", c.scopedKey, params, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// doJSON performs an HTTP request with a JSON body (if non-nil), reads the
// response up to meiliMaxResponse bytes, and optionally decodes it into out.
// The key is passed as the Authorization bearer token and is never included
// in returned errors.
func (c *MeiliClient) doJSON(ctx context.Context, method, path, key string, body any, out any) error {
	tctx, cancel := context.WithTimeout(ctx, meiliTimeout)
	defer cancel()

	var bodyReader io.Reader
	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("search: marshal request: %w", err)
		}
		bodyReader = bytes.NewReader(encoded)
	}

	req, err := http.NewRequestWithContext(tctx, method, c.baseURL+path, bodyReader)
	if err != nil {
		return fmt.Errorf("search: build request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+key)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("search: request failed")
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(io.LimitReader(resp.Body, meiliMaxResponse))
	if err != nil {
		return fmt.Errorf("search: read response: %w", err)
	}

	if resp.StatusCode >= http.StatusBadRequest {
		return fmt.Errorf("search: unexpected status %d", resp.StatusCode)
	}

	if out != nil && len(data) > 0 {
		if err := json.Unmarshal(data, out); err != nil {
			return fmt.Errorf("search: decode response: %w", err)
		}
	}
	return nil
}
