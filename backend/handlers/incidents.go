package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/Gi-v/agentops-platform/backend/db"
)

type Incident struct {
	ID               int    `json:"id"`
	ServiceName      string `json:"service_name"`
	IssueDescription string `json:"issue_description"`
	ActionTaken      string `json:"action_taken"`
	Status           string `json:"status"`
	CreatedAt        string `json:"created_at"`
}

// HandleGetIncidents returns the most recent remediation incidents from the audit ledger
func HandleGetIncidents(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	incidents := []Incident{}

	if db.Conn == nil {
		json.NewEncoder(w).Encode(incidents)
		return
	}

	rows, err := db.Conn.Query(
		"SELECT id, service_name, issue_description, action_taken, status, created_at FROM incidents ORDER BY created_at DESC LIMIT 50",
	)
	if err != nil {
		slog.Error("Failed to query incidents", "error", err)
		json.NewEncoder(w).Encode(incidents)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var inc Incident
		var createdAt time.Time
		if err := rows.Scan(&inc.ID, &inc.ServiceName, &inc.IssueDescription, &inc.ActionTaken, &inc.Status, &createdAt); err != nil {
			continue
		}
		inc.CreatedAt = createdAt.Format(time.RFC3339)
		incidents = append(incidents, inc)
	}

	json.NewEncoder(w).Encode(incidents)
}