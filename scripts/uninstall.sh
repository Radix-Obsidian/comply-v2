#!/bin/bash
# =========================================================
#  Comply-v2 Uninstaller
#  Removes services, data, and installation
# =========================================================

INSTALL_DIR="/opt/comply-v2"
LAUNCH_AGENTS="$HOME/Library/LaunchAgents"
GUI_DOMAIN="gui/$(id -u)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo ""
echo "========================================="
echo "  Comply-v2 Uninstaller"
echo "========================================="
echo ""

# Confirmation
echo -e "${YELLOW}This will remove:${NC}"
echo "  - All launchd services (auto-start)"
echo "  - Installation at $INSTALL_DIR"
echo "  - Database and logs"
echo ""
read -p "Are you sure? (type 'yes' to confirm): " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""

# 1. Stop and remove services
echo "Stopping services..."
for svc in com.comply-v2.frontend com.comply-v2.backend com.comply-v2.ollama; do
    launchctl bootout "$GUI_DOMAIN/$svc" 2>/dev/null || true
    rm -f "$LAUNCH_AGENTS/$svc.plist"
    echo -e "  ${YELLOW}Removed${NC} $svc"
done

# 2. Remove installation directory
if [[ -d "$INSTALL_DIR" ]]; then
    echo ""
    read -p "Delete $INSTALL_DIR and ALL data? (type 'yes'): " CONFIRM_DATA
    if [[ "$CONFIRM_DATA" == "yes" ]]; then
        sudo rm -rf "$INSTALL_DIR"
        echo -e "  ${GREEN}Removed${NC} $INSTALL_DIR"
    else
        echo -e "  ${YELLOW}Kept${NC} $INSTALL_DIR (remove manually if needed)"
    fi
fi

echo ""
echo "========================================="
echo -e "  ${GREEN}Comply-v2 uninstalled.${NC}"
echo ""
echo "  Homebrew packages (python, node, ollama)"
echo "  were NOT removed. Remove manually if needed:"
echo "    brew uninstall ollama python3 node"
echo "========================================="
