#!/bin/bash
# =========================================================
#  Comply-v2 Service Controller
#  Usage: comply-ctl.sh [start|stop|restart|status|logs]
# =========================================================

INSTALL_DIR="/opt/comply-v2"
LOG_DIR="$INSTALL_DIR/logs"
LAUNCH_AGENTS="$HOME/Library/LaunchAgents"
GUI_DOMAIN="gui/$(id -u)"

SERVICES=(
    "com.comply-v2.ollama"
    "com.comply-v2.backend"
    "com.comply-v2.frontend"
)

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

case "${1:-status}" in

start)
    echo "Starting Comply-v2 services..."
    for svc in "${SERVICES[@]}"; do
        plist="$LAUNCH_AGENTS/$svc.plist"
        if [[ -f "$plist" ]]; then
            launchctl bootstrap "$GUI_DOMAIN" "$plist" 2>/dev/null || true
            echo -e "  ${GREEN}Started${NC} $svc"
        else
            echo -e "  ${RED}Missing${NC} $plist"
        fi
        sleep 2
    done
    echo "Done. Run '$0 status' to verify."
    ;;

stop)
    echo "Stopping Comply-v2 services..."
    # Stop in reverse order
    for (( i=${#SERVICES[@]}-1; i>=0; i-- )); do
        svc="${SERVICES[$i]}"
        launchctl bootout "$GUI_DOMAIN/$svc" 2>/dev/null || true
        echo -e "  ${YELLOW}Stopped${NC} $svc"
    done
    echo "All services stopped."
    ;;

restart)
    echo "Restarting Comply-v2..."
    "$0" stop
    sleep 3
    "$0" start
    ;;

status)
    echo ""
    echo "Comply-v2 Service Status"
    echo "========================"

    # Ollama
    if curl -s http://localhost:11434/api/tags &>/dev/null; then
        MODEL_COUNT=$(curl -s http://localhost:11434/api/tags 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('models',[])))" 2>/dev/null || echo "?")
        echo -e "  Ollama:    ${GREEN}running${NC} (${MODEL_COUNT} models loaded)"
    else
        echo -e "  Ollama:    ${RED}stopped${NC}"
    fi

    # Backend
    HEALTH=$(curl -s http://localhost:8100/health 2>/dev/null || echo "")
    if echo "$HEALTH" | grep -q '"status":"ok"'; then
        VERSION=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('version','?'))" 2>/dev/null || echo "?")
        echo -e "  Backend:   ${GREEN}running${NC} v${VERSION} (port 8100)"
    else
        echo -e "  Backend:   ${RED}stopped${NC}"
    fi

    # Frontend
    HTTP=$(curl -o /dev/null -s -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
    if [[ "$HTTP" == "200" ]]; then
        echo -e "  Frontend:  ${GREEN}running${NC} (port 3000)"
    else
        echo -e "  Frontend:  ${RED}stopped${NC} (HTTP $HTTP)"
    fi

    echo ""
    echo "  Frontend:  http://localhost:3000"
    echo "  API Docs:  http://localhost:8100/docs"
    echo "  Logs:      $LOG_DIR/"
    echo ""
    ;;

logs)
    SERVICE="${2:-backend}"
    LOG_FILE="$LOG_DIR/$SERVICE.log"
    ERR_FILE="$LOG_DIR/$SERVICE.err"

    if [[ -f "$ERR_FILE" ]] && [[ -s "$ERR_FILE" ]]; then
        echo "=== $SERVICE stderr (last 30 lines) ==="
        tail -30 "$ERR_FILE"
        echo ""
    fi
    if [[ -f "$LOG_FILE" ]]; then
        echo "=== $SERVICE stdout (last 30 lines) ==="
        tail -30 "$LOG_FILE"
    else
        echo "No log file found at $LOG_FILE"
        echo "Available: ollama, backend, frontend"
    fi
    ;;

*)
    echo "Usage: $0 {start|stop|restart|status|logs [service]}"
    echo ""
    echo "  start    - Start all Comply-v2 services"
    echo "  stop     - Stop all services"
    echo "  restart  - Restart all services"
    echo "  status   - Show service status and URLs"
    echo "  logs     - Show logs (default: backend)"
    echo "             logs ollama | logs backend | logs frontend"
    ;;

esac
