'use client';

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector2, Vector3, Shape, CatmullRomCurve3 } from "three";
import * as THREE from "three";
import { 
  useGLTF, 
  Environment, 
  useHelper, 
  Plane, 
  MeshTransmissionMaterial,
  MeshDistortMaterial,
  Html
} from "@react-three/drei";
import { EmotionalState, ParticleDisplay } from "../utils/types";

interface ParametricDroidProps {
  emotionalState?: EmotionalState;
  showParticles?: ParticleDisplay;
  hologramText?: string | null;
  animation?: string;
  interactive?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  onComplete?: () => void;
}

// Define material creation functions with enhanced properties
const createMatteMaterial = () => ({
  color: '#ffffff', 
  roughness: 0.25, 
  metalness: 0.7,
  envMapIntensity: 1.2,
  clearcoat: 0.5,
  clearcoatRoughness: 0.3
});

const createCarbonFiberMaterial = () => ({
  color: '#111111', 
  roughness: 0.3, 
  metalness: 0.6,
  envMapIntensity: 1.0,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1
});

const createGlowMaterial = (intensity: number = 3.0) => ({
  color: '#00FFFF',
  emissive: '#00FFFF',
  emissiveIntensity: intensity,
  roughness: 0.05,
  metalness: 0.9,
  envMapIntensity: 2.0,
  transparent: true,
  opacity: 0.9
});

const createSteelMaterial = () => ({
  color: '#303030', 
  roughness: 0.2, 
  metalness: 0.9,
  envMapIntensity: 2.5,
  clearcoat: 0.7,
  clearcoatRoughness: 0.05
});

// Create a V shape for the chest glow
const createVShape = (width: number, height: number): Shape => {
  const shape = new Shape();
  // Start at the top center
  shape.moveTo(0, height / 2);
  // Draw to bottom left
  shape.lineTo(-width / 2, -height / 2);
  // Draw to bottom right
  shape.lineTo(width / 2, -height / 2);
  // Close the shape
  shape.lineTo(0, height / 2);
  return shape;
};

// Function to create a parametric head dome
const ParametricHeadDome = () => {
  // Using an enhanced spherical geometry with better details
  const antennaRef = useRef<THREE.Group>(null);
  
  // Add rotating animation to antenna
  useFrame((state) => {
    if (antennaRef.current) {
      antennaRef.current.rotation.y += 0.005;
    }
  });
  
  return (
    <group>
      {/* Main head dome */}
      <mesh>
        <sphereGeometry args={[0.12, 64, 32]} />
        <meshStandardMaterial {...createMatteMaterial()} />
      </mesh>
      
      {/* Back head port/access panel */}
      <mesh position={[0, 0, -0.1]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[0.1, 0.08, 0.01]} />
        <meshStandardMaterial {...createCarbonFiberMaterial()} />
      </mesh>
      
      {/* Sensor array on top of head */}
      <group ref={antennaRef} position={[0, 0.10, 0]}>
        {/* Central antenna */}
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.06, 8]} />
          <meshStandardMaterial {...createSteelMaterial()} />
        </mesh>
        
        {/* Antenna tip glow */}
        <mesh position={[0, 0.07, 0]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshStandardMaterial {...createGlowMaterial(2.0)} />
        </mesh>
        
        {/* Sensor crown base */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.02, 16]} />
          <meshStandardMaterial {...createCarbonFiberMaterial()} />
        </mesh>
        
        {/* Mini sensors around crown */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh 
            key={i}
            position={[
              Math.sin(i * Math.PI / 3) * 0.04,
              0.01,
              Math.cos(i * Math.PI / 3) * 0.04
            ]}
          >
            <sphereGeometry args={[0.007, 8, 8]} />
            <meshStandardMaterial 
              color="#00FFFF"
              emissive="#00FFFF"
              emissiveIntensity={1.5}
            />
          </mesh>
        ))}
      </group>
      
      {/* Side mounted micro lenses */}
      <mesh position={[-0.1, 0.02, 0.04]} rotation={[0, Math.PI/3, 0]}>
        <cylinderGeometry args={[0.01, 0.007, 0.03, 8]} />
        <meshStandardMaterial {...createSteelMaterial()} />
      </mesh>
      
      <mesh position={[0.1, 0.02, 0.04]} rotation={[0, -Math.PI/3, 0]}>
        <cylinderGeometry args={[0.01, 0.007, 0.03, 8]} />
        <meshStandardMaterial {...createSteelMaterial()} />
      </mesh>
    </group>
  );
};

