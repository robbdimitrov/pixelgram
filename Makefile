.DEFAULT_GOAL := all

IMAGE_PREFIX ?= localhost:5000/pixelgram

.PHONY: all
all: backend database frontend

.PHONY: backend
backend:
	docker build -t $(IMAGE_PREFIX)/backend apps/backend

.PHONY: database
database:
	docker build -t $(IMAGE_PREFIX)/database apps/database

.PHONY: frontend
frontend:
	docker build -t $(IMAGE_PREFIX)/frontend apps/frontend

.PHONY: format
format:
	@gofmt -w $$(find apps/backend -name '*.go')

.PHONY: lint
lint:
	@test -z "$$(gofmt -l $$(find apps/backend -name '*.go'))"
	@cd apps/frontend && npm run lint

.PHONY: test
test:
	@echo "Testing backend..."
	@cd apps/backend && go test ./...
	@echo "Testing frontend..."
	@cd apps/frontend && npm test
