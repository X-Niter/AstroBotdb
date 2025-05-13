"use client";

import React, { useRef, useState, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import { Canvas } from "@react-three/fiber";
import { 
  Environment, 
  ContactShadows, 
  PresentationControls, 
  Html
} from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Noise, DepthOfField } from "@react-three/postprocessing";
import ThreeJsErrorBoundary from "./three-js-error-boundary";
import { EmotionalState, ParticleDisplay } from "../utils/types";
import { FuturisticHumanoidRobot } from "./futuristic-humanoid-robot";
import ThreeJsCanvas from "./three-js-canvas";

// Enhanced robot model component that uses our detailed futuristic humanoid robot
const RobotModel: React.FC<{
  currentSequence: string | null;
  emotionalState: EmotionalState;
  showParticles: ParticleDisplay;
  hologramText: string | null;
  isAnimating: boolean;
  onComplete?: () => void;
}> = ({ 
  currentSequence, 
  emotionalState, 
  showParticles, 
  hologramText, 
  isAnimating,
  onComplete
}) => {
  // Animation effect
  const [bobPosition, setBobPosition] = useState(0);

  useEffect(() => {
    if (!isAnimating) return;

    let animationFrameId: number;
    let startTime = Date.now();

    const animationLoop = () => {
      const elapsed = Date.now() - startTime;
      const newBobPosition = Math.sin(elapsed / 500) * 0.05;
      setBobPosition(newBobPosition);
      animationFrameId = requestAnimationFrame(animationLoop);
    };

    animationLoop();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAnimating]);

  // Use our enhanced futuristic humanoid robot from separate component
  return (
    <FuturisticHumanoidRobot
      animation={currentSequence || "idle"}
      emotionalState={emotionalState}
      position={[0, bobPosition - 4, 0]} // Shifted significantly down to ensure head visibility
      rotation={[0, Math.PI * 0.05, 0]}
      scale={[0.7, 0.7, 0.7]} // Scaled down further to fit in view
      showParticles={showParticles}
      hologramText={hologramText}
      onComplete={onComplete}
    />
  );
};

// Performance settings type
interface PerformanceSettings {
  shadows: boolean;
  environment: boolean;
  postProcessing: boolean;
  pixelRatio: number;
}

// Component props interface
interface SafeRobot3DProps {
  currentSequence: string | null;
  emotionalState: EmotionalState;
  showParticles: ParticleDisplay;
  hologramText: string | null;
  animate: boolean;
  interactive: boolean;
  highQuality: boolean;
  onComplete?: () => void;
}

// Main component implementing the 3D robot
const SafeRobot3D: React.FC<SafeRobot3DProps> = ({ 
  currentSequence, 
  emotionalState,
  showParticles,
  hologramText,
  animate,
  interactive,
  highQuality,
  onComplete
}) => {
  // Performance settings based on highQuality prop
  const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings>({
    shadows: highQuality,
    environment: highQuality,
    postProcessing: true, // Keep minimal post-processing for visual appeal
    pixelRatio: 1 // Default value until we access window
  });
  
  // Set pixel ratio after component mounts to avoid SSR issues
  useEffect(() => {
    // Check if we're in a browser environment first
    if (typeof window !== 'undefined') {
      // Now it's safe to access window
      setPerformanceSettings(prev => ({
        ...prev,
        pixelRatio: Math.max(2.5, window.devicePixelRatio) // Force high resolution
      }));
    }
  }, [highQuality]);

  // Use our portal-based ThreeJsCanvas component to break out of any constraining containers
  return (
    <div className="w-full h-full" style={{ position: 'relative', minHeight: '200px' }}>
      <ThreeJsCanvas
        width="100%"
        height="100%"
        dpr={performanceSettings.pixelRatio}
        gl={{ 
          antialias: highQuality,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        camera={{ 
          position: [0, -3, 12], // Positioned even lower and further back
          fov: 40, // Narrower field of view to reduce distortion
          near: 0.1,
          far: 1000
        }}
        shadows={performanceSettings.shadows}
      >
        <Suspense fallback={null}>
          {/* Enhanced lighting for better visibility */}
          <ambientLight intensity={0.8} />
          <directionalLight 
            position={[5, 5, 5]} 
            intensity={1} 
            castShadow={performanceSettings.shadows}
          />
          {performanceSettings.environment && (
            <Environment preset="city" />
          )}
          
          <PresentationControls
            global
            rotation={[0.3, 0, 0]} // More downward tilt to see top of head
            polar={[-0.6, 0.6]} // Expanded range for more movement
            azimuth={[-1.2, 1.2]}  // Expanded range for more movement
            speed={2} // More responsive
            zoom={0.7}  // Zoomed out to see more of the robot
            enabled={interactive}
          >
            <RobotModel
              currentSequence={currentSequence}
              emotionalState={emotionalState}
              showParticles={showParticles}
              hologramText={hologramText}
              isAnimating={animate}
              onComplete={onComplete}
            />
          </PresentationControls>

          {performanceSettings.postProcessing && (
            <EffectComposer>
              <Bloom 
                luminanceThreshold={0.6} 
                luminanceSmoothing={0.8} 
                intensity={0.8}
                radius={0.5}
              />
              <ChromaticAberration
                offset={[0.0005, 0.0005]}
              />
              {/* Removed noise effect for sharper image */}
              {/* Removed Depth of Field for sharper image */}
            </EffectComposer>
          )}
        </Suspense>
      </ThreeJsCanvas>
    </div>
  );
};

export default SafeRobot3D;