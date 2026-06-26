package httpx

import (
	"crypto/tls"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSecurityHeadersSetsHSTSForSecureRequests(t *testing.T) {
	tests := []struct {
		name       string
		tls        bool
		trustProxy bool
		proto      string
		wantHSTS   bool
	}{
		{name: "direct TLS", tls: true, wantHSTS: true},
		{name: "trusted forwarded HTTPS", trustProxy: true, proto: "https", wantHSTS: true},
		{name: "untrusted forwarded HTTPS", proto: "https"},
		{name: "plain HTTP"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			oldTrustProxy := trustProxy
			trustProxy = test.trustProxy
			t.Cleanup(func() { trustProxy = oldTrustProxy })

			req := httptest.NewRequest(http.MethodGet, "http://example.com/health", nil)
			if test.tls {
				req.TLS = &tls.ConnectionState{}
			}
			if test.proto != "" {
				req.Header.Set("X-Forwarded-Proto", test.proto)
			}
			res := httptest.NewRecorder()

			SecurityHeaders(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(http.StatusNoContent)
			})).ServeHTTP(res, req)

			got := res.Header().Get("Strict-Transport-Security")
			if test.wantHSTS && got != "max-age=31536000; includeSubDomains" {
				t.Fatalf("Strict-Transport-Security = %q", got)
			}
			if !test.wantHSTS && got != "" {
				t.Fatalf("Strict-Transport-Security = %q, want empty", got)
			}
		})
	}
}
