# ==============================================================================
# OpenClaw Nexus - Master Taskfile
# ==============================================================================

.PHONY: help up down logs seed clean rebuild

help: ## Display this help menu
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Boot the entire OpenClaw infrastructure in the background
	@echo "🚀 Booting OpenClaw Engine..."
	docker-compose up -d

down: ## Gracefully spin down the infrastructure
	@echo "🛑 Shutting down..."
	docker-compose down

rebuild: ## Force a clean rebuild of all multi-stage containers
	@echo "🏗️ Rebuilding containers from scratch..."
	docker-compose up --build -d

logs: ## Tail the master log stream of the autonomous agent
	docker logs -f openclaw-agent

seed: ## Inject the enterprise mock fleet into the Consul mesh
	@echo "🌱 Seeding Consul with target nodes..."
	chmod +x deploy-fleet.sh
	./deploy-fleet.sh

clean: ## Nuke all containers, networks, and orphan volumes (Factory Reset)
	@echo "💥 Performing factory reset..."
	docker-compose down -v --remove-orphans
	docker system prune -f