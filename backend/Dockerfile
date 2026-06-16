# STAGE 1: Builder
FROM golang:alpine AS builder
WORKDIR /app

RUN apk add --no-cache git ca-certificates

# Download deps first so they're cached unless go.mod/go.sum change
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o agent-backend .

# STAGE 2: Secure Runner
FROM alpine:latest
WORKDIR /app

RUN adduser -D appuser
USER appuser

COPY --from=builder /app/agent-backend .

EXPOSE 8080
CMD ["./agent-backend"]