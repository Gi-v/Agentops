package consul

import (
	"fmt"
	"log"
	"os"

	"github.com/hashicorp/consul/api"
)

// RegisterService connects to the local Consul instance and registers the backend.
func RegisterService() error {
	// 1. Get the Consul URL from the environment (set in docker-compose.yml)
	consulURL := os.Getenv("CONSUL_URL")
	if consulURL == "" {
		consulURL = "127.0.0.1:8500" // Fallback for local testing
	}

	// 2. Configure the Consul client
	config := api.DefaultConfig()
	config.Address = consulURL
	
	client, err := api.NewClient(config)
	if err != nil {
		return fmt.Errorf("failed to create Consul client: %v", err)
	}

	// 3. Define the Service and its Health Check
	port := 8080
	registration := &api.AgentServiceRegistration{
		ID:      "agent-backend-node-1",
		Name:    "agent-backend",
		Port:    port,
		Address: "backend", // Matches the docker-compose service name
		Check: &api.AgentServiceCheck{
			HTTP:     fmt.Sprintf("http://backend:%d/health", port),
			Interval: "10s",
			Timeout:  "5s",
		},
	}

	// 4. Register with Consul
	err = client.Agent().ServiceRegister(registration)
	if err != nil {
		return fmt.Errorf("failed to register service with Consul: %v", err)
	}

	log.Println("Successfully registered with Consul Service Mesh")
	return nil
}