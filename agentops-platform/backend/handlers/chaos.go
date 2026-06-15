package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

var chaosActive bool
var chaosTicker *time.Ticker

// HandleChaosToggle turns the Automated GameDay on or off
func HandleChaosToggle(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	
	chaosActive = !chaosActive

	if chaosActive {
		log.Println("🐒 CHAOS MONKEY ACTIVATED: Randomly killing containers...")
		chaosTicker = time.NewTicker(30 * time.Second)
		
		go func() {
			for range chaosTicker.C {
				if !chaosActive {
					return
				}
				log.Println("🐒 Chaos Monkey is striking [payment-api]!")
				// Forcefully kill the container to simulate a severe crash
				restartDockerContainer("payment-api") 
			}
		}()
	} else {
		log.Println("🛡️ CHAOS MONKEY DEACTIVATED.")
		if chaosTicker != nil {
			chaosTicker.Stop()
		}
	}

	json.NewEncoder(w).Encode(map[string]bool{"active": chaosActive})
}