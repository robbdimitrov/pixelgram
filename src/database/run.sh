#!/bin/sh
set -e

DB_URL="postgres://postgres:${POSTGRES_PASSWORD}@database:5432/pixelgram?sslmode=disable"

echo "Running database migrations..."
exec migrate -path /migrations -database "$DB_URL" up
