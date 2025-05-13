// AstroBot AI - Main Entry Point
// This script handles the transition from Flask to pure Node.js

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create the Express app for API endpoints and health checks
const app = express();
const PORT = process.env.PORT || 5000;

// Simple API endpoint for status check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'AstroBot AI',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Root endpoint redirects to Next.js
app.get('/', (req, res) => {
  res.redirect('http://localhost:3000/');
});

// Catch-all route - redirect to Next.js
app.use((req, res) => {
  const nextUrl = `http://localhost:3000${req.path}`;
  res.redirect(nextUrl);
});

// Kill any Python/Flask processes that might be running
try {
  console.log('🧹 Cleaning up any Python/Flask processes...');
  require('child_process').execSync('pkill -f gunicorn || true');
  require('child_process').execSync('pkill -f python || true');
  require('child_process').execSync('pkill -f flask || true');
  require('child_process').execSync('pkill -f "next dev" || true');
} catch (error) {
  // Ignore errors
}

// Find the dashboard directory
const dashboardPath = path.join(__dirname, 'astrobot-monorepo', 'apps', 'dashboard');
console.log(`Looking for dashboard at: ${dashboardPath}`);

// Check if the dashboard directory exists
if (!fs.existsSync(dashboardPath)) {
  console.error(`❌ Dashboard directory not found at: ${dashboardPath}`);
  process.exit(1);
}

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

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 AstroBot API server running on port ${PORT}`);
  
  // Start the Next.js application
  console.log('🚀 Starting Next.js with Bun...');
  try {
    // Change to the dashboard directory
    process.chdir(dashboardPath);
    console.log(`📂 Changed to dashboard directory: ${process.cwd()}`);
    
    // Start Next.js with Bun
    const nextProcess = spawn('bun', ['run', 'dev'], {
      stdio: 'inherit',
      detached: false
    });
    
    nextProcess.on('error', (err) => {
      console.error('❌ Failed to start Next.js:', err);
    });
    
    // Handle process exit
    process.on('SIGINT', () => {
      console.log('Shutting down AstroBot AI...');
      nextProcess.kill('SIGINT');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('Shutting down AstroBot AI...');
      nextProcess.kill('SIGTERM');
      process.exit(0);
    });
    
    console.log('✨ AstroBot system ready!');
  } catch (error) {
    console.error('❌ Error starting Next.js:', error);
  }
});