// Function to create torso using LatheGeometry with enhanced design
const TorsoAndPelvis = () => {
  // Define the profile curve points for the torso with more detail
  const torsoPoints = useMemo(() => [
    new Vector2(0.0, 0.0),     // Start at bottom center
    new Vector2(0.28, 0.0),    // Bottom right edge
    new Vector2(0.3, 0.05),    // Bottom curve
    new Vector2(0.31, 0.1),    // Hip joint connection
    new Vector2(0.3, 0.2),     // Lower torso
    new Vector2(0.28, 0.4),    // Waist
    new Vector2(0.27, 0.5),    // Mid torso narrow
    new Vector2(0.28, 0.6),    // Upper mid torso
    new Vector2(0.3, 0.75),    // Lower chest
    new Vector2(0.32, 0.85),   // Mid chest
    new Vector2(0.31, 0.95),   // Upper chest
    new Vector2(0.25, 1.1),    // Shoulder area
    new Vector2(0.2, 1.2)      // Neck connection
  ], []);

  // References for animated parts
  const reactorGlowRef = useRef<THREE.Mesh>(null);
  const coolingVentsRef = useRef<THREE.Group>(null);
  
  // Animate the cooling vents and reactor
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Animate reactor glow
    if (reactorGlowRef.current) {
      reactorGlowRef.current.scale.set(
        1.0 + Math.sin(time * 1.5) * 0.05,
        1.0 + Math.sin(time * 1.5) * 0.05,
        1.0 + Math.sin(time * 1.5) * 0.05
      );
    }
    
    // Animate cooling vents
    if (coolingVentsRef.current) {
      coolingVentsRef.current.rotation.y = time * 0.2;
    }
  });

  return (
    <group>
      {/* Main torso structure */}
      <mesh rotation={[0, 0, 0]} position={[0, -0.6, 0]}>
        <latheGeometry args={[torsoPoints, 64, 0, 2 * Math.PI]} />
        <meshStandardMaterial {...createMatteMaterial()} />
      </mesh>
      
      {/* Back cooling system with vents */}
      <group position={[0, 0, -0.25]} rotation={[0, Math.PI, 0]}>
        {/* Main cooling housing */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.3, 0.4, 0.05]} />
          <meshStandardMaterial {...createMatteMaterial()} />
        </mesh>
        
        {/* Vent frame */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.28, 0.38, 0.02]} />
          <meshStandardMaterial {...createCarbonFiberMaterial()} />
        </mesh>
        
        {/* Rotating cooling vents */}
        <group ref={coolingVentsRef} position={[0, 0, 0.03]}>
          {[...Array(5)].map((_, i) => (
            <mesh 
              key={`vent-${i}`} 
              position={[0, -0.15 + i * 0.075, 0]}
              rotation={[0, 0, Math.PI/8]}
            >
              <boxGeometry args={[0.25, 0.025, 0.01]} />
              <meshStandardMaterial {...createSteelMaterial()} />
            </mesh>
          ))}
        </group>
      </group>
      
      {/* Side armor connections */}
      {[-1, 1].map((side) => (
        <group key={`side-${side}`} position={[side * 0.25, 0, 0]}>
          {/* Side panel */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.08, 0.4, 0.25]} />
            <meshStandardMaterial {...createMatteMaterial()} />
          </mesh>
          
          {/* Connection ports */}
          {[0.1, -0.1].map((y, i) => (
            <mesh key={`port-${i}`} position={[side * 0.04, y, 0.1]}>
              <cylinderGeometry args={[0.03, 0.03, 0.05, 12]} />
              <meshStandardMaterial {...createCarbonFiberMaterial()} />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Central reactor housing in chest - enhanced for realism */}
      <group position={[0, 0.15, 0.15]}>
        {/* Reactor frame */}
        <mesh>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
          <meshStandardMaterial {...createCarbonFiberMaterial()} />
        </mesh>
        
        {/* Inner reactor core - animated */}
        <mesh ref={reactorGlowRef} position={[0, 0, 0.02]}>
          <cylinderGeometry args={[0.12, 0.12, 0.12, 16]} />
          <meshStandardMaterial 
            color="#00FFFF" 
            emissive="#00FFFF" 
            emissiveIntensity={3.0}
            transparent={true}
            opacity={0.9}
          />
        </mesh>
        
        {/* Energy containment rings */}
        {[0, 1, 2].map((i) => (
          <mesh 
            key={`reactor-ring-${i}`}
            position={[0, 0, 0.04]}
            rotation={[Math.PI/2, 0, i * Math.PI/4]}
          >
            <torusGeometry args={[0.13, 0.01, 16, 32]} />
            <meshStandardMaterial {...createSteelMaterial()} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// Function to create an arm using LatheGeometry
const Arm = ({ 
  side = 'left', 
  position = [0, 0, 0] as [number, number, number], 
  showGlow = true 
}) => {
  // Scale factor for left/right sides
  const sideMultiplier = side === 'left' ? -1 : 1;
  
  // Points for upper arm - more detailed curve
  const upperArmPoints = useMemo(() => [
    new Vector2(0.0, 0.0),    // Top center
    new Vector2(0.1, 0.0),    // Top edge
    new Vector2(0.11, 0.1),   // Upper bicep
    new Vector2(0.12, 0.2),   // Mid bicep bulge
    new Vector2(0.11, 0.3),   // Lower bicep
    new Vector2(0.09, 0.5),   // Above elbow
    new Vector2(0.08, 0.6)    // Elbow joint
  ], []);
  
  // Points for lower arm - more detailed curve
  const lowerArmPoints = useMemo(() => [
    new Vector2(0.0, 0.0),    // Elbow center
    new Vector2(0.08, 0.0),   // Elbow edge
    new Vector2(0.09, 0.1),   // Upper forearm
    new Vector2(0.085, 0.2),  // Mid forearm
    new Vector2(0.08, 0.3),   // Lower forearm
    new Vector2(0.07, 0.4),   // Near wrist
    new Vector2(0.06, 0.5)    // Wrist
  ], []);

  // Calculate positions
  const upperArmPos: [number, number, number] = [sideMultiplier * 0.3, 0, 0];
  const lowerArmPos: [number, number, number] = [0, -0.6, 0];
  const handPos: [number, number, number] = [0, -0.55, 0];
  
  // Refs for glow animations
  const armGlowRef = useRef<THREE.Mesh>(null);
  const wristGlowRef = useRef<THREE.Mesh>(null);
  
  // Function to create a jointed finger
  const createFinger = (fingerPos: [number, number, number], length = 0.08, thickness = 0.015) => (
    <group position={fingerPos}>
      {/* Finger base joint */}
      <mesh>
        <sphereGeometry args={[thickness * 1.2, 8, 8]} />
        <meshStandardMaterial {...createCarbonFiberMaterial()} />
      </mesh>
      
      {/* Finger segment 1 */}
      <mesh position={[0, -length/3, 0]}>
        <capsuleGeometry args={[thickness, length/2]} />
        <meshStandardMaterial {...createMatteMaterial()} />
      </mesh>
      
      {/* Middle joint */}
      <mesh position={[0, -length/1.5, 0]}>
        <sphereGeometry args={[thickness * 0.9, 8, 8]} />
        <meshStandardMaterial {...createCarbonFiberMaterial()} />
      </mesh>
      
      {/* Finger segment 2 */}
      <mesh position={[0, -length/1.1, 0]} rotation={[0.3, 0, 0]}>
        <capsuleGeometry args={[thickness * 0.8, length/3]} />
        <meshStandardMaterial {...createMatteMaterial()} />
      </mesh>
      
      {/* Fingertip */}
      <mesh position={[0, -length, 0]}>
        <sphereGeometry args={[thickness * 0.7, 8, 8]} />
        <meshStandardMaterial {...createMatteMaterial()} />
      </mesh>
    </group>
  );
  
  // Animate the glows
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (armGlowRef.current && showGlow) {
      // Upper arm glow pulse animation
      const intensity = 2 + Math.sin(time * 2) * 0.5;
      const material = armGlowRef.current.material as THREE.MeshStandardMaterial;
      if (material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = intensity;
      }
    }
    
    if (wristGlowRef.current && showGlow) {
      // Wrist glow pulse animation - slightly out of phase
      const intensity = 2 + Math.sin(time * 2.5 + 1) * 0.5;
      const material = wristGlowRef.current.material as THREE.MeshStandardMaterial;
      if (material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = intensity;
      }
    }
  });

  return (
    <group position={position}>
      {/* Shoulder joint with enhanced details */}
      <group position={[sideMultiplier * 0.25, 0, 0]}>
        {/* Main shoulder ball */}
        <mesh>
          <sphereGeometry args={[0.12, 24, 16]} />
          <meshStandardMaterial {...createCarbonFiberMaterial()} />
        </mesh>
        
        {/* Shoulder armor plate */}
        <mesh position={[sideMultiplier * 0.08, 0, 0]} rotation={[0, 0, sideMultiplier * Math.PI/4]}>
          <boxGeometry args={[0.1, 0.06, 0.12]} />
          <meshStandardMaterial {...createMatteMaterial()} />
        </mesh>
        
        {/* Shoulder connection tubes */}
        <mesh position={[sideMultiplier * 0.05, 0, 0]} rotation={[0, Math.PI/2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
          <meshStandardMaterial {...createCarbonFiberMaterial()} />
        </mesh>
      </group>
      
      {/* Upper arm with detailed elements */}
      <group position={upperArmPos}>
        {/* Main upper arm lathe */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <latheGeometry args={[upperArmPoints, 32, 0, 2 * Math.PI]} />
          <meshStandardMaterial {...createMatteMaterial()} />
        </mesh>
        
        {/* Visible tubes/wires along arm */}
        {[0, 1, 2].map((i) => (
          <mesh 
            key={`tube-${i}`}
            position={[0, -0.3, 0.09 - i * 0.04]} 
            rotation={[0, 0, Math.PI/2]}
          >
            <cylinderGeometry args={[0.007, 0.007, 0.5, 8]} />
            <meshStandardMaterial {...createSteelMaterial()} />
          </mesh>
        ))}
        
        {/* Upper arm glow band */}
        {showGlow && (
          <mesh ref={armGlowRef} position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.12, 0.01, 16, 32]} />
            <meshStandardMaterial {...createGlowMaterial()} />
          </mesh>
        )}
        
        {/* Elbow joint with cables */}
        <group position={[0, -0.6, 0]}>
          <mesh>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial {...createCarbonFiberMaterial()} />
          </mesh>
          
          {/* Elbow hydraulic piston */}
          <mesh position={[0, 0, 0.09]} rotation={[Math.PI/2.5, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
            <meshStandardMaterial {...createSteelMaterial()} />
          </mesh>
        </group>
        
        {/* Lower arm */}
        <group position={lowerArmPos}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <latheGeometry args={[lowerArmPoints, 32, 0, 2 * Math.PI]} />
            <meshStandardMaterial {...createMatteMaterial()} />
          </mesh>
          
          {/* Visible tubes/wires along forearm */}
          {[0, 1].map((i) => (
            <mesh 
              key={`forearm-tube-${i}`}
              position={[0, -0.25, 0.07 - i * 0.03]} 
              rotation={[0, 0, Math.PI/2]}
            >
              <cylinderGeometry args={[0.005, 0.005, 0.3, 8]} />
              <meshStandardMaterial {...createSteelMaterial()} />
            </mesh>
          ))}
          
          {/* Lower arm glow band */}
          {showGlow && (
            <mesh ref={wristGlowRef} position={[0, -0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.08, 0.01, 16, 32]} />
              <meshStandardMaterial {...createGlowMaterial()} />
            </mesh>
          )}
          
          {/* Wrist joint */}
          <mesh position={[0, -0.45, 0]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial {...createCarbonFiberMaterial()} />
          </mesh>
          
          {/* Hand with articulated fingers */}
          <group position={handPos}>
            {/* Palm plate */}
            <mesh position={[0, -0.04, 0]}>
              <boxGeometry args={[0.12, 0.08, 0.04]} />
              <meshStandardMaterial {...createMatteMaterial()} />
            </mesh>
            
            {/* Thumb */}
            {createFinger([0.06, -0.04, 0.02], 0.06, 0.013)}
            
            {/* Four fingers */}
            {[-0.045, -0.015, 0.015, 0.045].map((x, i) => (
              <group key={`finger-${i}`} rotation={[0.2, 0, 0]}>
                {createFinger([x, -0.08, 0], 0.07 - Math.abs(x) * 0.1, 0.012)}
              </group>
            ))}
            
            {/* Holographic emitter in palm - only if show glow is enabled */}
            {showGlow && (
              <mesh position={[0, -0.04, 0.021]}>
                <cylinderGeometry args={[0.015, 0.015, 0.01, 16]} />
                <meshStandardMaterial {...createGlowMaterial(1.5)} />
              </mesh>
            )}
          </group>
        </group>
      </group>
    </group>
  );
};

// Function to create a leg using LatheGeometry
const Leg = ({ 
  side = 'left', 
  position = [0, 0, 0] as [number, number, number], 
  showGlow = true 
}) => {
  // Scale factor for left/right sides
  const sideMultiplier = side === 'left' ? -1 : 1;
  
  // Points for thigh - more detailed curve
  const thighPoints = useMemo(() => [
    new Vector2(0.0, 0.0),    // Hip joint center
    new Vector2(0.15, 0.0),   // Hip edge
    new Vector2(0.16, 0.1),   // Upper thigh
    new Vector2(0.16, 0.25),  // Mid-upper thigh
    new Vector2(0.15, 0.4),   // Mid thigh
    new Vector2(0.13, 0.55),  // Lower thigh
    new Vector2(0.12, 0.65)   // Knee joint
  ], []);
  
  // Points for shin - more detailed curve
  const shinPoints = useMemo(() => [
    new Vector2(0.0, 0.0),    // Knee center
    new Vector2(0.12, 0.0),   // Knee edge
    new Vector2(0.13, 0.1),   // Upper shin
    new Vector2(0.13, 0.25),  // Mid-upper shin
    new Vector2(0.12, 0.4),   // Mid shin
    new Vector2(0.11, 0.5),   // Lower shin
    new Vector2(0.10, 0.6)    // Ankle
  ], []);

  // Calculate positions
  const thighPos: [number, number, number] = [sideMultiplier * 0.18, 0, 0];
  const shinPos: [number, number, number] = [0, -0.65, 0];
  const footPos: [number, number, number] = [0, -0.65, 0.05];
  const toePos: [number, number, number] = [0, 0, 0.12];
  
  // Refs for glow animations
  const thighGlowRef = useRef<THREE.Mesh>(null);
  const shinGlowRef = useRef<THREE.Mesh>(null);
  
  // Function to create hydraulic components
  const createHydraulic = (position: [number, number, number], rotation: [number, number, number], size: [number, number]) => (
    <group position={position} rotation={rotation}>
      {/* Piston rod */}
      <mesh>
        <cylinderGeometry args={[size[0] * 0.4, size[0] * 0.4, size[1] * 0.6, 8]} />
        <meshStandardMaterial {...createSteelMaterial()} />
      </mesh>
      
      {/* Hydraulic cylinder */}
      <mesh position={[0, size[1] * 0.35, 0]}>
        <cylinderGeometry args={[size[0], size[0], size[1] * 0.3, 16]} />
        <meshStandardMaterial {...createCarbonFiberMaterial()} />
      </mesh>
    </group>
  );
  
  // Animate the glows
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Thigh glow animation
    if (thighGlowRef.current && showGlow) {
      const thighIntensity = 2 + Math.sin(time * 2.2) * 0.5;
      const thighMaterial = thighGlowRef.current.material as THREE.MeshStandardMaterial;
      if (thighMaterial.emissiveIntensity !== undefined) {
        thighMaterial.emissiveIntensity = thighIntensity;
      }
    }
    
    // Shin glow animation - slightly out of phase
    if (shinGlowRef.current && showGlow) {
      const shinIntensity = 2 + Math.sin(time * 2.5 + 0.8) * 0.5;
      const shinMaterial = shinGlowRef.current.material as THREE.MeshStandardMaterial;
      if (shinMaterial.emissiveIntensity !== undefined) {
        shinMaterial.emissiveIntensity = shinIntensity;
      }
    }
  });

  return (
    <group position={position}>
      {/* Hip joint with articulation */}
      <group position={[sideMultiplier * 0.1, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.13, 20, 16]} />
          <meshStandardMaterial {...createCarbonFiberMaterial()} />
        </mesh>
        
        {/* Hip armor plate */}
        <mesh position={[sideMultiplier * 0.05, 0.02, 0]} rotation={[0.1, 0, sideMultiplier * 0.2]}>
          <boxGeometry args={[0.12, 0.06, 0.14]} />
          <meshStandardMaterial {...createMatteMaterial()} />
        </mesh>
      </group>
      
      {/* Thigh with armor plating */}
      <group position={thighPos}>
        {/* Main thigh structure */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <latheGeometry args={[thighPoints, 32, 0, 2 * Math.PI]} />
          <meshStandardMaterial {...createMatteMaterial()} />
        </mesh>
        
        {/* Thigh armor plates */}
        <mesh position={[0, -0.25, 0.12]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.14, 0.3, 0.04]} />
          <meshStandardMaterial {...createMatteMaterial()} />
        </mesh>
        
        {/* Side hydraulic systems */}
        {createHydraulic(
          [0.12, -0.3, 0.05], 
          [0, 0, Math.PI/2 + 0.4], 
          [0.025, 0.15]
        )}
        
        {/* Thigh glow band */}
        {showGlow && (
          <mesh ref={thighGlowRef} position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.16, 0.01, 16, 32]} />
            <meshStandardMaterial {...createGlowMaterial()} />
          </mesh>
        )}
        
        {/* Knee joint with articulation */}
        <group position={[0, -0.65, 0]}>
          {/* Main knee sphere */}
          <mesh>
            <sphereGeometry args={[0.12, 20, 16]} />
            <meshStandardMaterial {...createCarbonFiberMaterial()} />
          </mesh>
          
          {/* Knee guard - protective plate */}
          <mesh position={[0, 0, 0.1]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.15, 0.06, 0.02]} />
            <meshStandardMaterial {...createMatteMaterial()} />
          </mesh>
          
          {/* Knee hydraulics - side supports */}
          {[-0.1, 0.1].map((x, i) => (
            <group key={`knee-hydraulic-${i}`} position={[x, 0, 0]}>
              {createHydraulic(
                [0, 0, 0.1], 
                [Math.PI/2 - 0.4, 0, 0], 
                [0.02, 0.12]
              )}
            </group>
          ))}
        </group>
        
        {/* Shin segment with armor plating */}
        <group position={shinPos}>
          {/* Main shin structure */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <latheGeometry args={[shinPoints, 32, 0, 2 * Math.PI]} />
            <meshStandardMaterial {...createMatteMaterial()} />
          </mesh>
          
          {/* Front shin armor plate */}
          <mesh position={[0, -0.25, 0.1]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.12, 0.25, 0.03]} />
            <meshStandardMaterial {...createMatteMaterial()} />
          </mesh>
          
          {/* Side calf hydraulics */}
          {createHydraulic(
            [0.09, -0.2, 0.03], 
            [0, 0, Math.PI/2 + 0.3], 
            [0.018, 0.12]
          )}
          
          {/* Shin glow band */}
          {showGlow && (
            <mesh ref={shinGlowRef} position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.13, 0.01, 16, 32]} />
              <meshStandardMaterial {...createGlowMaterial()} />
            </mesh>
          )}
          
          {/* Enhanced foot with advanced biomechanical design */}
          <group position={footPos}>
            {/* Ankle joint - carbon fiber sphere */}
            <mesh position={[0, 0, -0.05]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshStandardMaterial {...createCarbonFiberMaterial()} />
            </mesh>
            
            {/* Main foot plate - contoured for stability */}
            <mesh position={[0, -0.01, 0.05]}>
              <boxGeometry args={[0.18, 0.04, 0.22]} />
              <meshStandardMaterial {...createMatteMaterial()} />
            </mesh>
            
            {/* Underfoot shock absorbers */}
            {[-0.06, 0, 0.06].map((x, i) => (
              <mesh key={`absorber-${i}`} position={[x, -0.04, 0.05]}>
                <cylinderGeometry args={[0.02, 0.02, 0.03, 8]} />
                <meshStandardMaterial {...createCarbonFiberMaterial()} />
              </mesh>
            ))}
            
            {/* Central toe divider - carbon fiber */}
            <mesh position={[0, 0.01, 0.12]}>
              <boxGeometry args={[0.03, 0.06, 0.12]} />
              <meshStandardMaterial {...createCarbonFiberMaterial()} />
            </mesh>
            
            {/* Left toe - articulated */}
            <group position={[-0.05, 0, 0.12]}>
              <mesh>
                <boxGeometry args={[0.07, 0.05, 0.08]} />
                <meshStandardMaterial {...createMatteMaterial()} />
              </mesh>
              
              {/* Toe joint */}
              <mesh position={[0, 0, 0.04]}>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial {...createCarbonFiberMaterial()} />
              </mesh>
              
              {/* Toe tip - angled for grip */}
              <mesh position={[0, -0.01, 0.08]} rotation={[-0.2, 0, 0]}>
                <boxGeometry args={[0.06, 0.03, 0.04]} />
                <meshStandardMaterial {...createMatteMaterial()} />
              </mesh>
            </group>
            
            {/* Right toe - articulated */}
            <group position={[0.05, 0, 0.12]}>
              <mesh>
                <boxGeometry args={[0.07, 0.05, 0.08]} />
                <meshStandardMaterial {...createMatteMaterial()} />
              </mesh>
              
              {/* Toe joint */}
              <mesh position={[0, 0, 0.04]}>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial {...createCarbonFiberMaterial()} />
              </mesh>
              
              {/* Toe tip - angled for grip */}
              <mesh position={[0, -0.01, 0.08]} rotation={[-0.2, 0, 0]}>
                <boxGeometry args={[0.06, 0.03, 0.04]} />
                <meshStandardMaterial {...createMatteMaterial()} />
              </mesh>
            </group>
            
            {/* Foot glow accents */}
            {showGlow && (
              <>
                {/* Front toe glow */}
                <mesh position={[0, 0.01, 0.16]}>
                  <boxGeometry args={[0.15, 0.01, 0.02]} />
                  <meshStandardMaterial {...createGlowMaterial(1.8)} />
                </mesh>
                
                {/* Heel glow */}
                <mesh position={[0, -0.01, -0.05]}>
                  <boxGeometry args={[0.12, 0.02, 0.01]} />
                  <meshStandardMaterial {...createGlowMaterial(1.5)} />
                </mesh>
              </>
            )}
          </group>
        </group>
      </group>
    </group>
  );
};

// Function to create neck using tube geometry for cables
const Neck = () => {
  // Create curved path for the neck
  const neckPath = useMemo(() => {
    return new CatmullRomCurve3([
      new Vector3(0, 0, 0),
      new Vector3(0, 0.03, 0.01),
      new Vector3(0, 0.06, 0),
      new Vector3(0, 0.09, 0)
    ]);
  }, []);
  
  return (
    <group>
      {/* Main neck cylinder */}
      <mesh>
        <cylinderGeometry args={[0.05, 0.06, 0.09, 16]} />
        <meshStandardMaterial {...createCarbonFiberMaterial()} />
      </mesh>
      
      {/* Tubes/cables around the neck */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i * Math.PI) / 2;
        const x = Math.sin(angle) * 0.035;
        const z = Math.cos(angle) * 0.035;
        
        return (
          <mesh key={`neck-cable-${i}`} position={[x, 0, z]}>
            <tubeGeometry args={[neckPath, 20, 0.008, 8, false]} />
            <meshStandardMaterial {...createSteelMaterial()} />
          </mesh>
        );
      })}
    </group>
  );
};

