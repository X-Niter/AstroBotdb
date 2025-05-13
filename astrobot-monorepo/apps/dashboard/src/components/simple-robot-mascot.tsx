"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

type RobotMascotProps = {
  size?: 'small' | 'medium' | 'large';
  color?: string;
};

// Fallback component to display when rendering fails
function RobotFallbackDisplay() {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg border border-gray-300 text-center">
      <svg
        className="w-16 h-16 text-gray-400 mb-2"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      <p className="text-sm font-medium">Robot Display Unavailable</p>
      <p className="text-xs text-gray-500 mt-1">
        The robot mascot couldn't be rendered in your browser.
      </p>
    </div>
  );
}

// Error handler for the error boundary
function handleError(error: Error, info: { componentStack: string }) {
  console.error('Robot Mascot rendering failed:', error);
  console.error('Component stack:', info.componentStack);
}

// Base component that renders the actual robot
function SimpleRobotMascotBase({ size = 'medium', color = '#5e81ac' }: RobotMascotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({
    width: 200,
    height: 200,
  });
  
  // Set dimensions based on size prop
  useEffect(() => {
    const sizeDimensions = {
      small: { width: 150, height: 150 },
      medium: { width: 250, height: 250 },
      large: { width: 350, height: 350 },
    };
    
    setDimensions(sizeDimensions[size]);
  }, [size]);
  
  // Draw the simple robot on canvas
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    // Draw robot (simple version for testing)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const robotSize = Math.min(canvas.width, canvas.height) * 0.8;
    
    // Draw head (circle)
    ctx.beginPath();
    ctx.arc(centerX, centerY - robotSize * 0.15, robotSize * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw body (rectangle)
    ctx.beginPath();
    ctx.rect(
      centerX - robotSize * 0.2,
      centerY + robotSize * 0.1,
      robotSize * 0.4,
      robotSize * 0.3
    );
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();
    
    // Draw eyes
    const eyeSize = robotSize * 0.06;
    
    // Left eye
    ctx.beginPath();
    ctx.arc(centerX - robotSize * 0.08, centerY - robotSize * 0.15, eyeSize, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();
    
    // Right eye
    ctx.beginPath();
    ctx.arc(centerX + robotSize * 0.08, centerY - robotSize * 0.15, eyeSize, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();
    
    // Draw arms
    ctx.beginPath();
    ctx.moveTo(centerX - robotSize * 0.2, centerY + robotSize * 0.15);
    ctx.lineTo(centerX - robotSize * 0.4, centerY + robotSize * 0.05);
    ctx.lineWidth = 5;
    ctx.strokeStyle = color;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + robotSize * 0.2, centerY + robotSize * 0.15);
    ctx.lineTo(centerX + robotSize * 0.4, centerY + robotSize * 0.05);
    ctx.lineWidth = 5;
    ctx.strokeStyle = color;
    ctx.stroke();
    
    // Draw legs
    ctx.beginPath();
    ctx.moveTo(centerX - robotSize * 0.1, centerY + robotSize * 0.4);
    ctx.lineTo(centerX - robotSize * 0.1, centerY + robotSize * 0.6);
    ctx.lineWidth = 5;
    ctx.strokeStyle = color;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + robotSize * 0.1, centerY + robotSize * 0.4);
    ctx.lineTo(centerX + robotSize * 0.1, centerY + robotSize * 0.6);
    ctx.lineWidth = 5;
    ctx.strokeStyle = color;
    ctx.stroke();
    
    // Draw mouth
    ctx.beginPath();
    ctx.arc(centerX, centerY - robotSize * 0.08, robotSize * 0.08, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#333';
    ctx.stroke();
    
  }, [dimensions, color]);
  
  return (
    <div className="relative">
      <canvas 
        ref={canvasRef} 
        width={dimensions.width} 
        height={dimensions.height}
        className="block"
      />
    </div>
  );
}

// Wrapper component with error boundary
function SimpleRobotMascot(props: RobotMascotProps) {
  return (
    <ErrorBoundary FallbackComponent={RobotFallbackDisplay} onError={handleError}>
      <SimpleRobotMascotBase {...props} />
    </ErrorBoundary>
  );
}

export default SimpleRobotMascot;