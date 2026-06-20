// Package env provides small, dependency-free helpers for reading typed
// configuration from environment variables with fallback defaults.
package env

import (
	"os"
	"strconv"
)

// String returns the value of key, or fallback when unset/empty.
func String(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// Int returns key parsed as a positive int, or fallback on absence/parse error.
func Int(key string, fallback int) int {
	value, err := strconv.Atoi(os.Getenv(key))
	if err != nil || value <= 0 {
		return fallback
	}
	return value
}

// Float returns key parsed as a positive float64, or fallback otherwise.
func Float(key string, fallback float64) float64 {
	value, err := strconv.ParseFloat(os.Getenv(key), 64)
	if err != nil || value <= 0 {
		return fallback
	}
	return value
}

// Bool returns key parsed via strconv.ParseBool, or fallback otherwise.
func Bool(key string, fallback bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}
	return parsed
}
