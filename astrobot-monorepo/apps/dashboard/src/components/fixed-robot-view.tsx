'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EmotionalState, ParticleDisplay } from "../utils/types";

interface FixedRobotViewProps {
  emotionalState?: EmotionalState;
  showParticles?: ParticleDisplay;
  animation?: string;
  hologramText?: string | null;
  onComplete?: () => void;
}

// The detailed robot model directly embedded within this component
const DetailedRobotModel = ({ 
  emotionalState = 'neutral',
  showParticles = 'none',
  hologramText = null,
  animation = 'idle',
  onComplete = () => {} 
}: {
  emotionalState?: EmotionalState;
  showParticles?: ParticleDisplay;
  hologramText?: string | null;
  animation?: string;
  onComplete?: () => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Material presets
  const whiteMetal = {
    color: '#f0f0f0',
    metalness: 0.8,
    roughness: 0.2,
  };
  
  const secondaryMetal = {
    color: '#e0e0e0',
    metalness: 0.7,
    roughness: 0.3,
  };
  
  const darkMetal = {
    color: '#111111',
    metalness: 0.9,
    roughness: 0.2,
  };
  
  const darkJoints = {
    color: '#222222',
    metalness: 0.85,
    roughness: 0.3,
  };
  
  const glowColor = emotionalState === 'happy' ? '#40e0ff' : 
                    emotionalState === 'alert' ? '#ff5050' :
                    emotionalState === 'thinking' ? '#50c0ff' :
                    emotionalState === 'sad' ? '#8080ff' :
                    emotionalState === 'confused' ? '#ff80ff' :
                    '#40e0ff'; // default color
  
  const glowMaterial = {
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 2,
    metalness: 0.9,
    roughness: 0.2,
  };
  
  // Animation effect
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Subtle idle animation
    if (animation === 'idle') {
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.02;
      
      // Subtle head movement
      if (groupRef.current.children[0]) {
        groupRef.current.children[0].rotation.y = Math.sin(t * 0.3) * 0.03;
        groupRef.current.children[0].rotation.z = Math.sin(t * 0.2) * 0.01;
      }
    }
  });

  useEffect(() => {
    // Simulate animation completion
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [animation, onComplete]);
  
  return (
    <group ref={groupRef} scale={1.8} position={[0, -1.0, 0]}>
      {/* ===== HEAD ===== */}
      <group position={[0, 1.5, 0]}>
        {/* Main helmet/head shape */}
        <mesh>
          <sphereGeometry args={[0.2, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.66]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Lower face/jaw area */}
        <mesh position={[0, -0.11, 0]}>
          <cylinderGeometry args={[0.13, 0.1, 0.09, 16]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Face plate with eyes */}
        <mesh position={[0, 0, 0.11]}>
          <sphereGeometry args={[0.15, 32, 32, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.1, Math.PI * 0.4]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Eyes */}
        <mesh position={[-0.05, 0.03, 0.18]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
        
        <mesh position={[0.05, 0.03, 0.18]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
        
        {/* Head details */}
        <mesh position={[0, 0.28, 0.02]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
      </group>
      
      {/* ===== TORSO ===== */}
      <group position={[0, 1.05, 0]}>
        {/* Upper chest - main armor plate */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.35, 0.15, 0.2]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Central torso glowing detail */}
        <mesh position={[0, -0.05, 0.1]}>
          <boxGeometry args={[0.05, 0.2, 0.01]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
      </group>
      
      {/* ===== ARMS ===== */}
      <group position={[-0.32, 1.15, 0]}>
        <mesh>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
      </group>
      
      <group position={[0.32, 1.15, 0]}>
        <mesh>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
      </group>
    </group>
  );
};

// Main component
const FixedRobotView: React.FC<FixedRobotViewProps> = ({
  emotionalState = "neutral",
  showParticles = "none",
  animation = "idle",
  hologramText = null,
  onComplete
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
        pointerEvents: 'auto'
      }}
    >
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
          antialias: true,
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
          
          <OrbitControls 
            enablePan={false}
            minPolarAngle={Math.PI / 4} // Allow more upward view to see head
            maxPolarAngle={Math.PI / 1.8} // Restrict downward view less
            minDistance={5}
            maxDistance={30} // Allow zooming out further
            target={[0, -8, 0]} // Move the target point down to focus on the robot's body
          />
          
          <directionalLight position={[5, 5, 5]} intensity={0.5} />
          <directionalLight position={[-5, 5, 5]} intensity={0.5} />
          <ambientLight intensity={0.5} />
          
          <DetailedRobotModel
            animation={animation}
            emotionalState={emotionalState}
            showParticles={showParticles}
            hologramText={hologramText}
            onComplete={handleAnimationComplete}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default FixedRobotView;