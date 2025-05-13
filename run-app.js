#!/usr/bin/env node

/**
 * AstroBot Runner
 * This script starts the AstroBot dashboard directly using Bun + Next.js,
 * replacing the Flask-based approach that was causing conflicts.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Kill any existing processes
try {
  console.log('🧹 Cleaning up any running processes...');
  require('child_process').execSync('pkill -f gunicorn || true');
  require('child_process').execSync('pkill -f python || true');
  require('child_process').execSync('pkill -f flask || true');
  require('child_process').execSync('pkill -f "next dev" || true');
} catch (error) {
  // Ignore errors
}

console.log('🚀 Pure AstroBot Runner (No Flask/Python)');
console.log('========================================');

// Find the dashboard directory
const dashboardPath = path.join(__dirname, 'astrobot-monorepo', 'apps', 'dashboard');
console.log(`Looking for dashboard at: ${dashboardPath}`);

// Check if the dashboard directory exists
if (!fs.existsSync(dashboardPath)) {
  console.error(`❌ Dashboard directory not found at: ${dashboardPath}`);
  process.exit(1);
}

console.log(`✅ Found dashboard at: ${dashboardPath}`);

// Change to the dashboard directory
process.chdir(dashboardPath);
console.log(`📂 Changed directory to: ${process.cwd()}`);

// Check if we have the necessary files
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found in the dashboard directory');
  process.exit(1);
}

// Check for .env file and create it if it doesn't exist
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file with default values...');
  fs.writeFileSync('.env', `# AstroBot Dashboard Environment
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
DISCORD_CLIENT_ID="discord_client_id"
DISCORD_CLIENT_SECRET="discord_client_secret"
NEXTAUTH_SECRET="astrobot-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
`);
  console.log('✅ Created .env file');
}

console.log('🚀 Starting Next.js with Bun on port 3000...');

// Start Next.js with Bun
const nextProcess = spawn('bun', ['run', 'dev', '--', '-p', '3000'], {
  stdio: 'inherit',
  shell: true
});

// Handle errors
nextProcess.on('error', (err) => {
  console.error('❌ Failed to start Next.js:', err);
  process.exit(1);
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('👋 Shutting down Next.js...');
  nextProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('👋 Shutting down Next.js...');
  nextProcess.kill('SIGTERM');
  process.exit(0);
});