'use client';

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { GLTF } from "three-stdlib";
import { EmotionalState, ParticleDisplay } from "../utils/types";
import { ANIMATION_SEQUENCES } from "./astro-bot-mascot-3d-simplified";

// Define the props for our futuristic humanoid robot
interface FuturisticHumanoidRobotProps {
  animation?: string;
  emotionalState?: EmotionalState;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  showParticles?: ParticleDisplay;
  hologramText?: string | null;
  onComplete?: () => void;
}

// The main robot component
export function FuturisticHumanoidRobot({
  animation = ANIMATION_SEQUENCES.IDLE,
  emotionalState = "neutral",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  showParticles = "none",
  hologramText = null,
  onComplete
}: FuturisticHumanoidRobotProps) {
  // Create refs for the model and its parts
  const group = useRef<THREE.Group>(null);
  const mixer = useRef<THREE.AnimationMixer | null>(null);
  const eyesRef = useRef<THREE.Mesh>(null);
  const accentLightsRef = useRef<THREE.Mesh>(null);
  const chestLightRef = useRef<THREE.Mesh>(null);
  
  // State for tracking animation progress
  const [animationState, setAnimationState] = useState({
    current: animation,
    complete: true
  });

  // Create state for robot lights' colors based on emotional state
  const [lightColors, setLightColors] = useState({
    eyes: new THREE.Color("#40e0ff"),      // Default blue eyes
    accents: new THREE.Color("#00a0e0"),   // Default blue accents
    chest: new THREE.Color("#30d0ff")      // Default blue chest glow
  });

  // This emulates loading a GLTF model and animations
  // In a real implementation, you would use useGLTF and useAnimations hooks
  useEffect(() => {
    // Update light colors based on emotional state
    const colors = {
      neutral: {
        eyes: new THREE.Color("#40e0ff"),    // Calm blue
        accents: new THREE.Color("#00a0e0"), // Medium blue
        chest: new THREE.Color("#30d0ff")    // Blue-cyan
      },
      happy: {
        eyes: new THREE.Color("#40ffa0"),    // Green-cyan
        accents: new THREE.Color("#00e080"), // Vibrant green
        chest: new THREE.Color("#20f090")    // Bright green
      },
      sad: {
        eyes: new THREE.Color("#4080ff"),    // Deeper blue
        accents: new THREE.Color("#1060e0"), // Dark blue
        chest: new THREE.Color("#2070f0")    // Royal blue
      },
      alert: {
        eyes: new THREE.Color("#ff6040"),    // Orange-red
        accents: new THREE.Color("#ff4000"), // Bright red
        chest: new THREE.Color("#ff5020")    // Red-orange
      },
      thinking: {
        eyes: new THREE.Color("#c040ff"),    // Purple
        accents: new THREE.Color("#a000e0"), // Deep purple
        chest: new THREE.Color("#b020ff")    // Bright purple
      },
      confused: {
        eyes: new THREE.Color("#ffb040"),    // Amber
        accents: new THREE.Color("#ff9000"), // Orange
        chest: new THREE.Color("#ffb010")    // Gold
      }
    };

    // Set the colors based on emotional state
    setLightColors(colors[emotionalState] || colors.neutral);
    
    // Set up animation state when animation changes
    if (animation !== animationState.current) {
      setAnimationState({
        current: animation,
        complete: false
      });
      
      // In a real implementation, this would trigger the animation to play
      
      // Simulate animation completion after a delay
      const timeout = setTimeout(() => {
        setAnimationState(prev => ({ ...prev, complete: true }));
        if (onComplete) onComplete();
      }, 2000); // Simulated animation length
      
      return () => clearTimeout(timeout);
    }
  }, [animation, emotionalState, animationState.current, onComplete]);

  // Animation loop using Three.js animation mixer
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
      
      // Apply subtle rotational movement for more life-like appearance
      group.current.rotation.y = rotation[1] + Math.sin(time * 0.3) * 0.05;
    }
    
    // Pulse the lights based on emotional state
    if (eyesRef.current && eyesRef.current.material) {
      const material = eyesRef.current.material as THREE.MeshStandardMaterial;
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
    
    // Update animation mixer if available
    if (mixer.current) {
      mixer.current.update(delta);
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
      {/* Here we create a simplified futuristic humanoid robot using basic Three.js primitives */}
      {/* In a real implementation, you would load a GLTF model with proper textures and animations */}
      
      {/* Robot Head */}
      <group position={[0, 1.6, 0]}>
        {/* Head base */}
        <mesh castShadow>
          <sphereGeometry args={[0.25, 32, 32]} />
          <meshStandardMaterial
            color="#f0f0f0"
            metalness={0.8}
            roughness={0.2}
            envMapIntensity={1}
          />
        </mesh>
        
        {/* Redesigned face plate to avoid obstruction */}
        <mesh position={[0, -0.05, 0.05]}>
          <boxGeometry args={[0.25, 0.12, 0.05]} />
          <meshStandardMaterial
            color="#f0f0f0"
            metalness={0.7}
            roughness={0.2}
            transparent={true}
            opacity={0.9}
            envMapIntensity={1}
          />
        </mesh>
        
        {/* Eyes - glowing and moved forward */}
        <mesh ref={eyesRef} position={[0, 0.05, 0.25]}>
          <boxGeometry args={[0.2, 0.03, 0.01]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={lightColors.eyes}
            emissiveIntensity={1.0}
            metalness={0.6}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
        
        {/* Left eye detail - moved forward */}
        <mesh position={[-0.06, 0.05, 0.26]}>
          <circleGeometry args={[0.025, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={lightColors.eyes}
            emissiveIntensity={1.5}
            metalness={0.6}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
        
        {/* Right eye detail - moved forward */}
        <mesh position={[0.06, 0.05, 0.26]}>
          <circleGeometry args={[0.025, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={lightColors.eyes}
            emissiveIntensity={1.5}
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
          color="#c0c0c0"
          metalness={0.9}
          roughness={0.4}
        />
      </mesh>
      
      {/* Robot Torso */}
      <group position={[0, 1, 0]}>
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
            emissive={lightColors.chest}
            emissiveIntensity={1.5}
            metalness={0.5}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
        
        {/* Shoulder accents */}
        <mesh ref={accentLightsRef} position={[0.28, 0.3, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color="#d0d0d0"
            emissive={lightColors.accents}
            emissiveIntensity={1.2}
            metalness={0.7}
            roughness={0.3}
            toneMapped={false}
          />
        </mesh>
        
        <mesh ref={accentLightsRef} position={[-0.28, 0.3, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color="#d0d0d0"
            emissive={lightColors.accents}
            emissiveIntensity={1.2}
            metalness={0.7}
            roughness={0.3}
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
        
        {/* Elbow joint */}
        <mesh position={[0, -0.3, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color="#c0c0c0"
            metalness={0.9}
            roughness={0.4}
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
        
        {/* Accent light on wrist */}
        <mesh position={[0, -0.57, 0.05]}>
          <circleGeometry args={[0.015, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={lightColors.accents}
            emissiveIntensity={1.2}
            metalness={0.5}
            roughness={0.2}
            toneMapped={false}
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
        
        {/* Elbow joint */}
        <mesh position={[0, -0.3, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color="#c0c0c0"
            metalness={0.9}
            roughness={0.4}
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
        
        {/* Accent light on wrist */}
        <mesh position={[0, -0.57, 0.05]}>
          <circleGeometry args={[0.015, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={lightColors.accents}
            emissiveIntensity={1.2}
            metalness={0.5}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
      </group>
      
      {/* Robot Legs */}
      {/* Waist connection */}
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.1, 16]} />
        <meshStandardMaterial
          color="#c0c0c0"
          metalness={0.9}
          roughness={0.4}
        />
      </mesh>
      
      {/* Pelvis */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.35, 0.15, 0.25]} />
        <meshStandardMaterial
          color="#e0e0e0"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      
      {/* Left Leg */}
      <group position={[-0.15, 0.4, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.07, 0.4, 16]} />
          <meshStandardMaterial
            color="#d8d8d8"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Knee joint */}
        <mesh position={[0, -0.4, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial
            color="#c0c0c0"
            metalness={0.9}
            roughness={0.4}
          />
        </mesh>
        
        {/* Calf */}
        <mesh position={[0, -0.65, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.075, 0.4, 16]} />
          <meshStandardMaterial
            color="#d8d8d8"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Ankle joint */}
        <mesh position={[0, -0.85, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color="#c0c0c0"
            metalness={0.9}
            roughness={0.4}
          />
        </mesh>
        
        {/* Foot */}
        <mesh position={[0, -0.92, 0.04]}>
          <boxGeometry args={[0.1, 0.05, 0.2]} />
          <meshStandardMaterial
            color="#d0d0d0"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        
        {/* Accent light on ankle */}
        <mesh position={[0, -0.85, 0.06]}>
          <circleGeometry args={[0.02, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={lightColors.accents}
            emissiveIntensity={1.2}
            metalness={0.5}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
      </group>
      
      {/* Right Leg - mirror of left */}
      <group position={[0.15, 0.4, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.07, 0.4, 16]} />
          <meshStandardMaterial
            color="#d8d8d8"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Knee joint */}
        <mesh position={[0, -0.4, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial
            color="#c0c0c0"
            metalness={0.9}
            roughness={0.4}
          />
        </mesh>
        
        {/* Calf */}
        <mesh position={[0, -0.65, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.075, 0.4, 16]} />
          <meshStandardMaterial
            color="#d8d8d8"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Ankle joint */}
        <mesh position={[0, -0.85, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color="#c0c0c0"
            metalness={0.9}
            roughness={0.4}
          />
        </mesh>
        
        {/* Foot */}
        <mesh position={[0, -0.92, 0.04]}>
          <boxGeometry args={[0.1, 0.05, 0.2]} />
          <meshStandardMaterial
            color="#d0d0d0"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        
        {/* Accent light on ankle */}
        <mesh position={[0, -0.85, 0.06]}>
          <circleGeometry args={[0.02, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={lightColors.accents}
            emissiveIntensity={1.2}
            metalness={0.5}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Hologram projection if active */}
      {hologramText && (
        <group position={[0, 1.3, 0.7]}>
          <mesh>
            <planeGeometry args={[hologramText.length * 0.06, 0.15]} />
            <meshBasicMaterial 
              color={lightColors.eyes}
              opacity={0.7}
              transparent={true}
            />
          </mesh>
          
          {/* Simulated hologram text */}
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[hologramText.length * 0.06, 0.15]} />
            <meshBasicMaterial 
              color="#ffffff"
              opacity={0.9}
              transparent={true}
            />
          </mesh>
        </group>
      )}
      
      {/* Particles system if enabled */}
      {showParticles !== "none" && (
        <group>
          {/* In a real implementation, this would be a proper particle system */}
          {/* For now, just some floating dots */}
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh 
              key={i}
              position={[
                (Math.random() - 0.5) * 0.5,
                1 + (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
              ]}
            >
              <sphereGeometry args={[0.01, 8, 8]} />
              <meshBasicMaterial 
                color={lightColors.accents}
                opacity={0.7 * Math.random()}
                transparent={true}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}