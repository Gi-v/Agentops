package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq" // Postgres driver
)

// Global DB connection pool
var Conn *sql.DB

// InitDB connects to Postgres and ensures our tables exist
func InitDB() error {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return fmt.Errorf("DATABASE_URL environment variable is not set")
	}

	var err error
	// Retry loop: DB might take a few seconds to boot up in Docker
	for i := 0; i < 5; i++ {
		Conn, err = sql.Open("postgres", dbURL)
		if err == nil {
			err = Conn.Ping()
			if err == nil {
				break // Successfully connected!
			}
		}
		log.Printf("⏳ Waiting for PostgreSQL to boot (attempt %d/5)...", i+1)
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		return fmt.Errorf("failed to connect to database after retries: %v", err)
	}

	log.Println("🐘 Successfully connected to PostgreSQL!")
	return createTables()
}

func createTables() error {
	query := `
	CREATE TABLE IF NOT EXISTS incidents (
		id SERIAL PRIMARY KEY,
		service_name VARCHAR(255) NOT NULL,
		issue_description TEXT NOT NULL,
		action_taken VARCHAR(100) NOT NULL,
		status VARCHAR(50) NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`

	_, err := Conn.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to create incidents table: %v", err)
	}
	
	log.Println("✅ Database schema validated.")
	return nil
}