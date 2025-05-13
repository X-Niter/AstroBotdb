#!/bin/bash

# Go to the monorepo directory
cd astrobot-monorepo || exit 1

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies with npm..."
  npm install || exit 1
fi

# Run the Next.js development server
echo "Starting Next.js dev server..."
npx next dev -p 3000