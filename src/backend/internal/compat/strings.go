package compat

import "regexp"

var emailPattern = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

func ValidEmail(email string) bool {
	return emailPattern.MatchString(email)
}
