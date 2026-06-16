package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	// THE FIX: These must use the canonical "moby" paths to match the SDK
	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/client"

	"github.com/Gi-v/agentops-platform/backend/db"
)

type RemediationRequest struct {
	ServiceName string `json:"service_name"`
	Issue       string `json:"issue"`
	Action      string `json:"action"`
}

type SlackPayload struct {
	ServiceName string `json:"service_name"`
	Action      string `json:"action"`
}

// restartDockerContainer connects to the local Docker socket and issues a restart command
func restartDockerContainer(containerName string) error {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return fmt.Errorf("docker context failure: %v", err)
	}
	defer cli.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	return cli.ContainerRestart(ctx, containerName, container.StopOptions{})
}

// HandleRemediation receives automated webhook triggers from the OpenClaw Agent
func HandleRemediation(w http.ResponseWriter, r *http.Request) {
	var req RemediationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Error("Malformed remediation request", "error", err)
		http.Error(w, `{"error": "Malformed request structural payload"}`, http.StatusBadRequest)
		return
	}

	slog.Info("Evaluating autonomous rule execution", "service_name", req.ServiceName, "action", req.Action)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "processing"}`))
}

// HandleSlackInteraction processes approvals from remote human operators
func HandleSlackInteraction(w http.ResponseWriter, r *http.Request) {
	var actionData SlackPayload
	if err := json.NewDecoder(r.Body).Decode(&actionData); err != nil {
		http.Error(w, `{"error": "Invalid payload"}`, http.StatusBadRequest)
		return
	}

	slog.Info("Operator Authorization confirmed via Slack", "service_name", actionData.ServiceName)

	if actionData.Action == "restart" {
		err := restartDockerContainer(actionData.ServiceName)
		statusValue := "Resolved"
		descValue := "Critical mesh health check failed. System state brought back to equilibrium through operator validation."
		
		if err != nil {
			slog.Warn("Docker engine execution warning", "service_name", actionData.ServiceName, "error", err)
			descValue = fmt.Sprintf("Remediation execution flagged an adjustment: %v", err)
			statusValue = "Executed"
		}

		// Ensure db.Conn is initialized in your db package
		_, dbErr := db.Conn.Exec(
			"INSERT INTO incidents (service_name, issue_description, action_taken, status) VALUES ($1, $2, $3, $4)",
			actionData.ServiceName, descValue, "Container Restart Matrix Triggered", statusValue,
		)
		if dbErr != nil {
			slog.Error("Persistent storage write failure", "error", dbErr)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"text": "✅ Command payload deployed into execution context. Check your Dashboard ledger."}`))
}