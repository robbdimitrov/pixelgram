package pagination

import (
	"net/url"
	"reflect"
	"testing"
	"time"
)

func TestParsePagination(t *testing.T) {
	created := time.Date(2026, 6, 15, 10, 0, 0, 0, time.UTC)
	cursor := Cursor{Created: created, ID: 42}
	encodedCursor := EncodeCursor(cursor)
	tests := []struct {
		name  string
		query url.Values
		want  Pagination
		ok    bool
	}{
		{name: "defaults", query: url.Values{}, want: Pagination{Limit: 10}, ok: true},
		{name: "cursor and limit", query: url.Values{"cursor": {encodedCursor}, "limit": {"25"}}, want: Pagination{Cursor: &cursor, Limit: 25}, ok: true},
		{name: "caps limit", query: url.Values{"limit": {"500"}}, want: Pagination{Limit: 50}, ok: true},
		{name: "legacy page", query: url.Values{"page": {"0"}}, ok: false},
		{name: "invalid cursor", query: url.Values{"cursor": {"invalid"}}, ok: false},
		{name: "zero limit", query: url.Values{"limit": {"0"}}, ok: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, ok := ParsePagination(tt.query)
			if ok != tt.ok {
				t.Fatalf("ok = %v, want %v", ok, tt.ok)
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Fatalf("pagination = %+v, want %+v", got, tt.want)
			}
		})
	}
}

func TestCursorRoundTrip(t *testing.T) {
	want := Cursor{
		Created: time.Date(2026, 6, 15, 10, 0, 0, 123, time.UTC),
		ID:      42,
	}

	got, ok := DecodeCursor(EncodeCursor(want))

	if !ok || got == nil {
		t.Fatal("cursor did not decode")
	}
	if !reflect.DeepEqual(*got, want) {
		t.Fatalf("cursor = %+v, want %+v", *got, want)
	}
}
