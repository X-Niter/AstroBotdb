'use client';

import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  OrbitControls,
  Environment,
  PerspectiveCamera
} from "@react-three/drei";
import * as THREE from "three";
import { EmotionalState, ParticleDisplay } from "../utils/types";
import { ANIMATION_SEQUENCES } from "./astro-bot-mascot-3d-simplified";
import ParametricDroid from "./parametric-droid";

interface Enhanced3DRobotProps {
  emotionalState?: EmotionalState;
  showParticles?: ParticleDisplay;
  animation?: string;
  hologramText?: string | null;
  onComplete?: () => void;
  interactive?: boolean;
}

// Enhanced camera control component to ensure full head visibility
const EnhancedCamera = () => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  
  useEffect(() => {
    if (cameraRef.current) {
      // Position the camera to see the full robot including head
      cameraRef.current.position.set(0, 1, 5); // Move camera up and closer
      cameraRef.current.lookAt(0, 0, 0); // Look at the center
    }
  }, []);
  
  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={40}
      near={0.1}
      far={1000}
      position={[0, 1, 5]} // Match position with useEffect
    />
  );
};

// Robot container with animation bobbing
const RobotContainer = ({ 
  animation, 
  emotionalState, 
  showParticles, 
  hologramText, 
  onComplete 
}: { 
  animation: string; 
  emotionalState: EmotionalState; 
  showParticles: ParticleDisplay; 
  hologramText: string | null; 
  onComplete?: () => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [bobPosition, setBobPosition] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Handle subtle floating motion
  useEffect(() => {
    if (animation && animation !== "idle") {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [animation]);
  
  // Subtle bob animation
  useFrame((state) => {
    if (!isAnimating && groupRef.current) {
      const t = state.clock.getElapsedTime();
      const newPos = Math.sin(t * 0.5) * 0.05;
      setBobPosition(newPos);
      groupRef.current.position.y = newPos;
    }
  });
  
  return (
    <group ref={groupRef}>
      <ParametricDroid
        animation={animation}
        emotionalState={emotionalState}
        position={[0, 0, 0]} // Position at center of scene
        rotation={[0, 0, 0]}
        scale={[0.5, 0.5, 0.5]} // Scaled down a bit more to ensure visibility
        showParticles={showParticles}
        hologramText={hologramText}
        onComplete={onComplete}
        interactive={true}
      />
    </group>
  );
};

const Enhanced3DRobot: React.FC<Enhanced3DRobotProps> = ({
  emotionalState = "neutral",
  showParticles = "none",
  animation = ANIMATION_SEQUENCES.IDLE,
  hologramText = null,
  onComplete,
  interactive = true
}) => {
  // Track animation state for sequence handling
  const [currentSequence, setCurrentSequence] = useState<string | null>(animation);
  
  // Handle animation sequence completion
  const handleAnimationComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };
  
  // Update sequence when animation prop changes
  useEffect(() => {
    setCurrentSequence(animation);
  }, [animation]);

  return (
    <div 
      className="fixed top-0 left-0 w-screen h-screen z-[100]"
      style={{ 
        overflow: 'visible',
        pointerEvents: interactive ? 'auto' : 'none'
      }}
    >
      <Canvas
        style={{ 
          position: 'absolute', 
          top: '0', // Reset position to be visible
          left: '0', 
          width: '100%', // Standard canvas size
          height: '100%', // Standard canvas size
          background: 'transparent' 
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <Suspense fallback={null}>
          {/* Enhanced camera positioning */}
          <EnhancedCamera />
          
          {/* Enhanced lighting for better visibility */}
          <Environment preset="city" />
          <directionalLight position={[5, 5, 5]} intensity={1.0} />
          <directionalLight position={[-5, 5, 5]} intensity={1.0} />
          <directionalLight position={[0, 5, -5]} intensity={0.7} />
          <directionalLight position={[0, -5, 0]} intensity={0.3} />
          <ambientLight intensity={0.7} />
          
          {/* Helper sphere to debug positioning - remove in production */}
          <mesh visible={false} position={[0, 0, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="red" />
          </mesh>
          
          {/* Controls for interactive rotation */}
          {interactive && (
            <OrbitControls 
              enablePan={false}
              minPolarAngle={Math.PI / 4} // Allow enough upward view to see head
              maxPolarAngle={Math.PI / 1.8}
              minDistance={3}
              maxDistance={10}
              target={[0, 0, 0]} // Target the center where robot should be
            />
          )}
          
          {/* Robot with positioning to avoid clipping */}
          <RobotContainer
            animation={currentSequence || "idle"}
            emotionalState={emotionalState}
            showParticles={showParticles}
            hologramText={hologramText}
            onComplete={handleAnimationComplete}
          />
          
          {/* Additional post-processing effects can be added here if needed in the future */}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Enhanced3DRobot;