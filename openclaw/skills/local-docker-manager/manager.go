package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

// OpenClaw Skill Execution Interface
func ExecuteTool(args map[string]interface{}) (string, error) {
	serviceName, ok := args["service_name"].(string)
	if !ok {
		return "", fmt.Errorf("missing service_name")
	}
	
	issue, ok := args["issue"].(string)
	if !ok {
		return "", fmt.Errorf("missing issue description")
	}

	action := "restart_container" // Default action for this skill

	// Build the payload expected by our backend API
	payload := map[string]string{
		"service_name": serviceName,
		"issue":        issue,
		"action":       action,
	}
	
	jsonData, _ := json.Marshal(payload)
	backendURL := os.Getenv("BACKEND_URL")
	if backendURL == "" {
		backendURL = "http://backend:8080"
	}

	// Send the command to the Go Backend Gateway
	resp, err := http.Post(backendURL+"/api/remediate", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to contact gateway: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gateway rejected the remediation request. Status: %d", resp.StatusCode)
	}

	return fmt.Sprintf("Successfully executed %s on %s", action, serviceName), nil
}