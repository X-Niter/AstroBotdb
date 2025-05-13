'use client';

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { EmotionalState, ParticleDisplay } from "../utils/types";
import { ANIMATION_SEQUENCES } from "./astro-bot-mascot-3d-simplified";

// Define the props for our detailed humanoid robot
interface DetailedHumanoidRobotProps {
  animation?: string;
  emotionalState?: EmotionalState;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  showParticles?: ParticleDisplay;
  hologramText?: string | null;
  onComplete?: () => void;
  interactive?: boolean;
  highQuality?: boolean;
}

// The main robot component based on precise humanoid proportions
export function DetailedHumanoidRobot({
  animation = ANIMATION_SEQUENCES.IDLE,
  emotionalState = "neutral",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  showParticles = "none",
  hologramText = null,
  onComplete,
  interactive = true,
  highQuality = true
}: DetailedHumanoidRobotProps) {
  // Create refs for the model and its parts
  const group = useRef<THREE.Group>(null);
  const mixer = useRef<THREE.AnimationMixer | null>(null);
  const visorRef = useRef<THREE.Mesh>(null);
  const spineGlowRef = useRef<THREE.Mesh>(null);
  const chestGlowRef = useRef<THREE.Mesh>(null);
  const shoulderGlowLeftRef = useRef<THREE.Mesh>(null);
  const shoulderGlowRightRef = useRef<THREE.Mesh>(null);
  const forearmGlowLeftRef = useRef<THREE.Mesh>(null);
  const forearmGlowRightRef = useRef<THREE.Mesh>(null);
  const quadGlowLeftRef = useRef<THREE.Mesh>(null);
  const quadGlowRightRef = useRef<THREE.Mesh>(null);
  const shinGlowLeftRef = useRef<THREE.Mesh>(null);
  const shinGlowRightRef = useRef<THREE.Mesh>(null);
  
  // State for tracking animation progress
  const [animationState, setAnimationState] = useState({
    current: animation,
    complete: true
  });

  // Create state for robot lights' colors based on emotional state
  const [lightColors, setLightColors] = useState({
    primary: new THREE.Color("#40e0ff"),      // Default cyan glow
    secondary: new THREE.Color("#00a0e0"),    // Default darker cyan
    accent: new THREE.Color("#30d0ff")        // Default mid-cyan
  });

  // Update light colors and animations when props change
  useEffect(() => {
    // Define emotional state color palettes
    const colors = {
      neutral: {
        primary: new THREE.Color("#40e0ff"),    // Calm cyan
        secondary: new THREE.Color("#00a0e0"),  // Deep cyan 
        accent: new THREE.Color("#30d0ff")      // Mid cyan
      },
      happy: {
        primary: new THREE.Color("#40ffa0"),    // Green-cyan
        secondary: new THREE.Color("#00e080"),  // Deep green
        accent: new THREE.Color("#20f090")      // Bright green
      },
      sad: {
        primary: new THREE.Color("#4080ff"),    // Deep blue
        secondary: new THREE.Color("#1060e0"),  // Navy blue
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
      
      // Apply subtle rotational sway
      group.current.rotation.y = rotation[1] + Math.sin(time * 0.3) * 0.05;
    }
    
    // Apply pulsing glow effect to all light elements
    const time = state.clock.getElapsedTime();
    const glowIntensity = getGlowIntensity(emotionalState);
    const pulseFactor = getPulseFactor(emotionalState);
    const pulseValue = 0.8 + Math.sin(time * pulseFactor) * glowIntensity;
    
    // Update all glowing elements
    updateGlowingElement(visorRef, pulseValue, lightColors.primary);
    updateGlowingElement(spineGlowRef, pulseValue, lightColors.accent);
    updateGlowingElement(chestGlowRef, pulseValue, lightColors.primary);
    updateGlowingElement(shoulderGlowLeftRef, pulseValue * 0.8, lightColors.accent);
    updateGlowingElement(shoulderGlowRightRef, pulseValue * 0.8, lightColors.accent);
    updateGlowingElement(forearmGlowLeftRef, pulseValue, lightColors.secondary);
    updateGlowingElement(forearmGlowRightRef, pulseValue, lightColors.secondary);
    updateGlowingElement(quadGlowLeftRef, pulseValue * 0.9, lightColors.secondary);
    updateGlowingElement(quadGlowRightRef, pulseValue * 0.9, lightColors.secondary);
    updateGlowingElement(shinGlowLeftRef, pulseValue * 0.7, lightColors.accent);
    updateGlowingElement(shinGlowRightRef, pulseValue * 0.7, lightColors.accent);
    
    // Update animation mixer if available
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });

  // Helper functions for emotional effects
  const getGlowIntensity = (state: EmotionalState): number => {
    switch (state) {
      case 'happy': return 0.3;
      case 'alert': return 0.5;
      case 'confused': return 0.4;
      case 'thinking': return 0.25;
      case 'sad': return 0.15;
      default: return 0.2; // neutral
    }
  };
  
  const getPulseFactor = (state: EmotionalState): number => {
    switch (state) {
      case 'happy': return 2.0;
      case 'alert': return 4.0;
      case 'confused': return 2.5;
      case 'thinking': return 1.0;
      case 'sad': return 0.7;
      default: return 1.5; // neutral
    }
  };
  
  const updateGlowingElement = (
    ref: React.RefObject<THREE.Mesh>, 
    intensity: number, 
    color: THREE.Color
  ) => {
    if (ref.current && ref.current.material) {
      const material = ref.current.material as THREE.MeshStandardMaterial;
      material.emissive = color;
      material.emissiveIntensity = intensity;
    }
  };

  // Define material properties as configurations - don't create materials directly
  const whiteMaterialProps = {
    color: '#f0f0f0',
    metalness: 0.8,
    roughness: 0.2,
    envMapIntensity: 1
  };
  
  const blackMaterialProps = {
    color: '#202020',
    metalness: 0.9,
    roughness: 0.4
  };
  
  const jointMaterialProps = {
    color: '#404040',
    metalness: 0.9,
    roughness: 0.5
  };

  // The glowing material properties creator
  const getGlowMaterialProps = (color: THREE.Color, intensity = 1.5) => {
    return {
      color: '#ffffff',
      emissive: color,
      emissiveIntensity: intensity,
      metalness: 0.6,
      roughness: 0.2,
      toneMapped: false
    };
  };

  return (
    <group 
      ref={group} 
      position={position}
      rotation={rotation}
      scale={scale}
      dispose={null}
    >
      {/* HEAD SECTION - Based on 6ft tall humanoid proportions (24cm head height) */}
      <group position={[0, 1.6, 0]}>
        {/* Main head shape */}
        <mesh castShadow>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshStandardMaterial {...whiteMaterialProps} />
        </mesh>
        
        {/* Extended head back */}
        <mesh position={[0, 0, -0.04]}>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshStandardMaterial {...whiteMaterialProps} />
        </mesh>
        
        {/* Face plate */}
        <mesh position={[0, 0, 0.06]}>
          <cylinderGeometry args={[0.1, 0.08, 0.06, 16, 2, false, Math.PI*0.25, Math.PI*1.5]} />
          <meshStandardMaterial {...whiteMaterialProps} />
        </mesh>
        
        {/* Visor - thin glowing strip */}
        <mesh ref={visorRef} position={[0, 0.03, 0.11]}>
          <boxGeometry args={[0.15, 0.01, 0.01]} />
          <meshStandardMaterial {...getGlowMaterialProps(lightColors.primary, 1.5)} />
        </mesh>
        
        {/* Side head details - temple glows */}
        <mesh ref={visorRef} position={[0.11, 0.03, 0]} rotation={[0, Math.PI/2, 0]}>
          <boxGeometry args={[0.08, 0.01, 0.01]} />
          <meshStandardMaterial {...getGlowMaterialProps(lightColors.secondary, 1.2)} />
        </mesh>
        
        <mesh ref={visorRef} position={[-0.11, 0.03, 0]} rotation={[0, Math.PI/2, 0]}>
          <boxGeometry args={[0.08, 0.01, 0.01]} />
          <meshStandardMaterial {...getGlowMaterialProps(lightColors.secondary, 1.2)} />
        </mesh>
        
        {/* Subtle audio panels near jaw */}
        <mesh position={[0.08, -0.06, 0.08]} rotation={[0, Math.PI/4, 0]}>
          <boxGeometry args={[0.03, 0.02, 0.01]} />
          <meshStandardMaterial {...blackMaterialProps} />
        </mesh>
        
        <mesh position={[-0.08, -0.06, 0.08]} rotation={[0, -Math.PI/4, 0]}>
          <boxGeometry args={[0.03, 0.02, 0.01]} />
          <meshStandardMaterial {...blackMaterialProps} />
        </mesh>
      </group>
      
      {/* NECK SECTION - Carbon fiber exposed joint area */}
      <group position={[0, 1.44, 0]}>
        {/* Upper neck - connecting to head */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.05, 16]} />
          {jointMaterial.clone()}
        </mesh>
        
        {/* Lower neck - segmented design */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.1, 16]} />
          {jointMaterial.clone()}
        </mesh>
        
        {/* Neck cables - small details */}
        <mesh position={[0.03, 0, 0.02]}>
          <cylinderGeometry args={[0.005, 0.005, 0.15, 8]} />
          {blackMaterial.clone()}
        </mesh>
        
        <mesh position={[-0.03, 0, 0.02]}>
          <cylinderGeometry args={[0.005, 0.005, 0.15, 8]} />
          {blackMaterial.clone()}
        </mesh>
      </group>
      
      {/* TORSO SECTION - 68cm torso height */}
      <group position={[0, 1.1, 0]}>
        {/* Main chest armor plating */}
        <mesh castShadow>
          <boxGeometry args={[0.35, 0.4, 0.2]} />
          {whiteMaterial.clone()}
        </mesh>
        
        {/* Chest plating details - upper */}
        <mesh position={[0, 0.1, 0.11]}>
          <boxGeometry args={[0.3, 0.18, 0.01]} />
          {whiteMaterial.clone()}
        </mesh>
        
        {/* Chest V-shaped glow */}
        <mesh ref={chestGlowRef} position={[0, 0.05, 0.11]}>
          <shapeGeometry args={[createVShape(0.15, 0.15)]} />
          {createGlowMaterial(lightColors.primary, 1.5)}
        </mesh>
        
        {/* Back spine glow */}
        <mesh ref={spineGlowRef} position={[0, 0, -0.11]}>
          <boxGeometry args={[0.03, 0.35, 0.01]} />
          {createGlowMaterial(lightColors.accent, 1.3)}
        </mesh>
        
        {/* Abdomen section */}
        <mesh position={[0, -0.22, 0]}>
          <boxGeometry args={[0.3, 0.05, 0.18]} />
          {whiteMaterial.clone()}
        </mesh>
        
        {/* Waist connection - slimmer */}
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[0.25, 0.08, 0.15]} />
          {whiteMaterial.clone()}
        </mesh>
      </group>
      
      {/* SHOULDERS AND ARMS SECTION - 48cm shoulder width */}
      {/* Left Shoulder and Arm */}
      <group position={[-0.24, 1.3, 0]}>
        {/* Shoulder joint */}
        <mesh>
          <sphereGeometry args={[0.08, 24, 24]} />
          {whiteMaterial.clone()}
        </mesh>
        
        {/* Shoulder glow ring */}
        <mesh ref={shoulderGlowLeftRef} position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.06, 0.01, 16, 32, Math.PI]} />
          {createGlowMaterial(lightColors.accent, 1.2)}
        </mesh>
        
        {/* Upper arm */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.05, 0.3, 16]} />
          {whiteMaterial.clone()}
        </mesh>
        
        {/* Elbow joint - carbon fiber */}
        <mesh position={[0, -0.3, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          {jointMaterial.clone()}
        </mesh>
        
        {/* Forearm */}
        <mesh position={[0, -0.45, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.3, 16]} />
          {whiteMaterial.clone()}
        </mesh>
        
        {/* Forearm glow strip */}
        <mesh ref={forearmGlowLeftRef} position={[0, -0.45, 0.06]} rotation={[0, 0, Math.PI/2]}>
          <boxGeometry args={[0.25, 0.01, 0.005]} />
          {createGlowMaterial(lightColors.secondary, 1.4)}
        </mesh>
        
        {/* Wrist joint */}
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.05, 0.04, 0.05, 16]} />
          {jointMaterial.clone()}
        </mesh>
        
        {/* Hand */}
        <group position={[0, -0.65, 0]}>
          {/* Palm */}
          <mesh position={[0, -0.03, 0.01]}>
            <boxGeometry args={[0.08, 0.1, 0.03]} />
            {whiteMaterial.clone()}
          </mesh>
          
          {/* Fingers */}
          {[0, 1, 2, 3].map((i) => (
            <mesh key={`left-finger-${i}`} position={[(i-1.5)*0.02, -0.09, 0.02]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.015, 0.06, 0.015]} />
              {whiteMaterial.clone()}
            </mesh>
          ))}
          
          {/* Thumb */}
          <mesh position={[0.05, -0.05, 0.01]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.015, 0.05, 0.015]} />
            {whiteMaterial.clone()}
          </mesh>
        </group>
      </group>
      
      {/* Right Shoulder and Arm - mirror of left */}
      <group position={[0.24, 1.3, 0]}>
        {/* Shoulder joint */}
        <mesh>
          <sphereGeometry args={[0.08, 24, 24]} />
          {whiteMaterial.clone()}
        </mesh>
        
        {/* Shoulder glow ring */}
        <mesh ref={shoulderGlowRightRef} position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.06, 0.01, 16, 32, Math.PI]} />
          {createGlowMaterial(lightColors.accent, 1.2)}
        </mesh>
        
        {/* Upper arm */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.05, 0.3, 16]} />
          {whiteMaterial.clone()}
        </mesh>
        
        {/* Elbow joint - carbon fiber */}
        <mesh position={[0, -0.3, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          {jointMaterial.clone()}
        </mesh>
        
        {/* Forearm */}
        <mesh position={[0, -0.45, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.3, 16]} />
          {whiteMaterial.clone()}
        </mesh>
        
        {/* Forearm glow strip */}
        <mesh ref={forearmGlowRightRef} position={[0, -0.45, 0.06]} rotation={[0, 0, Math.PI/2]}>
          <boxGeometry args={[0.25, 0.01, 0.005]} />
          {createGlowMaterial(lightColors.secondary, 1.4)}
        </mesh>
        
        {/* Wrist joint */}
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.05, 0.04, 0.05, 16]} />
          {jointMaterial.clone()}
        </mesh>
        
        {/* Hand */}
        <group position={[0, -0.65, 0]}>
          {/* Palm */}
          <mesh position={[0, -0.03, 0.01]}>
            <boxGeometry args={[0.08, 0.1, 0.03]} />
            {whiteMaterial.clone()}
          </mesh>
          
          {/* Fingers */}
          {[0, 1, 2, 3].map((i) => (
            <mesh key={`right-finger-${i}`} position={[(i-1.5)*0.02, -0.09, 0.02]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.015, 0.06, 0.015]} />
              {whiteMaterial.clone()}
            </mesh>
          ))}
          
          {/* Thumb */}
          <mesh position={[-0.05, -0.05, 0.01]} rotation={[0, 0, 0.5]}>
            <boxGeometry args={[0.015, 0.05, 0.015]} />
            {whiteMaterial.clone()}
          </mesh>
        </group>
      </group>
      
      {/* PELVIS SECTION */}
      <group position={[0, 0.6, 0]}>
        {/* Pelvis armor */}
        <mesh>
          <boxGeometry args={[0.25, 0.15, 0.2]} />
          {whiteMaterial.clone()}
        </mesh>
        
        {/* Hip joints - left */}
        <mesh position={[-0.15, -0.05, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          {jointMaterial.clone()}
        </mesh>
        
        {/* Hip joints - right */}
        <mesh position={[0.15, -0.05, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          {jointMaterial.clone()}
        </mesh>
      </group>
      
      {/* LEGS SECTION - 94cm leg height */}
      {/* Left Leg */}
      <group position={[-0.15, 0.5, 0]}>
        {/* Upper leg - thigh */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.06, 0.4, 16]} />
          {whiteMaterial.clone()}
        </mesh>
        
        {/* Quad glow strip */}
        <mesh ref={quadGlowLeftRef} position={[0, -0.2, 0.07]} rotation={[0, 0, Math.PI/2]}>
          <boxGeometry args={[0.3, 0.015, 0.005]} />
          {createGlowMaterial(lightColors.secondary, 1.3)}
        </mesh>
        
        {/* Knee joint with visible mechanics */}
        <mesh position={[0, -0.4, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          {jointMaterial.clone()}
        </mesh>
        
        {/* Knee pistons - detail */}
        <mesh position={[0, -0.4, 0.06]}>
          <cylinderGeometry args={[0.01, 0.01, 0.08, 8]} />
          {blackMaterial.clone()}
        </mesh>
        
        {/* Lower leg - calf */}
        <mesh position={[0, -0.65, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 0.4, 16]} />
          {whiteMaterial.clone()}
        </mesh>
        
        {/* Shin glow accent */}
        <mesh ref={shinGlowLeftRef} position={[0, -0.65, 0.07]} rotation={[0, 0, Math.PI/2]}>
          <boxGeometry args={[0.3, 0.01, 0.005]} />
          {createGlowMaterial(lightColors.accent, 1.2)}
        </mesh>
        
        {/* Ankle joint */}
        <mesh position={[0, -0.85, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          {jointMaterial.clone()}
        </mesh>
        
        {/* Foot */}
        <mesh position={[0, -0.92, 0.05]}>
          <boxGeometry args={[0.1, 0.05, 0.2]} />
          {whiteMaterial.clone()}
        </mesh>
      </group>
      
      {/* Right Leg - mirror of left */}
      <group position={[0.15, 0.5, 0]}>
        {/* Upper leg - thigh */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.06, 0.4, 16]} />
          {whiteMaterial.clone()}
        </mesh>
        
        {/* Quad glow strip */}
        <mesh ref={quadGlowRightRef} position={[0, -0.2, 0.07]} rotation={[0, 0, Math.PI/2]}>
          <boxGeometry args={[0.3, 0.015, 0.005]} />
          {createGlowMaterial(lightColors.secondary, 1.3)}
        </mesh>
        
        {/* Knee joint with visible mechanics */}
        <mesh position={[0, -0.4, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          {jointMaterial.clone()}
        </mesh>
        
        {/* Knee pistons - detail */}
        <mesh position={[0, -0.4, 0.06]}>
          <cylinderGeometry args={[0.01, 0.01, 0.08, 8]} />
          {blackMaterial.clone()}
        </mesh>
        
        {/* Lower leg - calf */}
        <mesh position={[0, -0.65, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 0.4, 16]} />
          {whiteMaterial.clone()}
        </mesh>
        
        {/* Shin glow accent */}
        <mesh ref={shinGlowRightRef} position={[0, -0.65, 0.07]} rotation={[0, 0, Math.PI/2]}>
          <boxGeometry args={[0.3, 0.01, 0.005]} />
          {createGlowMaterial(lightColors.accent, 1.2)}
        </mesh>
        
        {/* Ankle joint */}
        <mesh position={[0, -0.85, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          {jointMaterial.clone()}
        </mesh>
        
        {/* Foot */}
        <mesh position={[0, -0.92, 0.05]}>
          <boxGeometry args={[0.1, 0.05, 0.2]} />
          {whiteMaterial.clone()}
        </mesh>
      </group>
      
      {/* Optional hologram text display above head */}
      {hologramText && (
        <group position={[0, 1.85, 0]}>
          {/* We're using a simple placeholder for the text */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[hologramText.length * 0.05, 0.05, 0.01]} />
            <meshBasicMaterial 
              color={lightColors.primary} 
              opacity={0.7} 
              transparent={true} 
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Helper function to create a V-shaped geometry for chest glow
function createVShape(width: number, height: number) {
  const shape = new THREE.Shape();
  
  // Start at top center
  shape.moveTo(0, height/2);
  // Draw to bottom left
  shape.lineTo(-width/2, -height/2);
  // Move back to top center
  shape.moveTo(0, height/2);
  // Draw to bottom right
  shape.lineTo(width/2, -height/2);
  
  return shape;
}

// Default export for the component
export default DetailedHumanoidRobot;