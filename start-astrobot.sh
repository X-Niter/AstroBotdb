#!/bin/bash

# Kill any existing processes
pkill -f python || true
pkill -f gunicorn || true 
pkill -f "next dev" || true

echo "🚀 Starting AstroBot Dashboard with Bun + Next.js"
echo "==============================================="

# Change to the dashboard directory
cd astrobot-monorepo/apps/dashboard || exit 1

# Start Next.js with Bun
echo "📡 Starting Next.js on port 3000..."
exec bun run dev