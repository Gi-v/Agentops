package handlers

import (
	"context"
	"io"
	"log"
	"net/http"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow Next.js frontend to connect
	},
}

// HandleLiveLogs streams Docker container logs directly to the UI
func HandleLiveLogs(w http.ResponseWriter, r *http.Request) {
	containerName := r.URL.Query().Get("container")
	if containerName == "" {
		http.Error(w, "Missing container name", http.StatusBadRequest)
		return
	}

	// Upgrade the standard HTTP connection to a WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("❌ Failed to connect to Docker SDK"))
		return
	}
	defer cli.Close()

	// Request the last 50 lines of logs, plus a continuous live stream
	// Request the last 50 lines of logs, plus a continuous live stream
	options := container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     true,
		Tail:       "50",
	}

	// Wait for container logs
	ctx := context.Background()
	reader, err := cli.ContainerLogs(ctx, containerName, container.LogsOptions(options))
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("❌ Could not find logs for "+containerName))
		return
	}
	defer reader.Close()

	// Read from Docker and push to the Browser
	buffer := make([]byte, 1024)
	for {
		n, err := reader.Read(buffer)
		if err != nil {
			if err != io.EOF {
				log.Printf("Error reading logs: %v", err)
			}
			break
		}
		
		// Docker multiplexes logs (adds an 8-byte header). We strip it for clean text.
		if n > 8 {
			conn.WriteMessage(websocket.TextMessage, buffer[8:n])
		}
	}
}