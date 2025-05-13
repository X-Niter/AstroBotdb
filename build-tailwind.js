// build-tailwind.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure directories exist
const dirs = ['./static/css/dist'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Use npx directly to ensure it works regardless of local installation
try {
  console.log('Building Tailwind CSS...');
  execSync(`npx tailwindcss -i ./static/css/tailwind.css -o ./static/css/output.css`, { stdio: 'inherit' });
  console.log('Tailwind CSS built successfully!');
  
  // Make a copy in the dist folder
  fs.copyFileSync('./static/css/output.css', './static/css/dist/tailwind.css');
  console.log('Copied to dist folder successfully!');
} catch (error) {
  console.error('Error building Tailwind CSS:', error.message);
  process.exit(1);
}

console.log('Build completed!');