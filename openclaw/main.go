package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// --- PROMETHEUS METRICS ---
var (
	remediationsTriggered = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "openclaw_remediations_total",
		Help: "Total number of automated remediation payloads fired by OpenClaw",
	})
	consulPollErrors = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "openclaw_consul_poll_errors_total",
		Help: "Total number of failed attempts to poll the Consul mesh",
	})
)

func init() {
	prometheus.MustRegister(remediationsTriggered)
	prometheus.MustRegister(consulPollErrors)
}

type ConsulCheck struct {
	Node        string
	CheckID     string
	Name        string
	Status      string
	Notes       string
	Output      string
	ServiceID   string
	ServiceName string
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	consulURL := os.Getenv("CONSUL_URL")
	if consulURL == "" {
		consulURL = "http://consul:8500"
	}
	backendURL := os.Getenv("BACKEND_URL")
	if backendURL == "" {
		backendURL = "http://backend:8080"
	}

	// --- 1. CONTEXT MANAGEMENT & GRACEFUL SHUTDOWN ---
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	
	go func() {
		<-quit
		slog.Info("Termination signal intercepted. Initiating graceful shutdown sequence...")
		cancel() // Cascades termination to active requests
	}()

	// --- 2. METRICS EXPORT PIPELINE ---
	go func() {
		mux := http.NewServeMux()
		mux.Handle("/metrics", promhttp.Handler())
		slog.Info("Prometheus metrics pipeline exposed", "port", "9091")
		if err := http.ListenAndServe(":9091", mux); err != nil {
			slog.Error("Metrics server crashed", "error", err)
		}
	}()

	slog.Info("OpenClaw Autonomous Core online", "target_mesh", consulURL)
	cooldowns := make(map[string]time.Time)

	// --- 3. EXPONENTIAL BACKOFF CONFIGURATION ---
	baseDelay := 2 * time.Second
	maxDelay := 32 * time.Second
	currentDelay := baseDelay

	for {
		select {
		case <-ctx.Done():
			slog.Info("Agent loop successfully terminated without resource leaks.")
			return
		default:
			req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/v1/health/state/any", consulURL), nil)
			if err != nil {
				continue
			}

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				consulPollErrors.Inc()
				
				jitter := time.Duration(rand.Int63n(int64(currentDelay) / 2))
				actualDelay := currentDelay + jitter
				
				slog.Warn("Mesh unreachable. Initiating exponential backoff.", "error", err, "retry_in", actualDelay.String())
				
				select {
				case <-time.After(actualDelay):
				case <-ctx.Done():
					return
				}

				currentDelay *= 2
				if currentDelay > maxDelay {
					currentDelay = maxDelay
				}
				continue
			}

			currentDelay = baseDelay

			var checks []ConsulCheck
			if err := json.NewDecoder(resp.Body).Decode(&checks); err != nil {
				resp.Body.Close()
				continue
			}
			resp.Body.Close()

			for _, check := range checks {
				if check.ServiceName == "" || check.ServiceName == "consul" {
					continue
				}

				if check.Status == "critical" {
					lastAlerted, inCooldown := cooldowns[check.CheckID]
					if inCooldown && time.Since(lastAlerted) < 1*time.Minute {
						continue
					}

					slog.Warn("Service isolation detected", "service_name", check.ServiceName, "status", check.Status)
					cooldowns[check.CheckID] = time.Now()

					payload := map[string]string{
						"service_name": check.ServiceName,
						"issue":        fmt.Sprintf("Consul check reporting failure: %s", check.Output),
						"action":       "evaluate_remediation_heuristics",
					}
					jsonPayload, _ := json.Marshal(payload)

					postReq, _ := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/api/remediate", backendURL), bytes.NewBuffer(jsonPayload))
					postReq.Header.Set("Content-Type", "application/json")
					
					_, postErr := http.DefaultClient.Do(postReq)
					if postErr != nil {
						slog.Error("Logic kernel handover failed", "error", postErr)
					} else {
						remediationsTriggered.Inc()
					}
				}
			}
			
			select {
			case <-time.After(4 * time.Second):
			case <-ctx.Done():
				return
			}
		}
	}
}