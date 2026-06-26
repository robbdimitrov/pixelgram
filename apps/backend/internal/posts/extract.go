package posts

import (
	"regexp"
	"strings"
)

var hashtagPattern = regexp.MustCompile(`#([A-Za-z0-9_]{1,50})`)

const maxHashtags = 20

// ExtractHashtags parses #tag tokens from text, lowercases each capture,
// and returns de-duplicated tags in first-occurrence order, capped at maxHashtags.
func ExtractHashtags(description string) []string {
	matches := hashtagPattern.FindAllStringSubmatch(description, -1)
	seen := make(map[string]bool)
	var tags []string
	for _, m := range matches {
		if len(tags) >= maxHashtags {
			break
		}
		tag := strings.ToLower(m[1])
		if !seen[tag] {
			seen[tag] = true
			tags = append(tags, tag)
		}
	}
	return tags
}
