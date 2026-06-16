# STAGE 1: Builder
FROM golang:alpine AS builder
WORKDIR /app

RUN apk add --no-cache git ca-certificates
COPY . .

RUN rm -f go.mod go.sum
RUN go mod init github.com/Gi-v/agentops-platform/openclaw

# Explicitly fetch Prometheus metrics dependencies
RUN go get github.com/prometheus/client_golang/prometheus@latest
RUN go get github.com/prometheus/client_golang/prometheus/promhttp@latest

RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o openclaw-agent main.go

# STAGE 2: Secure Runner
FROM alpine:latest
WORKDIR /app

RUN adduser -D appuser
USER appuser

COPY --from=builder /app/openclaw-agent .

# Expose the Prometheus metrics port
EXPOSE 9091
CMD ["./openclaw-agent"]