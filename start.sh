#!/bin/bash

echo "🧹 Cleaning up any Python/Flask processes..."
pkill -f gunicorn || true
pkill -f python || true
pkill -f flask || true
pkill -f "next dev" || true

echo "🚀 Starting AstroBot with pure Node.js + Next.js"
echo "=============================================="

# Start the Node.js server
exec node app.js