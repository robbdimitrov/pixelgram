package httpx

import (
	"errors"
	"net/http"

	"phasma/backend/internal/store"
)

// WriteStoreError maps a store sentinel error to its conventional JSON HTTP
// response. Handlers that need an endpoint-specific message should handle that
// sentinel explicitly before delegating the remaining cases here.
func WriteStoreError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, store.ErrNotFound):
		WriteMessage(w, http.StatusNotFound, "Not Found")
	case errors.Is(err, store.ErrConflict):
		WriteMessage(w, http.StatusConflict, "Conflict")
	case errors.Is(err, store.ErrForbidden):
		WriteMessage(w, http.StatusForbidden, "Forbidden")
	case errors.Is(err, store.ErrUnavailable):
		WriteMessage(w, http.StatusServiceUnavailable, "Service Unavailable")
	default:
		WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
	}
}