// Create armor plating with beveled edges
const ArmorPlating = ({ 
  baseWidth = 0.34, 
  baseHeight = 0.4, 
  baseDepth = 0.2,
  shellThickness = 0.02,
  position = [0, 0, 0] as [number, number, number],
  rotation = [0, 0, 0] as [number, number, number]
}) => {
  // Create outer and inner meshes for shell effect
  return (
    <group position={position} rotation={rotation}>
      {/* Outer armor shell */}
      <mesh>
        <boxGeometry args={[baseWidth, baseHeight, baseDepth]} />
        <meshStandardMaterial {...createMatteMaterial()} />
      </mesh>
      
      {/* Inner cutout - slightly smaller to create shell effect */}
      <mesh scale={[0.9, 0.9, 0.9]}>
        <boxGeometry args={[baseWidth, baseHeight, baseDepth]} />
        <meshStandardMaterial 
          color="#000000" 
          transparent={true} 
          opacity={0.2} 
          side={THREE.BackSide} 
        />
      </mesh>
      
      {/* Beveled edges - thin strips along the armor edges */}
      {/* Horizontal top edge */}
      <mesh position={[0, baseHeight/2 - 0.01, 0]}>
        <boxGeometry args={[baseWidth, 0.02, baseDepth]} />
        <meshStandardMaterial {...createCarbonFiberMaterial()} />
      </mesh>
      
      {/* Horizontal bottom edge */}
      <mesh position={[0, -baseHeight/2 + 0.01, 0]}>
        <boxGeometry args={[baseWidth, 0.02, baseDepth]} />
        <meshStandardMaterial {...createCarbonFiberMaterial()} />
      </mesh>
    </group>
  );
};

