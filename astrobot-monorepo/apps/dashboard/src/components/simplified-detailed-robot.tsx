'use client';

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EmotionalState, ParticleDisplay } from "../utils/types";
import { ANIMATION_SEQUENCES } from "./astro-bot-mascot-3d-simplified";

interface SimplifiedDetailedRobotProps {
  animation?: string;
  emotionalState?: EmotionalState;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  showParticles?: ParticleDisplay;
  hologramText?: string | null;
  onComplete?: () => void;
  interactive?: boolean;
}

export const SimplifiedDetailedRobot: React.FC<SimplifiedDetailedRobotProps> = ({
  animation = ANIMATION_SEQUENCES.IDLE,
  emotionalState = "neutral",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  showParticles = "none",
  hologramText = null,
  onComplete,
  interactive = true
}) => {
  // Create refs for the model and its parts
  const group = useRef<THREE.Group>(null);
  const visorRef = useRef<THREE.Mesh>(null);
  const chestLightRef = useRef<THREE.Mesh>(null);
  
  // State for tracking animation progress
  const [animationState, setAnimationState] = useState({
    current: animation,
    complete: true
  });

  // Create state for robot lights' colors based on emotional state
  const [lightColors, setLightColors] = useState({
    primary: new THREE.Color("#40e0ff"),      // Default blue-cyan
    secondary: new THREE.Color("#00a0e0"),    // Default blue
    accent: new THREE.Color("#30d0ff")        // Default light blue
  });

  // Update light colors and animations when props change
  useEffect(() => {
    // Colors based on emotional state
    const colors = {
      neutral: {
        primary: new THREE.Color("#40e0ff"),    // Calm blue
        secondary: new THREE.Color("#00a0e0"),  // Medium blue
        accent: new THREE.Color("#30d0ff")      // Blue-cyan
      },
      happy: {
        primary: new THREE.Color("#40ffa0"),    // Green-cyan
        secondary: new THREE.Color("#00e080"),  // Vibrant green
        accent: new THREE.Color("#20f090")      // Bright green
      },
      sad: {
        primary: new THREE.Color("#4080ff"),    // Deeper blue
        secondary: new THREE.Color("#1060e0"),  // Dark blue
        accent: new THREE.Color("#2070f0")      // Royal blue
      },
      alert: {
        primary: new THREE.Color("#ff6040"),    // Orange-red
        secondary: new THREE.Color("#ff4000"),  // Bright red
        accent: new THREE.Color("#ff5020")      // Red-orange
      },
      thinking: {
        primary: new THREE.Color("#c040ff"),    // Purple
        secondary: new THREE.Color("#a000e0"),  // Deep purple
        accent: new THREE.Color("#b020ff")      // Bright purple
      },
      confused: {
        primary: new THREE.Color("#ffb040"),    // Amber
        secondary: new THREE.Color("#ff9000"),  // Orange
        accent: new THREE.Color("#ffb010")      // Gold
      }
    };

    // Set the colors based on emotional state
    setLightColors(colors[emotionalState] || colors.neutral);
    
    // Handle animation changes
    if (animation !== animationState.current) {
      setAnimationState({
        current: animation,
        complete: false
      });
      
      // Simulate animation completion after a delay
      const timeout = setTimeout(() => {
        setAnimationState(prev => ({ ...prev, complete: true }));
        if (onComplete) onComplete();
      }, 2000); // Simulated animation length
      
      return () => clearTimeout(timeout);
    }
  }, [animation, emotionalState, animationState.current, onComplete]);

  // Animation loop
  useFrame((state, delta) => {
    // Subtle ambient motion for idle state
    if (group.current) {
      // Add gentle hovering effect
      const time = state.clock.getElapsedTime();
      group.current.position.y = position[1] + Math.sin(time * 0.5) * 0.05;
      
      // Add subtle breathing effect
      const breathingScale = 1 + Math.sin(time * 0.8) * 0.01;
      group.current.scale.set(
        scale[0] * breathingScale,
        scale[1] * breathingScale,
        scale[2] * breathingScale
      );
      
      // Apply subtle rotational sway for more lifelike motion
      group.current.rotation.y = rotation[1] + Math.sin(time * 0.3) * 0.05;
    }
    
    // Apply pulsing glow effect to visor
    if (visorRef.current && visorRef.current.material) {
      const material = visorRef.current.material as THREE.MeshStandardMaterial;
      const time = state.clock.getElapsedTime();
      
      // Calculate pulse intensity based on emotional state
      const pulseIntensity = 
        emotionalState === 'happy' ? 0.3 :
        emotionalState === 'alert' ? 0.5 :
        emotionalState === 'confused' ? 0.4 :
        emotionalState === 'thinking' ? 0.25 :
        emotionalState === 'sad' ? 0.15 :
        0.2; // default for neutral
      
      // Calculate pulse frequency based on emotional state
      const pulseFrequency = 
        emotionalState === 'happy' ? 2.0 :
        emotionalState === 'alert' ? 4.0 :
        emotionalState === 'confused' ? 2.5 :
        emotionalState === 'thinking' ? 1.0 :
        emotionalState === 'sad' ? 0.7 :
        1.5; // default for neutral
      
      // Apply pulsing effect to material emissive intensity
      const pulseValue = 0.8 + Math.sin(time * pulseFrequency) * pulseIntensity;
      material.emissiveIntensity = pulseValue;
    }
    
    // Apply similar effect to chest light
    if (chestLightRef.current && chestLightRef.current.material) {
      const material = chestLightRef.current.material as THREE.MeshStandardMaterial;
      const time = state.clock.getElapsedTime();
      const pulseIntensity = emotionalState === 'alert' ? 0.5 : 0.3;
      const pulseFrequency = emotionalState === 'alert' ? 3.0 : 1.0;
      const pulseValue = 1.0 + Math.sin(time * pulseFrequency) * pulseIntensity;
      material.emissiveIntensity = pulseValue;
    }
  });

  return (
    <group 
      ref={group} 
      position={position}
      rotation={rotation}
      scale={scale}
      dispose={null}
    >
      {/* Robot Head */}
      <group position={[0, 1.6, 0]}>
        {/* Main head shape */}
        <mesh castShadow>
          <sphereGeometry args={[0.25, 32, 32]} />
          <meshStandardMaterial 
            color="#f0f0f0"
            metalness={0.8}
            roughness={0.2}
            envMapIntensity={1}
          />
        </mesh>
        
        {/* Face plate */}
        <mesh position={[0, -0.05, 0.1]}>
          <boxGeometry args={[0.3, 0.15, 0.05]} />
          <meshStandardMaterial
            color="#f0f0f0"
            metalness={0.7}
            roughness={0.2}
            transparent={true}
            opacity={0.9}
          />
        </mesh>
        
        {/* Visor - glowing */}
        <mesh ref={visorRef} position={[0, 0.05, 0.2]}>
          <boxGeometry args={[0.25, 0.03, 0.01]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={lightColors.primary}
            emissiveIntensity={1.0}
            metalness={0.6}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
      </group>
      
      {/* Robot Neck */}
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.15, 16]} />
        <meshStandardMaterial
          color="#404040"
          metalness={0.9}
          roughness={0.4}
        />
      </mesh>
      
      {/* Robot Torso */}
      <group position={[0, 1.0, 0]}>
        {/* Main chest */}
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.7, 0.3]} />
          <meshStandardMaterial
            color="#e8e8e8"
            metalness={0.8}
            roughness={0.2}
            envMapIntensity={1}
          />
        </mesh>
        
        {/* Central chest glowing element */}
        <mesh ref={chestLightRef} position={[0, 0, 0.16]}>
          <circleGeometry args={[0.1, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={lightColors.primary}
            emissiveIntensity={1.5}
            metalness={0.5}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
      </group>
      
      {/* Robot Arms */}
      {/* Left Arm */}
      <group position={[-0.32, 1.2, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.05, 0.3, 16]} />
          <meshStandardMaterial
            color="#d8d8d8"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Forearm */}
        <mesh position={[0, -0.45, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.3, 16]} />
          <meshStandardMaterial
            color="#d8d8d8"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Hand */}
        <mesh position={[0, -0.6, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color="#e0e0e0"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      </group>
      
      {/* Right Arm - mirror of left */}
      <group position={[0.32, 1.2, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.05, 0.3, 16]} />
          <meshStandardMaterial
            color="#d8d8d8"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Forearm */}
        <mesh position={[0, -0.45, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.3, 16]} />
          <meshStandardMaterial
            color="#d8d8d8"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Hand */}
        <mesh position={[0, -0.6, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color="#e0e0e0"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      </group>
      
      {/* Robot Legs */}
      {/* Left Leg */}
      <group position={[-0.15, 0.5, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.07, 0.4, 16]} />
          <meshStandardMaterial
            color="#d8d8d8"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Calf */}
        <mesh position={[0, -0.65, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 0.4, 16]} />
          <meshStandardMaterial
            color="#d8d8d8"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Foot */}
        <mesh position={[0, -0.92, 0.05]}>
          <boxGeometry args={[0.1, 0.05, 0.2]} />
          <meshStandardMaterial
            color="#d0d0d0"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      </group>
      
      {/* Right Leg - mirror of left */}
      <group position={[0.15, 0.5, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.07, 0.4, 16]} />
          <meshStandardMaterial
            color="#d8d8d8"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Calf */}
        <mesh position={[0, -0.65, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 0.4, 16]} />
          <meshStandardMaterial
            color="#d8d8d8"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Foot */}
        <mesh position={[0, -0.92, 0.05]}>
          <boxGeometry args={[0.1, 0.05, 0.2]} />
          <meshStandardMaterial
            color="#d0d0d0"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      </group>
      
      {/* Optional hologram text display above head */}
      {hologramText && (
        <group position={[0, 1.9, 0]}>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[hologramText.length * 0.08, 0.1]} />
            <meshBasicMaterial 
              color={lightColors.primary.getHex()} 
              opacity={0.7} 
              transparent={true} 
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default SimplifiedDetailedRobot;