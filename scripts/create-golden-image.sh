#!/bin/bash
set -e

echo "========================================="
echo "  Comply-v2 Golden Image Builder"
echo "  Sovereign Mac Mini Deployment"
echo "========================================="
echo ""

cd "$(dirname "$0")/.."

# Start Ollama and wait for it
echo "[1/4] Starting Ollama..."
docker compose up -d ollama
echo "Waiting for Ollama to be ready..."
sleep 8

# Pull the model
OLLAMA_CTR=$(docker compose ps -q ollama)
MODEL="${OLLAMA_MODEL:-llama3.2:11b}"
echo "[2/4] Pulling model: $MODEL"
docker exec "$OLLAMA_CTR" ollama pull "$MODEL"

# Build backend + frontend
echo "[3/4] Building backend container..."
docker compose build backend

echo "[4/4] Building frontend container..."
docker compose build frontend

echo ""
echo "========================================="
echo "  Golden Image Ready!"
echo "========================================="
echo ""
echo "  Start:     docker compose up -d"
echo "  Stop:      docker compose down"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  API docs:  http://localhost:8100/docs"
echo "  Health:    http://localhost:8100/health"
echo ""
echo "  Model:     $MODEL"
echo "  Data:      ./data/ (encrypted SQLite)"
echo "========================================="
