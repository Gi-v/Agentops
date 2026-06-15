package handlers

import (
	"bytes"
	"fmt"
	"net/http"
	"time"
)

// HandleScaleService duplicates a service and adds it to the load balancer
func HandleScaleService(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	
	serviceName := r.URL.Query().Get("service")
	if serviceName == "" {
		http.Error(w, "Missing service name", http.StatusBadRequest)
		return
	}

	// Generate a unique ID for the cloned container
	cloneID := fmt.Sprintf("%s-clone-%d", serviceName, time.Now().Unix()%1000)

	// Instruct Consul to register the new clone into the mesh
	consulPayload := fmt.Sprintf(`{
		"ID": "%s", 
		"Name": "%s", 
		"Port": 8080, 
		"Check": {
			"HTTP": "http://localhost:8080/health", 
			"Interval": "10s", 
			"Status": "passing"
		}
	}`, cloneID, serviceName)

	resp, err := http.Post("http://consul:8500/v1/agent/service/register", "application/json", bytes.NewBuffer([]byte(consulPayload)))
	if err != nil || resp.StatusCode != 200 {
		http.Error(w, `{"error": "Failed to inject clone into Consul"}`, http.StatusInternalServerError)
		return
	}

	w.Write([]byte(fmt.Sprintf(`{"status": "scaled", "clone_id": "%s"}`, cloneID)))
}