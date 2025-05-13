'use client';

import React, { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector2, Vector3, Shape, CatmullRomCurve3, Quaternion, Euler } from "three";
import * as THREE from "three";
import {
  useGLTF,
  Environment,
  useHelper,
  Plane,
  OrbitControls,
  Center,
  Sphere,
  Box,
  Cylinder,
  useAnimations,
  Html,
} from "@react-three/drei";
import { EmotionalState, ParticleDisplay } from "../utils/types";
import useProceduralNormalMaps, { createProceduralNormalMap } from "./NormalMapFallback";

// Accurate droid measurements in meters as per refined specification
const DROID_SPECS = {
  // Overall height: 1.83m (6 feet)
  HEAD_HEIGHT: 0.22, // Per refinement spec
  NECK_HEIGHT: 0.092,
  TORSO_HEIGHT: 0.659, // Per refinement spec
  PELVIS_HEIGHT: 0.183,
  LEG_LENGTH: 0.586, // Per refinement spec (hip to ankle)
  FOOT_HEIGHT: 0.092, // Per refinement spec
  ARM_LENGTH: 0.82, // Per refinement spec (shoulder to hand)
  // Additional measurements refined
  SHOULDER_WIDTH: 0.3, // Narrower width as specified
  HIP_WIDTH: 0.3, 
  CHEST_DEPTH: 0.22,
  // Joint sizes
  MAJOR_JOINT_RADIUS: 0.07,
  MINOR_JOINT_RADIUS: 0.05,
  // Head positioning
  HEAD_HEIGHT_FROM_GROUND: 1.65, // Per refinement spec
};

// We'll create the procedural normal maps inside the component
// to ensure proper initialization with React lifecycle

// Create standardized materials with proper parameters based on final polish specifications
const createMatteMaterial = () => {
  return new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.2, // Matte white armor with slight polish
    metalness: 0.6, // Metal with white coating
    envMapIntensity: 1.2,
    flatShading: false, // Smooth surfaces for armor plates
    // Bevel effect achieved through geometry rather than material
  });
};

// Dark carbon fiber material for joints as per final polish spec
const createCarbonFiberMaterial = () => {
  return new THREE.MeshStandardMaterial({
    color: '#111111', // Very dark, almost black for carbon fiber look
    roughness: 0.3,   // Slight texture
    metalness: 0.6,   // Slight metallic look of carbon fiber
    envMapIntensity: 1.0,
    flatShading: false,
    // Create texture for carbon fiber look
    // (in practice would use normalMap for proper fiber texture)
  });
};

// Emissive cyan glow with minimal intensity for very subtle effect
const createGlowMaterial = (intensity: number = 0.4) => new THREE.MeshStandardMaterial({
  color: '#00FFFF',        // Cyan blue precisely as specified #00FFFF
  emissive: '#00FFFF',     // Same color emission
  emissiveIntensity: intensity, // Minimal intensity for extremely natural appearance
  roughness: 0.35,         // Higher roughness for diffused effect
  metalness: 0.3,          // Lower metalness for less reflection
  envMapIntensity: 0.5,    // Minimal environment response
  transparent: true,       // Allow transparency
  opacity: 0.75,           // Lower opacity for gentler effect
  // Recessed into the mesh slightly as specified in final polish
});

// Mechanical joint material for hinges and pistons with improved texture
const createJointMaterial = () => new THREE.MeshStandardMaterial({
  color: '#222222',        // Dark mechanical pieces
  roughness: 0.15,         // More polished
  metalness: 0.9,          // Very metallic
  envMapIntensity: 1.4,    // Highly reflective
  // Refined for pivot joint clarity
});

// Steel material for connectors and mechanical parts with subtle brushing
const createSteelMaterial = () => new THREE.MeshStandardMaterial({
  color: '#BBBBBB',        // Silver color
  roughness: 0.1,          // Polished 
  metalness: 0.9,          // Very metallic
  envMapIntensity: 1.2,    // Reflective
  // Refined for better reflections at joint intersections
});

// Material for mechanical vents and intakes
const createVentMaterial = () => new THREE.MeshStandardMaterial({
  color: '#080808',        // Almost black
  roughness: 0.6,          // Rough texture for vents
  metalness: 0.4,          // Less reflective inside vents
  envMapIntensity: 0.8,    // Less responsive to light
});

interface UnifiedDroidModelProps {
  animation?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  showGlow?: boolean;
  interactive?: boolean;
}

// Function to create a V shape 
const createVShape = (width: number, height: number) => {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.lineTo(-width / 2, height);
  shape.lineTo(0, height * 0.7);
  shape.lineTo(width / 2, height);
  shape.lineTo(0, 0);
  return shape;
};

