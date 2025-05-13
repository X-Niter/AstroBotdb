// Next.js launcher for AstroBot
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting AstroBot Dashboard');
console.log('============================');

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
console.log(`📂 Current directory: ${process.cwd()}`);

// Set environment variables
process.env.PORT = '3000';
process.env.NODE_ENV = 'development';

// Start Next.js
console.log('🚀 Starting Next.js on port 3000...');
const nextProcess = spawn('npx', ['next', 'dev', '-p', '3000'], {
  stdio: 'inherit',
  shell: true
});

// Handle errors
nextProcess.on('error', (err) => {
  console.error('❌ Failed to start Next.js:', err);
  process.exit(1);
});

// Handle exit
nextProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Next.js exited with code ${code}`);
    process.exit(code);
  }
});

// Handle signals
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