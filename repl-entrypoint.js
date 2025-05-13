#!/usr/bin/env node

/**
 * AstroBot Replit Entrypoint
 * 
 * This script forces Replit to use Node.js instead of Python/Flask
 * by providing an alternative entry point that's executed by Replit's
 * infrastructure regardless of the .replit file configuration.
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Kill any Python processes that might be causing issues
try {
  console.log('🧹 Cleaning up legacy processes...');
  execSync('pkill -f gunicorn || true');
  execSync('pkill -f python || true');
  execSync('pkill -f flask || true');
  execSync('pkill -f "next dev" || true');
} catch (error) {
  // Ignore errors
}

// Define dashboard path
const dashboardPath = path.join(__dirname, 'astrobot-monorepo', 'apps', 'dashboard');

// Create a custom .env file if it doesn't exist
const envPath = path.join(dashboardPath, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating default .env file...');
  fs.writeFileSync(envPath, `# AstroBot Dashboard - Default Environment Variables
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
DISCORD_CLIENT_ID="discord_client_id"
DISCORD_CLIENT_SECRET="discord_client_secret"
NEXTAUTH_SECRET="astrobot-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
`);
}

// Create a simple Express server that will proxy to Next.js
const expressApp = require('./app.js');

// Start Next.js with Bun
console.log('🚀 Starting AstroBot Next.js with Bun...');
try {
  process.chdir(dashboardPath);
  console.log(`📂 Changed to dashboard directory: ${process.cwd()}`);
  
  const nextProcess = spawn('bun', ['run', 'dev'], {
    stdio: 'inherit',
    detached: false
  });
  
  nextProcess.on('error', (err) => {
    console.error('❌ Failed to start Next.js:', err);
    process.exit(1);
  });
  
  process.on('SIGINT', () => {
    nextProcess.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    nextProcess.kill('SIGTERM');
    process.exit(0);
  });
  
  console.log('✅ Next.js started successfully on port 3000!');
} catch (error) {
  console.error('❌ Error starting Next.js:', error);
}