// Main droid component that assembles all parts
const ParametricDroid: React.FC<ParametricDroidProps> = ({ 
  emotionalState = "neutral",
  showParticles = "none",
  hologramText = null,
  animation = "idle",
  interactive = false,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  onComplete
}) => {
  // Refs for animated elements
  const chestGlowRef = useRef<THREE.Mesh>(null);
  const headGlowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const shouldersRef = useRef<THREE.Group>(null);
  
  // Animation state
  const animationState = useRef({
    time: 0,
    walkCycle: 0,
    idlePhase: 0
  });
  
  // Handle animation completion callback
  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);
  
  // Animation for head and chest glow and body movements
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    animationState.current.time = time;
    
    if (chestGlowRef.current) {      
      // Pulse based on emotional state
      let pulseSpeed = 1.5;
      let pulseIntensity = 0.3;
      
      switch(emotionalState) {
        case "happy":
          pulseSpeed = 2.5;
          pulseIntensity = 0.5;
          break;
        case "thinking":
          pulseSpeed = 1.0;
          pulseIntensity = 0.2;
          break;
        case "alert":
          pulseSpeed = 4.0;
          pulseIntensity = 0.7;
          break;
        case "sad":
          pulseSpeed = 0.7;
          pulseIntensity = 0.2;
          break;
        case "confused":
          pulseSpeed = 1.8;
          pulseIntensity = 0.4;
          // Add subtle head rotation for confused state
          if (groupRef.current) {
            groupRef.current.rotation.z = Math.sin(time * 0.5) * 0.05;
          }
          break;
      }
      
      // Apply pulse to chest glow
      const chestMaterial = chestGlowRef.current.material as THREE.MeshStandardMaterial;
      if (chestMaterial.emissiveIntensity !== undefined) {
        chestMaterial.emissiveIntensity = 2 + Math.sin(time * pulseSpeed) * pulseIntensity;
      }
      
      // Apply pulse to head glow if it exists
      if (headGlowRef.current) {
        const headMaterial = headGlowRef.current.material as THREE.MeshStandardMaterial;
        if (headMaterial.emissiveIntensity !== undefined) {
          headMaterial.emissiveIntensity = 2 + Math.sin(time * pulseSpeed + 0.5) * pulseIntensity;
        }
      }
      
      // Subtle body movement for idle animation
      if (animation === "idle" && groupRef.current) {
        groupRef.current.position.y = Math.sin(time * 0.5) * 0.01;
        groupRef.current.rotation.y = Math.sin(time * 0.2) * 0.03;
        
        // Subtle breathing effect by scaling the chest
        if (shouldersRef.current) {
          const breathingScale = 1 + Math.sin(time * 0.8) * 0.01;
          shouldersRef.current.scale.set(breathingScale, breathingScale, breathingScale);
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* HEAD ASSEMBLY */}
      <group position={[0, 1.73, 0]}>
        {/* Main head dome using parametric sphere */}
        <ParametricHeadDome />
        
        {/* Head plating */}
        <ArmorPlating 
          baseWidth={0.18} 
          baseHeight={0.10} 
          baseDepth={0.06}
          position={[0, -0.06, 0.06]}
          rotation={[0.2, 0, 0]}
        />
        
        {/* Enhanced facial features with expressive LED matrix */}
        {/* Face plate */}
        <mesh position={[0, 0, 0.1]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.15, 0.08, 0.05]} />
          <meshStandardMaterial {...createMatteMaterial()} />
        </mesh>
        
        {/* Face plate trim */}
        <mesh position={[0, 0, 0.11]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.16, 0.09, 0.01]} />
          <meshStandardMaterial {...createCarbonFiberMaterial()} />
        </mesh>
        
        {/* Eyes glow - triangular UI display */}
        <group position={[0, 0.02, 0.13]}>
          {/* Main triangular glow */}
          <mesh ref={headGlowRef} rotation={[0.1, 0, 0]}>
            <shapeGeometry args={[createVShape(0.06, 0.025)]} />
            <meshStandardMaterial {...createGlowMaterial(3.0)} />
          </mesh>
          
          {/* Secondary glow for enhanced effect */}
          <mesh position={[0, 0, 0.001]} rotation={[0.1, 0, 0]}>
            <shapeGeometry args={[createVShape(0.05, 0.02)]} />
            <meshStandardMaterial 
              color="#FFFFFF" 
              emissive="#FFFFFF" 
              emissiveIntensity={1.8}
              transparent={true}
              opacity={0.8}
            />
          </mesh>
        </group>
        
        {/* Voice projector/speech panel */}
        <mesh position={[0, -0.04, 0.13]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.08, 0.01, 0.01]} />
          <meshStandardMaterial {...createGlowMaterial(1.0)} />
        </mesh>
        
        {/* LED matrix dots for expression */}
        {[0, 1, 2].map((row) => (
          [...Array(5)].map((_, col) => (
            <mesh 
              key={`led-${row}-${col}`}
              position={[
                -0.04 + col * 0.02, 
                -0.02 - row * 0.01,
                0.14
              ]}
              rotation={[0.1, 0, 0]}
            >
              <sphereGeometry args={[0.002, 8, 8]} />
              <meshStandardMaterial 
                color="#FFFFFF"
                emissive="#00FFFF"
                emissiveIntensity={row === 1 && (col === 1 || col === 3) ? 1.5 : 0.5}
              />
            </mesh>
          ))
        ))}
      </group>
      
      {/* NECK */}
      <group position={[0, 1.65, 0]}>
        <Neck />
      </group>
      
      {/* TORSO AND PELVIS */}
      <group ref={shouldersRef} position={[0, 1.2, 0]}>
        {/* Main torso */}
        <TorsoAndPelvis />
        
        {/* Torso armor plating */}
        <ArmorPlating 
          baseWidth={0.36} 
          baseHeight={0.30} 
          baseDepth={0.15}
          position={[0, 0.25, 0.05]}
        />
        
        {/* Enhanced torso armor plating */}
        <ArmorPlating 
          baseWidth={0.35} 
          baseHeight={0.28} 
          baseDepth={0.14}
          position={[0, -0.15, 0.02]}
        />
        
        {/* AI Reactor Core */}
        <group position={[0, 0.05, 0.15]}>
          {/* Core housing */}
          <mesh>
            <cylinderGeometry args={[0.12, 0.12, 0.06, 16]} />
            <meshStandardMaterial {...createCarbonFiberMaterial()} />
          </mesh>
          
          {/* Inner core glow */}
          <mesh ref={chestGlowRef} position={[0, 0, 0.01]}>
            <cylinderGeometry args={[0.08, 0.08, 0.08, 16]} />
            <meshStandardMaterial 
              color="#00FFFF" 
              emissive="#00FFFF" 
              emissiveIntensity={3.5}
              transparent={true}
              opacity={0.9}
            />
          </mesh>
          
          {/* Inner energy sphere */}
          <mesh position={[0, 0, 0.01]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial 
              color="#FFFFFF" 
              emissive="#FFFFFF" 
              emissiveIntensity={2.0}
              transparent={true}
              opacity={0.7}
            />
          </mesh>
          
          {/* Reactor rings */}
          {[0, 1, 2].map((ring) => (
            <mesh 
              key={`reactor-ring-${ring}`} 
              position={[0, 0, 0.01]} 
              rotation={[Math.PI/2, 0, ring * Math.PI/3]}
            >
              <torusGeometry args={[0.1, 0.005, 16, 32]} />
              <meshStandardMaterial {...createSteelMaterial()} />
            </mesh>
          ))}
        </group>
        
        {/* Chest glow V shape with layered effect */}
        <group position={[0, 0.3, 0.28]}>
          {/* Main glow */}
          <mesh>
            <shapeGeometry args={[createVShape(0.25, 0.2)]} />
            <meshStandardMaterial {...createGlowMaterial(2.5)} />
          </mesh>
          
          {/* Inner glow for enhanced effect */}
          <mesh position={[0, 0, 0.001]}>
            <shapeGeometry args={[createVShape(0.21, 0.16)]} />
            <meshStandardMaterial 
              color="#FFFFFF" 
              emissive="#FFFFFF" 
              emissiveIntensity={1.8}
              transparent={true}
              opacity={0.8}
            />
          </mesh>
        </group>
        
        {/* Indicator panels and status lights */}
        <group position={[0, 0.15, 0.26]}>
          {/* Left indicator panel */}
          <mesh position={[-0.15, 0, 0]}>
            <boxGeometry args={[0.08, 0.04, 0.01]} />
            <meshStandardMaterial {...createCarbonFiberMaterial()} />
          </mesh>
          
          {/* Right indicator panel */}
          <mesh position={[0.15, 0, 0]}>
            <boxGeometry args={[0.08, 0.04, 0.01]} />
            <meshStandardMaterial {...createCarbonFiberMaterial()} />
          </mesh>
          
          {/* Status lights */}
          {[-0.15, 0.15].map((x, idx) => (
            [...Array(3)].map((_, i) => (
              <mesh 
                key={`status-light-${idx}-${i}`}
                position={[x - 0.025 + i * 0.025, 0, 0.01]}
              >
                <sphereGeometry args={[0.006, 8, 8]} />
                <meshStandardMaterial 
                  color={i === 1 ? "#00FFFF" : (i === 0 ? "#00FF00" : "#FFFF00")}
                  emissive={i === 1 ? "#00FFFF" : (i === 0 ? "#00FF00" : "#FFFF00")}
                  emissiveIntensity={1.5}
                />
              </mesh>
            ))
          ))}
        </group>
        
        {/* Shoulder pads */}
        <ArmorPlating 
          baseWidth={0.18} 
          baseHeight={0.12} 
          baseDepth={0.12}
          position={[-0.25, 0.45, 0]}
          rotation={[0, 0, -0.3]}
        />
        
        <ArmorPlating 
          baseWidth={0.18} 
          baseHeight={0.12} 
          baseDepth={0.12}
          position={[0.25, 0.45, 0]}
          rotation={[0, 0, 0.3]}
        />
      </group>
      
      {/* SHOULDER AND ARM ASSEMBLY */}
      <group position={[0, 1.45, 0]}>
        {/* Shoulder armor plates - connect torso to arms */}
        <group>
          {/* Left shoulder connection */}
          <group position={[-0.28, 0.15, 0]}>
            <mesh rotation={[0, 0, Math.PI/4]}>
              <boxGeometry args={[0.15, 0.08, 0.12]} />
              <meshStandardMaterial {...createMatteMaterial()} />
            </mesh>
            
            {/* Connection joint */}
            <mesh position={[-0.06, 0, 0]}>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial {...createCarbonFiberMaterial()} />
            </mesh>
            
            {/* Hydraulic shoulder support */}
            <mesh position={[-0.03, 0.03, 0.05]} rotation={[0, -Math.PI/6, Math.PI/3]}>
              <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
              <meshStandardMaterial {...createSteelMaterial()} />
            </mesh>
          </group>
          
          {/* Right shoulder connection */}
          <group position={[0.28, 0.15, 0]}>
            <mesh rotation={[0, 0, -Math.PI/4]}>
              <boxGeometry args={[0.15, 0.08, 0.12]} />
              <meshStandardMaterial {...createMatteMaterial()} />
            </mesh>
            
            {/* Connection joint */}
            <mesh position={[0.06, 0, 0]}>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial {...createCarbonFiberMaterial()} />
            </mesh>
            
            {/* Hydraulic shoulder support */}
            <mesh position={[0.03, 0.03, 0.05]} rotation={[0, Math.PI/6, -Math.PI/3]}>
              <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
              <meshStandardMaterial {...createSteelMaterial()} />
            </mesh>
          </group>
        </group>
        
        {/* Arms */}
        <Arm side="left" position={[-0.32, 0, 0]} showGlow={showParticles !== "none"} />
        <Arm side="right" position={[0.32, 0, 0]} showGlow={showParticles !== "none"} />
      </group>
      
      {/* HIP AND LEG ASSEMBLY */}
      <group position={[0, 1.0, 0]}>
        {/* Hip connector - central pelvic assembly */}
        <group position={[0, 0, 0]}>
          {/* Central hip plate */}
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.25, 0.1, 0.18]} />
            <meshStandardMaterial {...createMatteMaterial()} />
          </mesh>
          
          {/* Hip joint frame - left */}
          <mesh position={[-0.12, -0.05, 0]} rotation={[0, 0, Math.PI/12]}>
            <boxGeometry args={[0.08, 0.12, 0.14]} />
            <meshStandardMaterial {...createCarbonFiberMaterial()} />
          </mesh>
          
          {/* Hip joint frame - right */}
          <mesh position={[0.12, -0.05, 0]} rotation={[0, 0, -Math.PI/12]}>
            <boxGeometry args={[0.08, 0.12, 0.14]} />
            <meshStandardMaterial {...createCarbonFiberMaterial()} />
          </mesh>
          
          {/* Hip armor plating - center bottom */}
          <mesh position={[0, -0.1, 0.07]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.2, 0.06, 0.04]} />
            <meshStandardMaterial {...createMatteMaterial()} />
          </mesh>
          
          {/* Hip armor decorative details - triangular pattern */}
          <mesh position={[0, -0.06, 0.1]} rotation={[0.2, 0, 0]}>
            <shapeGeometry args={[createVShape(0.1, 0.06)]} />
            <meshStandardMaterial {...createMatteMaterial()} />
          </mesh>
          
          {/* Hip glow accent */}
          {showParticles !== "none" && (
            <mesh position={[0, -0.06, 0.11]} rotation={[0.2, 0, 0]}>
              <shapeGeometry args={[createVShape(0.06, 0.03)]} />
              <meshStandardMaterial {...createGlowMaterial(1.2)} />
            </mesh>
          )}
        </group>
        
        {/* Legs */}
        <Leg side="left" position={[-0.14, 0, 0]} showGlow={showParticles !== "none"} />
        <Leg side="right" position={[0.14, 0, 0]} showGlow={showParticles !== "none"} />
      </group>
      
      {/* Optional hologram text */}
      {hologramText && (
        <Html position={[0, 2.0, 0]}>
          <div className="hologram-text" style={{
            color: '#00FFFF',
            fontSize: '14px',
            fontFamily: 'monospace',
            padding: '5px 10px',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '5px',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            transform: 'translateX(-50%)'
          }}>
            {hologramText}
          </div>
        </Html>
      )}
    </group>
  );
};

export default ParametricDroid;