package httpx

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestDecodeJSONMalformedBody(t *testing.T) {
	var body struct {
		Email string `json:"email"`
	}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/sessions", strings.NewReader(`{"email":`))

	if DecodeJSON(res, req, &body) {
		t.Fatal("expected DecodeJSON to fail")
	}
	if res.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusBadRequest)
	}
	if strings.TrimSpace(res.Body.String()) != `{"message":"Malformed JSON request body."}` {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestDecodeJSONOversizedBody(t *testing.T) {
	var body struct {
		Padding string `json:"padding"`
	}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/sessions", strings.NewReader(`{"padding":"`+strings.Repeat("x", 110*1024)+`"}`))

	if DecodeJSON(res, req, &body) {
		t.Fatal("expected DecodeJSON to fail")
	}
	if res.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusRequestEntityTooLarge)
	}
	if strings.TrimSpace(res.Body.String()) != `{"message":"Request body is too large."}` {
		t.Fatalf("body = %q", res.Body.String())
	}
}
