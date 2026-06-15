# STAGE 1: Builder
FROM golang:alpine AS builder
WORKDIR /app

# Install git and CA certificates for secure downloading
RUN apk add --no-cache git ca-certificates

# Copy your raw source code
COPY . .

# Force the container to generate its own clean environment
RUN rm -f go.mod go.sum
RUN go mod init github.com/Gi-v/agentops-platform/backend

# Explicitly resolve complex external dependencies BEFORE running tidy
RUN go get github.com/docker/docker/client@latest
RUN go get github.com/docker/docker/api/types/container@latest
RUN go get github.com/lib/pq@latest
RUN go get github.com/hashicorp/consul/api@latest

# Now tidy can safely organize the rest without panicking
RUN go mod tidy

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o agent-backend main.go

# STAGE 2: Secure Runner
FROM alpine:latest
WORKDIR /app

# Add a non-root user
RUN adduser -D appuser
USER appuser

# Extract the compiled gateway
COPY --from=builder /app/agent-backend .

EXPOSE 8080
CMD ["./agent-backend"]