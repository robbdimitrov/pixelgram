.DEFAULT_GOAL := all

IMAGE_PREFIX ?= localhost:5000/pixelgram

.PHONY: all
all: backend database frontend

.PHONY: backend
backend:
	docker build -t $(IMAGE_PREFIX)/backend src/backend

.PHONY: database
database:
	docker build -t $(IMAGE_PREFIX)/database src/database

.PHONY: frontend
frontend:
	docker build -t $(IMAGE_PREFIX)/frontend src/frontend

.PHONY: format
format:
	@gofmt -w $$(find src/backend -name '*.go')

.PHONY: lint
lint:
	@test -z "$$(gofmt -l $$(find src/backend -name '*.go'))"
	@cd src/frontend && npm run lint

.PHONY: test
test:
	@echo "Testing backend..."
	@cd src/backend && go test ./...
	@echo "Testing frontend..."
	@cd src/frontend && npm test
