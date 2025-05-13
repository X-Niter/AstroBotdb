"use client";

import React, { useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { useFrame } from '@react-three/fiber';

// Global animation time reference that can be shared across components
// This prevents hydration mismatches and ensures consistent timing
export const globalTimeRef = { current: { value: 0 } };

/**
 * A specialized component for handling Three.js animation timing
 * This should be placed inside the Canvas component to update the global time reference
 */
const RobotTimeKeeper: React.FC<{
  isPaused?: boolean;
  timeScale?: number;
  onTick?: (elapsedTime: number) => void;
}> = ({
  isPaused = false,
  timeScale = 1.0,
  onTick
}) => {
  // Track last frame time for delta calculations
  const lastTimeRef = useRef(0);
  
  // Update the global time reference on each frame
  useFrame((_, delta) => {
    if (isPaused) return;
    
    // Scale the time delta by timeScale for speed control
    const scaledDelta = delta * timeScale;
    
    // Update the global time reference
    globalTimeRef.current.value += scaledDelta;
    
    // Calculate elapsed time since last frame
    const elapsedTime = globalTimeRef.current.value - lastTimeRef.current;
    lastTimeRef.current = globalTimeRef.current.value;
    
    // Call optional tick callback
    if (onTick) {
      onTick(elapsedTime);
    }
  });
  
  // This component doesn't render anything visible
  return null;
};

// Export a function to help initialize the global time system
export function initializeTimeSystem() {
  // Initialize with current time to ensure consistency
  globalTimeRef.current.value = 0;
}

export default RobotTimeKeeper;