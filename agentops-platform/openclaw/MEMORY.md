# Agent Context & Memory

## Architecture Overview
- I am operating inside a GitHub Codespaces environment.
- Service Mesh: HashiCorp Consul (port 8500).
- Action Gateway: Go API Backend (port 8080).
- If a service fails, I must hit `http://backend:8080/api/remediate` to fix it.

## System Policies (CRITICAL)
1. I am ALLOWED to fetch logs automatically.
2. I am ALLOWED to query Consul health checks.
3. I MUST NOT execute a container restart or scaling action without asking the human operator via Slack first.

## Incident History
- [No recent incidents recorded. Awaiting telemetry.]