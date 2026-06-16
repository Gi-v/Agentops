package handlers

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"
)

func HandleAIAnalysis(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	serviceName := r.URL.Query().Get("service")
	if serviceName == "" {
		http.Error(w, `{"error": "Missing service name"}`, http.StatusBadRequest)
		return
	}

	// Simulate AI reading massive log dumps
	time.Sleep(1800 * time.Millisecond)

	// A massive pool of realistic DevOps failures for extreme diversity
	rootCauses := []string{
		"goroutine leak leading to OOM (Out of Memory) termination",
		"segmentation fault within the CGO bindings",
		"TCP socket exhaustion (TIME_WAIT limit reached)",
		"deadlock detected in the primary database connection pool",
		"panic: nil pointer dereference in the authentication middleware",
		"ephemeral storage exceeded 100% capacity due to runaway log files",
		"connection timeout to internal Redis cache layer",
		"invalid JWT signature validation causing cascading 401s",
		"bifurcated network partition isolating the node from the Consul quorum",
		"CPU throttling enforced by Docker cgroups limiting performance to 5%",
	}

	actions := []string{
		"Executing a graceful SIGTERM and re-provisioning a clean container.",
		"Flushing the cache pipeline and restarting the daemon.",
		"Horizontally scaling the service to redistribute the traffic load.",
		"Purging the ephemeral volume mounts and issuing a cold start.",
		"Rolling back to the previous stable container image hash.",
	}

	rand.Seed(time.Now().UnixNano())
	cause := rootCauses[rand.Intn(len(rootCauses))]
	action := actions[rand.Intn(len(actions))]

	diagnosis := fmt.Sprintf("Analysis of %s logs reveals a %s. %s", serviceName, cause, action)
	confidence := fmt.Sprintf("%d.%d%%", rand.Intn(10)+90, rand.Intn(99)) // e.g. 94.67%

	response := map[string]string{
		"service":        serviceName,
		"diagnosis":      diagnosis,
		"confidence":     confidence,
		"recommendation": "Approve horizontal scaling to balance the load, or force a cold restart of the node.",
	}

	json.NewEncoder(w).Encode(response)
}