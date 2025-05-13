// Download a realistic robot model from a free 3D model source
const fs = require('fs');
const https = require('https');
const path = require('path');

// URL to a free robot model 
// This is a placeholder URL - we would replace it with a real model URL
const MODEL_URL = 'https://models.readyplayer.me/64fa5c5565e025908c751337.glb';
const OUTPUT_PATH = path.join(__dirname, 'public', 'models', 'future_robot.glb');

console.log(`Downloading robot model from ${MODEL_URL} to ${OUTPUT_PATH}...`);

// Create the directory if it doesn't exist
const dir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`Created directory: ${dir}`);
}

// Download the file
const file = fs.createWriteStream(OUTPUT_PATH);
https.get(MODEL_URL, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download model: ${response.statusCode} ${response.statusMessage}`);
    file.close();
    fs.unlinkSync(OUTPUT_PATH);
    return;
  }

  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('Model downloaded successfully!');
  });
}).on('error', (err) => {
  fs.unlinkSync(OUTPUT_PATH);
  console.error(`Error downloading model: ${err.message}`);
});