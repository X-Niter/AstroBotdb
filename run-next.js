#!/usr/bin/env node

// Direct runner for Next.js without any Flask/Python dependency
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔥 Pure Next.js Runner (No Flask/Python)');
console.log('=======================================');

// Kill any existing processes
try {
  console.log('Cleaning up any running processes...');
  require('child_process').execSync('pkill -f gunicorn || true');
  require('child_process').execSync('pkill -f python || true');
  require('child_process').execSync('pkill -f flask || true');
  require('child_process').execSync('pkill -f "next dev" || true');
} catch (error) {
  // Ignore errors
}

// Set up the dashboard path
const dashboardPath = path.join(__dirname, 'astrobot-monorepo', 'apps', 'dashboard');

// Check if the dashboard directory exists
if (!fs.existsSync(dashboardPath)) {
  console.error(`Dashboard directory not found at: ${dashboardPath}`);
  process.exit(1);
}

console.log(`✅ Found dashboard at: ${dashboardPath}`);

// Set environment variables
process.env.PORT = '3000';
process.env.NODE_ENV = 'development';

// Change to the dashboard directory and run Next.js
process.chdir(dashboardPath);
console.log('📂 Changed directory to:', process.cwd());

console.log('🚀 Starting Next.js on port 3000...');

// Start Next.js directly
const nextProcess = spawn('bun', ['run', 'dev', '--', '-p', '3000'], {
  stdio: 'inherit',
  shell: true
});

nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Next.js...');
  nextProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down Next.js...');
  nextProcess.kill('SIGTERM');
  process.exit(0);
});