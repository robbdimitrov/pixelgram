.PHONY: all
all: frontend backend database

.PHONY: frontend
frontend:
	docker build -t pixelgram/frontend src/frontend

.PHONY: backend
backend:
	docker build -t pixelgram/backend src/backend

.PHONY: database
database:
	docker build -t pixelgram/database src/database
