#!/bin/bash
# =========================================================
#  Comply-v2 Installer for Mac Mini (Apple Silicon)
#  One script → sovereign compliance appliance
#  Idempotent — safe to re-run
# =========================================================
set -e

INSTALL_DIR="/opt/comply-v2"
REPO_URL="https://github.com/Radix-Obsidian/comply-v2.git"
LAUNCH_AGENTS="$HOME/Library/LaunchAgents"
LOG_DIR="$INSTALL_DIR/logs"
VENV_DIR="$INSTALL_DIR/.venv"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $1"; exit 1; }

echo ""
echo "========================================="
echo "  Comply-v2 Installer"
echo "  Sovereign Mac Mini Deployment"
echo "========================================="
echo ""

# -----------------------------------------------------------
# 0. Preflight checks
# -----------------------------------------------------------
[[ "$(uname)" != "Darwin" ]] && fail "This installer is for macOS only."
[[ "$(uname -m)" != "arm64" ]] && warn "Expected Apple Silicon (arm64). Proceeding anyway."

# Detect RAM for model selection
RAM_GB=$(( $(sysctl -n hw.memsize) / 1024 / 1024 / 1024 ))
if [[ "$RAM_GB" -ge 16 ]]; then
    DEFAULT_MODEL="llama3.2:3b"
    info "Detected ${RAM_GB}GB RAM — using llama3.2:3b"
else
    DEFAULT_MODEL="llama3.2:3b"
    info "Detected ${RAM_GB}GB RAM — using llama3.2:3b (2GB model)"
fi
OLLAMA_MODEL="${OLLAMA_MODEL:-$DEFAULT_MODEL}"

# -----------------------------------------------------------
# 1. Install Homebrew
# -----------------------------------------------------------
if ! command -v brew &>/dev/null; then
    info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(/opt/homebrew/bin/brew shellenv)"
    ok "Homebrew installed"
else
    ok "Homebrew already installed"
fi

# Ensure brew is in PATH for this session
eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || true

# -----------------------------------------------------------
# 2. Install system dependencies
# -----------------------------------------------------------
info "Installing system dependencies..."

for pkg in python3 node ollama; do
    if ! command -v "$pkg" &>/dev/null; then
        info "  Installing $pkg..."
        brew install "$pkg"
    else
        ok "  $pkg already installed"
    fi
done

ok "All system dependencies ready"

# -----------------------------------------------------------
# 3. Create install directory and clone/copy repo
# -----------------------------------------------------------
if [[ ! -d "$INSTALL_DIR" ]]; then
    info "Creating $INSTALL_DIR..."
    sudo mkdir -p "$INSTALL_DIR"
    sudo chown "$(whoami)" "$INSTALL_DIR"
fi

# If running from inside the repo, copy; otherwise clone
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

if [[ -f "$REPO_ROOT/backend/main.py" && "$REPO_ROOT" != "$INSTALL_DIR" ]]; then
    info "Copying project to $INSTALL_DIR..."
    rsync -a --exclude='.git' --exclude='node_modules' --exclude='.next' \
          --exclude='__pycache__' --exclude='.venv' --exclude='data/*.db' \
          "$REPO_ROOT/" "$INSTALL_DIR/"
    ok "Project copied"
elif [[ -f "$INSTALL_DIR/backend/main.py" ]]; then
    ok "Project already at $INSTALL_DIR"
else
    info "Cloning repository..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    ok "Repository cloned"
fi

# Create required directories
mkdir -p "$INSTALL_DIR/data" "$LOG_DIR"

# -----------------------------------------------------------
# 4. Python virtual environment + dependencies
# -----------------------------------------------------------
info "Setting up Python environment..."

PYTHON_BIN="$(brew --prefix python3)/bin/python3"
if [[ ! -f "$PYTHON_BIN" ]]; then
    PYTHON_BIN="$(which python3)"
fi

if [[ ! -d "$VENV_DIR" ]]; then
    "$PYTHON_BIN" -m venv "$VENV_DIR"
    ok "Virtual environment created"
else
    ok "Virtual environment exists"
fi

"$VENV_DIR/bin/pip" install --quiet --upgrade pip
"$VENV_DIR/bin/pip" install --quiet -r "$INSTALL_DIR/backend/requirements.txt"
ok "Python dependencies installed"

# -----------------------------------------------------------
# 5. Frontend build
# -----------------------------------------------------------
info "Building frontend..."

cd "$INSTALL_DIR/frontend"
npm install --silent 2>/dev/null
npm run build 2>/dev/null
cd "$INSTALL_DIR"

ok "Frontend built"

# -----------------------------------------------------------
# 6. Generate secrets (.env)
# -----------------------------------------------------------
ENV_FILE="$INSTALL_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
    info "Generating secrets..."
    JWT_SECRET=$(openssl rand -hex 32)
    DB_KEY=$(openssl rand -hex 32)

    cat > "$ENV_FILE" <<ENVEOF
# Comply-v2 — auto-generated on $(date -u +%Y-%m-%dT%H:%M:%SZ)
# DO NOT COMMIT THIS FILE

OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=$OLLAMA_MODEL
API_PORT=8100
CORS_ORIGINS=http://localhost:3000

