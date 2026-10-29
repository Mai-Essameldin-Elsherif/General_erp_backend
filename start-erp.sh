#!/bin/bash
# General ERP - Start All Servers
# Double-click this file or run: bash start-erp.sh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 General ERP - Starting Servers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo ""
echo "📂 Project: $SCRIPT_DIR"
echo ""

# Start Backend in new Terminal tab
echo "▶  Starting Backend (NestJS) on port 3000..."
osascript -e "tell application \"Terminal\"
  activate
  tell application \"System Events\" to keystroke \"t\" using {command down}
  delay 0.5
  do script \"cd '$SCRIPT_DIR/General_erp_backend' && npm run start:dev\" in front window
end tell"

sleep 2

# Start Frontend in new Terminal tab
echo "▶  Starting Frontend (Vite) on port 5173..."
osascript -e "tell application \"Terminal\"
  activate
  tell application \"System Events\" to keystroke \"t\" using {command down}
  delay 0.5
  do script \"cd '$SCRIPT_DIR/frontend' && npm run dev\" in front window
end tell"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Done! Open: http://localhost:5173"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Login: admin3@erp.com / Admin@123"
echo "     or: admin@erp.com  / Admin@123"
echo ""
