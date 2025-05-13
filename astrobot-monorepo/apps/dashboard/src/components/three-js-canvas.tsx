"use client";

import React, { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import ThreeJsErrorBoundary from './three-js-error-boundary';
import UniversalClientOnly from './universal-client-only';
import RobotFallback from './robot-fallback';

// Dynamically import the Canvas to avoid SSR issues
const DynamicCanvas = dynamic(
  () => import('@react-three/fiber').then(mod => mod.Canvas), 
  { ssr: false }
);

interface ThreeJsCanvasProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  width?: number | string;
  height?: number | string;
  className?: string;
  shadows?: boolean;
  dpr?: number;
  gl?: any;
  camera?: any;
  style?: React.CSSProperties;
}

/**
 * ThreeJsCanvas - A robust Canvas implementation for Three.js that:
 * 1. Only renders on the client side
 * 2. Handles errors gracefully
 * 3. Provides meaningful fallbacks
 */
const ThreeJsCanvas: React.FC<ThreeJsCanvasProps> = ({
  children,
  fallback,
  onError,
  width = '100%',
  height = '100%',
  className = '',
  shadows = true,
  dpr = 1,
  gl = { antialias: true },
  camera = { position: [0, 0, 5], fov: 45 },
  style = {},
}) => {
  // Default fallback while loading/during SSR
  const defaultFallback = (
    <div
      style={{ 
        width, 
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
      className={className}
    >
      <RobotFallback 
        message="Loading 3D visualization..."
        emotionalState="thinking"
        size="default"
      />
    </div>
  );

  // Custom fallback for error states
  const errorFallback = (
    <div
      style={{ 
        width, 
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
      className={className}
    >
      <RobotFallback 
        message="Unable to render 3D content"
        emotionalState="confused"
        size="default"
      />
    </div>
  );
  
  // Use a portal to render the 3D content outside of any constraints
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  
  // Create a portal container when the component mounts
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      // Look for existing container or create a new one
      let container = document.getElementById('robot-portal-container');
      
      if (!container) {
        container = document.createElement('div');
        container.id = 'robot-portal-container';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '150vw'; // Wider than viewport to ensure no clipping
        container.style.height = '150vh'; // Taller than viewport
        container.style.transform = 'translate(-25%, -25%)'; // Center the expanded container
        container.style.pointerEvents = 'auto'; // Enable interactions with the robot
        container.style.zIndex = '50'; // Ensure it's above content but not too high
        container.style.overflow = 'visible';
        container.style.background = 'transparent';
        document.body.appendChild(container);
      }
      
      setPortalContainer(container);
    }
    
    // Cleanup on unmount
    return () => {
      // We don't remove the container to avoid flicker if multiple components use it
    };
  }, []);
  
  // The actual canvas with Three.js content
  const canvasContent = (
    <div 
      style={{ 
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100vw',
        height: '100vh',
        pointerEvents: 'auto',
        overflow: 'visible'
      }} 
      className={className}
    >
      <ThreeJsErrorBoundary 
        fallback={errorFallback}
        onError={onError}
        resetAfterSeconds={5}
      >
        <DynamicCanvas
          shadows={shadows}
          dpr={dpr}
          gl={gl}
          camera={camera}
          style={{ 
            width: '100%', 
            height: '100%',
            overflow: 'visible'
          }}
        >
          {children}
        </DynamicCanvas>
      </ThreeJsErrorBoundary>
    </div>
  );

  // Render a placeholder div in the original position and the actual content in a portal
  return (
    <UniversalClientOnly fallback={fallback || defaultFallback}>
      <>
        {/* Placeholder for layout purposes only */}
        <div style={{ width, height, ...style }} className={className}></div>
        
        {/* Render actual content through portal */}
        {portalContainer && createPortal(canvasContent, portalContainer)}
      </>
    </UniversalClientOnly>
  );
};

export default ThreeJsCanvas;