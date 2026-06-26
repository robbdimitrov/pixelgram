.DEFAULT_GOAL := all

IMAGE_PREFIX ?= localhost:5000/phasma
GIT_SHA ?= $(shell git rev-parse --short HEAD)

.PHONY: all
all: backend database frontend

.PHONY: backend
backend:
	docker build -t $(IMAGE_PREFIX)/backend:$(GIT_SHA) apps/backend
	docker push $(IMAGE_PREFIX)/backend:$(GIT_SHA)

.PHONY: database
database:
	docker build -t $(IMAGE_PREFIX)/database:$(GIT_SHA) apps/database
	docker push $(IMAGE_PREFIX)/database:$(GIT_SHA)

.PHONY: frontend
frontend:
	docker build -t $(IMAGE_PREFIX)/frontend:$(GIT_SHA) apps/frontend
	docker push $(IMAGE_PREFIX)/frontend:$(GIT_SHA)

.PHONY: format
format:
	@gofmt -w $$(find apps/backend -name '*.go')

.PHONY: lint
lint:
	@test -z "$$(gofmt -l $$(find apps/backend -name '*.go'))"
	@cd apps/frontend && npm run lint

.PHONY: test test-integration
test:
	@echo "Testing backend..."
	@cd apps/backend && go test ./...
	@echo "Testing frontend..."
	@cd apps/frontend && npm test

test-integration:
	@./scripts/test-backend-integration.sh
