"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { EmotionalState, ParticleDisplay } from "../utils/types";
// Import the detailed robot model
import RealisticRobotModel from "./realistic-robot-model";
import ThreeJsErrorBoundary from "./three-js-error-boundary";

// Safety check to help debugging
if (!RealisticRobotModel) {
  console.error('RealisticRobotModel is undefined');
}

interface FullscreenRobotProps {
  emotionalState?: EmotionalState;
  showParticles?: ParticleDisplay;
  animation?: string;
  interactive?: boolean;
  hologramText?: string | null;
  onComplete?: () => void;
  highQuality?: boolean;
}

const FullscreenRobot: React.FC<FullscreenRobotProps> = ({
  emotionalState = "neutral",
  showParticles = "none",
  animation = "idle",
  interactive = true,
  hologramText = null,
  onComplete,
  highQuality = false,
}) => {
  const [animating, setAnimating] = useState(false);

  // Handle animation completion
  const handleAnimationComplete = () => {
    setAnimating(false);
    if (onComplete) {
      onComplete();
    }
  };

  useEffect(() => {
    if (animation && animation !== "idle") {
      setAnimating(true);
    }
  }, [animation]);

  return (
    <div 
      className="fixed top-0 left-0 w-screen h-screen pointer-events-none z-[1000]"
      style={{ 
        overflow: 'visible',
        pointerEvents: interactive ? 'auto' : 'none'
      }}
    >
      <ThreeJsErrorBoundary fallback={<div>Failed to load 3D robot model</div>}>
        <Canvas
          style={{ 
            position: 'absolute', 
            top: '-100%', // Double the offset to ensure maximum space
            left: '-100%', 
            width: '300%', // Triple the width to ensure plenty of room
            height: '300%', // Triple the height
            background: 'transparent' 
          }}
          gl={{
            antialias: highQuality,
            alpha: true,
            powerPreference: 'high-performance'
          }}
          camera={{
            position: [0, -5, 20], // Position much lower and further back
            fov: 25, // Very narrow field of view to reduce distortion
            near: 0.1,
            far: 1000
          }}
        >
          <Suspense fallback={null}>
            <Environment preset="city" />
            
            {/* Use OrbitControls instead of PresentationControls for more flexibility */}
            {interactive && (
              <OrbitControls 
                enablePan={false}
                minPolarAngle={Math.PI / 4} // Allow more upward view to see head
                maxPolarAngle={Math.PI / 1.8} // Restrict downward view less
                minDistance={5}
                maxDistance={30} // Allow zooming out further
                target={[0, -8, 0]} // Move the target point down to focus on the robot's body
              />
            )}
            
            <directionalLight position={[5, 5, 5]} intensity={0.5} />
            <directionalLight position={[-5, 5, 5]} intensity={0.5} />
            <ambientLight intensity={0.5} />
            
            {/* To completely avoid the possibility of a reference error */}
            {RealisticRobotModel && (
              <RealisticRobotModel
                animation={animation}
                emotionalState={emotionalState}
                showParticles={showParticles}
                hologramText={hologramText}
                onComplete={handleAnimationComplete}
              />
            )}
          </Suspense>
        </Canvas>
      </ThreeJsErrorBoundary>
    </div>
  );
}

export default FullscreenRobot;