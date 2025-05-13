#!/bin/bash

echo "📡 Starting AstroBot Next.js Dashboard..."

# Make sure we're in the correct directory
cd "$(dirname "$0")/astrobot-monorepo" || exit 1

# Check if dashboard directory exists
if [ ! -d "apps/dashboard" ]; then
  echo "❌ Error: Dashboard directory not found"
  exit 1
fi

echo "✓ Found dashboard directory"

# Navigate to the dashboard directory
cd apps/dashboard || exit 1

# Kill any existing Next.js processes
pkill -f "next dev" 2>/dev/null || true
pkill -f "node.*next" 2>/dev/null || true

# Set the port explicitly
export PORT=3000
export NODE_ENV=development

# Run Next.js development server
echo "🚀 Starting Next.js server on port 3000..."
exec bun run dev -- -p 3000