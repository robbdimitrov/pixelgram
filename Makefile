.PHONY: all
all: backend database frontend

GO_CACHE ?= /tmp/pixelgram-go-build
GO_MOD_CACHE ?= /tmp/pixelgram-go-mod

.PHONY: backend
backend:
	docker build -t localhost:5000/pixelgram/backend src/backend

.PHONY: database
database:
	docker build -t localhost:5000/pixelgram/database src/database

.PHONY: frontend
frontend:
	docker build -t localhost:5000/pixelgram/frontend src/frontend

.PHONY: test
test:
	@echo "Testing backend..."
	@cd src/backend && go test ./...
	@echo "Testing frontend..."
	cd src/frontend && npx jest
