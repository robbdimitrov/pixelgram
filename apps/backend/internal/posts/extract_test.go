package posts

import (
	"reflect"
	"strings"
	"testing"
)

func TestExtractHashtags(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  []string
	}{
		{"empty string", "", nil},
		{"no hashtags", "just plain text", nil},
		{"single tag", "#hello world", []string{"hello"}},
		{"case folded to lowercase", "#Hello #WORLD", []string{"hello", "world"}},
		{"deduped preserving first occurrence", "#Go #go #GO", []string{"go"}},
		{"underscore and numbers", "#hello_world #go2025", []string{"hello_world", "go2025"}},
		{"max length 50", "#" + strings.Repeat("a", 50), []string{strings.Repeat("a", 50)}},
		{"51 chars truncates at 50", "#" + strings.Repeat("a", 51), []string{strings.Repeat("a", 50)}},
		{"hash only rejected", "standalone # ignored", nil},
		{"non-ascii stops tag", "#café #naïve", []string{"caf", "na"}},
		{"mixed text and tags", "I love #Go and #Rust!", []string{"go", "rust"}},
		{"tag at start of string", "#first rest of text", []string{"first"}},
		{"multiple distinct tags", "#foo #bar #baz", []string{"foo", "bar", "baz"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ExtractHashtags(tt.input)
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ExtractHashtags(%q) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}
