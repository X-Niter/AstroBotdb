'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { EmotionalState, ParticleDisplay } from "../utils/types";

// The detailed robot model component
const RealisticRobotModel = ({ 
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
  
  const glowMaterial = {
    color: '#00d0ff',
    emissive: '#00a0ff',
    emissiveIntensity: 2,
    metalness: 0.9,
    roughness: 0.2,
  };
  
  // Animations
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Subtle idle animation - slight breathing motion
    if (animation === 'idle') {
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.02;
      
      // Subtle head movement
      const headMovement = Math.sin(t * 0.3) * 0.03;
      if (groupRef.current.children[0]) {
        groupRef.current.children[0].rotation.y = headMovement;
        groupRef.current.children[0].rotation.z = Math.sin(t * 0.2) * 0.01;
      }
    }
  });
  
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
        
        {/* Neck connection - dark section */}
        <mesh position={[0, -0.17, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.05, 16]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Face plate with eyes */}
        <mesh position={[0, 0, 0.11]}>
          <sphereGeometry args={[0.15, 32, 32, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.1, Math.PI * 0.4]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Left eye */}
        <mesh position={[-0.05, 0.03, 0.18]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
        
        {/* Right eye */}
        <mesh position={[0.05, 0.03, 0.18]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
        
        {/* Head details - side vents (left) */}
        <mesh position={[-0.15, 0.05, 0]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Head details - side vents (right) */}
        <mesh position={[0.15, 0.05, 0]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Head details - top ridges */}
        {[-0.07, 0, 0.07].map((x, i) => (
          <mesh key={i} position={[x, 0.17, 0]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.14, 8]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
        ))}
        
        {/* Head details - back plate */}
        <mesh position={[0, 0.05, -0.12]}>
          <boxGeometry args={[0.25, 0.12, 0.02]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Head details - antenna */}
        <mesh position={[0, 0.23, 0]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.005, 0.002, 0.1, 8]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Antenna tip light */}
        <mesh position={[0, 0.28, 0.02]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
        
        {/* Hologram projection (only when text is provided) */}
        {hologramText && (
          <group position={[0, 0.03, 0.35]} scale={0.007}>
            <mesh>
              <boxGeometry args={[hologramText.length * 12, 20, 1]} />
              <meshStandardMaterial 
                color="#00a0ff" 
                emissive="#00ffff"
                emissiveIntensity={2}
                transparent={true}
                opacity={0.6}
              />
            </mesh>
          </group>
        )}
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
      
      {/* ===== ARMS (simplified) ===== */}
      {/* Left arm */}
      <group position={[-0.32, 1.15, 0]}>
        {/* Shoulder joint */}
        <mesh>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Upper arm */}
        <group position={[0, -0.15, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.04, 0.2, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Armor plating */}
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[0.07, 0.24, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
        </group>
      </group>
      
      {/* Right arm (simplified) */}
      <group position={[0.32, 1.15, 0]}>
        {/* Shoulder joint */}
        <mesh>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Upper arm */}
        <group position={[0, -0.15, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.04, 0.2, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Armor plating */}
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[0.07, 0.24, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
        </group>
      </group>
      
      {/* ===== LEGS (simplified) ===== */}
      {/* Left leg */}
      <group position={[-0.15, 0.5, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.05, 0.3, 16, 16]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Knee joint */}
        <mesh position={[0, -0.2, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial {...darkJoints} />
        </mesh>
      </group>
      
      {/* Right leg */}
      <group position={[0.15, 0.5, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.05, 0.3, 16, 16]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Knee joint */}
        <mesh position={[0, -0.2, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial {...darkJoints} />
        </mesh>
      </group>
    </group>
  );
};

export default RealisticRobotModel;