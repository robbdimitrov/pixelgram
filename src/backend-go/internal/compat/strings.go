package compat

import (
	"regexp"
	"strings"
)

var emailPattern = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

func ValidEmail(email string) bool {
	return emailPattern.MatchString(email)
}

func TrimString(value string) string {
	return strings.TrimSpace(value)
}
