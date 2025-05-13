'use client';

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { EmotionalState, ParticleDisplay } from "../utils/types";
import { ANIMATION_SEQUENCES } from "./astro-bot-mascot-3d-simplified";

/**
 * BlueprintDroid: Precise implementation based on provided blueprint
 * 
 * Height: 1.83 meters (6 feet)
 * - Head: 0.22m
 * - Neck: 0.092m
 * - Torso: 0.659m
 * - Pelvis: 0.183m
 * - Legs: 0.586m
 * - Feet: 0.092m
 * 
 * Glow Color: Electric Cyan (#00FFFF)
 */

interface BlueprintDroidProps {
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

export const BlueprintDroid: React.FC<BlueprintDroidProps> = ({
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
  const mixer = useRef<THREE.AnimationMixer | null>(null);
  
  // Refs for glowing parts
  const chestVGlowRef = useRef<THREE.Mesh>(null);
  const spineGlowRef = useRef<THREE.Mesh>(null);
  const leftShoulderGlowRef = useRef<THREE.Mesh>(null);
  const rightShoulderGlowRef = useRef<THREE.Mesh>(null);
  const leftForearmGlowRef = useRef<THREE.Mesh>(null);
  const rightForearmGlowRef = useRef<THREE.Mesh>(null);
  const leftThighGlowRef = useRef<THREE.Mesh>(null);
  const rightThighGlowRef = useRef<THREE.Mesh>(null);
  const leftShinGlowRef = useRef<THREE.Mesh>(null);
  const rightShinGlowRef = useRef<THREE.Mesh>(null);
  const headTempleGlowRef = useRef<THREE.Mesh>(null);
  
  // State for tracking animation progress
  const [animationState, setAnimationState] = useState({
    current: animation,
    complete: true
  });

  // Colors based on emotional state
  const getEmotionalGlowColor = () => {
    switch(emotionalState) {
      case 'happy': return new THREE.Color(0x00FFAA);
      case 'alert': return new THREE.Color(0xFF4400);
      case 'thinking': return new THREE.Color(0x9900FF);
      case 'confused': return new THREE.Color(0xFFAA00);
      case 'sad': return new THREE.Color(0x0088FF);
      default: return new THREE.Color(0x00FFFF); // Default cyan based on blueprint
    }
  };

  // Handle animation changes
  useEffect(() => {
    if (animation !== animationState.current) {
      setAnimationState({
        current: animation,
        complete: false
      });
      
      // Simulate animation completion after a delay
      const timeout = setTimeout(() => {
        setAnimationState(prev => ({ ...prev, complete: true }));
        if (onComplete) onComplete();
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [animation, animationState.current, onComplete]);

  // Material definitions based on blueprint
  const matteMaterial = {
    color: '#F0F0F0',
    metalness: 0.4,
    roughness: 0.6
  };
  
  const carbonFiberMaterial = {
    color: '#222222',
    metalness: 0.7,
    roughness: 0.2
  };
  
  const steelMaterial = {
    color: '#A0A0A0',
    metalness: 0.8,
    roughness: 0.3
  };
  
  const getGlowMaterial = (intensity = 2.0) => ({
    color: '#FFFFFF',
    emissive: getEmotionalGlowColor(),
    emissiveIntensity: intensity,
    metalness: 0.5,
    roughness: 0.2,
    toneMapped: false
  });

  // Animation loop
  useFrame((state, delta) => {
    // Animation and subtle ambient motion for idle state
    if (group.current) {
      // Add gentle hovering effect
      const time = state.clock.getElapsedTime();
      
      // Different behaviors based on animation state
      if (animation === ANIMATION_SEQUENCES.IDLE) {
        // Subtle breathing - based on blueprint spec
        group.current.position.y = position[1] + Math.sin(time * 0.5) * 0.03;
        
        // Subtle head tilt in idle - blueprint spec
        if (group.current.children[0]) { // head is first child
          const head = group.current.children[0] as THREE.Group;
          head.rotation.z = Math.sin(time * 0.3) * 0.03;
          head.rotation.y = Math.sin(time * 0.5) * 0.05;
        }
        
        // Finger twitch in idle - blueprint spec
        // This would be handled with separate finger meshes in a real implementation
      }
      else if (animation === 'scanning') {
        // Head rotation for scanning
        if (group.current.children[0]) {
          const head = group.current.children[0] as THREE.Group;
          head.rotation.y = Math.sin(time * 1.5) * 0.5; // wider head movement
        }
        
        // Pulse chest glow during scanning
        if (chestVGlowRef.current && chestVGlowRef.current.material) {
          const material = chestVGlowRef.current.material as THREE.MeshStandardMaterial;
          material.emissiveIntensity = 1.5 + Math.sin(time * 3) * 1;
        }
      }
    }
    
    // Apply standard pulsing glow effect to all glowing parts
    const time = state.clock.getElapsedTime();
    const basePulse = 1.8 + Math.sin(time * 0.8) * 0.3;
    
    // Apply pulse to all glowing parts
    updateGlowIntensity(chestVGlowRef, basePulse);
    updateGlowIntensity(spineGlowRef, basePulse * 0.9);
    updateGlowIntensity(leftShoulderGlowRef, basePulse * 0.8);
    updateGlowIntensity(rightShoulderGlowRef, basePulse * 0.8);
    updateGlowIntensity(leftForearmGlowRef, basePulse * 0.7);
    updateGlowIntensity(rightForearmGlowRef, basePulse * 0.7);
    updateGlowIntensity(leftThighGlowRef, basePulse * 0.6);
    updateGlowIntensity(rightThighGlowRef, basePulse * 0.6);
    updateGlowIntensity(leftShinGlowRef, basePulse * 0.6);
    updateGlowIntensity(rightShinGlowRef, basePulse * 0.6);
    updateGlowIntensity(headTempleGlowRef, basePulse * 0.9);
    
    // Update animation mixer if available
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });

  // Helper to update glow intensity
  const updateGlowIntensity = (ref: React.RefObject<THREE.Mesh>, intensity: number) => {
    if (ref.current && ref.current.material) {
      const material = ref.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = intensity;
    }
  };

  return (
    <group 
      ref={group} 
      position={position}
      rotation={rotation}
      scale={scale}
      dispose={null}
    >
      {/* HEAD - 0.22m tall */}
      <group position={[0, 1.72, 0]}>
        {/* Main head dome - single-piece smooth dome as specified */}
        <mesh castShadow>
          <sphereGeometry args={[0.11, 32, 24]} />
          <meshStandardMaterial {...matteMaterial} />
        </mesh>
        
        {/* Vertical vent ridges on back of head */}
        <group position={[0, 0, -0.05]} rotation={[Math.PI/2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.09, 0.09, 0.01, 12, 4, true]} />
            <meshStandardMaterial {...matteMaterial} />
          </mesh>
        </group>
        
        {/* Temple glow line - side wrap around ear zone */}
        <group position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
          <mesh ref={headTempleGlowRef}>
            <torusGeometry args={[0.1, 0.005, 16, 32, Math.PI * 1.5]} />
            <meshStandardMaterial {...getGlowMaterial(2.2)} />
          </mesh>
        </group>
      </group>
      
      {/* NECK - 0.092m tall */}
      <group position={[0, 1.615, 0]}>
        {/* Reinforced piston rods as specified */}
        <mesh>
          <cylinderGeometry args={[0.03, 0.04, 0.092, 12]} />
          <meshStandardMaterial {...carbonFiberMaterial} />
        </mesh>
        
        {/* Cable mesh around neck */}
        {[0, 1, 2, 3].map((i) => {
          const cablePosition: [number, number, number] = [
            Math.sin(i * Math.PI/2) * 0.02,
            0,
            Math.cos(i * Math.PI/2) * 0.02
          ];
          return (
            <mesh key={`neck-cable-${i}`} position={cablePosition}>
              <cylinderGeometry args={[0.005, 0.005, 0.09, 8]} />
              <meshStandardMaterial {...steelMaterial} />
            </mesh>
          );
        })}
      </group>
      
      {/* TORSO - 0.659m tall */}
      <group position={[0, 1.24, 0]}>
        {/* Main chest - segmented plates with beveled edges */}
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.4, 0.2]} />
          <meshStandardMaterial {...matteMaterial} />
        </mesh>
        
        {/* Chest curves wrapping toward back */}
        <group position={[0, 0, 0.1]} rotation={[Math.PI/2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.18, 0.18, 0.4, 16, 1, true]} />
            <meshStandardMaterial {...matteMaterial} />
          </mesh>
        </group>
        
        {/* Chest V glow - centered vertical + angled arms */}
        <mesh ref={chestVGlowRef} position={[0, 0.05, 0.11]}>
          <shapeGeometry args={[createVShape(0.15, 0.15)]} />
          <meshStandardMaterial {...getGlowMaterial(2.5)} />
        </mesh>
        
        {/* Lower torso */}
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[0.26, 0.2, 0.18]} />
          <meshStandardMaterial {...matteMaterial} />
        </mesh>
        
        {/* Spine core glow on back */}
        <mesh ref={spineGlowRef} position={[0, 0, -0.11]}>
          <boxGeometry args={[0.03, 0.35, 0.01]} />
          <meshStandardMaterial {...getGlowMaterial(2.0)} />
        </mesh>
      </group>
      
      {/* SHOULDERS AND ARMS */}
      {/* Left Shoulder */}
      <group position={[-0.2, 1.44, 0]}>
        {/* Angular guard above arm */}
        <mesh>
          <boxGeometry args={[0.14, 0.08, 0.14]} />
          <meshStandardMaterial {...matteMaterial} />
        </mesh>
        
        {/* Shoulder ring glow */}
        <mesh ref={leftShoulderGlowRef} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.07, 0.008, 16, 24]} />
          <meshStandardMaterial {...getGlowMaterial(2.0)} />
        </mesh>
        
        {/* Upper arm */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.045, 0.3, 12]} />
          <meshStandardMaterial {...matteMaterial} />
        </mesh>
        
        {/* Elbow joint - dual servo pistons, rear-flexed */}
        <group position={[0, -0.3, 0]}>
          <mesh>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial {...carbonFiberMaterial} />
          </mesh>
          
          {/* Visible pistons at elbow */}
          <mesh position={[0, 0, 0.05]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.08, 8]} />
            <meshStandardMaterial {...steelMaterial} />
          </mesh>
          
