#!/bin/sh
set -eu

: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set}"
DB_URL="postgres://postgres:${POSTGRES_PASSWORD}@database:5432/phasma?sslmode=disable"

echo "Running database migrations..."
exec migrate -path /migrations -database "$DB_URL" up
