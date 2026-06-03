package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
)

func main() {
	port := getenv("PORT", "8080")

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusNotFound, map[string]string{"message": "Not Found"})
	})

	addr := ":" + port
	slog.Info("starting backend", "addr", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		slog.Error("backend stopped", "error", err)
		os.Exit(1)
	}
}

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