          <mesh position={[0, 0, -0.05]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.08, 8]} />
            <meshStandardMaterial {...steelMaterial} />
          </mesh>
        </group>
        
        {/* Forearm */}
        <mesh position={[0, -0.45, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.05, 0.3, 12]} />
          <meshStandardMaterial {...matteMaterial} />
        </mesh>
        
        {/* Forearm glow strip - side strips */}
        <mesh ref={leftForearmGlowRef} position={[0, -0.45, 0.05]}>
          <boxGeometry args={[0.01, 0.28, 0.005]} />
          <meshStandardMaterial {...getGlowMaterial(2.0)} />
        </mesh>
        
        {/* Hand - fully rigged mechanical fingers, 5 digits */}
        <group position={[0, -0.62, 0]}>
          {/* Palm base */}
          <mesh>
            <boxGeometry args={[0.08, 0.05, 0.03]} />
            <meshStandardMaterial {...matteMaterial} />
          </mesh>
          
          {/* 5 fingers with 3 segment joints each */}
          {[0, 1, 2, 3, 4].map((i) => {
            const isThumb = i === 0;
            const fingerAngle = isThumb ? -Math.PI/4 : 0;
            const fingerPos: [number, number, number] = isThumb ? 
              [-0.04, -0.02, 0.01] : 
              [(i - 2.5) * 0.016, -0.05, 0.01];
              
            return (
              <group key={`left-finger-${i}`} position={fingerPos} rotation={[fingerAngle, 0, 0]}>
                {/* 3 segments per finger */}
                {[0, 1, 2].map((j) => (
                  <mesh key={`left-finger-${i}-segment-${j}`} position={[0, -j * 0.02 - 0.01, 0]}>
                    <boxGeometry args={[0.014, 0.02, 0.012]} />
                    <meshStandardMaterial {...carbonFiberMaterial} />
                  </mesh>
                ))}
              </group>
            );
          })}
        </group>
      </group>
      
      {/* Right Shoulder - mirror of left */}
      <group position={[0.2, 1.44, 0]}>
        {/* Angular guard above arm */}
        <mesh>
          <boxGeometry args={[0.14, 0.08, 0.14]} />
          <meshStandardMaterial {...matteMaterial} />
        </mesh>
        
        {/* Shoulder ring glow */}
        <mesh ref={rightShoulderGlowRef} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.07, 0.008, 16, 24]} />
          <meshStandardMaterial {...getGlowMaterial(2.0)} />
        </mesh>
        
        {/* Upper arm */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.045, 0.3, 12]} />
          <meshStandardMaterial {...matteMaterial} />
        </mesh>
        
        {/* Elbow joint - dual servo pistons, rear-flexed */}
        <group position={[0, -0.3, 0]}>
          <mesh>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial {...carbonFiberMaterial} />
          </mesh>
          
          {/* Visible pistons at elbow */}
          <mesh position={[0, 0, 0.05]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.08, 8]} />
            <meshStandardMaterial {...steelMaterial} />
          </mesh>
          
          <mesh position={[0, 0, -0.05]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.08, 8]} />
            <meshStandardMaterial {...steelMaterial} />
          </mesh>
        </group>
        
        {/* Forearm */}
        <mesh position={[0, -0.45, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.05, 0.3, 12]} />
          <meshStandardMaterial {...matteMaterial} />
        </mesh>
        
        {/* Forearm glow strip - side strips */}
        <mesh ref={rightForearmGlowRef} position={[0, -0.45, 0.05]}>
          <boxGeometry args={[0.01, 0.28, 0.005]} />
          <meshStandardMaterial {...getGlowMaterial(2.0)} />
        </mesh>
        
        {/* Hand - fully rigged mechanical fingers, 5 digits */}
        <group position={[0, -0.62, 0]}>
          {/* Palm base */}
          <mesh>
            <boxGeometry args={[0.08, 0.05, 0.03]} />
            <meshStandardMaterial {...matteMaterial} />
          </mesh>
          
          {/* 5 fingers with 3 segment joints each */}
          {[0, 1, 2, 3, 4].map((i) => {
            const isThumb = i === 0;
            const fingerAngle = isThumb ? -Math.PI/4 : 0;
            const fingerPos: [number, number, number] = isThumb ? 
              [0.04, -0.02, 0.01] : 
              [(i - 2.5) * 0.016, -0.05, 0.01];
              
            return (
              <group key={`right-finger-${i}`} position={fingerPos} rotation={[fingerAngle, 0, 0]}>
                {/* 3 segments per finger */}
                {[0, 1, 2].map((j) => (
                  <mesh key={`right-finger-${i}-segment-${j}`} position={[0, -j * 0.02 - 0.01, 0]}>
                    <boxGeometry args={[0.014, 0.02, 0.012]} />
                    <meshStandardMaterial {...carbonFiberMaterial} />
                  </mesh>
                ))}
              </group>
            );
          })}
        </group>
      </group>
      
      {/* PELVIS - 0.183m tall */}
      <group position={[0, 0.92, 0]}>
        {/* Pelvis armor */}
        <mesh>
          <boxGeometry args={[0.24, 0.183, 0.18]} />
          <meshStandardMaterial {...matteMaterial} />
        </mesh>
        
        {/* Hip joints - left */}
        <mesh position={[-0.12, -0.05, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial {...carbonFiberMaterial} />
        </mesh>
        
        {/* Hip joints - right */}
        <mesh position={[0.12, -0.05, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial {...carbonFiberMaterial} />
        </mesh>
      </group>
      
      {/* LEGS - 0.586m tall */}
      {/* Left Leg */}
      <group position={[-0.12, 0.82, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.055, 0.3, 12]} />
          <meshStandardMaterial {...matteMaterial} />
        </mesh>
        
        {/* Outer thigh glow panel */}
        <mesh ref={leftThighGlowRef} position={[-0.06, -0.2, 0]}>
          <boxGeometry args={[0.005, 0.25, 0.07]} />
          <meshStandardMaterial {...getGlowMaterial(2.0)} />
        </mesh>
        
        {/* Knee joint with visible mechanics */}
        <group position={[0, -0.35, 0]}>
          <mesh>
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshStandardMaterial {...carbonFiberMaterial} />
          </mesh>
          
          {/* Hinged metal pistons visible on back of knee */}
          <mesh position={[0, 0, -0.05]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.08, 8]} />
            <meshStandardMaterial {...steelMaterial} />
          </mesh>
        </group>
        
        {/* Calf */}
        <mesh position={[0, -0.5, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.06, 0.286, 12]} />
          <meshStandardMaterial {...matteMaterial} />
        </mesh>
        
        {/* Shin glow panel */}
        <mesh ref={leftShinGlowRef} position={[-0.06, -0.5, 0]}>
          <boxGeometry args={[0.005, 0.25, 0.07]} />
          <meshStandardMaterial {...getGlowMaterial(1.8)} />
        </mesh>
      </group>
      
      {/* Right Leg - mirror of left */}
      <group position={[0.12, 0.82, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.055, 0.3, 12]} />
          <meshStandardMaterial {...matteMaterial} />
        </mesh>
        
        {/* Outer thigh glow panel */}
        <mesh ref={rightThighGlowRef} position={[0.06, -0.2, 0]}>
          <boxGeometry args={[0.005, 0.25, 0.07]} />
          <meshStandardMaterial {...getGlowMaterial(2.0)} />
        </mesh>
        
        {/* Knee joint with visible mechanics */}
        <group position={[0, -0.35, 0]}>
          <mesh>
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshStandardMaterial {...carbonFiberMaterial} />
          </mesh>
          
          {/* Hinged metal pistons visible on back of knee */}
          <mesh position={[0, 0, -0.05]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.08, 8]} />
            <meshStandardMaterial {...steelMaterial} />
          </mesh>
        </group>
        
        {/* Calf */}
        <mesh position={[0, -0.5, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.06, 0.286, 12]} />
          <meshStandardMaterial {...matteMaterial} />
        </mesh>
        
        {/* Shin glow panel */}
        <mesh ref={rightShinGlowRef} position={[0.06, -0.5, 0]}>
          <boxGeometry args={[0.005, 0.25, 0.07]} />
          <meshStandardMaterial {...getGlowMaterial(1.8)} />
        </mesh>
      </group>
      
      {/* FEET - 0.092m tall */}
      {/* Left Foot - split-toe biped design */}
      <group position={[-0.12, 0.046, 0]}>
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[0.09, 0.04, 0.18]} />
          <meshStandardMaterial {...matteMaterial} />
        </mesh>
        
        {/* Split toe detail */}
        <mesh position={[0, -0.01, 0.11]}>
          <boxGeometry args={[0.085, 0.03, 0.04]} />
          <meshStandardMaterial {...carbonFiberMaterial} />
        </mesh>
      </group>
      
      {/* Right Foot - mirror of left */}
      <group position={[0.12, 0.046, 0]}>
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[0.09, 0.04, 0.18]} />
          <meshStandardMaterial {...matteMaterial} />
        </mesh>
        
        {/* Split toe detail */}
        <mesh position={[0, -0.01, 0.11]}>
          <boxGeometry args={[0.085, 0.03, 0.04]} />
          <meshStandardMaterial {...carbonFiberMaterial} />
        </mesh>
      </group>
      
      {/* Optional hologram text display above head */}
      {hologramText && (
        <group position={[0, 1.9, 0]}>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[hologramText.length * 0.08, 0.1]} />
            <meshBasicMaterial 
              color={getEmotionalGlowColor()} 
              opacity={0.7} 
              transparent={true} 
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

// Helper function to create a V-shaped geometry for chest glow
function createVShape(width: number, height: number) {
  const shape = new THREE.Shape();
  
  // Start at top 
  shape.moveTo(0, height/2);
  // Vertical center line
  shape.lineTo(0, -height/2);
  // Move back to center
  shape.moveTo(0, 0);
  // Left diagonal
  shape.lineTo(-width/2, -height/4);
  // Move back to center
  shape.moveTo(0, 0);
  // Right diagonal
  shape.lineTo(width/2, -height/4);
  
  return shape;
}

export default BlueprintDroid;