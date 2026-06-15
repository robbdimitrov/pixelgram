package main

import (
	"strings"
	"testing"
)

func TestOpenRepositoriesWithoutDatabaseUsesNoopAdapters(t *testing.T) {
	repositories, closeRepositories, err := openRepositories("")
	if err != nil {
		t.Fatalf("openRepositories() error = %v", err)
	}
	closeRepositories()
	if repositories.SessionAuth == nil || repositories.Users == nil ||
		repositories.Sessions == nil || repositories.Uploads == nil ||
		repositories.Posts == nil || repositories.Comments == nil {
		t.Fatal("openRepositories() returned nil no-op adapter")
	}
}

func TestOpenRepositoriesRequiresSessionSecretWithDatabase(t *testing.T) {
	t.Setenv("SESSION_HASH_SECRET", "")

	_, _, err := openRepositories("postgres://unused")

	if err == nil || !strings.Contains(err.Error(), "SESSION_HASH_SECRET is required") {
		t.Fatalf("openRepositories() error = %v", err)
	}
}
