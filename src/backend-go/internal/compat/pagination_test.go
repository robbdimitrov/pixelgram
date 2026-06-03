package compat

import (
	"net/url"
	"testing"
)

func TestParsePagination(t *testing.T) {
	tests := []struct {
		name  string
		query url.Values
		want  Pagination
		ok    bool
	}{
		{name: "defaults", query: url.Values{}, want: Pagination{Page: 0, Limit: 10}, ok: true},
		{name: "explicit", query: url.Values{"page": {"2"}, "limit": {"25"}}, want: Pagination{Page: 2, Limit: 25}, ok: true},
		{name: "caps limit", query: url.Values{"limit": {"500"}}, want: Pagination{Page: 0, Limit: 50}, ok: true},
		{name: "negative page", query: url.Values{"page": {"-1"}}, ok: false},
		{name: "zero limit", query: url.Values{"limit": {"0"}}, ok: false},
		{name: "decimal page", query: url.Values{"page": {"1.2"}}, ok: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, ok := ParsePagination(tt.query)
			if ok != tt.ok {
				t.Fatalf("ok = %v, want %v", ok, tt.ok)
			}
			if got != tt.want {
				t.Fatalf("pagination = %+v, want %+v", got, tt.want)
			}
		})
	}
}
