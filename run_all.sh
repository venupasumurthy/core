#!/usr/bin/env bash
# HackFusion 2026 - Multi-Robot Task Negotiation Engine
# Startup script for Unix / Linux / macOS

echo "======================================================================"
echo "   HackFusion 2026 - Multi-Robot Task Negotiation Engine"
echo "   Starting FastAPI Backend (:8000) and Next.js Dashboard (:3000)..."
echo "======================================================================"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

# Start Backend
(cd "$DIR/backend" && python -m uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!

# Wait for backend
sleep 2

# Start Frontend
(cd "$DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo "Systems running:"
echo " - Next.js Dashboard: http://localhost:3000/dashboard"
echo " - FastAPI Gateway:    http://localhost:8000"
echo "Press Ctrl+C to stop all services."

wait
