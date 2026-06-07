FROM golang:1.26.4-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/backend ./cmd/api

FROM scratch
COPY --from=builder /out/backend /backend
EXPOSE 8080
CMD ["/backend"]
