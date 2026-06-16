# STAGE 1: Builder
FROM golang:alpine AS builder
WORKDIR /app

# Install git and CA certificates for secure downloading
RUN apk add --no-cache git ca-certificates

# Copy your raw source code first
COPY . .

# Revert the Moby hack: Automatically switch all paths back to the standard Docker SDK
RUN find . -type f -name "*.go" -exec sed -i 's|github.com/moby/moby|github.com/docker/docker|g' {} +

# Force the container to generate its own clean environment
RUN rm -f go.mod go.sum
RUN go mod init github.com/Gi-v/agentops-platform/backend

# --- ENTERPRISE DEPENDENCY MATRIX FIX ---
# Lock down the core stable components
RUN go get github.com/docker/docker@v24.0.9
RUN go get github.com/lib/pq@latest
RUN go get github.com/hashicorp/consul/api@latest

# --- THE MOVEMENT OF TRUTH: FORCEFUL MODULE OVERRIDE ---
# This fixes the "undefined: reference.SplitHostname" error by forcing the 
# distribution engine to use a stable patch version that works with the toolchain.
RUN go mod edit -replace github.com/docker/distribution=github.com/docker/distribution@v2.8.2+incompatible

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