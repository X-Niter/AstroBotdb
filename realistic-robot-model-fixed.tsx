import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Define types locally since this file is outside the normal structure
type EmotionalState = 'neutral' | 'happy' | 'thinking' | 'alert' | 'sad' | 'confused';
type ParticleDisplay = 'none' | 'temporary' | 'typing' | 'intense';

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
        
        {/* Chest plate details - glowing center */}
        <mesh position={[0, 0.1, 0.11]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
        
        {/* Upper chest details - left shoulder connector */}
        <mesh position={[-0.2, 0.12, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.15]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Upper chest details - right shoulder connector */}
        <mesh position={[0.2, 0.12, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.15]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Mid-torso - central section */}
        <mesh position={[0, -0.05, 0]} castShadow>
          <boxGeometry args={[0.3, 0.1, 0.18]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Lower torso - waist section */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.25, 0.15, 0.16]} />
          <meshStandardMaterial {...whiteMetal} />
        </mesh>
        
        {/* Torso back details */}
        <mesh position={[0, 0, -0.12]}>
          <boxGeometry args={[0.2, 0.4, 0.04]} />
          <meshStandardMaterial {...secondaryMetal} />
        </mesh>
        
        {/* Spine detail */}
        <mesh position={[0, -0.05, -0.14]}>
          <boxGeometry args={[0.05, 0.35, 0.02]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Central torso glowing detail */}
        <mesh position={[0, -0.05, 0.1]}>
          <boxGeometry args={[0.05, 0.2, 0.01]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
        
        {/* Belt/waist section */}
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[0.28, 0.05, 0.17]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
        
        {/* Hip joint connectors - left */}
        <mesh position={[-0.15, -0.35, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial {...darkJoints} />
        </mesh>
        
        {/* Hip joint connectors - right */}
        <mesh position={[0.15, -0.35, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial {...darkJoints} />
        </mesh>
        
        {/* Belt detail with glow */}
        <mesh position={[0, -0.3, 0.09]}>
          <boxGeometry args={[0.08, 0.02, 0.01]} />
          <meshStandardMaterial {...glowMaterial} />
        </mesh>
        
        {/* Pectoral armor plates */}
        {[-0.12, 0.12].map((x, i) => (
          <mesh key={i} position={[x, 0.1, 0.11]}>
            <boxGeometry args={[0.1, 0.08, 0.02]} />
            <meshStandardMaterial {...whiteMetal} />
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
            <mesh key={i} position={[0, y, 0.04]} rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} />
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
          <mesh position={[0, -0.03, 0.01]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} />
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
            <mesh key={i} position={[0, y, 0.04]} rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} />
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
          <mesh position={[0, -0.03, 0.01]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} />
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
  emotionalState?: EmotionalState;
  showParticles?: ParticleDisplay;
  hologramText?: string | null;
  animation?: string;
  onComplete?: () => void;
}) => {
  return (
    <RealisticRobotModel 
      emotionalState={emotionalState}
      showParticles={showParticles}
      hologramText={hologramText}
      animation={animation}
      onComplete={onComplete}
    />
  );
};

export default ModelLoader;