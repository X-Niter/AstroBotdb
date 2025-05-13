"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import ThreeJsErrorBoundary from "./three-js-error-boundary";
import RobotFallback from "./robot-fallback";
import { EmotionalState, ParticleDisplay, ComponentSize } from "../utils/types";

// Animation sequences for the robot
export const ANIMATION_SEQUENCES = {
  IDLE: "idle",
  GREETING: "greeting",
  WAVE: "wave",
  WALK: "walk",
  BUILD: "build",
  REPAIR: "repair",
  SCAN: "scan",
  THINK: "think",
  HOLOGRAM: "hologram",
  SURPRISED: "surprised",
  ALERT: "alert",
  HAPPY: "happy",
  SAD: "sad",
  CONFUSED: "confused",
  TYPING: "typing",
  PROCESSING: "processing"
};

// Component properties with expanded animation options
interface AstroBotMascot3DProps {
  size?: ComponentSize;
  showText?: boolean;
  animate?: boolean;
  showParticles?: ParticleDisplay;
  animationSequence?: string | null;
  hologramText?: string | null;
  interactive?: boolean;
  emotionalState?: EmotionalState;
  onComplete?: () => void;
  onInteraction?: (type: string) => void;
  highQuality?: boolean;
}

// Create a loading fallback component that doesn't use 3D
const LoadingFallback = () => {
  return (
    <div className="flex items-center justify-center bg-gradient-to-b from-gray-900 to-blue-900 w-full h-full min-h-[300px] rounded-lg">
      <div className="animate-pulse text-blue-300 font-mono text-sm">
        Loading 3D Robot...
      </div>
    </div>
  );
};

// Create a safer dynamic import for the Three.js implementation
// with proper SSR handling to avoid hook errors
const ThreeDRobot = dynamic(
  () => import("./safe-robot-3d"),
  { 
    ssr: false,
    loading: () => <LoadingFallback />
  }
);

// Main component
const AstroBotMascot3D: React.FC<AstroBotMascot3DProps> = ({
  size = "default",
  showText = false,
  animate = true,
  showParticles = "none",
  animationSequence = null,
  hologramText = null,
  interactive = true,
  emotionalState = "neutral",
  onComplete,
  onInteraction,
  highQuality = false
}) => {
  // Calculate dimensions based on size - increased dimensions to prevent clipping
  const dimensions = {
    small: { width: 150, height: 150 },
    default: { width: 250, height: 300 },
    large: { width: 350, height: 400 },
    xlarge: { width: 450, height: 550 }
  }[size];

  // Animation state
  const [currentSequence, setCurrentSequence] = useState<string | null>(
    animationSequence || ANIMATION_SEQUENCES.IDLE
  );
  const [hovering, setHovering] = useState(false);

  // Handle animation sequence changes
  useEffect(() => {
    if (animationSequence) {
      setCurrentSequence(animationSequence);
    }
  }, [animationSequence]);

  // Mouse interaction handlers
  const handleMouseEnter = () => {
    setHovering(true);
    if (onInteraction) onInteraction("hover_start");
  };

  const handleMouseLeave = () => {
    setHovering(false);
    if (onInteraction) onInteraction("hover_end");
  };

  return (
    <div
      style={{ 
        width: '100%',
        height: '100%',
        position: 'absolute', // Position absolutely to break out of normal flow
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)', // Center the container
        pointerEvents: 'auto', // Ensure interactions work
        overflow: 'visible', // Allow content to overflow without clipping
        zIndex: 50 // Ensure it appears above other content
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="robot-container"
    >
      <ThreeJsErrorBoundary 
        fallback={<RobotFallback emotionalState={emotionalState} size={size} />}
        resetAfterSeconds={5}
      >
        <ThreeDRobot 
          currentSequence={currentSequence}
          emotionalState={emotionalState}
          showParticles={showParticles}
          hologramText={hologramText}
          animate={animate}
          interactive={interactive}
          highQuality={highQuality}
          onComplete={onComplete}
        />
      </ThreeJsErrorBoundary>
      
      {/* Optional text display */}
      {showText && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-center font-mono text-blue-400">
          <span>{currentSequence || "idle"}</span>
        </div>
      )}
    </div>
  );
};

export default AstroBotMascot3D;