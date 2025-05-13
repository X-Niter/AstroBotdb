'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
  useAnimations,
  useGLTF,
  MeshReflectorMaterial,
  Html,
  Text,
  Loader
} from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping, Noise } from '@react-three/postprocessing';
import { BlendFunction, Resizer, KernelSize } from 'postprocessing';
import * as THREE from 'three';
import { EmotionalState, ParticleDisplay } from '../utils/types';
import ThreeJsErrorBoundary from './three-js-error-boundary';

// We'll be using a built-in model until a proper GLTF/FBX model is available
// The ideal approach would be to use a high-quality 3D model that matches the reference images
const useBasicGLTF = true; // Always use our built-in model for now

// A highly detailed sci-fi humanoid robot based on the reference images
// This creates a robot that resembles the provided reference as closely as possible
const PlaceholderRobot = ({ emotionalState }: { emotionalState: EmotionalState }) => {
  // Create a reference to the group that will hold our robot
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const eyeRef = useRef<THREE.Mesh>(null);
  const chestRef = useRef<THREE.Group>(null);

  // Animation timing with more realistic movements
  useFrame(({ clock }) => {
    if (!groupRef.current || !headRef.current || !eyeRef.current || !chestRef.current) return;
    
    const t = clock.getElapsedTime();
    
    // Subtle breathing animation
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.02;
    
    // Very slight body swaying
    groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.03;
    
    // Head scanning motion (occasional)
    if (Math.sin(t * 0.1) > 0.9) {
      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y,
        Math.sin(t * 0.3) * 0.2,
        0.01
      );
    } else {
      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y,
        0,
        0.01
      );
    }
    
    // Eye glow pulsing
    if (eyeRef.current.material instanceof THREE.MeshStandardMaterial) {
      eyeRef.current.material.emissiveIntensity = 1 + Math.sin(t * 2) * 0.2;
    }
    
    // Chest "breathing" motion
    chestRef.current.scale.z = 1 + Math.sin(t * 0.5) * 0.02;
    chestRef.current.scale.x = 1 + Math.sin(t * 0.5) * 0.01;
  });

  // Get emotional state color based on the reference image's blue accents
  const getEmotionColor = () => {
    switch (emotionalState) {
      case 'happy': return new THREE.Color(0x00e5ff); // Bright cyan blue
      case 'alert': return new THREE.Color(0xff3300); // Alert red
      case 'sad': return new THREE.Color(0x0066ff);   // Deep blue
      case 'thinking': return new THREE.Color(0x7b68ee); // Purple-blue
      case 'confused': return new THREE.Color(0xffaa00); // Amber
      default: return new THREE.Color(0x00aaff);      // Standard blue glow
    }
  };

  const emotionColor = getEmotionColor();

  // Refined material properties to match the reference image exactly
  const whiteMetal = {
    color: '#e8edef', // Slightly blueish white for the armor plating
    metalness: 0.85,
    roughness: 0.15,
    envMapIntensity: 1.2,
    clearcoat: 0.5, // Subtle clearcoat for a premium finish
    clearcoatRoughness: 0.2
  };
  
  const darkMetal = {
    color: '#1a1e21', // Dark gunmetal for joints and details
    metalness: 0.9,
    roughness: 0.25
  };
  
  const darkJoints = {
    color: '#111518', // Even darker for internal mechanisms
    metalness: 0.9,
    roughness: 0.4
  };
  
  const glowMaterial = {
    color: '#ffffff',
    emissive: emotionColor,
    emissiveIntensity: 2.0, // Brighter glow
    metalness: 0.5,
    roughness: 0.2
  };
  
  // Secondary armor color for two-tone effect
  const secondaryMetal = {
    color: '#d5d9db', // Slightly darker than primary white
    metalness: 0.8,
    roughness: 0.2
  };

  return (
    <group ref={groupRef}>
      {/* ===== HEAD ===== */}
      <group ref={headRef} position={[0, 1.65, 0]}>
        {/* Main head base - more accurate to reference image with elongated top */}
        <mesh castShadow>
          <cylinderGeometry args={[0.14, 0.16, 0.32, 16]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Top head design - the distinctive elongated top from reference */}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.07, 0.14, 0.16, 16]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Head side armor plates */}
        <mesh position={[0.14, 0, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.04, 0.28, 0.22]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        <mesh position={[-0.14, 0, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.04, 0.28, 0.22]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Face plate - tapered like the reference image */}
        <mesh position={[0, 0, 0.12]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.24, 0.2, 0.12]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Face secondary plates and detail */}
        <mesh position={[0, 0.06, 0.17]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.22, 0.06, 0.06]} />
          <meshStandardMaterial {...secondaryMetal} />
        </mesh>
        
        <mesh position={[0, -0.06, 0.17]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.22, 0.06, 0.06]} />
          <meshStandardMaterial {...secondaryMetal} />
        </mesh>
        
        {/* Main eye/optical sensor (circular blue element from reference) */}
        <mesh ref={eyeRef} position={[0.09, 0.03, 0.18]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.05, 16]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
        
        {/* Secondary optical sensor */}
        <mesh position={[-0.09, 0.03, 0.18]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.05, 16]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
        
        {/* Lens detail rings */}
        <mesh position={[0.09, 0.03, 0.2]}>
          <torusGeometry args={[0.045, 0.008, 16, 32]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        <mesh position={[-0.09, 0.03, 0.2]}>
          <torusGeometry args={[0.035, 0.008, 16, 32]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Seams and panel lines for intricate detail */}
        {[
          [0, 0.12, 0.15],
          [0, -0.09, 0.15], 
          [0.14, 0, 0.1], 
          [-0.14, 0, 0.1]
        ].map((pos, i) => (
          <mesh key={i} position={[pos[0], pos[1], pos[2]]}>
            <boxGeometry args={[0.2, 0.005, 0.001]} />
            <meshStandardMaterial {...darkJoints} />
          </mesh>
        ))}
        
        {/* Tech details at top of head like shown in reference */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Small glowing sensor details scattered across head */}
        {[
          [0.12, 0.15, 0.08], 
          [-0.12, 0.15, 0.08], 
          [0.12, -0.12, 0.14], 
          [-0.12, -0.12, 0.14], 
          [0.16, 0.05, 0.04], 
          [-0.16, 0.05, 0.04]
        ].map((pos, i) => (
          <mesh key={i} position={[pos[0], pos[1], pos[2]]}>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
        ))}
        
        {/* Dark visor/sensor strip across center of face like in reference */}
        <mesh position={[0, -0.02, 0.2]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.2, 0.02, 0.01]} />
          <meshStandardMaterial {...darkJoints} />
        </mesh>
        
        {/* Neck connection plate */}
        <mesh position={[0, -0.18, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.08, 0.04, 16]} />
          <meshStandardMaterial {...secondaryMetal} />
        </mesh>
      </group>
      
      {/* ===== NECK ===== */}
      <group position={[0, 1.4, 0]}>
        {/* Main neck section - sleeker and segmented */}
        <mesh castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.08, 16]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Secondary neck segment */}
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.08, 0.07, 0.08, 16]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Neck armor plates - front and back */}
        <mesh position={[0, -0.04, 0.05]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.1, 0.14, 0.05]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        <mesh position={[0, -0.04, -0.05]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.1, 0.14, 0.05]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Neck joint details and tech */}
        <mesh position={[0, 0.03, 0]} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.07, 0.01, 16, 16]} />
          <meshStandardMaterial {...darkJoints} />
        </mesh>
        
        <mesh position={[0, -0.13, 0]} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.08, 0.01, 16, 16]} />
          <meshStandardMaterial {...darkJoints} />
        </mesh>
        
        {/* Neck glow line - matches reference image */}
        <mesh position={[0, -0.04, 0.09]}>
          <boxGeometry args={[0.03, 0.01, 0.01]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
      </group>
      
      {/* ===== TORSO ===== */}
      <group ref={chestRef} position={[0, 0.98, 0]}>
        {/* Main chest frame - more angular like reference image */}
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.6, 0.25]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Chest armor plates - layered with two-tone effect */}
        <mesh position={[0, 0.1, 0.13]}>
          <boxGeometry args={[0.34, 0.25, 0.07]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        <mesh position={[0, -0.15, 0.13]}>
          <boxGeometry args={[0.34, 0.25, 0.07]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Chest detail panels */}
        <mesh position={[0, 0.1, 0.17]}>
          <boxGeometry args={[0.28, 0.18, 0.04]} />
          <meshStandardMaterial {...secondaryMetal} />
        </mesh>
        
        <mesh position={[0, -0.15, 0.17]}>
          <boxGeometry args={[0.28, 0.18, 0.04]} />
          <meshStandardMaterial {...secondaryMetal} />
        </mesh>
        
        {/* Central chest glowing element - prominent circular sensor */}
        <mesh position={[0, 0.12, 0.18]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
        
        {/* Secondary chest sensors */}
        <mesh position={[0, -0.15, 0.18]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
        
        {/* Chest plate seams and panel lines */}
        {[
          // Horizontal seams
          [0, 0.23, 0.14], 
          [0, -0.03, 0.14], 
          [0, -0.28, 0.14],
          // Vertical seams
          [0.15, 0.1, 0.14], 
          [-0.15, 0.1, 0.14], 
          [0.15, -0.15, 0.14], 
          [-0.15, -0.15, 0.14]
        ].map((pos, i) => (
          <mesh key={i} position={[pos[0], pos[1], pos[2]]}>
            <boxGeometry args={[i < 3 ? 0.32 : 0.01, i < 3 ? 0.005 : 0.15, 0.005]} />
            <meshStandardMaterial {...darkJoints} />
          </mesh>
        ))}
        
        {/* Illuminated torso details - matches reference image */}
        <mesh position={[0.17, 0, 0.15]}>
          <boxGeometry args={[0.02, 0.55, 0.02]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
        
        <mesh position={[-0.17, 0, 0.15]}>
          <boxGeometry args={[0.02, 0.55, 0.02]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
        
        {/* Side torso armor plates */}
        <mesh position={[0.19, 0, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.04, 0.55, 0.23]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        <mesh position={[-0.19, 0, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.04, 0.55, 0.23]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Side torso technical details */}
        {[0.15, -0.15].map((y, i) => (
          <mesh key={i} position={[0.21, y, 0]} rotation={[0, Math.PI/2, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
        ))}
        
        {[0.15, -0.15].map((y, i) => (
          <mesh key={i} position={[-0.21, y, 0]} rotation={[0, -Math.PI/2, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
        ))}
      </group>
      
      {/* ===== ARMS ===== */}
      {/* Left arm - matching the sleek armor plating and distinct joint style from reference */}
      <group position={[-0.32, 1.15, 0]}>
        {/* Shoulder joint - dark joint with white armor */}
        <mesh>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Shoulder armor plating */}
        <mesh position={[-0.03, 0, 0]}>
          <boxGeometry args={[0.06, 0.08, 0.09]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Shoulder blue accent light */}
        <mesh position={[-0.03, 0, 0.045]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.01, 16]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
        
        {/* Shoulder detail ring */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI/2]}>
          <torusGeometry args={[0.065, 0.008, 16, 16]} />
          <meshStandardMaterial {...darkJoints} />
        </mesh>
        
        {/* Upper arm - segmented with white armor over dark frame */}
        <group position={[0, -0.15, 0]}>
          {/* Upper arm inner frame */}
          <mesh castShadow>
            <capsuleGeometry args={[0.04, 0.2, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Upper arm outer armor - front plate */}
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[0.07, 0.24, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Upper arm outer armor - back plate */}
          <mesh position={[0, 0, -0.03]}>
            <boxGeometry args={[0.07, 0.24, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Upper arm glowing strip - matches blue accent in reference */}
          <mesh position={[0, 0, 0.048]}>
            <boxGeometry args={[0.02, 0.22, 0.01]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
          
          {/* Technical details on upper arm */}
          {[-0.06, 0.06].map((y, i) => (
            <mesh key={i} position={[0, y, 0.04]}>
              <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} rotation={[Math.PI/2, 0, 0]} />
              <meshStandardMaterial {...darkJoints} />
            </mesh>
          ))}
        </group>
        
        {/* Elbow joint - exposed black metal with technical details */}
        <group position={[0, -0.3, 0]}>
          <mesh>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Elbow armor plates */}
          <mesh position={[0, 0, 0.04]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.07, 0.06, 0.02]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          <mesh position={[0, 0, -0.04]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.07, 0.06, 0.02]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Elbow blue accent light */}
          <mesh position={[0, 0, 0.05]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
        </group>
        
        {/* Forearm - more angular and segmented like reference image */}
        <group position={[0, -0.45, 0]}>
          {/* Inner forearm structure */}
          <mesh castShadow>
            <capsuleGeometry args={[0.035, 0.18, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Forearm armor - main plate */}
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[0.06, 0.2, 0.04]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Forearm armor - secondary plate */}
          <mesh position={[0, 0, -0.03]}>
            <boxGeometry args={[0.06, 0.2, 0.04]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Forearm armor - side details */}
          <mesh position={[0.035, 0, 0]}>
            <boxGeometry args={[0.01, 0.17, 0.05]} />
            <meshStandardMaterial {...secondaryMetal} />
          </mesh>
          
          <mesh position={[-0.035, 0, 0]}>
            <boxGeometry args={[0.01, 0.17, 0.05]} />
            <meshStandardMaterial {...secondaryMetal} />
          </mesh>
          
          {/* Glowing forearm detail - vertical blue strip */}
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.01, 0.19, 0.01]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
          
          {/* Technical forearm details and panels */}
          {[-0.06, 0.06].map((y, i) => (
            <mesh key={i} position={[0, y, 0.04]}>
              <boxGeometry args={[0.04, 0.02, 0.01]} />
              <meshStandardMaterial {...darkJoints} />
            </mesh>
          ))}
        </group>
        
        {/* Wrist joint */}
        <mesh position={[0, -0.57, 0]}>
          <cylinderGeometry args={[0.035, 0.03, 0.04, 16]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Hand - more detailed with technical features */}
        <group position={[0, -0.62, 0]}>
          <mesh>
            <boxGeometry args={[0.05, 0.07, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Palm technical detail */}
          <mesh position={[0, -0.03, 0.01]}>
            <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} rotation={[Math.PI/2, 0, 0]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
          
          {/* Fingers - more detailed, matching ref image's robotic hand */}
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i - 2) * 0.25;
            const xPos = Math.sin(angle) * 0.025;
            const yPos = -0.07 - Math.cos(angle) * 0.02;
            
            return (
              <group key={i}>
                <mesh position={[xPos, yPos, 0]}>
                  <capsuleGeometry args={[0.008, 0.03, 8, 8]} />
                  <meshStandardMaterial {...whiteMetal} />
                </mesh>
                <mesh position={[xPos, yPos - 0.02, 0]}>
                  <boxGeometry args={[0.01, 0.01, 0.01]} />
                  <meshStandardMaterial {...darkJoints} />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>
      
      {/* Right arm - mirrored from left but with subtle differences */}
      <group position={[0.32, 1.15, 0]}>
        {/* Shoulder joint - dark joint with white armor */}
        <mesh>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Shoulder armor plating */}
        <mesh position={[0.03, 0, 0]}>
          <boxGeometry args={[0.06, 0.08, 0.09]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Shoulder blue accent light */}
        <mesh position={[0.03, 0, 0.045]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.01, 16]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
        
        {/* Shoulder detail ring */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI/2]}>
          <torusGeometry args={[0.065, 0.008, 16, 16]} />
          <meshStandardMaterial {...darkJoints} />
        </mesh>
        
        {/* Upper arm - segmented with white armor over dark frame */}
        <group position={[0, -0.15, 0]}>
          {/* Upper arm inner frame */}
          <mesh castShadow>
            <capsuleGeometry args={[0.04, 0.2, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Upper arm outer armor - front plate */}
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[0.07, 0.24, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Upper arm outer armor - back plate */}
          <mesh position={[0, 0, -0.03]}>
            <boxGeometry args={[0.07, 0.24, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Upper arm glowing strip - matches blue accent in reference */}
          <mesh position={[0, 0, 0.048]}>
            <boxGeometry args={[0.02, 0.22, 0.01]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
          
          {/* Technical details on upper arm */}
          {[-0.06, 0.06].map((y, i) => (
            <mesh key={i} position={[0, y, 0.04]}>
              <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} rotation={[Math.PI/2, 0, 0]} />
              <meshStandardMaterial {...darkJoints} />
            </mesh>
          ))}
        </group>
        
        {/* Elbow joint - exposed black metal with technical details */}
        <group position={[0, -0.3, 0]}>
          <mesh>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Elbow armor plates */}
          <mesh position={[0, 0, 0.04]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.07, 0.06, 0.02]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          <mesh position={[0, 0, -0.04]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.07, 0.06, 0.02]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Elbow blue accent light */}
          <mesh position={[0, 0, 0.05]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
        </group>
        
        {/* Forearm - more angular and segmented like reference image */}
        <group position={[0, -0.45, 0]}>
          {/* Inner forearm structure */}
          <mesh castShadow>
            <capsuleGeometry args={[0.035, 0.18, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Forearm armor - main plate */}
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[0.06, 0.2, 0.04]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Forearm armor - secondary plate */}
          <mesh position={[0, 0, -0.03]}>
            <boxGeometry args={[0.06, 0.2, 0.04]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Forearm armor - side details */}
          <mesh position={[0.035, 0, 0]}>
            <boxGeometry args={[0.01, 0.17, 0.05]} />
            <meshStandardMaterial {...secondaryMetal} />
          </mesh>
          
          <mesh position={[-0.035, 0, 0]}>
            <boxGeometry args={[0.01, 0.17, 0.05]} />
            <meshStandardMaterial {...secondaryMetal} />
          </mesh>
          
          {/* Glowing forearm detail - vertical blue strip */}
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.01, 0.19, 0.01]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
          
          {/* Technical forearm details and panels */}
          {[-0.06, 0.06].map((y, i) => (
            <mesh key={i} position={[0, y, 0.04]}>
              <boxGeometry args={[0.04, 0.02, 0.01]} />
              <meshStandardMaterial {...darkJoints} />
            </mesh>
          ))}
        </group>
        
        {/* Wrist joint */}
        <mesh position={[0, -0.57, 0]}>
          <cylinderGeometry args={[0.035, 0.03, 0.04, 16]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Hand - more detailed with technical features */}
        <group position={[0, -0.62, 0]}>
          <mesh>
            <boxGeometry args={[0.05, 0.07, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Palm technical detail */}
          <mesh position={[0, -0.03, 0.01]}>
            <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} rotation={[Math.PI/2, 0, 0]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
          
          {/* Fingers - more detailed, matching ref image's robotic hand */}
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i - 2) * 0.25;
            const xPos = Math.sin(angle) * 0.025;
            const yPos = -0.07 - Math.cos(angle) * 0.02;
            
            return (
              <group key={i}>
                <mesh position={[xPos, yPos, 0]}>
                  <capsuleGeometry args={[0.008, 0.03, 8, 8]} />
                  <meshStandardMaterial {...whiteMetal} />
                </mesh>
                <mesh position={[xPos, yPos - 0.02, 0]}>
                  <boxGeometry args={[0.01, 0.01, 0.01]} />
                  <meshStandardMaterial {...darkJoints} />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>
      
      {/* ===== LEGS ===== */}
      {/* Left leg - highly detailed with armor plating and mechanical joints */}
      <group position={[-0.15, 0.6, 0]}>
        {/* Hip socket - complex joint structure from reference */}
        <group>
          {/* Main hip joint */}
          <mesh>
            <sphereGeometry args={[0.075, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Hip armor plating - front */}
          <mesh position={[0, 0, 0.04]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.1, 0.08, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Hip armor plating - back */}
          <mesh position={[0, 0, -0.04]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.1, 0.08, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Hip mechanical detail with blue accent */}
          <mesh position={[0, 0.05, 0.06]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
          
          {/* Hip socket detailed edge */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.08, 0.01, 16, 16]} />
            <meshStandardMaterial {...darkJoints} />
          </mesh>
        </group>
        
        {/* Upper thigh - complex armor plating structure */}
        <group position={[0, -0.2, 0]}>
          {/* Main thigh structure */}
          <mesh castShadow>
            <capsuleGeometry args={[0.05, 0.3, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Front thigh armor plate - main plate */}
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.09, 0.32, 0.04]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Back thigh armor plate */}
          <mesh position={[0, 0, -0.04]}>
            <boxGeometry args={[0.09, 0.32, 0.04]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Side thigh armor plates */}
          <mesh position={[0.055, 0, 0]}>
            <boxGeometry args={[0.02, 0.3, 0.06]} />
            <meshStandardMaterial {...secondaryMetal} />
          </mesh>
          
          <mesh position={[-0.055, 0, 0]}>
            <boxGeometry args={[0.02, 0.3, 0.06]} />
            <meshStandardMaterial {...secondaryMetal} />
          </mesh>
          
          {/* Thigh blue glowing accent - straight line like reference */}
          <mesh position={[0, 0, 0.065]}>
            <boxGeometry args={[0.01, 0.25, 0.01]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
          
          {/* Thigh technical details - matching reference image */}
          {[-0.1, 0.1].map((y, i) => (
            <mesh key={i} position={[0, y, 0.055]}>
              <boxGeometry args={[0.03, 0.02, 0.01]} />
              <meshStandardMaterial {...darkJoints} />
            </mesh>
          ))}
          
          {/* Small circular detail elements like in reference */}
          <mesh position={[0.03, -0.12, 0.055]}>
            <cylinderGeometry args={[0.01, 0.01, 0.012, 8]} />
            <meshStandardMaterial {...darkJoints} />
          </mesh>
        </group>
        
        {/* Knee joint - complex structure with multiple parts */}
        <group position={[0, -0.4, 0]}>
          {/* Main knee joint */}
          <mesh>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Knee armor plates - carefully placed to match reference */}
          <mesh position={[0, 0, 0.05]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.08, 0.07, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Back knee plate */}
          <mesh position={[0, 0, -0.05]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.08, 0.07, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Knee mechanical detail with blue accent */}
          <mesh position={[0, 0, 0.07]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
        </group>
        
        {/* Lower leg (shin) - matching the angular design in reference */}
        <group position={[0, -0.65, 0]}>
          {/* Inner shin structure */}
          <mesh castShadow>
            <capsuleGeometry args={[0.045, 0.4, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Front shin armor - with slight forward curve like reference */}
          <mesh position={[0, 0, 0.04]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.08, 0.4, 0.04]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Back shin armor */}
          <mesh position={[0, 0, -0.04]}>
            <boxGeometry args={[0.08, 0.4, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Side shin details */}
          <mesh position={[0.05, 0, 0]}>
            <boxGeometry args={[0.02, 0.38, 0.06]} />
            <meshStandardMaterial {...secondaryMetal} />
          </mesh>
          
          <mesh position={[-0.05, 0, 0]}>
            <boxGeometry args={[0.02, 0.38, 0.06]} />
            <meshStandardMaterial {...secondaryMetal} />
          </mesh>
          
          {/* Shin blue glowing accent - prominent in reference images */}
          <mesh position={[0, 0, 0.065]}>
            <boxGeometry args={[0.01, 0.35, 0.01]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
          
          {/* Technical shin details */}
          {[-0.15, 0, 0.15].map((y, i) => (
            <mesh key={i} position={[0, y, 0.055]}>
              <boxGeometry args={[0.04, 0.02, 0.01]} />
              <meshStandardMaterial {...darkJoints} />
            </mesh>
          ))}
          
          {/* Additional circular detail on shin */}
          <mesh position={[-0.03, 0.1, 0.055]}>
            <cylinderGeometry args={[0.01, 0.01, 0.01, 8]} />
            <meshStandardMaterial {...darkJoints} />
          </mesh>
        </group>
        
        {/* Ankle joint - complex with multiple parts as seen in reference */}
        <group position={[0, -0.88, 0]}>
          {/* Main ankle joint */}
          <mesh>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Ankle armor plates */}
          <mesh position={[0, 0, 0.04]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.07, 0.05, 0.02]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Ankle mechanical details */}
          <mesh position={[0.04, 0, 0]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial {...darkJoints} />
          </mesh>
          
          {/* Ankle blue accent */}
          <mesh position={[0, 0, 0.055]}>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
        </group>
        
        {/* Foot - complex structure matching reference */}
        <group position={[0, -0.95, 0.05]}>
          {/* Main foot plate */}
          <mesh castShadow>
            <boxGeometry args={[0.09, 0.04, 0.18]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Toe section */}
          <mesh position={[0, 0, 0.1]}>
            <boxGeometry args={[0.09, 0.03, 0.05]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Foot mechanical underside */}
          <mesh position={[0, -0.025, 0]}>
            <boxGeometry args={[0.085, 0.01, 0.17]} />
            <meshStandardMaterial {...darkJoints} />
          </mesh>
          
          {/* Foot blue accent */}
          <mesh position={[0, -0.01, 0.09]}>
            <boxGeometry args={[0.04, 0.01, 0.01]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
        </group>
      </group>
      
      {/* Right leg - mirrored from left with subtle asymmetrical details */}
      <group position={[0.15, 0.6, 0]}>
        {/* Hip socket - complex joint structure from reference */}
        <group>
          {/* Main hip joint */}
          <mesh>
            <sphereGeometry args={[0.075, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Hip armor plating - front */}
          <mesh position={[0, 0, 0.04]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.1, 0.08, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Hip armor plating - back */}
          <mesh position={[0, 0, -0.04]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.1, 0.08, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Hip mechanical detail with blue accent */}
          <mesh position={[0, 0.05, 0.06]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
          
          {/* Hip socket detailed edge */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.08, 0.01, 16, 16]} />
            <meshStandardMaterial {...darkJoints} />
          </mesh>
        </group>
        
        {/* Upper thigh - complex armor plating structure */}
        <group position={[0, -0.2, 0]}>
          {/* Main thigh structure */}
          <mesh castShadow>
            <capsuleGeometry args={[0.05, 0.3, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Front thigh armor plate - main plate */}
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.09, 0.32, 0.04]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Back thigh armor plate */}
          <mesh position={[0, 0, -0.04]}>
            <boxGeometry args={[0.09, 0.32, 0.04]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Side thigh armor plates */}
          <mesh position={[0.055, 0, 0]}>
            <boxGeometry args={[0.02, 0.3, 0.06]} />
            <meshStandardMaterial {...secondaryMetal} />
          </mesh>
          
          <mesh position={[-0.055, 0, 0]}>
            <boxGeometry args={[0.02, 0.3, 0.06]} />
            <meshStandardMaterial {...secondaryMetal} />
          </mesh>
          
          {/* Thigh blue glowing accent - straight line like reference */}
          <mesh position={[0, 0, 0.065]}>
            <boxGeometry args={[0.01, 0.25, 0.01]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
          
          {/* Thigh technical details - matching reference image */}
          {[-0.1, 0.1].map((y, i) => (
            <mesh key={i} position={[0, y, 0.055]}>
              <boxGeometry args={[0.03, 0.02, 0.01]} />
              <meshStandardMaterial {...darkJoints} />
            </mesh>
          ))}
          
          {/* Small circular detail elements like in reference */}
          <mesh position={[-0.03, -0.12, 0.055]}>
            <cylinderGeometry args={[0.01, 0.01, 0.012, 8]} />
            <meshStandardMaterial {...darkJoints} />
          </mesh>
        </group>
        
        {/* Knee joint - complex structure with multiple parts */}
        <group position={[0, -0.4, 0]}>
          {/* Main knee joint */}
          <mesh>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Knee armor plates - carefully placed to match reference */}
          <mesh position={[0, 0, 0.05]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.08, 0.07, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Back knee plate */}
          <mesh position={[0, 0, -0.05]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.08, 0.07, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Knee mechanical detail with blue accent */}
          <mesh position={[0, 0, 0.07]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
        </group>
        
        {/* Lower leg (shin) - matching the angular design in reference */}
        <group position={[0, -0.65, 0]}>
          {/* Inner shin structure */}
          <mesh castShadow>
            <capsuleGeometry args={[0.045, 0.4, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Front shin armor - with slight forward curve like reference */}
          <mesh position={[0, 0, 0.04]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.08, 0.4, 0.04]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Back shin armor */}
          <mesh position={[0, 0, -0.04]}>
            <boxGeometry args={[0.08, 0.4, 0.03]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Side shin details */}
          <mesh position={[0.05, 0, 0]}>
            <boxGeometry args={[0.02, 0.38, 0.06]} />
            <meshStandardMaterial {...secondaryMetal} />
          </mesh>
          
          <mesh position={[-0.05, 0, 0]}>
            <boxGeometry args={[0.02, 0.38, 0.06]} />
            <meshStandardMaterial {...secondaryMetal} />
          </mesh>
          
          {/* Shin blue glowing accent - prominent in reference images */}
          <mesh position={[0, 0, 0.065]}>
            <boxGeometry args={[0.01, 0.35, 0.01]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
          
          {/* Technical shin details */}
          {[-0.15, 0, 0.15].map((y, i) => (
            <mesh key={i} position={[0, y, 0.055]}>
              <boxGeometry args={[0.04, 0.02, 0.01]} />
              <meshStandardMaterial {...darkJoints} />
            </mesh>
          ))}
          
          {/* Additional circular detail on shin */}
          <mesh position={[0.03, 0.1, 0.055]}>
            <cylinderGeometry args={[0.01, 0.01, 0.01, 8]} />
            <meshStandardMaterial {...darkJoints} />
          </mesh>
        </group>
        
        {/* Ankle joint - complex with multiple parts as seen in reference */}
        <group position={[0, -0.88, 0]}>
          {/* Main ankle joint */}
          <mesh>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>
          
          {/* Ankle armor plates */}
          <mesh position={[0, 0, 0.04]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.07, 0.05, 0.02]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Ankle mechanical details */}
          <mesh position={[-0.04, 0, 0]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial {...darkJoints} />
          </mesh>
          
          {/* Ankle blue accent */}
          <mesh position={[0, 0, 0.055]}>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
        </group>
        
        {/* Foot - complex structure matching reference */}
        <group position={[0, -0.95, 0.05]}>
          {/* Main foot plate */}
          <mesh castShadow>
            <boxGeometry args={[0.09, 0.04, 0.18]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Toe section */}
          <mesh position={[0, 0, 0.1]}>
            <boxGeometry args={[0.09, 0.03, 0.05]} />
            <meshStandardMaterial {...whiteMetal} />
          </mesh>
          
          {/* Foot mechanical underside */}
          <mesh position={[0, -0.025, 0]}>
            <boxGeometry args={[0.085, 0.01, 0.17]} />
            <meshStandardMaterial {...darkJoints} />
          </mesh>
          
          {/* Foot blue accent */}
          <mesh position={[0, -0.01, 0.09]}>
            <boxGeometry args={[0.04, 0.01, 0.01]} />
            <meshStandardMaterial {...glowMaterial} />
          </mesh>
        </group>
      </group>
      
      {/* Additional inner mechanical details that show through gaps */}
      <group position={[0, 1.05, -0.05]}>
        <mesh rotation={[0, 0, Math.PI/4]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        <mesh rotation={[0, 0, -Math.PI/4]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
      </group>
    </group>
  );
};

// Create the actual model component that will load the GLTF
const ModelLoader = ({ 
  emotionalState = 'neutral',
  showParticles = 'none',
  hologramText = null,
  animation = 'idle',
  onComplete
}: {
  emotionalState: EmotionalState;
  showParticles: ParticleDisplay;
  hologramText: string | null;
  animation: string;
  onComplete?: () => void;
}) => {
  const { camera } = useThree();
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  
  useEffect(() => {
    // Set initial camera position
    if (camera) {
      camera.position.set(0, 1, 3);
      camera.lookAt(0, 1, 0);
    }
  }, [camera]);
  
  // Attempt to load the model if available, otherwise use placeholder
  if (useBasicGLTF) {
    // In development, or if model isn't available yet, use the placeholder
    return (
      <>
        <PerspectiveCamera makeDefault position={[0, 1, 3]} fov={50} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        <PlaceholderRobot emotionalState={emotionalState} />
        {hologramText && (
          <Html position={[0, 2.3, 0]} center>
            <div className="px-4 py-2 bg-blue-500/20 backdrop-blur-sm text-blue-300 rounded-lg border border-blue-400/30 text-sm font-mono whitespace-nowrap shadow-lg">
              <span className="opacity-80">&gt;</span> {hologramText}
            </div>
          </Html>
        )}
      </>
    );
  }
  
  // Code for when we have a GLTF model to load
  // This would include loading and animating the external model
  // Currently a placeholder until the model is available
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1, 3]} fov={50} />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />
      <PlaceholderRobot emotionalState={emotionalState} />
      {hologramText && (
        <Html position={[0, 2.3, 0]} center>
          <div className="px-4 py-2 bg-blue-500/20 backdrop-blur-sm text-blue-300 rounded-lg border border-blue-400/30 text-sm font-mono whitespace-nowrap shadow-lg">
            <span className="opacity-80">&gt;</span> {hologramText}
          </div>
        </Html>
      )}
    </>
  );
};

// Main component props interface
interface RealisticRobotModelProps {
  emotionalState?: EmotionalState;
  showParticles?: ParticleDisplay;
  hologramText?: string | null;
  animation?: string;
  interactive?: boolean;
  highQuality?: boolean;
  onAnimationComplete?: () => void;
}

// The main component
const RealisticRobotModel: React.FC<RealisticRobotModelProps> = ({
  emotionalState = 'neutral',
  showParticles = 'none',
  hologramText = null,
  animation = 'idle',
  interactive = true,
  highQuality = true,
  onAnimationComplete
}) => {
  const [pixelRatio, setPixelRatio] = useState(1);
  
  // Set pixel ratio based on device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPixelRatio(Math.max(2.5, window.devicePixelRatio));
    }
  }, []);

  return (
    <ThreeJsErrorBoundary>
      <div className="w-full h-full relative">
        <Canvas
          style={{ 
            background: 'transparent',
            touchAction: 'none'
          }}
          dpr={pixelRatio}
          gl={{ 
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
          }}
          camera={{ 
            position: [0, 1, 3],
            fov: 50,
            near: 0.1,
            far: 1000
          }}
          shadows
        >
          <Suspense fallback={null}>
            {/* Enhanced lighting setup for more realistic appearance */}
          <ambientLight intensity={0.6} />
          <pointLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" castShadow />
          <pointLight position={[-5, 3, -5]} intensity={0.5} color="#b0c4de" /> 
          <pointLight position={[0, 2, 5]} intensity={1.2} color="#add8e6" castShadow />
          
          {/* Spotlights to accentuate the robot's details and create dramatic lighting */}
          <spotLight 
            position={[3, 5, 3]} 
            angle={0.5} 
            penumbra={0.8} 
            intensity={1.5} 
            color="#ffffff" 
            castShadow 
            shadow-bias={-0.0001}
          />
          <spotLight 
            position={[-2, 3, -3]} 
            angle={0.4} 
            penumbra={0.9} 
            intensity={0.8} 
            color="#d6ebff" 
          />
          
          {/* Very subtle fog for depth */}
          <fog attach="fog" args={['#000', 8, 25]} />
          
          <ModelLoader 
            emotionalState={emotionalState}
            showParticles={showParticles}
            hologramText={hologramText}
            animation={animation}
            onComplete={onAnimationComplete}
          />
          
          {interactive && <OrbitControls
            enablePan={false}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 8}
            maxDistance={3.5}
            minDistance={1.2}
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.5}
          />}

          <EffectComposer enabled={highQuality}>
            {/* Enhanced bloom effect for better glow on emissive parts */}
            <Bloom 
              luminanceThreshold={0.6} 
              luminanceSmoothing={0.9} 
              intensity={0.6}
              kernelSize={KernelSize.LARGE}
            />
            <ToneMapping
              blendFunction={BlendFunction.NORMAL}
              adaptive={true}
              resolution={512}
              middleGrey={0.8}
              maxLuminance={12.0}
              averageLuminance={1.0}
              adaptationRate={0.8}
            />
          </EffectComposer>
          </Suspense>
        </Canvas>
        <Loader />
      </div>
    </ThreeJsErrorBoundary>
  );
};

export default RealisticRobotModel;