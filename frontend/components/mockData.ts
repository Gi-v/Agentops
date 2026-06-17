export const MOCK_NODES = [
  { CheckID: "svc-analytics-engine", ServiceName: "analytics-engine", Status: "warning" },
  { CheckID: "svc-auth-service", ServiceName: "auth-service", Status: "passing" },
  { CheckID: "svc-cache-redis", ServiceName: "cache-redis", Status: "passing" },
  { CheckID: "svc-cdn-edge", ServiceName: "cdn-edge", Status: "passing" },
  { CheckID: "svc-frontend-ui", ServiceName: "frontend-ui", Status: "passing" },
  { CheckID: "svc-inventory-db", ServiceName: "inventory-db", Status: "critical" },
  { CheckID: "svc-message-broker", ServiceName: "message-broker", Status: "critical" },
  { CheckID: "svc-notification-svc", ServiceName: "notification-service", Status: "passing" },
  { CheckID: "svc-order-processing", ServiceName: "order-processing", Status: "passing" },
  { CheckID: "svc-payment-api", ServiceName: "payment-api", Status: "passing" },
  { CheckID: "svc-search-service", ServiceName: "search-service", Status: "warning" },
  { CheckID: "svc-shipping-service", ServiceName: "shipping-service", Status: "critical" },
  { CheckID: "svc-user-profile-svc", ServiceName: "user-profile-service", Status: "critical" },
  { CheckID: "svc-websocket-server", ServiceName: "websocket-server", Status: "critical" },
  { CheckID: "svc-ml-inference", ServiceName: "ml-inference", Status: "warning" },
  { CheckID: "svc-api-gateway", ServiceName: "api-gateway", Status: "passing" },
];

export const MOCK_INCIDENTS = [
  { id: 101, service_name: "payment-api", issue_description: "Stripe API gateway timeout. Goroutine leak detected in connection pool.", action_taken: "Graceful SIGTERM & Node Clone", status: "Resolved", created_at: new Date(Date.now() - 1200000).toISOString() },
  { id: 102, service_name: "auth-service", issue_description: "JWT signature validation failure. Redis cache desync on primary node.", action_taken: "Flushed Cache & Restarted Daemon", status: "Resolved", created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 103, service_name: "inventory-db", issue_description: "PostgreSQL connection pool exhausted. Active connections exceeded 100 limit.", action_taken: "Scaled horizontally to distribute load", status: "Executed", created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 104, service_name: "shipping-service", issue_description: "Chaos fault injected: synthetic latency spike 2400ms on /fulfil endpoint.", action_taken: "Traffic rerouted to replica-2", status: "Mitigated", created_at: new Date(Date.now() - 900000).toISOString() },
  { id: 105, service_name: "ml-inference", issue_description: "CUDA OOM on GPU node-3. Model inference queue depth exceeded 500.", action_taken: "Batching reduced, CPU fallback enabled", status: "Monitoring", created_at: new Date(Date.now() - 300000).toISOString() },
];

// Simulated CPU/RAM per service (static seed so UI looks realistic)
export const NODE_METRICS: Record<string, { cpu: number; ram: number }> = {
  "analytics-engine":    { cpu: 89, ram: 76 },
  "auth-service":        { cpu: 18, ram: 22 },
  "cache-redis":         { cpu: 12, ram: 31 },
  "cdn-edge":            { cpu: 9,  ram: 15 },
  "frontend-ui":         { cpu: 11, ram: 19 },
  "inventory-db":        { cpu: 94, ram: 88 },
  "message-broker":      { cpu: 97, ram: 91 },
  "notification-service":{ cpu: 7,  ram: 13 },
  "order-processing":    { cpu: 22, ram: 28 },
  "payment-api":         { cpu: 31, ram: 35 },
  "search-service":      { cpu: 72, ram: 61 },
  "shipping-service":    { cpu: 99, ram: 95 },
  "user-profile-service":{ cpu: 96, ram: 90 },
  "websocket-server":    { cpu: 98, ram: 93 },
  "ml-inference":        { cpu: 81, ram: 74 },
  "api-gateway":         { cpu: 14, ram: 20 },
};