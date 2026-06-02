.PHONY: all
all: backend database frontend

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
test: test-backend test-frontend

.PHONY: test-backend
test-backend:
	cd src/backend && npx jest

.PHONY: test-frontend
test-frontend:
	cd src/frontend && npx jest