// Main unified droid component
const UnifiedDroidModel: React.FC<UnifiedDroidModelProps> = ({
  animation = 'idle',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  showGlow = true,
  interactive = false
}) => {
  // Setup refs for animation and rigging
  const modelRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  
  // References for glow elements
  const headGlowRef = useRef<THREE.Mesh>(null);
  const chestGlowRef = useRef<THREE.Mesh>(null);
  const leftArmGlowRef = useRef<THREE.Mesh>(null);
  const rightArmGlowRef = useRef<THREE.Mesh>(null);
  const leftLegGlowRef = useRef<THREE.Mesh>(null);
  const rightLegGlowRef = useRef<THREE.Mesh>(null);
  
  // Create materials once with proper optimization for final polish
  const materials = useMemo(() => {
    return {
      matte: createMatteMaterial(),
      carbon: createCarbonFiberMaterial(),
      glow: createGlowMaterial(),
      brightGlow: createGlowMaterial(0.5), // Extremely subtle glow effect
      joint: createJointMaterial(),
      steel: createSteelMaterial(),
      vent: createVentMaterial()
    };
  }, []);
  
  // The points for torso using LatheGeometry with refined, anatomically accurate curves
  // Refined to match exact specification of 0.659m torso length and 0.3m width
  const torsoPoints = useMemo(() => [
    // Using strictly specified dimensions
    new Vector2(0.0, 0.0),                                             // Start at bottom center
    new Vector2(DROID_SPECS.HIP_WIDTH / 2, 0.0),                       // Bottom edge precisely at hip width (0.15m)
    
    // Pelvis - more defined with beveled armor segments
    new Vector2(DROID_SPECS.HIP_WIDTH / 2 * 1.05, DROID_SPECS.PELVIS_HEIGHT * 0.1),  // Slight outward bevel for armor plating
    new Vector2(DROID_SPECS.HIP_WIDTH / 2 * 1.0, DROID_SPECS.PELVIS_HEIGHT * 0.2),   // Hip plating curve
    new Vector2(DROID_SPECS.HIP_WIDTH / 2 * 0.95, DROID_SPECS.PELVIS_HEIGHT * 0.5),  // Mid pelvis
    new Vector2(DROID_SPECS.HIP_WIDTH / 2 * 0.9, DROID_SPECS.PELVIS_HEIGHT),         // Top of pelvis
    
    // Torso - refined with segmented armor plate design
    // Lower torso - slight inward curve for waist
    new Vector2(DROID_SPECS.HIP_WIDTH / 2 * 0.85, DROID_SPECS.PELVIS_HEIGHT + DROID_SPECS.TORSO_HEIGHT * 0.15),
    // Mid torso (waist) - narrowest point
    new Vector2(DROID_SPECS.HIP_WIDTH / 2 * 0.78, DROID_SPECS.PELVIS_HEIGHT + DROID_SPECS.TORSO_HEIGHT * 0.35),
    // Upper mid torso - beginning to widen for chest
    new Vector2(DROID_SPECS.HIP_WIDTH / 2 * 0.88, DROID_SPECS.PELVIS_HEIGHT + DROID_SPECS.TORSO_HEIGHT * 0.55),
    // Chest plate - widest point with beveled armor design
    new Vector2(DROID_SPECS.HIP_WIDTH / 2 * 1.05, DROID_SPECS.PELVIS_HEIGHT + DROID_SPECS.TORSO_HEIGHT * 0.75),
    // Upper chest/shoulders
    new Vector2(DROID_SPECS.HIP_WIDTH / 2 * 1.0, DROID_SPECS.PELVIS_HEIGHT + DROID_SPECS.TORSO_HEIGHT * 0.9),
    // Top of torso (shoulder level) - with armor lip
    new Vector2(DROID_SPECS.HIP_WIDTH / 2 * 0.95, DROID_SPECS.PELVIS_HEIGHT + DROID_SPECS.TORSO_HEIGHT),
    
    // Neck - more mechanical with piston-like design
    // Neck base - connection point
    new Vector2(DROID_SPECS.HIP_WIDTH / 2 * 0.65, DROID_SPECS.PELVIS_HEIGHT + DROID_SPECS.TORSO_HEIGHT + DROID_SPECS.NECK_HEIGHT * 0.1),
    // Mid neck - slight curve for mechanical design
    new Vector2(DROID_SPECS.HIP_WIDTH / 2 * 0.55, DROID_SPECS.PELVIS_HEIGHT + DROID_SPECS.TORSO_HEIGHT + DROID_SPECS.NECK_HEIGHT * 0.5),
    // Upper neck - supporting head
    new Vector2(DROID_SPECS.HIP_WIDTH / 2 * 0.5, DROID_SPECS.PELVIS_HEIGHT + DROID_SPECS.TORSO_HEIGHT + DROID_SPECS.NECK_HEIGHT), 
  ], []);
  
  // Animation logic for the unified model
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (!modelRef.current) return;
    
    // Simple idle animation with breathing and subtle movement
    if (animation === 'idle') {
      // Breathing effect
      if (torsoRef.current) {
        const breathScale = 1 + Math.sin(time * 0.8) * 0.02;
        torsoRef.current.scale.set(breathScale, 1, breathScale);
      }
      
      // Subtle head movement
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
        headRef.current.rotation.z = Math.sin(time * 0.3) * 0.03;
      }
      
      // Subtle arm sway
      if (leftArmRef.current && rightArmRef.current) {
        const armSway = Math.sin(time * 0.7) * 0.05;
        leftArmRef.current.rotation.z = -0.1 + armSway;
        rightArmRef.current.rotation.z = 0.1 - armSway;
      }
    }
    
    // Scanning animation
    if (animation === 'scan') {
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(time * 1.2) * 0.8;
      }
    }
    
    // Wave animation
    if (animation === 'wave' && rightArmRef.current) {
      const wavePhase = (time % 3) / 3; // 0 to 1 repeating every 3 seconds
      
      if (wavePhase < 0.3) {
        // Raise arm
        rightArmRef.current.rotation.z = 0.1 - wavePhase * 1.5;
        rightArmRef.current.rotation.x = wavePhase * 1.0;
      } else if (wavePhase < 0.8) {
        // Wave hand back and forth
        rightArmRef.current.rotation.z = -0.35;
        rightArmRef.current.rotation.x = 0.3 + Math.sin((wavePhase - 0.3) * 12) * 0.2;
        rightArmRef.current.rotation.y = Math.sin((wavePhase - 0.3) * 8) * 0.3;
      } else {
        // Lower arm
        const lowerPhase = (wavePhase - 0.8) / 0.2;
        rightArmRef.current.rotation.z = -0.35 + lowerPhase * 0.45;
        rightArmRef.current.rotation.x = 0.3 - lowerPhase * 0.3;
        rightArmRef.current.rotation.y = 0;
      }
    }
    
    // Walk animation
    if (animation === 'walk') {
      const walkCycle = time * 2 % 1; // 0 to 1 repeating twice per second
      
      // Leg movement
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = Math.sin(walkCycle * Math.PI * 2) * 0.4;
        rightLegRef.current.rotation.x = Math.sin((walkCycle * Math.PI * 2) + Math.PI) * 0.4;
      }
      
      // Arm counter-movement
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin((walkCycle * Math.PI * 2) + Math.PI) * 0.3;
        rightArmRef.current.rotation.x = Math.sin(walkCycle * Math.PI * 2) * 0.3;
      }
      
      // Subtle torso movement
      if (torsoRef.current) {
        torsoRef.current.position.y = Math.abs(Math.sin(walkCycle * Math.PI * 2)) * 0.02;
        torsoRef.current.rotation.z = Math.sin(walkCycle * Math.PI * 2) * 0.05;
      }
    }
    
    // Animate glow effects
    const glowRefs = [headGlowRef, chestGlowRef, leftArmGlowRef, rightArmGlowRef, leftLegGlowRef, rightLegGlowRef];
    glowRefs.forEach((ref, index) => {
      if (ref.current && showGlow) {
        const material = ref.current.material as THREE.MeshStandardMaterial;
        if (material && material.emissiveIntensity !== undefined) {
          // Different phase for each glow element
          const phaseOffset = index * 0.2;
          // Extremely subtle pulsing with very small range
          material.emissiveIntensity = 0.4 + Math.sin(time * 1.0 + phaseOffset) * 0.1;
        }
      }
    });
  });
  
  return (
    <group 
      ref={modelRef}
      position={position}
      rotation={rotation as unknown as THREE.Euler}
      scale={typeof scale === 'number' ? [scale, scale, scale] : scale}
    >
      {/* Main skeletal structure following the bone map */}
      <group ref={torsoRef} position={[0, DROID_SPECS.PELVIS_HEIGHT, 0]}>
        {/* TORSO - Primary body structure with beveled armor plating */}
        <group>
          {/* Main torso body */}
          <mesh rotation={[0, 0, 0]}>
            <latheGeometry args={[torsoPoints, 32, 0, Math.PI * 2]} />
            <primitive object={materials.matte} />
          </mesh>
          
          {/* Extra connector pieces to ensure no gaps between torso and extremities */}
          {/* Left shoulder connection reinforcement */}
          <mesh position={[-DROID_SPECS.SHOULDER_WIDTH * 0.5 + 0.04, DROID_SPECS.TORSO_HEIGHT, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
            <primitive object={materials.joint} />
          </mesh>
          
          {/* Right shoulder connection reinforcement */}
          <mesh position={[DROID_SPECS.SHOULDER_WIDTH * 0.5 - 0.04, DROID_SPECS.TORSO_HEIGHT, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
            <primitive object={materials.joint} />
          </mesh>
          
          {/* Neck base reinforcement to connect with head */}
          <mesh position={[0, DROID_SPECS.TORSO_HEIGHT + DROID_SPECS.NECK_HEIGHT - 0.06, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.12, 16]} />
            <primitive object={materials.joint} />
          </mesh>
        </group>
        
        {/* Chest plate with armor details */}
        <group position={[0, DROID_SPECS.TORSO_HEIGHT * 0.7, DROID_SPECS.CHEST_DEPTH * 0.4]}>
          {/* Chest armor plate */}
          <mesh position={[0, 0, 0]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[DROID_SPECS.SHOULDER_WIDTH * 0.8, DROID_SPECS.TORSO_HEIGHT * 0.4, 0.04]} />
            <meshStandardMaterial {...createMatteMaterial()} />
          </mesh>
          
          {/* Central reactor housing */}
          <group position={[0, 0, 0.03]}>
            {/* Reactor frame - updated for clean attachment and better visualization */}
            <mesh>
              <cylinderGeometry args={[DROID_SPECS.CHEST_DEPTH * 0.2, DROID_SPECS.CHEST_DEPTH * 0.2, 0.05, 16]} />
              <primitive object={materials.carbon} />
            </mesh>
            
            {/* Reactor core glow - properly RECESSED as per polish requirements */}
            {showGlow && (
              <>
                {/* Outer rim for recessed effect */}
                <mesh position={[0, 0, 0.005]}>
                  <cylinderGeometry args={[DROID_SPECS.CHEST_DEPTH * 0.17, DROID_SPECS.CHEST_DEPTH * 0.17, 0.02, 16]} />
                  <primitive object={materials.steel} />
                </mesh>
                
                {/* Recessed glow element */}
                <mesh ref={chestGlowRef} position={[0, 0, 0]}>
                  <cylinderGeometry args={[DROID_SPECS.CHEST_DEPTH * 0.15, DROID_SPECS.CHEST_DEPTH * 0.15, 0.06, 16]} />
                  <primitive object={materials.brightGlow} />
                </mesh>
              </>
            )}
            
            {/* Reactor detail rings - polish with precise alignment for mechanical connection */}
            {[0, 1, 2].map((i) => (
              <mesh 
                key={`reactor-ring-${i}`}
                position={[0, 0, 0.03]}
                rotation={[Math.PI/2, 0, i * Math.PI/3]}
              >
                <torusGeometry args={[DROID_SPECS.CHEST_DEPTH * 0.17, 0.005, 16, 32]} />
                <primitive object={materials.steel} />
              </mesh>
            ))}
          </group>
          
          {/* Chest V-shaped glow accent - RECESSED as per polish requirements */}
          {showGlow && (
            <>
              {/* Recessed channel for the glow */}
              <mesh position={[0, -DROID_SPECS.TORSO_HEIGHT * 0.15, 0.01]}>
                <shapeGeometry args={[createVShape(DROID_SPECS.SHOULDER_WIDTH * 0.42, DROID_SPECS.TORSO_HEIGHT * 0.27)]} />
                <primitive object={materials.carbon} />
              </mesh>
              
              {/* The actual V-shaped glow, slightly recessed into the panel */}
              <mesh position={[0, -DROID_SPECS.TORSO_HEIGHT * 0.15, 0.015]}>
                <shapeGeometry args={[createVShape(DROID_SPECS.SHOULDER_WIDTH * 0.4, DROID_SPECS.TORSO_HEIGHT * 0.25)]} />
                <primitive object={materials.glow} />
              </mesh>
            </>
          )}
        </group>
        
        {/* Back cooling system */}
        <group position={[0, DROID_SPECS.TORSO_HEIGHT * 0.6, -DROID_SPECS.CHEST_DEPTH * 0.3]}>
          {/* Back plate - with precise T-pose alignment */}
          <mesh rotation={[0, Math.PI, 0]}>
            <boxGeometry args={[DROID_SPECS.SHOULDER_WIDTH * 0.7, DROID_SPECS.TORSO_HEIGHT * 0.5, 0.03]} />
            <primitive object={materials.matte} />
          </mesh>
          
          {/* Cooling vents - properly spaced for heat dissipation */}
          <group position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]}>
            {[-2, -1, 0, 1, 2].map((i) => (
              <mesh key={`vent-${i}`} position={[0, i * 0.05, 0]}>
                <boxGeometry args={[DROID_SPECS.SHOULDER_WIDTH * 0.6, 0.02, 0.01]} />
                <primitive object={materials.carbon} />
              </mesh>
            ))}
          </group>
        </group>
        
        {/* NECK section - redesigned with mechanical joints and proper skeletal structure */}
        <group position={[0, DROID_SPECS.TORSO_HEIGHT, 0]}>
          {/* Mechanical neck base - where neck connects to torso */}
          <group position={[0, 0, 0]}>
            {/* Enhanced connecting base plate - torso to neck with proper alignment */}
            <mesh position={[0, 0.01, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.03, 24]} />
              <primitive object={materials.steel} />
            </mesh>
            
            {/* Neck ring connector - embedded joint for better connection */}
            <mesh position={[0, 0.03, 0]}>
              <torusGeometry args={[0.07, 0.02, 24, 24]} />
              <primitive object={materials.joint} />
            </mesh>
            
            {/* Reinforced connection structure - completely eliminates gaps */}
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.07, 0.075, 0.08, 24]} />
              <primitive object={materials.matte} />
            </mesh>
            
            {/* Additional reinforcement plates */}
            <group>
              {/* Cross-bracing support structure */}
              <mesh position={[0, 0.04, 0]} rotation={[Math.PI/2, 0, 0]}>
                <boxGeometry args={[0.15, 0.02, 0.015]} />
                <primitive object={materials.steel} />
              </mesh>
              
              <mesh position={[0, 0.04, 0]} rotation={[Math.PI/2, Math.PI/2, 0]}>
                <boxGeometry args={[0.15, 0.02, 0.015]} />
                <primitive object={materials.steel} />
              </mesh>
            </group>
          </group>
          
          {/* Neck column with segmented design - T-pose for animation */}
          <group position={[0, DROID_SPECS.NECK_HEIGHT * 0.5, 0]}>
            {/* Main neck support - central spine column */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.06, DROID_SPECS.NECK_HEIGHT * 0.8, 16]} />
              <meshStandardMaterial {...createCarbonFiberMaterial()} />
            </mesh>
            
            {/* Neck armor plating - segmented sections with beveled edges */}
            {[-0.25, 0, 0.25].map((y, i) => (
              <mesh 
                key={`neck-segment-${i}`}
                position={[0, DROID_SPECS.NECK_HEIGHT * y, 0]}
                rotation={[0, Math.PI/8 * i, 0]}
              >
                <torusGeometry args={[0.055, 0.012, 16, 24]} />
                <meshStandardMaterial {...createSteelMaterial()} />
              </mesh>
            ))}
            
            {/* Neck hydraulic pistons - side mechanical details */}
            {[-1, 1].map((side) => (
              <group key={`neck-piston-${side}`} position={[0.04 * side, 0, 0]}>
                <mesh position={[0, -DROID_SPECS.NECK_HEIGHT * 0.3, 0.03]} rotation={[0.2, 0, 0]}>
                  <cylinderGeometry args={[0.008, 0.008, DROID_SPECS.NECK_HEIGHT * 0.6, 8]} />
                  <meshStandardMaterial {...createJointMaterial()} />
                </mesh>
                
                <mesh position={[0, DROID_SPECS.NECK_HEIGHT * 0.2, 0.04]} rotation={[0.2, 0, 0]}>
                  <cylinderGeometry args={[0.01, 0.01, DROID_SPECS.NECK_HEIGHT * 0.25, 8]} />
                  <meshStandardMaterial {...createSteelMaterial()} />
                </mesh>
              </group>
            ))}
            
            {/* Embedded glow for neck - properly recessed as specified in final polish */}
            {showGlow && (
              <>
                {/* Recessed channel for the glow */}
                <mesh position={[0, 0, 0.055]}>
                  <boxGeometry args={[0.025, DROID_SPECS.NECK_HEIGHT * 0.55, 0.01]} />
                  <primitive object={materials.carbon} />
                </mesh>
                
                {/* The actual glow element - slightly recessed */}
                <mesh position={[0, 0, 0.06]}>
                  <boxGeometry args={[0.02, DROID_SPECS.NECK_HEIGHT * 0.5, 0.005]} />
                  <primitive object={materials.glow} />
                </mesh>
              </>
            )}
          </group>
          
          {/* Upper neck joint connector - aligned to head */}
          <group position={[0, DROID_SPECS.NECK_HEIGHT, 0]}>
            {/* Connector plate */}
            <mesh position={[0, -0.01, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.02, 16]} />
              <meshStandardMaterial {...createSteelMaterial()} />
            </mesh>
            
            {/* Joint ball that connects to head - aligned precisely to head bone */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshStandardMaterial {...createJointMaterial()} />
            </mesh>
            
            {/* Electrical connectors */}
            {[-1, 1].map((side) => (
              <mesh 
                key={`head-connector-${side}`}
                position={[side * 0.03, 0.01, 0]}
                rotation={[0, 0, side * Math.PI * 0.1]}
              >
                <cylinderGeometry args={[0.005, 0.005, 0.05, 6]} />
                <meshStandardMaterial {...createJointMaterial()} />
              </mesh>
            ))}
          </group>
        </group>
        
        {/* HEAD assembly - properly attached to neck bone with accurate skull base pivot */}
        <group 
          ref={headRef} 
          position={[0, DROID_SPECS.TORSO_HEIGHT + DROID_SPECS.NECK_HEIGHT, 0]}
        >
          {/* Completely redesigned head-to-neck connection assembly with zero-gap guarantee */}
          <group>
            {/* Main neck connector - significantly thicker and longer to eliminate any possibility of gaps */}
            <mesh position={[0, -0.08, 0]}>
              <cylinderGeometry args={[0.075, 0.075, 0.18, 24]} />
              <primitive object={materials.joint} />
            </mesh>
            
            {/* Reinforced neck base plate */}
            <mesh position={[0, -0.15, 0]}>
              <cylinderGeometry args={[0.09, 0.08, 0.04, 24]} />
              <primitive object={materials.steel} />
            </mesh>
            
            {/* Additional neck stabilizing connector plates - quad configuration */}
            <mesh position={[0, -0.05, 0.04]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.06, 0.05, 0.025]} />
              <primitive object={materials.steel} />
            </mesh>
            
            <mesh position={[0, -0.05, -0.04]} rotation={[-0.2, 0, 0]}>
              <boxGeometry args={[0.06, 0.05, 0.025]} />
              <primitive object={materials.steel} />
            </mesh>
            
            <mesh position={[0.04, -0.05, 0]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[0.025, 0.05, 0.06]} />
              <primitive object={materials.steel} />
            </mesh>
            
            <mesh position={[-0.04, -0.05, 0]} rotation={[0, 0, -0.2]}>
              <boxGeometry args={[0.025, 0.05, 0.06]} />
              <primitive object={materials.steel} />
            </mesh>
            
            {/* Filling piece to ensure complete connection from all angles */}
            <mesh position={[0, -0.11, 0]}>
              <sphereGeometry args={[0.08, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <primitive object={materials.joint} />
            </mesh>
          </group>
          {/* Main head dome - exactly 0.22m tall per spec */}
          <group>
            {/* Bottom head dome */}
            <mesh position={[0, -DROID_SPECS.HEAD_HEIGHT * 0.1, 0]}>
              <sphereGeometry 
                args={[DROID_SPECS.HEAD_HEIGHT * 0.45, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.6]} 
              />
              <meshStandardMaterial {...createMatteMaterial()} />
            </mesh>
            
            {/* Top head dome - slightly smaller radius for beveled look */}
            <mesh position={[0, DROID_SPECS.HEAD_HEIGHT * 0.05, 0]}>
              <sphereGeometry 
                args={[DROID_SPECS.HEAD_HEIGHT * 0.4, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.5]} 
              />
              <meshStandardMaterial {...createMatteMaterial()} />
            </mesh>
            
            {/* Head armor plates - adding segmentation */}
            <group>
              {/* Crown plate */}
              <mesh position={[0, DROID_SPECS.HEAD_HEIGHT * 0.3, 0]}>
                <cylinderGeometry args={[DROID_SPECS.HEAD_HEIGHT * 0.3, DROID_SPECS.HEAD_HEIGHT * 0.35, 0.03, 16, 1, true]} />
                <meshStandardMaterial {...createMatteMaterial()} />
              </mesh>
              
              {/* Rear head plate */}
              <mesh position={[0, 0, -DROID_SPECS.HEAD_HEIGHT * 0.25]} rotation={[Math.PI * 0.15, 0, 0]}>
                <boxGeometry args={[DROID_SPECS.HEAD_HEIGHT * 0.5, DROID_SPECS.HEAD_HEIGHT * 0.4, 0.03]} />
                <meshStandardMaterial {...createMatteMaterial()} />
              </mesh>
            </group>
          </group>
          
          {/* Side wrap glow stripe as specified in requirements */}
          {showGlow && (
            <group>
              {/* Left side glow */}
              <mesh ref={headGlowRef} position={[-DROID_SPECS.HEAD_HEIGHT * 0.45, 0, 0]} rotation={[0, Math.PI * 0.5, 0]}>
                <torusGeometry args={[DROID_SPECS.HEAD_HEIGHT * 0.25, 0.01, 16, 32, Math.PI * 1.2]} />
                <meshStandardMaterial {...createGlowMaterial(3.0)} />
              </mesh>
              
              {/* Right side glow - mirror of left */}
              <mesh position={[DROID_SPECS.HEAD_HEIGHT * 0.45, 0, 0]} rotation={[0, -Math.PI * 0.5, 0]}>
                <torusGeometry args={[DROID_SPECS.HEAD_HEIGHT * 0.25, 0.01, 16, 32, Math.PI * 1.2]} />
                <meshStandardMaterial {...createGlowMaterial(3.0)} />
              </mesh>
            </group>
          )}
          
          {/* Face plate - more refined with beveled edges */}
          <group position={[0, -DROID_SPECS.HEAD_HEIGHT * 0.05, DROID_SPECS.HEAD_HEIGHT * 0.3]}>
            {/* Main face structure - slightly beveled with extrusion */}
            <group>
              {/* Main face plate */}
              <mesh>
                <boxGeometry args={[DROID_SPECS.HEAD_HEIGHT * 0.7, DROID_SPECS.HEAD_HEIGHT * 0.4, DROID_SPECS.HEAD_HEIGHT * 0.2]} />
                <meshStandardMaterial {...createMatteMaterial()} />
              </mesh>
              
              {/* Beveled face plate edges */}
              <mesh position={[0, 0, DROID_SPECS.HEAD_HEIGHT * 0.12]}>
                <boxGeometry args={[DROID_SPECS.HEAD_HEIGHT * 0.68, DROID_SPECS.HEAD_HEIGHT * 0.38, 0.02]} />
                <meshStandardMaterial {...createSteelMaterial()} />
              </mesh>
            </group>
            
            {/* Face plate frame */}
            <mesh position={[0, 0, DROID_SPECS.HEAD_HEIGHT * 0.12]}>
              <boxGeometry args={[DROID_SPECS.HEAD_HEIGHT * 0.72, DROID_SPECS.HEAD_HEIGHT * 0.42, 0.01]} />
              <meshStandardMaterial {...createCarbonFiberMaterial()} />
            </mesh>
            
            {/* Visual sensor array */}
            <group position={[0, 0, DROID_SPECS.HEAD_HEIGHT * 0.14]}>
              {/* Main visor/eye */}
              {showGlow && (
                <mesh>
                  <shapeGeometry args={[createVShape(DROID_SPECS.HEAD_HEIGHT * 0.3, DROID_SPECS.HEAD_HEIGHT * 0.12)]} />
                  <meshStandardMaterial {...createGlowMaterial(3.0)} />
                </mesh>
              )}
              
              {/* LED matrix for display - refined positioning */}
              {[0, 1, 2].map((row) => (
                [...Array(5)].map((_, col) => (
                  <mesh 
                    key={`led-${row}-${col}`}
                    position={[
                      -DROID_SPECS.HEAD_HEIGHT * 0.2 + col * DROID_SPECS.HEAD_HEIGHT * 0.1, 
                      -DROID_SPECS.HEAD_HEIGHT * 0.1 - row * DROID_SPECS.HEAD_HEIGHT * 0.05,
                      DROID_SPECS.HEAD_HEIGHT * 0.15
                    ]}
                  >
                    <sphereGeometry args={[0.005, 8, 8]} />
                    <meshStandardMaterial 
                      color="#FFFFFF"
                      emissive="#00FFFF"
                      emissiveIntensity={row === 1 && (col === 1 || col === 3) ? 1.5 : 0.5}
                    />
                  </mesh>
                ))
              ))}
            </group>
          </group>
          
          {/* Head sensor array */}
          <group position={[0, DROID_SPECS.HEAD_HEIGHT * 0.4, 0]}>
            {/* Main sensor rod */}
            <mesh>
              <cylinderGeometry args={[0.01, 0.01, 0.06, 8]} />
              <meshStandardMaterial {...createSteelMaterial()} />
            </mesh>
            
            {/* Sensor tip - with glow */}
            {showGlow && (
              <mesh position={[0, 0.035, 0]}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshStandardMaterial {...createGlowMaterial(2.0)} />
              </mesh>
            )}
            
            {/* Additional sensor details */}
            <group position={[0, 0.01, 0]}>
              {[-1, 1].map((side) => (
                <mesh 
                  key={`sensor-detail-${side}`} 
                  position={[0.03 * side, 0, 0]} 
                  rotation={[0, 0, Math.PI * 0.2 * side]}
                >
                  <cylinderGeometry args={[0.004, 0.004, 0.04, 6]} />
                  <meshStandardMaterial {...createJointMaterial()} />
                </mesh>
              ))}
            </group>
          </group>
        </group>
        
        {/* SHOULDER and ARM assemblies - properly connected with sockets - 0.82m exactly */}
        {/* Left arm assembly - connected at shoulder joint - T-pose for animation export */}
        <group 
          ref={leftArmRef}
          position={[-DROID_SPECS.SHOULDER_WIDTH * 0.5, DROID_SPECS.TORSO_HEIGHT, 0]}
          rotation={[0, 0, 0]} // Perfect T-pose as requested in refinement
        >
          {/* Improved shoulder connector to torso - eliminates gap completely */}
          <group>
            {/* Main structural connector */}
            <mesh position={[0.04, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.16, 16]} />
              <primitive object={materials.joint} />
            </mesh>
            
            {/* Additional shoulder connector reinforcement */}
            <mesh position={[0.06, 0, 0]}>
              <boxGeometry args={[0.04, 0.12, 0.12]} />
              <primitive object={materials.steel} />
            </mesh>
          </group>
          
          {/* Shoulder socket connection to torso - FIXED FLOATING GAP */}
          <group>
            {/* Torso side connection socket - recessed into torso */}
            <mesh position={[0.04, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
              <primitive object={materials.matte} />
            </mesh>
            
            {/* Socket interior */}
            <mesh position={[0.035, 0, 0]} rotation={[0, Math.PI/2, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.04, 16]} />
              <primitive object={materials.joint} />
            </mesh>
            
            {/* Primary shoulder joint - properly centered for bone pivot */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[DROID_SPECS.MAJOR_JOINT_RADIUS, 24, 24]} />
              <primitive object={materials.joint} />
            </mesh>
            
            {/* Shoulder armor plate with proper bone alignment */}
            <mesh position={[-0.02, 0.02, 0]}>
              <boxGeometry args={[0.08, 0.12, 0.08]} />
              <primitive object={materials.matte} />
            </mesh>
            
            {/* Shoulder hydraulic connections - aligned to anatomically correct rotation */}
            <mesh position={[0, 0.05, 0.06]} rotation={[Math.PI * 0.25, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />
              <meshStandardMaterial {...createSteelMaterial()} />
            </mesh>
            
            {/* Cable and mechanical connectors at joint */}
            {[0, 1, 2].map((i) => (
              <mesh 
                key={`left-shoulder-cable-${i}`}
                position={[0.01, 0.02, -0.05 + i * 0.02]} 
                rotation={[0, Math.PI * 0.35, Math.PI * 0.15]}
              >
                <cylinderGeometry args={[0.005, 0.005, 0.1, 6]} />
                <meshStandardMaterial {...createJointMaterial()} />
              </mesh>
            ))}
            
            {/* Shoulder joint piston */}
            <mesh position={[0, 0.08, 0.03]}>
              <boxGeometry args={[0.03, 0.02, 0.06]} />
              <meshStandardMaterial {...createJointMaterial()} />
            </mesh>
            
            {/* Embedded glow - recessed as specified in polish */}
            {showGlow && (
              <mesh position={[-0.02, 0.02, 0.045]}>
                <boxGeometry args={[0.04, 0.01, 0.01]} />
                <meshStandardMaterial {...createGlowMaterial()} />
              </mesh>
            )}
          </group>
          
          {/* Upper arm - exactly scaled to spec - 0.41m (half of arm length) */}
          <group position={[-DROID_SPECS.ARM_LENGTH * 0.25, 0, 0]}>
            {/* Base connector to shoulder joint */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.05, 0.04, 16]} />
              <meshStandardMaterial {...createJointMaterial()} />
            </mesh>
            
            {/* Upper arm structure - segmented armor plating */}
            <group position={[-DROID_SPECS.ARM_LENGTH * 0.2, 0, 0]}>
              {/* Main arm structure */}
              <mesh rotation={[0, 0, Math.PI * 0.5]}>
                <capsuleGeometry args={[0.05, DROID_SPECS.ARM_LENGTH * 0.4, 12, 18]} />
                <meshStandardMaterial {...createMatteMaterial()} />
              </mesh>
              
              {/* Armor segments - adding beveled plates */}
              {[-0.15, -0.05, 0.05, 0.15].map((x, i) => (
                <mesh 
                  key={`left-arm-plate-${i}`}
                  position={[x, 0, 0]} 
                  rotation={[0, 0, Math.PI * 0.5]}
                >
                  <torusGeometry args={[0.055, 0.008, 16, 6, Math.PI * 1.2]} />
                  <meshStandardMaterial {...createSteelMaterial()} />
                </mesh>
              ))}
              
              {/* Upper arm glow strip - specified in refinement */}
              {showGlow && (
                <mesh ref={leftArmGlowRef} position={[-DROID_SPECS.ARM_LENGTH * 0.05, 0, 0.05]} rotation={[0, 0, Math.PI * 0.5]}>
                  <boxGeometry args={[0.15, 0.01, 0.01]} />
                  <meshStandardMaterial {...createGlowMaterial(2.2)} />
                </mesh>
              )}
            </group>
            
            {/* Elbow joint - mechanical hinge design as specified */}
            <group position={[-DROID_SPECS.ARM_LENGTH * 0.4, 0, 0]}>
              {/* Main elbow hinge */}
              <mesh rotation={[Math.PI * 0.5, 0, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.08, 16]} />
                <meshStandardMaterial {...createJointMaterial()} />
              </mesh>
              
              {/* Elbow joint caps */}
              {[-1, 1].map((side) => (
                <mesh 
                  key={`left-elbow-cap-${side}`}
                  position={[0, 0, side * 0.045]} 
                  rotation={[Math.PI * 0.5, 0, 0]}
                >
                  <cylinderGeometry args={[0.045, 0.035, 0.01, 16]} />
                  <meshStandardMaterial {...createSteelMaterial()} />
                </mesh>
              ))}
              
              {/* Elbow joint hydraulic */}
              <mesh position={[0, -0.06, 0]} rotation={[-Math.PI * 0.2, 0, 0]}>
                <cylinderGeometry args={[0.015, 0.018, 0.1, 8]} />
                <meshStandardMaterial {...createJointMaterial()} />
              </mesh>
            </group>
            
            {/* Forearm - remaining 0.41m of arm length */}
            <group position={[-DROID_SPECS.ARM_LENGTH * 0.4, 0, 0]}>
              {/* Forearm structure with beveled armor plating */}
              <group position={[-DROID_SPECS.ARM_LENGTH * 0.15, 0, 0]}>
                {/* Main forearm cylinder - properly aligned for T-pose */}
                <mesh rotation={[0, 0, Math.PI * 0.5]}>
                  <capsuleGeometry args={[0.04, DROID_SPECS.ARM_LENGTH * 0.25, 10, 16]} />
                  <primitive object={materials.matte} />
                </mesh>
                
                {/* Forearm glow strip - recessed as specified in polish requirements */}
                {showGlow && (
                  <>
                    {/* Recessed channel for glow */}
                    <mesh position={[0, 0, 0.041]} rotation={[0, 0, Math.PI * 0.5]}>
                      <boxGeometry args={[0.21, 0.014, 0.003]} />
                      <primitive object={materials.carbon} />
                    </mesh>
                    
                    {/* Glow strip in recessed channel */}
                    <mesh position={[0, 0, 0.042]} rotation={[0, 0, Math.PI * 0.5]}>
                      <boxGeometry args={[0.2, 0.012, 0.002]} />
                      <primitive object={materials.glow} />
                    </mesh>
                  </>
                )}
                
                {/* Forearm armor plates - reinforced with mechanical detailing */}
                {[-0.1, 0, 0.1].map((x, i) => (
                  <mesh 
                    key={`left-forearm-plate-${i}`}
                    position={[x, 0, 0]} 
                    rotation={[0, 0, Math.PI * 0.5]}
                  >
                    <torusGeometry args={[0.045, 0.006, 16, 6, Math.PI * 1.0]} />
                    <primitive object={materials.steel} />
                  </mesh>
                ))}
              </group>
              
              {/* Wrist joint - mechanical pivot with precise alignment */}
              <group position={[-DROID_SPECS.ARM_LENGTH * 0.3, 0, 0]}>
                {/* Wrist main joint */}
                <mesh rotation={[Math.PI * 0.5, 0, 0]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.07, 16]} />
                  <primitive object={materials.joint} />
                </mesh>
                
                {/* Wrist connector pieces */}
                <mesh position={[-0.01, 0, 0]}>
                  <boxGeometry args={[0.04, 0.05, 0.06]} />
                  <primitive object={materials.joint} />
                </mesh>
              </group>
              
              {/* Hand - improved with mechanical details and proper connections */}
              <group position={[-DROID_SPECS.ARM_LENGTH * 0.35, 0, 0]}>
                {/* Palm base - no gaps with wrist joint */}
                <mesh position={[-0.025, 0, 0]}>
                  <boxGeometry args={[0.05, 0.07, 0.035]} />
                  <primitive object={materials.matte} />
                </mesh>
                
                {/* Palm mech details - recessed panel */}
                <mesh position={[-0.025, 0, 0.019]}>
                  <boxGeometry args={[0.03, 0.06, 0.002]} />
                  <primitive object={materials.carbon} />
                </mesh>
                
                {/* Palm tech details - inner workings */}
                <mesh position={[-0.025, 0, 0.02]}>
                  <boxGeometry args={[0.028, 0.058, 0.001]} />
                  <primitive object={materials.joint} />
                </mesh>
                
                {/* Articulated Fingers - with joints and seamless connections */}
                {[-0.03, -0.01, 0.01, 0.03].map((y, i) => (
                  <group key={`left-finger-${i}`} position={[-0.055, y, 0]}>
                    {/* Finger base joint - precision connection */}
                    <mesh position={[0, 0, 0]}>
                      <sphereGeometry args={[0.008, 12, 12]} />
                      <primitive object={materials.joint} />
                    </mesh>
                    
                    {/* Finger segments - proximal with mechanical detailing */}
                    <mesh position={[-0.015, 0, 0]} rotation={[0, 0, -i * 0.08]}>
                      <capsuleGeometry args={[0.007, 0.022, 6, 12]} />
                      <primitive object={materials.matte} />
                    </mesh>
                    
                    {/* Finger middle joint - enhanced articulation */}
                    <mesh position={[-0.03, 0, 0]}>
                      <sphereGeometry args={[0.006, 12, 12]} />
                      <primitive object={materials.joint} />
                    </mesh>
                    
                    {/* Finger segments - distal with precise mechanical alignment */}
                    <mesh position={[-0.045, 0, 0]} rotation={[0, 0, -i * 0.12]}>
                      <capsuleGeometry args={[0.005, 0.02, 6, 12]} />
                      <primitive object={materials.matte} />
                    </mesh>
                    
                    {/* Fingertip */}
                    <mesh position={[-0.058, 0, 0]}>
                      <sphereGeometry args={[0.006, 8, 8]} />
                      <meshStandardMaterial {...createJointMaterial()} />
                    </mesh>
                  </group>
                ))}
                
                {/* Thumb - with proper joints */}
                <group position={[-0.04, 0.04, 0]} rotation={[0, 0, -0.6]}>
                  {/* Thumb base */}
                  <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.009, 8, 8]} />
                    <meshStandardMaterial {...createJointMaterial()} />
                  </mesh>
                  
                  {/* Thumb proximal */}
                  <mesh position={[-0.015, 0, 0]}>
                    <capsuleGeometry args={[0.008, 0.02, 4, 8]} />
                    <meshStandardMaterial {...createMatteMaterial()} />
                  </mesh>
                  
                  {/* Thumb joint */}
                  <mesh position={[-0.03, 0, 0]}>
                    <sphereGeometry args={[0.007, 8, 8]} />
                    <meshStandardMaterial {...createJointMaterial()} />
                  </mesh>
                  
                  {/* Thumb distal */}
                  <mesh position={[-0.045, 0, 0]} rotation={[0, 0, -0.3]}>
                    <capsuleGeometry args={[0.006, 0.02, 4, 8]} />
                    <meshStandardMaterial {...createMatteMaterial()} />
                  </mesh>
                  
                  {/* Thumb tip */}
                  <mesh position={[-0.058, 0, 0]}>
                    <sphereGeometry args={[0.006, 8, 8]} />
                    <meshStandardMaterial {...createJointMaterial()} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>
        
        {/* Right arm assembly - mirrored with proper socket connection */}
        <group 
          ref={rightArmRef}
          position={[DROID_SPECS.SHOULDER_WIDTH * 0.5, DROID_SPECS.TORSO_HEIGHT, 0]}
          rotation={[0, 0, 0]} // T-pose for animation export
        >
          {/* Improved shoulder connector to torso - eliminates gap completely */}
          <group>
            {/* Main structural connector */}
            <mesh position={[-0.04, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.16, 16]} />
              <primitive object={materials.joint} />
            </mesh>
            
            {/* Additional shoulder connector reinforcement */}
            <mesh position={[-0.06, 0, 0]}>
              <boxGeometry args={[0.04, 0.12, 0.12]} />
              <primitive object={materials.steel} />
            </mesh>
          </group>
          
          {/* Shoulder socket connection to torso - FIXED FLOATING GAP */}
          <group>
            {/* Torso side connection socket - recessed into torso */}
            <mesh position={[-0.04, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
              <primitive object={materials.matte} />
            </mesh>
            
            {/* Socket interior */}
            <mesh position={[-0.035, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.04, 16]} />
              <primitive object={materials.joint} />
            </mesh>
            
            {/* Primary shoulder joint - properly centered for bone pivot */}
            <mesh>
              <sphereGeometry args={[DROID_SPECS.MAJOR_JOINT_RADIUS, 24, 24]} />
              <primitive object={materials.joint} />
            </mesh>
            
            {/* Shoulder armor plate with proper bone alignment */}
            <mesh position={[0.02, 0.02, 0]}>
              <boxGeometry args={[0.08, 0.12, 0.08]} />
              <primitive object={materials.matte} />
            </mesh>
            
            {/* Shoulder hydraulic connections - aligned to anatomically correct rotation */}
            <mesh position={[0, 0.05, 0.06]} rotation={[Math.PI * 0.25, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />
              <meshStandardMaterial {...createSteelMaterial()} />
            </mesh>
            
            {/* Cable and mechanical connectors at joint */}
            {[0, 1, 2].map((i) => (
              <mesh 
                key={`right-shoulder-cable-${i}`}
                position={[-0.01, 0.02, -0.05 + i * 0.02]} 
                rotation={[0, -Math.PI * 0.35, -Math.PI * 0.15]}
              >
                <cylinderGeometry args={[0.005, 0.005, 0.1, 6]} />
                <meshStandardMaterial {...createJointMaterial()} />
              </mesh>
            ))}
            
            {/* Shoulder joint piston */}
            <mesh position={[0, 0.08, 0.03]}>
              <boxGeometry args={[0.03, 0.02, 0.06]} />
              <meshStandardMaterial {...createJointMaterial()} />
            </mesh>
            
            {/* Embedded glow - recessed as specified in polish */}
            {showGlow && (
              <mesh position={[0.02, 0.02, 0.045]}>
                <boxGeometry args={[0.04, 0.01, 0.01]} />
                <meshStandardMaterial {...createGlowMaterial()} />
              </mesh>
            )}
          </group>
          
          {/* Upper arm - exactly scaled to spec */}
          <group position={[DROID_SPECS.ARM_LENGTH * 0.25, 0, 0]}>
            {/* Base connector to shoulder joint */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.05, 0.04, 16]} />
              <meshStandardMaterial {...createJointMaterial()} />
            </mesh>
            
            {/* Upper arm structure - segmented armor plating */}
            <group position={[DROID_SPECS.ARM_LENGTH * 0.2, 0, 0]}>
              {/* Main arm structure */}
              <mesh rotation={[0, 0, Math.PI * 0.5]}>
                <capsuleGeometry args={[0.05, DROID_SPECS.ARM_LENGTH * 0.4, 12, 18]} />
                <meshStandardMaterial {...createMatteMaterial()} />
              </mesh>
              
              {/* Armor segments - adding beveled plates */}
              {[-0.15, -0.05, 0.05, 0.15].map((x, i) => (
                <mesh 
                  key={`right-arm-plate-${i}`}
                  position={[x, 0, 0]} 
                  rotation={[0, 0, Math.PI * 0.5]}
                >
                  <torusGeometry args={[0.055, 0.008, 16, 6, Math.PI * 1.2]} />
                  <meshStandardMaterial {...createSteelMaterial()} />
                </mesh>
              ))}
              
              {/* Upper arm glow strip - specified in refinement */}
              {showGlow && (
                <mesh ref={rightArmGlowRef} position={[DROID_SPECS.ARM_LENGTH * 0.05, 0, 0.05]} rotation={[0, 0, Math.PI * 0.5]}>
                  <boxGeometry args={[0.15, 0.01, 0.01]} />
                  <meshStandardMaterial {...createGlowMaterial(2.2)} />
                </mesh>
              )}
            </group>
            
            {/* Elbow joint - mechanical hinge design as specified */}
            <group position={[DROID_SPECS.ARM_LENGTH * 0.4, 0, 0]}>
              {/* Main elbow hinge */}
              <mesh rotation={[Math.PI * 0.5, 0, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.08, 16]} />
                <meshStandardMaterial {...createJointMaterial()} />
              </mesh>
              
              {/* Elbow joint caps */}
              {[-1, 1].map((side) => (
                <mesh 
                  key={`right-elbow-cap-${side}`}
                  position={[0, 0, side * 0.045]} 
                  rotation={[Math.PI * 0.5, 0, 0]}
                >
                  <cylinderGeometry args={[0.045, 0.035, 0.01, 16]} />
                  <meshStandardMaterial {...createSteelMaterial()} />
                </mesh>
              ))}
              
              {/* Elbow joint hydraulic */}
              <mesh position={[0, -0.06, 0]} rotation={[-Math.PI * 0.2, 0, 0]}>
                <cylinderGeometry args={[0.015, 0.018, 0.1, 8]} />
                <meshStandardMaterial {...createJointMaterial()} />
              </mesh>
            </group>
            
            {/* Forearm */}
            <group position={[DROID_SPECS.ARM_LENGTH * 0.4, 0, 0]}>
              {/* Forearm structure with beveled armor plating */}
              <group position={[DROID_SPECS.ARM_LENGTH * 0.15, 0, 0]}>
                {/* Main forearm cylinder */}
                <mesh rotation={[0, 0, Math.PI * 0.5]}>
                  <capsuleGeometry args={[0.04, DROID_SPECS.ARM_LENGTH * 0.25, 10, 16]} />
                  <meshStandardMaterial {...createMatteMaterial()} />
                </mesh>
                
                {/* Forearm glow strip */}
                {showGlow && (
                  <mesh position={[0, 0, 0.042]} rotation={[0, 0, Math.PI * 0.5]}>
                    <boxGeometry args={[0.2, 0.012, 0.005]} />
                    <meshStandardMaterial {...createGlowMaterial(2.0)} />
                  </mesh>
                )}
                
                {/* Forearm armor plates */}
                {[-0.1, 0, 0.1].map((x, i) => (
                  <mesh 
                    key={`right-forearm-plate-${i}`}
                    position={[x, 0, 0]} 
                    rotation={[0, 0, Math.PI * 0.5]}
                  >
                    <torusGeometry args={[0.045, 0.006, 16, 6, Math.PI * 1.0]} />
                    <meshStandardMaterial {...createSteelMaterial()} />
                  </mesh>
                ))}
              </group>
              
              {/* Wrist joint - mechanical pivot */}
              <group position={[DROID_SPECS.ARM_LENGTH * 0.3, 0, 0]}>
                {/* Wrist main joint */}
                <mesh rotation={[Math.PI * 0.5, 0, 0]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.07, 16]} />
                  <meshStandardMaterial {...createJointMaterial()} />
                </mesh>
                
                {/* Wrist connector pieces */}
                <mesh position={[0.01, 0, 0]}>
                  <boxGeometry args={[0.04, 0.05, 0.06]} />
                  <meshStandardMaterial {...createJointMaterial()} />
                </mesh>
              </group>
              
              {/* Hand - improved with mechanical details */}
              <group position={[DROID_SPECS.ARM_LENGTH * 0.35, 0, 0]}>
                {/* Palm base */}
                <mesh position={[0.025, 0, 0]}>
                  <boxGeometry args={[0.05, 0.07, 0.035]} />
                  <meshStandardMaterial {...createMatteMaterial()} />
                </mesh>
                
                {/* Palm mech details */}
                <mesh position={[0.025, 0, 0.02]}>
                  <boxGeometry args={[0.03, 0.06, 0.005]} />
                  <meshStandardMaterial {...createJointMaterial()} />
                </mesh>
                
                {/* Articulated Fingers - with joints */}
                {[-0.03, -0.01, 0.01, 0.03].map((y, i) => (
                  <group key={`right-finger-${i}`} position={[0.055, y, 0]}>
                    {/* Finger base joint */}
                    <mesh position={[0, 0, 0]}>
                      <sphereGeometry args={[0.008, 8, 8]} />
                      <meshStandardMaterial {...createJointMaterial()} />
                    </mesh>
                    
                    {/* Finger segments - proximal */}
                    <mesh position={[0.015, 0, 0]} rotation={[0, 0, i * 0.08]}>
                      <capsuleGeometry args={[0.007, 0.022, 4, 8]} />
                      <meshStandardMaterial {...createMatteMaterial()} />
                    </mesh>
                    
                    {/* Finger middle joint */}
                    <mesh position={[0.03, 0, 0]}>
                      <sphereGeometry args={[0.006, 8, 8]} />
                      <meshStandardMaterial {...createJointMaterial()} />
                    </mesh>
                    
                    {/* Finger segments - distal */}
                    <mesh position={[0.045, 0, 0]} rotation={[0, 0, i * 0.12]}>
                      <capsuleGeometry args={[0.005, 0.02, 4, 8]} />
                      <meshStandardMaterial {...createMatteMaterial()} />
                    </mesh>
                    
                    {/* Fingertip */}
                    <mesh position={[0.058, 0, 0]}>
                      <sphereGeometry args={[0.006, 8, 8]} />
                      <meshStandardMaterial {...createJointMaterial()} />
                    </mesh>
                  </group>
                ))}
                
                {/* Thumb - with proper joints */}
                <group position={[0.04, 0.04, 0]} rotation={[0, 0, 0.6]}>
                  {/* Thumb base */}
                  <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.009, 8, 8]} />
                    <meshStandardMaterial {...createJointMaterial()} />
                  </mesh>
                  
                  {/* Thumb proximal */}
                  <mesh position={[0.015, 0, 0]}>
                    <capsuleGeometry args={[0.008, 0.02, 4, 8]} />
                    <meshStandardMaterial {...createMatteMaterial()} />
                  </mesh>
                  
                  {/* Thumb joint */}
                  <mesh position={[0.03, 0, 0]}>
                    <sphereGeometry args={[0.007, 8, 8]} />
                    <meshStandardMaterial {...createJointMaterial()} />
                  </mesh>
                  
                  {/* Thumb distal */}
                  <mesh position={[0.045, 0, 0]} rotation={[0, 0, 0.3]}>
                    <capsuleGeometry args={[0.006, 0.02, 4, 8]} />
                    <meshStandardMaterial {...createMatteMaterial()} />
                  </mesh>
                  
                  {/* Thumb tip */}
                  <mesh position={[0.058, 0, 0]}>
                    <sphereGeometry args={[0.006, 8, 8]} />
                    <meshStandardMaterial {...createJointMaterial()} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>
        
        {/* PELVIS - redesigned with detailed armor segmentation and proper connection to torso */}
        <group position={[0, 0, 0]}>
          {/* Connection piece between torso and hip - eliminates gap */}
          <mesh position={[0, -DROID_SPECS.PELVIS_HEIGHT * 0.25, 0]}>
            <cylinderGeometry args={[DROID_SPECS.HIP_WIDTH * 0.3, DROID_SPECS.HIP_WIDTH * 0.32, 0.05, 16]} />
            <primitive object={materials.joint} />
          </mesh>
          
          {/* Hip assembly with mechanical details and armor plating */}
          <group position={[0, -DROID_SPECS.PELVIS_HEIGHT * 0.5, 0]}>
            {/* Main hip plate - central armor housing with precise T-pose alignment */}
            <mesh>
              <boxGeometry 
                args={[DROID_SPECS.HIP_WIDTH, DROID_SPECS.PELVIS_HEIGHT * 0.4, DROID_SPECS.CHEST_DEPTH * 0.8]} 
              />
              <primitive object={materials.matte} />
            </mesh>
            
            {/* Hip plate beveled edges - reinforced connection */}
            <mesh position={[0, -DROID_SPECS.PELVIS_HEIGHT * 0.15, DROID_SPECS.CHEST_DEPTH * 0.25]}>
              <boxGeometry 
                args={[DROID_SPECS.HIP_WIDTH * 0.95, DROID_SPECS.PELVIS_HEIGHT * 0.05, DROID_SPECS.CHEST_DEPTH * 0.2]} 
              />
              <primitive object={materials.steel} />
            </mesh>
            
            {/* Hip central detail with mechanical armoring */}
            <group position={[0, -DROID_SPECS.PELVIS_HEIGHT * 0.15, DROID_SPECS.CHEST_DEPTH * 0.4]}>
              {/* Recessed panel backing */}
              <mesh position={[0, 0, -0.005]}>
                <boxGeometry args={[DROID_SPECS.HIP_WIDTH * 0.52, DROID_SPECS.PELVIS_HEIGHT * 0.14, 0.01]} />
                <primitive object={materials.carbon} />
              </mesh>
              
              {/* Main panel */}
              <mesh>
                <boxGeometry args={[DROID_SPECS.HIP_WIDTH * 0.5, DROID_SPECS.PELVIS_HEIGHT * 0.12, 0.02]} />
                <primitive object={materials.joint} />
              </mesh>
              
              {/* Hip glow accent - recessed as specified */}
              {showGlow && (
                <>
                  {/* Recessed channel */}
                  <mesh position={[0, 0, 0.012]}>
                    <boxGeometry args={[DROID_SPECS.HIP_WIDTH * 0.32, 0.012, 0.005]} />
                    <primitive object={materials.carbon} />
                  </mesh>
                  
                  {/* Glow strip */}
                  <mesh position={[0, 0, 0.015]}>
                    <boxGeometry args={[DROID_SPECS.HIP_WIDTH * 0.3, 0.01, 0.005]} />
                    <primitive object={materials.glow} />
                  </mesh>
                </>
              )}
            </group>
            
            {/* Hip joint mechanical connections - left - enhanced with zero-gap connection */}
            <group position={[-DROID_SPECS.HIP_WIDTH * 0.4, -DROID_SPECS.PELVIS_HEIGHT * 0.2, 0]}>
              {/* Reinforced connection to main hip body - completely prevents any gaps */}
              <group>
                {/* Primary connector cylinder */}
                <mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI * 0.5]}>
                  <cylinderGeometry args={[0.05, 0.07, 0.08, 24]} />
                  <primitive object={materials.joint} />
                </mesh>
                
                {/* Additional reinforcement plate */}
                <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI * 0.5]}>
                  <boxGeometry args={[0.04, 0.12, 0.1]} />
                  <primitive object={materials.steel} />
                </mesh>
                
                {/* Filler piece to completely eliminate any gap */}
                <mesh position={[0.03, 0, 0]}>
                  <sphereGeometry args={[0.06, 16, 16]} />
                  <primitive object={materials.joint} />
                </mesh>
              </group>
              
              {/* Main hip ball joint - left side with precision mechanical design */}
              <mesh>
                <sphereGeometry args={[DROID_SPECS.MAJOR_JOINT_RADIUS, 24, 24]} />
                <primitive object={materials.joint} />
              </mesh>
              
              {/* Hip joint armor plate - left */}
              <mesh position={[0, 0, 0.06]} rotation={[0.2, 0, 0]}>
                <boxGeometry args={[0.12, 0.12, 0.04]} />
                <primitive object={materials.matte} />
              </mesh>
              
              {/* Hip mechanical details - left - reinforced pistons */}
              {[0, 1, 2].map((i) => (
                <mesh 
                  key={`left-hip-detail-${i}`} 
                  position={[0, 0.05 - i * 0.04, -0.05]}
                  rotation={[Math.PI * 0.1, 0, 0]}
                >
                  <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
                  <primitive object={materials.steel} />
                </mesh>
              ))}
            </group>
            
            {/* Hip joint mechanical connections - right - perfectly mirrored from left */}
            <group position={[DROID_SPECS.HIP_WIDTH * 0.4, -DROID_SPECS.PELVIS_HEIGHT * 0.2, 0]}>
              {/* Reinforced connection to main hip body - completely prevents any gaps */}
              <group>
                {/* Primary connector cylinder */}
                <mesh position={[-0.02, 0, 0]} rotation={[0, 0, Math.PI * 0.5]}>
                  <cylinderGeometry args={[0.05, 0.07, 0.08, 24]} />
                  <primitive object={materials.joint} />
                </mesh>
                
                {/* Additional reinforcement plate */}
                <mesh position={[-0.05, 0, 0]} rotation={[0, 0, Math.PI * 0.5]}>
                  <boxGeometry args={[0.04, 0.12, 0.1]} />
                  <primitive object={materials.steel} />
                </mesh>
                
                {/* Filler piece to completely eliminate any gap */}
                <mesh position={[-0.03, 0, 0]}>
                  <sphereGeometry args={[0.06, 16, 16]} />
                  <primitive object={materials.joint} />
                </mesh>
              </group>
              
              {/* Main hip ball joint - right side with precision mechanical design */}
              <mesh>
                <sphereGeometry args={[DROID_SPECS.MAJOR_JOINT_RADIUS, 24, 24]} />
                <primitive object={materials.joint} />
              </mesh>
              
              {/* Hip joint armor plate - right */}
              <mesh position={[0, 0, 0.06]} rotation={[0.2, 0, 0]}>
                <boxGeometry args={[0.12, 0.12, 0.04]} />
                <primitive object={materials.matte} />
              </mesh>
              
              {/* Hip mechanical details - right - reinforced pistons */}
              {[0, 1, 2].map((i) => (
                <mesh 
                  key={`right-hip-detail-${i}`} 
                  position={[0, 0.05 - i * 0.04, -0.05]}
                  rotation={[Math.PI * 0.1, 0, 0]}
                >
                  <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
                  <primitive object={materials.steel} />
                </mesh>
              ))}
            </group>
          </group>
        </group>
        
        {/* LEFT LEG assembly - properly connected at hip socket with leg center axis alignment */}
        <group 
          ref={leftLegRef}
          position={[-DROID_SPECS.HIP_WIDTH * 0.4, -DROID_SPECS.PELVIS_HEIGHT * 0.7, 0]}
          // No rotation for clean T-pose for animation export
        >
          {/* Enhanced hip-to-leg connector assembly - completely eliminates any possible gap */}
          <group>
            {/* Primary structural connector */}
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.12, 24]} />
              <primitive object={materials.joint} />
            </mesh>
            
            {/* Upper connection reinforcement */}
            <mesh position={[0, 0.08, 0]} rotation={[0, 0, 0]}>
              <sphereGeometry args={[0.085, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
              <primitive object={materials.joint} />
            </mesh>
            
            {/* Lower connection reinforcement - wider to ensure complete coverage */}
            <mesh position={[0, 0.01, 0]}>
              <cylinderGeometry args={[0.09, 0.075, 0.04, 24]} />
              <primitive object={materials.steel} />
            </mesh>
            
            {/* Additional support brackets - creates a cross-reinforced connection */}
            <group>
              <mesh position={[0, 0.05, 0.05]} rotation={[Math.PI/2 - 0.3, 0, 0]}>
                <boxGeometry args={[0.06, 0.04, 0.1]} />
                <primitive object={materials.steel} />
              </mesh>
              
              <mesh position={[0, 0.05, -0.05]} rotation={[-Math.PI/2 + 0.3, 0, 0]}>
                <boxGeometry args={[0.06, 0.04, 0.1]} />
                <primitive object={materials.steel} />
              </mesh>
            </group>
          </group>
          
          {/* Thigh - upper half of 0.586m leg length */}
          <group>
            {/* Thigh base structure */}
            <group position={[0, -DROID_SPECS.LEG_LENGTH * 0.2, 0]}>
              {/* Main thigh structure - armor plated */}
              <mesh>
                <capsuleGeometry args={[0.075, DROID_SPECS.LEG_LENGTH * 0.35, 12, 18]} />
                <primitive object={materials.matte} />
              </mesh>
              
              {/* Thigh armor plating segments */}
              {[-0.15, -0.05, 0.05, 0.15].map((y, i) => (
                <mesh 
                  key={`left-thigh-plate-${i}`} 
                  position={[0, y, 0]}
                  rotation={[0, Math.PI/4 * i, 0]}
                >
                  <torusGeometry args={[0.078, 0.01, 16, 8, Math.PI * 1.2]} />
                  <primitive object={materials.steel} />
                </mesh>
              ))}
              
              {/* Thigh side detail plates */}
              <mesh position={[0.06, 0, 0]} rotation={[0, Math.PI/2, 0]}>
                <boxGeometry args={[0.22, 0.05, 0.025]} />
                <primitive object={materials.joint} />
              </mesh>
              
              {/* Thigh glow strip as specified in refinement */}
              {showGlow && (
                <mesh ref={leftLegGlowRef} position={[0.065, 0, 0]} rotation={[0, Math.PI/2, 0]}>
                  <boxGeometry args={[0.15, 0.01, 0.01]} />
                  <primitive object={materials.brightGlow} />
                </mesh>
              )}
            </group>
            
            {/* Knee joint - mechanical hinge design per specification */}
            <group position={[0, -DROID_SPECS.LEG_LENGTH * 0.35, 0]}>
              {/* Knee joint primary structure */}
              <mesh rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.04, 0.04, 0.09, 16]} />
                <meshStandardMaterial {...createJointMaterial()} />
              </mesh>
              
              {/* Knee caps */}
              {[-1, 1].map((side) => (
                <mesh 
                  key={`left-knee-cap-${side}`} 
                  position={[side * 0.05, 0, 0]} 
                  rotation={[0, 0, Math.PI/2]}
                >
                  <cylinderGeometry args={[0.05, 0.04, 0.01, 16]} />
                  <meshStandardMaterial {...createSteelMaterial()} />
                </mesh>
              ))}
              
              {/* Knee armor plate */}
              <mesh position={[0, 0, 0.05]}>
                <boxGeometry args={[0.1, 0.08, 0.03]} />
                <meshStandardMaterial {...createMatteMaterial()} />
              </mesh>
              
              {/* Knee hydraulic pistons */}
              {[-0.03, 0.03].map((x, i) => (
                <group key={`left-knee-piston-${i}`} position={[x, 0, -0.06]}>
                  <mesh rotation={[Math.PI * 0.05, 0, 0]}>
                    <cylinderGeometry args={[0.012, 0.012, 0.1, 8]} />
                    <meshStandardMaterial {...createJointMaterial()} />
                  </mesh>
                  
                  <mesh position={[0, -0.06, 0]}>
                    <sphereGeometry args={[0.015, 10, 10]} />
                    <meshStandardMaterial {...createSteelMaterial()} />
                  </mesh>
                </group>
              ))}
            </group>
            
            {/* Shin structure - lower half of 0.586m leg length */}
            <group position={[0, -DROID_SPECS.LEG_LENGTH * 0.35, 0]}>
              {/* Main shin column */}
              <group position={[0, -DROID_SPECS.LEG_LENGTH * 0.175, 0]}>
                {/* Shin primary structure */}
                <mesh>
                  <capsuleGeometry args={[0.06, DROID_SPECS.LEG_LENGTH * 0.25, 12, 16]} />
                  <meshStandardMaterial {...createMatteMaterial()} />
                </mesh>
                
                {/* Shin armor plates */}
                {[-0.1, 0, 0.1].map((y, i) => (
                  <mesh 
                    key={`left-shin-plate-${i}`} 
                    position={[0, y, 0]}
                    rotation={[0, -Math.PI/6 * i, 0]}
                  >
                    <torusGeometry args={[0.062, 0.008, 16, 6, Math.PI * 1.4]} />
                    <meshStandardMaterial {...createSteelMaterial()} />
                  </mesh>
                ))}
                
                {/* Shin front armor plate */}
                <mesh position={[0, 0, 0.05]} rotation={[0.1, 0, 0]}>
                  <boxGeometry args={[0.08, 0.22, 0.035]} />
                  <meshStandardMaterial {...createMatteMaterial()} />
                </mesh>
                
                {/* Shin glow strip as specified */}
                {showGlow && (
                  <mesh position={[0, 0, 0.07]} rotation={[0.1, 0, 0]}>
                    <boxGeometry args={[0.04, 0.15, 0.01]} />
                    <meshStandardMaterial {...createGlowMaterial(2.0)} />
                  </mesh>
                )}
              </group>
              
              {/* Ankle joint - mechanical design as specified */}
              <group position={[0, -DROID_SPECS.LEG_LENGTH * 0.35, 0.02]}>
                {/* Ankle ball joint */}
                <mesh>
                  <sphereGeometry args={[0.05, 16, 16]} />
                  <meshStandardMaterial {...createJointMaterial()} />
                </mesh>
                
                {/* Ankle connection plates */}
                <mesh position={[0, 0, 0.04]} rotation={[0.2, 0, 0]}>
                  <boxGeometry args={[0.08, 0.06, 0.02]} />
                  <meshStandardMaterial {...createSteelMaterial()} />
                </mesh>
              </group>
              
              {/* Foot - exactly 0.092m in height as specified */}
              <group position={[0, -DROID_SPECS.LEG_LENGTH * 0.43, 0.1]}>
                {/* Foot base structure - sits flush with ground */}
                <mesh position={[0, -DROID_SPECS.FOOT_HEIGHT * 0.25, 0]}>
                  <boxGeometry 
                    args={[0.1, DROID_SPECS.FOOT_HEIGHT * 0.5, DROID_SPECS.FOOT_HEIGHT * 2]} 
                  />
                  <meshStandardMaterial {...createMatteMaterial()} />
                </mesh>
                
                {/* Foot armor details */}
                <mesh 
                  position={[0, -DROID_SPECS.FOOT_HEIGHT * 0.15, DROID_SPECS.FOOT_HEIGHT * 0.2]} 
                  rotation={[0.15, 0, 0]}
                >
                  <boxGeometry 
                    args={[0.09, DROID_SPECS.FOOT_HEIGHT * 0.2, 0.025]} 
                  />
                  <meshStandardMaterial {...createSteelMaterial()} />
                </mesh>
                
                {/* Foot toe split design */}
                <group position={[0, -DROID_SPECS.FOOT_HEIGHT * 0.25, DROID_SPECS.FOOT_HEIGHT * 0.8]}>
                  {/* Toe separation */}
                  <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[0.005, DROID_SPECS.FOOT_HEIGHT * 0.4, DROID_SPECS.FOOT_HEIGHT * 0.4]} />
                    <meshStandardMaterial {...createJointMaterial()} />
                  </mesh>
                  
                  {/* Left toe */}
                  <mesh position={[-0.05, 0, 0]}>
                    <boxGeometry args={[0.09, DROID_SPECS.FOOT_HEIGHT * 0.4, DROID_SPECS.FOOT_HEIGHT * 0.6]} />
                    <meshStandardMaterial {...createMatteMaterial()} />
                  </mesh>
                  
                  {/* Right toe */}
                  <mesh position={[0.05, 0, 0]}>
                    <boxGeometry args={[0.09, DROID_SPECS.FOOT_HEIGHT * 0.4, DROID_SPECS.FOOT_HEIGHT * 0.6]} />
                    <meshStandardMaterial {...createMatteMaterial()} />
                  </mesh>
                </group>
                
                {/* Foot glow accent */}
                {showGlow && (
                  <mesh position={[0, -DROID_SPECS.FOOT_HEIGHT * 0.45, DROID_SPECS.FOOT_HEIGHT * 0.6]}>
                    <boxGeometry args={[0.1, 0.01, 0.02]} />
                    <meshStandardMaterial {...createGlowMaterial(1.5)} />
                  </mesh>
                )}
              </group>
            </group>
          </group>
        </group>
        
        {/* RIGHT LEG assembly - properly connected with aligned bone pivots */}
        <group 
          ref={rightLegRef}
          position={[DROID_SPECS.HIP_WIDTH * 0.4, -DROID_SPECS.PELVIS_HEIGHT * 0.7, 0]}
          // Precise T-pose for animation export
        >
          {/* Enhanced hip-to-leg connector assembly - completely eliminates any possible gap */}
          <group>
            {/* Primary structural connector */}
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.12, 24]} />
              <primitive object={materials.joint} />
            </mesh>
            
            {/* Upper connection reinforcement */}
            <mesh position={[0, 0.08, 0]} rotation={[0, 0, 0]}>
              <sphereGeometry args={[0.085, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
              <primitive object={materials.joint} />
            </mesh>
            
            {/* Lower connection reinforcement - wider to ensure complete coverage */}
            <mesh position={[0, 0.01, 0]}>
              <cylinderGeometry args={[0.09, 0.075, 0.04, 24]} />
              <primitive object={materials.steel} />
            </mesh>
            
            {/* Additional support brackets - creates a cross-reinforced connection */}
            <group>
              <mesh position={[0, 0.05, 0.05]} rotation={[Math.PI/2 - 0.3, 0, 0]}>
                <boxGeometry args={[0.06, 0.04, 0.1]} />
                <primitive object={materials.steel} />
              </mesh>
              
              <mesh position={[0, 0.05, -0.05]} rotation={[-Math.PI/2 + 0.3, 0, 0]}>
                <boxGeometry args={[0.06, 0.04, 0.1]} />
                <primitive object={materials.steel} />
              </mesh>
            </group>
          </group>
          
          {/* Thigh - upper half of 0.586m leg length */}
          <group>
            {/* Thigh base structure */}
            <group position={[0, -DROID_SPECS.LEG_LENGTH * 0.2, 0]}>
              {/* Main thigh structure - armor plated */}
              <mesh>
                <capsuleGeometry args={[0.075, DROID_SPECS.LEG_LENGTH * 0.35, 12, 18]} />
                <primitive object={materials.matte} />
              </mesh>
              
              {/* Thigh armor plating segments */}
              {[-0.15, -0.05, 0.05, 0.15].map((y, i) => (
                <mesh 
                  key={`right-thigh-plate-${i}`} 
                  position={[0, y, 0]}
                  rotation={[0, -Math.PI/4 * i, 0]}
                >
                  <torusGeometry args={[0.078, 0.01, 16, 8, Math.PI * 1.2]} />
                  <primitive object={materials.steel} />
                </mesh>
              ))}
              
              {/* Thigh side detail plates */}
              <mesh position={[-0.06, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
                <boxGeometry args={[0.22, 0.05, 0.025]} />
                <primitive object={materials.joint} />
              </mesh>
              
              {/* Thigh glow strip as specified in refinement */}
              {showGlow && (
                <mesh ref={rightLegGlowRef} position={[-0.065, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
                  <boxGeometry args={[0.15, 0.01, 0.01]} />
                  <primitive object={materials.brightGlow} />
                </mesh>
              )}
            </group>
            
            {/* Knee joint - mechanical hinge design per specification */}
            <group position={[0, -DROID_SPECS.LEG_LENGTH * 0.35, 0]}>
              {/* Knee joint primary structure */}
              <mesh rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.04, 0.04, 0.09, 16]} />
                <meshStandardMaterial {...createJointMaterial()} />
              </mesh>
              
              {/* Knee caps */}
              {[-1, 1].map((side) => (
                <mesh 
                  key={`right-knee-cap-${side}`} 
                  position={[side * 0.05, 0, 0]} 
                  rotation={[0, 0, Math.PI/2]}
                >
                  <cylinderGeometry args={[0.05, 0.04, 0.01, 16]} />
                  <meshStandardMaterial {...createSteelMaterial()} />
                </mesh>
              ))}
              
              {/* Knee armor plate */}
              <mesh position={[0, 0, 0.05]}>
                <boxGeometry args={[0.1, 0.08, 0.03]} />
                <meshStandardMaterial {...createMatteMaterial()} />
              </mesh>
              
              {/* Knee hydraulic pistons */}
              {[-0.03, 0.03].map((x, i) => (
                <group key={`right-knee-piston-${i}`} position={[x, 0, -0.06]}>
                  <mesh rotation={[Math.PI * 0.05, 0, 0]}>
                    <cylinderGeometry args={[0.012, 0.012, 0.1, 8]} />
                    <meshStandardMaterial {...createJointMaterial()} />
                  </mesh>
                  
                  <mesh position={[0, -0.06, 0]}>
                    <sphereGeometry args={[0.015, 10, 10]} />
                    <meshStandardMaterial {...createSteelMaterial()} />
                  </mesh>
                </group>
              ))}
            </group>
            
            {/* Shin structure - lower half of 0.586m leg length */}
            <group position={[0, -DROID_SPECS.LEG_LENGTH * 0.35, 0]}>
              {/* Main shin column */}
              <group position={[0, -DROID_SPECS.LEG_LENGTH * 0.175, 0]}>
                {/* Shin primary structure */}
                <mesh>
                  <capsuleGeometry args={[0.06, DROID_SPECS.LEG_LENGTH * 0.25, 12, 16]} />
                  <meshStandardMaterial {...createMatteMaterial()} />
                </mesh>
                
                {/* Shin armor plates */}
                {[-0.1, 0, 0.1].map((y, i) => (
                  <mesh 
                    key={`right-shin-plate-${i}`} 
                    position={[0, y, 0]}
                    rotation={[0, Math.PI/6 * i, 0]}
                  >
                    <torusGeometry args={[0.062, 0.008, 16, 6, Math.PI * 1.4]} />
                    <meshStandardMaterial {...createSteelMaterial()} />
                  </mesh>
                ))}
                
                {/* Shin front armor plate */}
                <mesh position={[0, 0, 0.05]} rotation={[0.1, 0, 0]}>
                  <boxGeometry args={[0.08, 0.22, 0.035]} />
                  <meshStandardMaterial {...createMatteMaterial()} />
                </mesh>
                
                {/* Shin glow strip as specified */}
                {showGlow && (
                  <mesh position={[0, 0, 0.07]} rotation={[0.1, 0, 0]}>
                    <boxGeometry args={[0.04, 0.15, 0.01]} />
                    <meshStandardMaterial {...createGlowMaterial(2.0)} />
                  </mesh>
                )}
              </group>
              
              {/* Ankle joint - mechanical design as specified */}
              <group position={[0, -DROID_SPECS.LEG_LENGTH * 0.35, 0.02]}>
                {/* Ankle ball joint */}
                <mesh>
                  <sphereGeometry args={[0.05, 16, 16]} />
                  <meshStandardMaterial {...createJointMaterial()} />
                </mesh>
                
                {/* Ankle connection plates */}
                <mesh position={[0, 0, 0.04]} rotation={[0.2, 0, 0]}>
                  <boxGeometry args={[0.08, 0.06, 0.02]} />
                  <meshStandardMaterial {...createSteelMaterial()} />
                </mesh>
              </group>
              
              {/* Foot - exactly 0.092m in height as specified */}
              <group position={[0, -DROID_SPECS.LEG_LENGTH * 0.43, 0.1]}>
                {/* Foot base structure - sits flush with ground */}
                <mesh position={[0, -DROID_SPECS.FOOT_HEIGHT * 0.25, 0]}>
                  <boxGeometry 
                    args={[0.1, DROID_SPECS.FOOT_HEIGHT * 0.5, DROID_SPECS.FOOT_HEIGHT * 2]} 
                  />
                  <meshStandardMaterial {...createMatteMaterial()} />
                </mesh>
                
                {/* Foot armor details */}
                <mesh 
                  position={[0, -DROID_SPECS.FOOT_HEIGHT * 0.15, DROID_SPECS.FOOT_HEIGHT * 0.2]} 
                  rotation={[0.15, 0, 0]}
                >
                  <boxGeometry 
                    args={[0.09, DROID_SPECS.FOOT_HEIGHT * 0.2, 0.025]} 
                  />
                  <meshStandardMaterial {...createSteelMaterial()} />
                </mesh>
                
                {/* Foot toe split design */}
                <group position={[0, -DROID_SPECS.FOOT_HEIGHT * 0.25, DROID_SPECS.FOOT_HEIGHT * 0.8]}>
                  {/* Toe separation */}
                  <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[0.005, DROID_SPECS.FOOT_HEIGHT * 0.4, DROID_SPECS.FOOT_HEIGHT * 0.4]} />
                    <meshStandardMaterial {...createJointMaterial()} />
                  </mesh>
                  
                  {/* Left toe */}
                  <mesh position={[-0.05, 0, 0]}>
                    <boxGeometry args={[0.09, DROID_SPECS.FOOT_HEIGHT * 0.4, DROID_SPECS.FOOT_HEIGHT * 0.6]} />
                    <meshStandardMaterial {...createMatteMaterial()} />
                  </mesh>
                  
                  {/* Right toe */}
                  <mesh position={[0.05, 0, 0]}>
                    <boxGeometry args={[0.09, DROID_SPECS.FOOT_HEIGHT * 0.4, DROID_SPECS.FOOT_HEIGHT * 0.6]} />
                    <meshStandardMaterial {...createMatteMaterial()} />
                  </mesh>
                </group>
                
                {/* Foot glow accent */}
                {showGlow && (
                  <mesh position={[0, -DROID_SPECS.FOOT_HEIGHT * 0.45, DROID_SPECS.FOOT_HEIGHT * 0.6]}>
                    <boxGeometry args={[0.1, 0.01, 0.02]} />
                    <meshStandardMaterial {...createGlowMaterial(1.5)} />
                  </mesh>
                )}
              </group>
            </group>
          </group>
        </group>
      </group>
      
      {/* Optional orbit controls if interactive */}
      {interactive && <OrbitControls enablePan enableZoom enableRotate />}
    </group>
  );
};

export default UnifiedDroidModel;