package main

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Gi-v/agentops-platform/backend/consul"
	"github.com/Gi-v/agentops-platform/backend/db"
	"github.com/Gi-v/agentops-platform/backend/handlers"
)

// CORSMiddleware ensures all cloud or local cross-origin traffic passes preflight checks
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	// Initialize Structured JSON Logging
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// Initialize PostgreSQL Persistence
	if err := db.InitDB(); err != nil {
		slog.Warn("Database warning during initialization", "error", err)
	}

	// Register this gateway service with Consul asynchronously on boot
	go func() {
		time.Sleep(5 * time.Second)
		if err := consul.RegisterService(); err != nil {
			slog.Warn("Consul registration delayed", "error", err)
		}
	}()

	mux := http.NewServeMux()

	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"platform": "OpenClaw Autonomous Fleet Backend", "status": "operational", "version": "6.0"}`))
	})

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "healthy"}`))
	})

	mux.HandleFunc("POST /api/remediate", handlers.HandleRemediation)
	mux.HandleFunc("POST /api/slack/action", handlers.HandleSlackInteraction)
	mux.HandleFunc("GET /api/incidents", handlers.HandleGetIncidents)
	mux.HandleFunc("POST /api/chaos", handlers.HandleChaosToggle)
	mux.HandleFunc("GET /api/logs", handlers.HandleLiveLogs)
	mux.HandleFunc("GET /api/ai/analyze", handlers.HandleAIAnalysis)
	mux.HandleFunc("POST /api/scale", handlers.HandleScaleService)

	mux.HandleFunc("GET /api/nodes", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		resp, err := http.Get("http://consul:8500/v1/health/state/any")
		if err != nil {
			slog.Error("Consul mesh unreachable", "error", err)
			http.Error(w, `{"error": "Consul mesh unreachable"}`, http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()
		io.Copy(w, resp.Body)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:         "0.0.0.0:" + port,
		Handler:      CORSMiddleware(mux),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	go func() {
		slog.Info("OpenClaw Micro-Kernel armed", "port", port, "protocol", "http")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Critical system kernel failure", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("Initiating secure kernel shutdown sequence...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	server.Shutdown(ctx)
}