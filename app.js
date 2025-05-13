// AstroBot AI Dashboard Server
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

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

// Root endpoint
app.get('/', (req, res) => {
  res.redirect('http://localhost:3000/');
});

// Catch-all route - redirect to Next.js
app.use((req, res) => {
  const nextUrl = `http://localhost:3000${req.path}`;
  res.redirect(nextUrl);
});

// Start Next.js dashboard in the background
function startNextJsDashboard() {
  console.log('🚀 Starting AstroBot Dashboard with Bun + Next.js');
  
  // Find the dashboard directory
  const dashboardPath = path.join(__dirname, 'astrobot-monorepo', 'apps', 'dashboard');
  console.log(`Looking for dashboard at: ${dashboardPath}`);
  
  try {
    // Change to the dashboard directory
    process.chdir(dashboardPath);
    console.log(`📂 Changed to dashboard directory: ${process.cwd()}`);
    
    // Start Next.js using Bun
    const nextProcess = spawn('bun', ['run', 'dev'], {
      stdio: 'inherit',
      detached: false
    });
    
    nextProcess.on('error', (err) => {
      console.error('❌ Failed to start Next.js:', err);
    });
    
    console.log('✅ Next.js dashboard started on port 3000');
    
    // Return to original directory
    process.chdir(__dirname);
  } catch (error) {
    console.error('Error starting Next.js dashboard:', error);
  }
}

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 AstroBot API server running on port ${PORT}`);
  
  // Start the Next.js dashboard
  startNextJsDashboard();
  
  console.log('✨ AstroBot system ready!');
});