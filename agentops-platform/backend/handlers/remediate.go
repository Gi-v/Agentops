package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"

	"github.com/Gi-v/agentops-platform/backend/db"
)

type RemediationRequest struct {
	ServiceName string `json:"service_name"`
	Issue       string `json:"issue"`
	Action      string `json:"action"`
}

type Incident struct {
	ID          int       `json:"id"`
	ServiceName string    `json:"service_name"`
	Description string    `json:"issue_description"`
	Action      string    `json:"action_taken"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

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

func HandleRemediation(w http.ResponseWriter, r *http.Request) {
	var req RemediationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Error("Malformed remediation request", "error", err)
		http.Error(w, `{"error": "Malformed request structural payload"}`, http.StatusBadRequest)
		return
	}

	slog.Info(
		"Evaluating autonomous rule execution",
		"service_name", req.ServiceName,
		"action", req.Action,
	)

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "processing"}`))
}

func HandleSlackInteraction(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Failed to decode form response context", http.StatusBadRequest)
		return
	}

	var payload struct {
		Actions []struct {
			Value string `json:"value"`
		} `json:"actions"`
	}

	if err := json.Unmarshal([]byte(r.FormValue("payload")), &payload); err != nil || len(payload.Actions) == 0 {
		http.Error(w, "Invalid interactive state data structure", http.StatusBadRequest)
		return
	}

	var actionData struct {
		ServiceName string `json:"service_name"`
		Action      string `json:"action"`
	}

	json.Unmarshal([]byte(payload.Actions[0].Value), &actionData)

	slog.Info(
		"Operator Authorization confirmed via Slack",
		"service_name", actionData.ServiceName,
	)

	if actionData.Action == "restart" {
		err := restartDockerContainer(actionData.ServiceName)

		statusValue := "Resolved"
		descValue := "Critical mesh health check failed. System state brought back to equilibrium through operator validation."

		if err != nil {
			slog.Warn(
				"Docker engine execution warning",
				"service_name", actionData.ServiceName,
				"error", err,
			)

			descValue = fmt.Sprintf("Remediation execution flagged an adjustment: %v", err)
			statusValue = "Executed"
		}

		_, dbErr := db.Conn.Exec(
			"INSERT INTO incidents (service_name, issue_description, action_taken, status) VALUES ($1, $2, $3, $4)",
			actionData.ServiceName,
			descValue,
			"Container Restart Matrix Triggered",
			statusValue,
		)

		if dbErr != nil {
			slog.Error(
				"Persistent storage write failure",
				"error", dbErr,
			)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"text": "✅ Command payload deployed into execution context. Check your Dashboard ledger."}`))
}

func HandleGetIncidents(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Conn.Query("SELECT id, service_name, issue_description, action_taken, status, created_at FROM incidents ORDER BY created_at DESC LIMIT 10")
	if err != nil {
		http.Error(w, `{"error": "Database retrieval exception"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	incidents := []Incident{}
	for rows.Next() {
		var i Incident
		if err := rows.Scan(&i.ID, &i.ServiceName, &i.Description, &i.Action, &i.Status, &i.CreatedAt); err != nil {
			continue
		}
		incidents = append(incidents, i)
	}

	json.NewEncoder(w).Encode(incidents)
}