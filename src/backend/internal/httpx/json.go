package httpx

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

const JSONBodyLimit = 100 * 1024

var ErrEmptyJSONBody = errors.New("empty json body")

func WriteJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func WriteMessage(w http.ResponseWriter, status int, message string) {
	WriteJSON(w, status, map[string]string{"message": message})
}

func DecodeJSON(w http.ResponseWriter, r *http.Request, dest any) bool {
	if r.Body == nil {
		WriteMessage(w, http.StatusBadRequest, "Malformed JSON request body.")
		return false
	}

	limited := http.MaxBytesReader(w, r.Body, JSONBodyLimit)
	decoder := json.NewDecoder(limited)

	if err := decoder.Decode(dest); err != nil {
		status, message := jsonDecodeError(err)
		WriteMessage(w, status, message)
		return false
	}

	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		WriteMessage(w, http.StatusBadRequest, "Malformed JSON request body.")
		return false
	}

	return true
}

func jsonDecodeError(err error) (int, string) {
	var maxBytesError *http.MaxBytesError
	if errors.As(err, &maxBytesError) {
		return http.StatusRequestEntityTooLarge, "Request body is too large."
	}

	if errors.Is(err, io.EOF) || errors.Is(err, ErrEmptyJSONBody) {
		return http.StatusBadRequest, "Malformed JSON request body."
	}

	var syntaxError *json.SyntaxError
	if errors.As(err, &syntaxError) {
		return http.StatusBadRequest, "Malformed JSON request body."
	}

	var unmarshalTypeError *json.UnmarshalTypeError
	if errors.As(err, &unmarshalTypeError) {
		return http.StatusBadRequest, "Malformed JSON request body."
	}

	return http.StatusBadRequest, "Malformed JSON request body."
}
