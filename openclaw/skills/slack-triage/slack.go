package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

func ExecuteTool(args map[string]interface{}) (string, error) {
	serviceName, ok := args["service_name"].(string)
	if !ok {
		return "", fmt.Errorf("missing service_name in agent request")
	}
	
	issue, ok := args["issue"].(string)
	if !ok {
		return "", fmt.Errorf("missing issue description in agent request")
	}

	proposedFix, ok := args["proposed_fix"].(string)
	if !ok {
		proposedFix = "Restart container via Go Gateway"
	}

	webhookURL := os.Getenv("SLACK_WEBHOOK_URL")
	if webhookURL == "" {
		return "", fmt.Errorf("SLACK_WEBHOOK_URL is missing")
	}

	slackBody := map[string]interface{}{
		"text": fmt.Sprintf("🚨 OpenClaw Alert: %s is failing", serviceName),
		"blocks": []map[string]interface{}{
			{
				"type": "header",
				"text": map[string]string{
					"type": "plain_text",
					"text": "🤖 AgentOps Incident Report",
					"emoji": "true",
				},
			},
			{
				"type": "section",
				"fields": []map[string]string{
					{
						"type": "mrkdwn",
						"text": fmt.Sprintf("*Service:*\n`%s`", serviceName),
					},
					{
						"type": "mrkdwn",
						"text": "*Status:*\n🚨 CRITICAL (Consul Health Check)",
					},
				},
			},
			{
				"type": "section",
				"text": map[string]string{
					"type": "mrkdwn",
					"text": fmt.Sprintf("*Agent Diagnosis:*\n%s\n\n*Proposed Remediation:*\n%s", issue, proposedFix),
				},
			},
			{
				"type": "actions",
				"elements": []map[string]interface{}{
					{
						"type": "button",
						"text": map[string]string{
							"type": "plain_text",
							"text": "✅ Approve & Restart Container",
							"emoji": "true",
						},
						"style": "primary",
						"action_id": "approve_remediation_btn",
						"value": fmt.Sprintf(`{"service_name": "%s", "action": "restart"}`, serviceName),
					},
				},
			},
		},
	}

	jsonData, err := json.Marshal(slackBody)
	if err != nil {
		return "", fmt.Errorf("failed to format Slack payload: %v", err)
	}

	resp, err := http.Post(webhookURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to send message to Slack: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("slack rejected the webhook. Status: %d", resp.StatusCode)
	}

	return fmt.Sprintf("Successfully notified human operators in Slack about %s", serviceName), nil
}