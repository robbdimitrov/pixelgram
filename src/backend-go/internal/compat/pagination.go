package compat

import (
	"net/url"
	"strconv"
)

type Pagination struct {
	Page  int
	Limit int
}

func ParsePagination(query url.Values) (Pagination, bool) {
	limit, ok := parseIntDefault(query.Get("limit"), 10)
	if !ok {
		return Pagination{}, false
	}

	page, ok := parseIntDefault(query.Get("page"), 0)
	if !ok {
		return Pagination{}, false
	}

	if page < 0 || limit < 1 {
		return Pagination{}, false
	}

	if limit > 50 {
		limit = 50
	}

	return Pagination{Page: page, Limit: limit}, true
}

func parseIntDefault(value string, fallback int) (int, bool) {
	if value == "" {
		return fallback, true
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, false
	}

	return parsed, true
}
