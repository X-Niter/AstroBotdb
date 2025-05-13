#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Direct AstroBot Next.js Runner');
console.log('================================');

// Ensure we're killing any existing processes
try {
  console.log('Cleaning up any existing processes...');
  require('child_process').execSync('pkill -f "next dev" || true');
  require('child_process').execSync('pkill -f gunicorn || true');
} catch (error) {
  // Ignore errors from pkill
}

// Build the path to the dashboard
const dashboardPath = path.join(__dirname, 'astrobot-monorepo', 'apps', 'dashboard');

// Check if the dashboard directory exists
try {
  require('fs').accessSync(dashboardPath, require('fs').constants.F_OK);
  console.log(`✅ Dashboard found at: ${dashboardPath}`);
} catch (error) {
  console.error(`❌ Dashboard not found at: ${dashboardPath}`);
  console.error(error);
  process.exit(1);
}

// Set environment variables
process.env.PORT = '3000';
process.env.NODE_ENV = 'development';

console.log('🔄 Starting Next.js server on port 3000...');

// Change directory and start Next.js directly
const nextProcess = spawn('cd astrobot-monorepo/apps/dashboard && bun run dev -- -p 3000', {
  stdio: 'inherit',
  shell: true
});

nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js application:', err);
  process.exit(1);
});

// Handle clean shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Next.js application...');
  nextProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down Next.js application...');
  nextProcess.kill('SIGTERM');
  process.exit(0);
});