JWT_SECRET=$JWT_SECRET
DB_ENCRYPTION_KEY=$DB_KEY

RETENTION_DAYS=2555
PII_SCAN_ENABLED=true
AUDIT_LOG_ENABLED=true
ENVEOF

    chmod 600 "$ENV_FILE"
    ok "Secrets generated at $ENV_FILE"
else
    ok "Secrets file exists (not overwriting)"
fi

# -----------------------------------------------------------
# 7. Start Ollama and pull model
# -----------------------------------------------------------
info "Setting up Ollama..."

# Start Ollama if not running
if ! curl -s http://localhost:11434/api/tags &>/dev/null; then
    brew services start ollama 2>/dev/null || true
    info "  Waiting for Ollama to start..."
    for i in $(seq 1 30); do
        if curl -s http://localhost:11434/api/tags &>/dev/null; then
            break
        fi
        sleep 1
    done
fi

# Pull model if not already pulled
if ollama list 2>/dev/null | grep -q "$OLLAMA_MODEL"; then
    ok "Model $OLLAMA_MODEL already pulled"
else
    info "Pulling model $OLLAMA_MODEL (this may take a few minutes)..."
    ollama pull "$OLLAMA_MODEL"
    ok "Model $OLLAMA_MODEL ready"
fi

# -----------------------------------------------------------
# 8. Install launchd services
# -----------------------------------------------------------
info "Installing launchd services..."

mkdir -p "$LAUNCH_AGENTS"
OLLAMA_BIN="$(which ollama)"
NODE_BIN="$(which node)"

# Ollama plist
sed "s|__OLLAMA_BIN__|$OLLAMA_BIN|g" \
    "$INSTALL_DIR/scripts/launchd/com.comply-v2.ollama.plist" \
    > "$LAUNCH_AGENTS/com.comply-v2.ollama.plist"

# Backend plist — inject .env vars
BACKEND_PLIST="$LAUNCH_AGENTS/com.comply-v2.backend.plist"
cp "$INSTALL_DIR/scripts/launchd/com.comply-v2.backend.plist" "$BACKEND_PLIST"

# Frontend plist
sed "s|__NODE_BIN__|$NODE_BIN|g" \
    "$INSTALL_DIR/scripts/launchd/com.comply-v2.frontend.plist" \
    > "$LAUNCH_AGENTS/com.comply-v2.frontend.plist"

ok "launchd plists installed"

# -----------------------------------------------------------
# 9. Load and start services
# -----------------------------------------------------------
info "Starting services..."

# Stop existing if running
for svc in com.comply-v2.frontend com.comply-v2.backend com.comply-v2.ollama; do
    launchctl bootout "gui/$(id -u)/$svc" 2>/dev/null || true
done

sleep 1

# Start in order: ollama → backend → frontend
launchctl bootstrap "gui/$(id -u)" "$LAUNCH_AGENTS/com.comply-v2.ollama.plist" 2>/dev/null || true
info "  Waiting for Ollama..."
sleep 5

launchctl bootstrap "gui/$(id -u)" "$LAUNCH_AGENTS/com.comply-v2.backend.plist" 2>/dev/null || true
info "  Waiting for backend..."
sleep 4

launchctl bootstrap "gui/$(id -u)" "$LAUNCH_AGENTS/com.comply-v2.frontend.plist" 2>/dev/null || true
info "  Waiting for frontend..."
sleep 4

# -----------------------------------------------------------
# 10. Health checks
# -----------------------------------------------------------
echo ""
info "Running health checks..."

PASS=true

if curl -s http://localhost:11434/api/tags &>/dev/null; then
    ok "Ollama is running (port 11434)"
else
    warn "Ollama not responding"; PASS=false
fi

HEALTH=$(curl -s http://localhost:8100/health 2>/dev/null || echo "")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    ok "Backend is running (port 8100)"
else
    warn "Backend not responding"; PASS=false
fi

HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [[ "$HTTP_CODE" == "200" ]]; then
    ok "Frontend is running (port 3000)"
else
    warn "Frontend not responding (HTTP $HTTP_CODE)"; PASS=false
fi

# -----------------------------------------------------------
# 11. Done!
# -----------------------------------------------------------
echo ""
echo "========================================="
if $PASS; then
    echo -e "  ${GREEN}Comply-v2 is running!${NC}"
else
    echo -e "  ${YELLOW}Comply-v2 installed (some services still starting)${NC}"
    echo "  Run: comply-ctl status"
fi
echo "========================================="
echo ""
echo "  Frontend:   http://localhost:3000"
echo "  API Docs:   http://localhost:8100/docs"
echo "  Health:     http://localhost:8100/health"
echo ""
echo "  Control:    /opt/comply-v2/scripts/comply-ctl.sh status"
echo "  Logs:       /opt/comply-v2/logs/"
echo "  Data:       /opt/comply-v2/data/"
echo "  Secrets:    /opt/comply-v2/.env"
echo ""
echo "  Model:      $OLLAMA_MODEL"
echo "  RAM:        ${RAM_GB}GB"
echo ""
echo "  Services auto-start on boot."
echo "  To stop:    /opt/comply-v2/scripts/comply-ctl.sh stop"
echo "========================================="
