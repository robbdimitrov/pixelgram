#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
network="pixelgram-test-$$"
database="pixelgram-postgres-test-$$"

cleanup() {
  docker rm -f "$database" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker network create "$network" >/dev/null
docker run -d --name "$database" --network "$network" \
  -e POSTGRES_PASSWORD=pixelgram \
  -e POSTGRES_DB=pixelgram \
  -p 127.0.0.1::5432 \
  postgres:18.4-alpine >/dev/null

attempt=0
until docker exec "$database" pg_isready -U postgres -d pixelgram >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then
    echo "PostgreSQL did not become ready within 60 seconds." >&2
    docker logs "$database" >&2 || true
    exit 1
  fi
  if [ "$(docker inspect -f '{{.State.Running}}' "$database" 2>/dev/null || true)" != "true" ]; then
    echo "PostgreSQL container stopped before becoming ready." >&2
    docker logs "$database" >&2 || true
    exit 1
  fi
  sleep 1
done

docker run --rm --network "$network" \
  -v "$root/apps/database/migrations:/migrations:ro" \
  migrate/migrate:v4.18.1 \
  -path=/migrations \
  -database="postgres://postgres:pixelgram@${database}:5432/pixelgram?sslmode=disable" \
  up

port=$(docker port "$database" 5432/tcp | sed 's/.*://')
export PIXELGRAM_TEST_DATABASE_URL="postgres://postgres:pixelgram@127.0.0.1:${port}/pixelgram?sslmode=disable"
export GOCACHE="${GOCACHE:-/tmp/pixelgram-go-build}"

cd "$root/apps/backend"
go test -count=1 -p=1 ./internal/store/postgres
