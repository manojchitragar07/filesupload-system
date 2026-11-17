#!/bin/bash
# One-click startup script for File Manager

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PORT="${1:-8000}"

echo "============================================="
echo "  Starting My File Manager Server...        "
echo "============================================="
echo "Frontend: $DIR/frontend"
echo "Backend:  $DIR/backend"
echo "Storage:  $DIR/backend/uploads"
echo "URL:      http://127.0.0.1:$PORT/"
echo "============================================="

cd "$DIR/backend" || exit 1
python3 server.py "$PORT"
