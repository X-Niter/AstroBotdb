#!/usr/bin/env python3

from flask import Flask, redirect, request
import os
import threading
import subprocess
import time

print("🚀 AstroBot Hybrid Server (Flask + Node.js)")
print("=========================================")

# Kill any existing processes
os.system("pkill -f node || true")

# Start Node.js in a thread
def start_nodejs():
    print("🚀 Starting Node.js...")
    os.system("node index.js &")

# Start Node.js in background
threading.Thread(target=start_nodejs, daemon=True).start()

# Create a Flask app that just redirects to Next.js
app = Flask(__name__)

@app.route('/health')
def health():
    return "OK - Flask/Next.js Bridge Running"

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    nextjs_url = f"http://localhost:3000/{path}"
    print(f"Redirecting to: {nextjs_url}")
    return redirect(nextjs_url)

# This satisfies the gunicorn launcher in the .replit config
if __name__ == "__main__":
    # Wait a moment for Node.js to start
    time.sleep(2)
    # Start Flask
    app.run(host="0.0.0.0", port=5000, debug=True)