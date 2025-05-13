"use client";

import React, { useRef, useState, useEffect, useMemo, useCallback, Suspense } from "react";
// Import THREE for direct use
import * as THREE from "three";
// Import Three.js hooks
import { useFrame, useThree } from '@react-three/fiber';
// Import hologram effects CSS module
import hologramStyles from '../styles/hologram-effects.module.css';
// Import custom components for robust rendering
import RobotTimeKeeper, { globalTimeRef, initializeTimeSystem } from './robot-timekeeper';
import ThreeJsErrorBoundary from './three-js-error-boundary';
import dynamic from 'next/dynamic';

// Dynamically import Three.js components to avoid SSR issues
const ThreeCanvas = dynamic(() => import('@react-three/fiber').then(mod => mod.Canvas), { ssr: false });
const ThreeEnvironment = dynamic(() => import('@react-three/drei').then(mod => mod.Environment), { ssr: false });
const Edges = dynamic(() => import('@react-three/drei').then(mod => mod.Edges), { ssr: false });
const ThreeHtml = dynamic(() => import('@react-three/drei').then(mod => mod.Html), { ssr: false });
const ThreeContactShadows = dynamic(() => import('@react-three/drei').then(mod => mod.ContactShadows), { ssr: false });
const ThreePresentationControls = dynamic(() => import('@react-three/drei').then(mod => mod.PresentationControls), { ssr: false });
const ThreeEffectComposer = dynamic(() => import('@react-three/postprocessing').then(mod => mod.EffectComposer), { ssr: false });
const ThreeBloom = dynamic(() => import('@react-three/postprocessing').then(mod => mod.Bloom), { ssr: false });
const ThreeChromaticAberration = dynamic(() => import('@react-three/postprocessing').then(mod => mod.ChromaticAberration), { ssr: false });
const ThreeNoise = dynamic(() => import('@react-three/postprocessing').then(mod => mod.Noise), { ssr: false });
const ThreeDepthOfField = dynamic(() => import('@react-three/postprocessing').then(mod => mod.DepthOfField), { ssr: false });

// Client-side renderer component props type
interface ClientSideRendererProps {
  dimensions: any;
  performanceSettings: any;
  currentSequence: string | null;
  emotionalState: string;
  showParticles: string;
  hologramText: string | null;
  animate: boolean;
  interactive: boolean;
  onAnimationComplete?: () => void;
  cursorPosition: any;
}

// Client-side only renderer component - properly typed as React component
const ClientSideRendererComponent = ({ 
  dimensions, 
  performanceSettings, 
  currentSequence, 
  emotionalState, 
  showParticles, 
  hologramText, 
  animate, 
  interactive,
  onAnimationComplete,
  cursorPosition 
}: ClientSideRendererProps) => {
  return (
    <ThreeCanvas
      shadows={performanceSettings.shadows}
      dpr={performanceSettings.pixelRatio}
      camera={{ position: [0, 0.5, 2.5], fov: 45 }}
      gl={{ antialias: true }}
    >
      {/* Enhanced environment and lighting system */}
      {performanceSettings.environment && (
        <ThreeEnvironment
          preset="studio"
          background={false}
          blur={0.65} // Slight blur to soften reflections
        />
      )}
      
      {/* Main key light with enhanced shadows */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.7}
        castShadow
        shadow-mapSize={[2048, 2048]} // Higher resolution shadows
        shadow-bias={-0.0001} // Reduce shadow acne
        color="#ffffff"
      >
        <orthographicCamera 
          attach="shadow-camera" 
          args={[-10, 10, 10, -10, 0.1, 50]} // Better shadow coverage
        />
      </directionalLight>
      
      {/* Fill light for softer illumination of dark areas */}
      <directionalLight
        position={[-5, 3, 0]}
        intensity={0.6}
        color="#b0d0ff" // Slightly blue fill light
      />
      
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} color="#d0d0e0" />
      
      {/* Rim light to highlight edges with colored tint */}
      <spotLight
        position={[-7, 5, -5]}
        intensity={0.7}
        angle={0.5}
        penumbra={0.8} // Softer edge falloff
        color="#80a0ff" // Cooler blue rim light
        castShadow
      />
      
      {/* Top accent light for highlights */}
      <spotLight
        position={[0, 10, 0]}
        intensity={0.8}
        angle={0.4}
        penumbra={0.9}
        distance={20}
        color="#ffffff"
      />
      
      {/* Subtle ground bounce light */}
      <pointLight
        position={[0, -0.5, 0]}
        intensity={0.15}
        color="#8080a0"
        distance={5}
      />
      
      {/* Global animation timekeeper component */}
      <RobotTimeKeeper 
        isPaused={!animate}
        timeScale={1.0}
        onTick={(elapsedTime) => {
          // Optional time-based updates can be handled here
        }}
      />
      
      {/* Robot model */}
      <RobotModel 
        currentSequence={currentSequence}
        emotionalState={emotionalState}
        showParticles={showParticles}
        hologramText={hologramText}
        animate={animate}
        onAnimationComplete={onAnimationComplete}
        cursorPosition={cursorPosition}
      />
      
      {/* Enhanced ground shadow with better quality */}
      <ThreeContactShadows
        position={[0, -1, 0]}
        opacity={0.7}
        scale={15}
        blur={2.5}
        far={10}
        resolution={512} // Higher resolution shadows
        color="#000420" // Slightly blue-tinted shadow for cooler appearance
      />
      
      {/* Extra subtle floor plane for reflections */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -1.001, 0]} 
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshPhysicalMaterial 
          color="#050505"
          metalness={0.2}
          roughness={0.8}
          reflectivity={0.2}
          clearcoat={0.1}
          clearcoatRoughness={0.8}
          envMapIntensity={0.3}
        />
      </mesh>
      
      {/* Camera controls if interactive */}
      {interactive && (
        <ThreePresentationControls
          global
          zoom={0.8}
          rotation={[0, 0, 0]}
          polar={[-Math.PI / 4, Math.PI / 4]}
          azimuth={[-Math.PI / 4, Math.PI / 4]}
        >
          <group position={[0, -1, 0]} />
        </ThreePresentationControls>
      )}
      
      {/* Advanced post-processing effects for photorealistic quality */}
      {performanceSettings.postProcessing && (
        <ThreeEffectComposer>
          {/* Enhanced multi-layer bloom effect with settings that adapt to emotional state */}
          <ThreeBloom
            kernelSize={emotionalState === "alert" ? 2 : 3} // Sharper bloom for alert, smoother for others
            luminanceThreshold={
              emotionalState === "happy" ? 0.5 : // Lower threshold for happy (more bloom)
              emotionalState === "sad" ? 0.7 : // Higher threshold for sad (less bloom)
              emotionalState === "alert" ? 0.55 : // Lower for alert (more noticeable glow)
              emotionalState === "thinking" ? 0.65 : // Balanced for thinking
              emotionalState === "confused" ? 0.6 : // Standard for confused
              0.6 // Default threshold
            }
            luminanceSmoothing={
              emotionalState === "happy" ? 0.8 : // Less smooth for more vibrant glow
              emotionalState === "sad" ? 0.95 : // Very smooth for subtle, soft glow
              emotionalState === "alert" ? 0.7 : // Harder edges for sharp alert state
              emotionalState === "thinking" ? 0.85 : // Clean, focused glow
              emotionalState === "confused" ? 0.9 : // Standard smoothing
              0.9 // Default smoothing
            }
            height={480} // Higher resolution bloom
            intensity={
              emotionalState === "happy" ? 1.5 : // Brighter for happy
              emotionalState === "sad" ? 0.9 : // Dimmer for sad
              emotionalState === "alert" ? 1.7 : // Brightest for alert state
              emotionalState === "thinking" ? 1.3 : // Slightly enhanced for thinking
              emotionalState === "confused" ? 1.2 : // Standard intensity
              1.2 // Default intensity
            }
            // Use multi-layer bloom for more sophisticated light effects
            levels={5} // More levels for better light dispersion
            radius={
              emotionalState === "happy" ? 0.8 : // More spread for happy
              emotionalState === "sad" ? 0.6 : // Less spread for sad
              emotionalState === "alert" ? 0.75 : // Balanced spread for alert
              emotionalState === "thinking" ? 0.65 : // Focused glow for thinking
              emotionalState === "confused" ? 0.9 : // More diffuse for confused
              0.7 // Default radius
            }
            opacity={
              emotionalState === "happy" ? 0.8 : // More visible for happy
              emotionalState === "sad" ? 0.5 : // Less visible for sad
              emotionalState === "alert" ? 0.9 : // Most visible for alert
              emotionalState === "thinking" ? 0.7 : // Standard for thinking
              emotionalState === "confused" ? 0.75 : // Slightly enhanced for confused
              0.7 // Default opacity
            }
            // Color tint based on emotional state for more expressive bloom
            // Removed blendMode property to fix "getShaderCode is not a function" error
            mipmapBlur={true} // Enable mipmap blur for more realistic bloom
          />
          
          {/* Secondary high-energy bloom layer - only active for alert, happy and confused states */}
          {(emotionalState === "alert" || emotionalState === "happy" || emotionalState === "confused") && (
            <ThreeBloom
              kernelSize={2} // Sharper kernel for intense points
              luminanceThreshold={
                emotionalState === "alert" ? 0.85 : // Higher threshold for alert - only brightest points
                emotionalState === "happy" ? 0.8 : // Slightly lower for happy - more bright points
                0.82 // Default for confused - selective bright points
              }
              luminanceSmoothing={0.5} // Less smoothing for sharper points
              height={350} // Lower resolution for performance
              intensity={
                emotionalState === "alert" ? 2.0 : // Intense for alert
                emotionalState === "happy" ? 1.8 : // Strong for happy
                1.7 // Default for confused
              }
              levels={3} // Fewer levels for more focused effect
              radius={0.4} // Tighter radius for pinpoint highlights
              opacity={
                emotionalState === "alert" ? 0.7 : // More visible for alert
                emotionalState === "happy" ? 0.6 : // Medium for happy
                0.5 // Default for confused
              }
              // Removed blendMode property to fix "getShaderCode is not a function" error
            />
          )}
          
          {/* Enhanced chromatic aberration with sophisticated emotional response patterns */}
          <ThreeChromaticAberration
            offset={[
              emotionalState === "happy" ? 0.0025 : // More vibrant for happy - joyful energy
              emotionalState === "sad" ? 0.0008 : // Very minimal for sad - emotional restraint
              emotionalState === "alert" ? 0.0035 : // Maximum for alert - urgent visual cue
              emotionalState === "thinking" ? 0.0012 : // Precise for thinking - focused attention
              emotionalState === "confused" ? 0.0028 : // Erratic for confused - perceptual distortion
              0.0015, // Default x offset
              
              emotionalState === "happy" ? 0.0028 : // Strong vertical spread for happy - expansive joy
              emotionalState === "sad" ? 0.0006 : // Minimal vertical spread for sad - emotional withdrawal
              emotionalState === "alert" ? 0.004 : // Extreme spread for alert - attention-grabbing warning
              emotionalState === "thinking" ? 0.001 : // Precise minimal spread - analytical focus
              emotionalState === "confused" ? 0.0032 : // Exaggerated spread - cognitive dissonance
              0.0015 // Default y offset
            ]} 
            radialModulation={
              emotionalState === "happy" || 
              emotionalState === "alert" || 
              emotionalState === "confused"
            } 
            modulationOffset={
              emotionalState === "happy" ? 0.65 : // Strong outward modulation - radiating positive energy
              emotionalState === "sad" ? 0.35 : // Minimal modulation - emotional containment
              emotionalState === "alert" ? 0.85 : // Maximum modulation - urgent visual distortion
              emotionalState === "thinking" ? 0.45 : // Moderate modulation - balanced cognitive state
              emotionalState === "confused" ? 0.7 : // High irregular modulation - perceptual uncertainty
              0.5 // Default modulation
            }
          />
          
          {/* Advanced film grain with cinematic parameters and emotion-driven visual styling */}
          <ThreeNoise
            opacity={
              emotionalState === "happy" ? 0.022 : // Minimal noise for happy - clean, joyful clarity
              emotionalState === "sad" ? 0.058 : // Heavy grain for sad - vintage film, melancholic aesthetic
              emotionalState === "alert" ? 0.018 : // Very minimal for alert - sharp warning clarity
              emotionalState === "thinking" ? 0.032 : // Moderate for thinking - analytical focus with slight texture
              emotionalState === "confused" ? 0.065 : // Maximum grain for confused - visual uncertainty, cognitive noise
              0.03 // Default balanced film grain
            }
            premultiply={
              emotionalState === "happy" || 
              emotionalState === "thinking" || 
              emotionalState === "neutral"
            }
            frameRate={
              emotionalState === "happy" ? 24 : // Classic film frame rate for happy - nostalgic warmth
              emotionalState === "sad" ? 18 : // Slower frame rate for sad - dramatic, heavy atmosphere
              emotionalState === "alert" ? 30 : // Faster frame rate for alert - modern, crisp presentation
              emotionalState === "thinking" ? 24 : // Standard film rate for thinking - balanced
              emotionalState === "confused" ? 16 : // Lowest frame rate for confused - stuttering uncertainty
              24 // Default cinematic frame rate
            }
          />
          
          {/* Physically accurate depth of field with cinematic quality and emotion-specific visual signatures */}
          <ThreeDepthOfField
            focusDistance={
              emotionalState === "happy" ? 2.2 : // Closer focus for happy - intimate, engaged presence
              emotionalState === "sad" ? 2.9 : // Distant focus for sad - emotional detachment, isolation
              emotionalState === "alert" ? 1.9 : // Very close focus for alert - immediate threat perception
              emotionalState === "thinking" ? 2.5 : // Medium focus for thinking - analytical distance
              emotionalState === "confused" ? 3.0 : // Furthest focus for confused - cognitive dissonance
              2.4 // Default balanced focus distance
            }
            focalLength={
              emotionalState === "happy" ? 0.012 : // Sharper overall for happy - clear, positive perception
              emotionalState === "sad" ? 0.035 : // Very soft focus for sad - dreamlike melancholy
              emotionalState === "alert" ? 0.006 : // Extremely sharp for alert - hypervigilant clarity
              emotionalState === "thinking" ? 0.018 : // Moderate focus for thinking - selective attention
              emotionalState === "confused" ? 0.04 : // Maximum blur for confused - perceptual uncertainty
              0.02 // Default focal length
            }
            bokehScale={
              emotionalState === "happy" ? 2.8 : // Large bokeh for happy - aesthetic "dreamy" highlights
              emotionalState === "sad" ? 3.5 : // Maximum bokeh for sad - dramatic emotional effect
              emotionalState === "alert" ? 0.8 : // Minimal bokeh for alert - tactical clarity
              emotionalState === "thinking" ? 1.8 : // Moderate bokeh for thinking - balanced aesthetics
              emotionalState === "confused" ? 3.2 : // Large irregular bokeh for confused - disorienting
              2.0 // Default bokeh scale
            }
            height={720} // Higher resolution for more precise depth mapping
            width={1280} // Widescreen aspect matching for consistency
          />
        </ThreeEffectComposer>
      )}
    </ThreeCanvas>
  );
};

// Create a dynamic version of our renderer component
const ClientSideRenderer = dynamic(() => Promise.resolve(ClientSideRendererComponent), { ssr: false });

// Animation sequences for the robot
export const ANIMATION_SEQUENCES = {
  IDLE: "idle",
  GREETING: "greeting",
  WAVE: "wave",
  WALK: "walk",
  BUILD: "build",
  REPAIR: "repair",
  SCAN: "scan",
  THINK: "think",
  HOLOGRAM: "hologram",
  SURPRISED: "surprised",
  ALERT: "alert",
  HAPPY: "happy",
  SAD: "sad",
  CONFUSED: "confused",
  TYPING: "typing",
  PROCESSING: "processing"
};

// Component properties with expanded animation options
interface AstroBotMascot3DProps {
  size?: "small" | "default" | "large" | "xlarge";
  showText?: boolean;
  animate?: boolean;
  showParticles?: "none" | "temporary" | "typing" | "intense";
  animationSequence?: string | null;
  hologramText?: string | null;
  interactive?: boolean;
  emotionalState?: "neutral" | "happy" | "thinking" | "alert" | "sad" | "confused";
  onAnimationComplete?: () => void;
  onInteraction?: (type: string) => void;
  highQuality?: boolean;
}

// Main component
const AstroBotMascot3D = ({
  size = "default",
  showText = false,
  animate = true,
  showParticles = "none",
  animationSequence = null,
  hologramText = null,
  interactive = true,
  emotionalState = "neutral",
  onAnimationComplete,
  onInteraction,
  highQuality = false
}: AstroBotMascot3DProps) => {
  // Calculate dimensions based on size
  const dimensions = {
    small: { width: 150, height: 250 },
    default: { width: 300, height: 500 },
    large: { width: 450, height: 750 },
    xlarge: { width: 600, height: 1000 }
  }[size];

  // Animation state
  const [currentSequence, setCurrentSequence] = useState<string | null>(animationSequence || ANIMATION_SEQUENCES.IDLE);
  const [hovering, setHovering] = useState(false);

  // Handle animation sequence changes
  useEffect(() => {
    if (animationSequence) {
      setCurrentSequence(animationSequence);
    }
  }, [animationSequence]);

  // Enhanced mouse interaction with cursor tracking for interactivity
  // State for tracking cursor position relative to robot
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  
  // Mouse interaction handlers with enhanced tracking
  const handleMouseEnter = () => {
    setHovering(true);
    if (onInteraction) onInteraction("hover_start");
  };

  const handleMouseLeave = () => {
    setHovering(false);
    setCursorPosition({ x: 0, y: 0 }); // Reset cursor position
    if (onInteraction) onInteraction("hover_end");
  };
  
  // Track mouse movement for gaze following and proximity reactions
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!interactive) return;
    
    // Get container dimensions for relative positioning
    const container = event.currentTarget as HTMLDivElement;
    const rect = container.getBoundingClientRect();
    
    // Calculate normalized position (-1 to 1) for easy mapping to rotations
    const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const normalizedY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update cursor position for animation frame usage
    setCursorPosition({ 
      x: normalizedX,
      y: normalizedY 
    });
    
    // Additional interaction event for advanced usage
    if (onInteraction) onInteraction("hover_move");
  };

  // Performance settings based on quality option, safe for SSR
  const performanceSettings = useMemo(() => {
    if (highQuality) {
      return {
        shadows: true,
        environment: true,
        postProcessing: true,
        pixelRatio: 2 // Default high quality
      };
    } else {
      return {
        shadows: true, 
        environment: true,
        postProcessing: false,
        pixelRatio: 1.5 // Default standard quality
      };
    }
  }, [highQuality]);

  // Create a simple fallback for server-side rendering
  const Fallback = () => (
    <div 
      className="flex items-center justify-center bg-gradient-to-b from-gray-900 to-blue-900" 
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <div className="text-blue-300 animate-pulse">Loading Robot...</div>
    </div>
  );

  return (
    <div
      style={{ width: dimensions.width, height: dimensions.height, position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className="robot-container cursor-pointer"
    >
      <Suspense fallback={<Fallback />}>
        <ClientSideRenderer 
          dimensions={dimensions}
          performanceSettings={performanceSettings}
          currentSequence={currentSequence}
          emotionalState={emotionalState}
          showParticles={showParticles}
          hologramText={hologramText}
          animate={animate}
          interactive={interactive}
          onAnimationComplete={onAnimationComplete}
          cursorPosition={cursorPosition}
        />
      </Suspense>
      
      {/* Optional text display */}
      {showText && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-center font-mono text-blue-400">
          <span>{currentSequence || "idle"}</span>
        </div>
      )}
    </div>
  );
};

// Robot model component (placeholder - would be replaced with actual GLTF model)
const RobotModel = ({ 
  currentSequence, 
  emotionalState, 
  showParticles, 
  hologramText, 
  animate, 
  onAnimationComplete,
  cursorPosition
}: {
  currentSequence: string | null;
  emotionalState: string;
  showParticles: string;
  hologramText: string | null;
  animate: boolean;
  onAnimationComplete?: () => void;
  cursorPosition: { x: number; y: number };
}) => {
  const group = useRef<THREE.Group>(null);
  // Use globalTimeRef instead of the Three.js clock for consistent timing
  // This prevents animation timing issues during hydration
  
  // Add animation transition state management
  const [prevSequence, setPrevSequence] = useState<string | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(1); // 0-1, 1 means fully transitioned
  const [transitionStartTime, setTransitionStartTime] = useState(0);
  
  // Use globalTimeRef for consistent animations across components
  const getElapsedTime = useCallback(() => {
    return globalTimeRef.current.value;
  }, []);
  interface PoseSnapshot {
    position: {x: number, y: number, z: number},
    rotation: {x: number, y: number, z: number},
    parts: {
      head?: {rotation: {x: number, y: number, z: number}} | undefined,
      leftArm?: {rotation: {x: number, y: number, z: number}} | undefined,
      rightArm?: {rotation: {x: number, y: number, z: number}} | undefined,
      leftLeg?: {rotation: {x: number, y: number, z: number}} | undefined,
      rightLeg?: {rotation: {x: number, y: number, z: number}} | undefined,
    }
  }
  
  const [initialPoseSnapshot, setInitialPoseSnapshot] = useState<PoseSnapshot | null>(null);
  
  // Transition configuration
  const TRANSITION_DURATION = 0.5; // seconds
  
  // Effect to detect animation sequence changes and start transitions
  useEffect(() => {
    if (currentSequence !== prevSequence && group.current) {
      // Take a snapshot of current pose before transitioning
      const snapshot = {
        position: {
          x: group.current.position.x || 0,
          y: group.current.position.y || 0,
          z: group.current.position.z || 0
        },
        rotation: {
          x: group.current.rotation.x || 0,
          y: group.current.rotation.y || 0,
          z: group.current.rotation.z || 0
        },
        parts: {
          head: undefined,
          leftArm: undefined,
          rightArm: undefined,
          leftLeg: undefined,
          rightLeg: undefined
        }
      };
      
      // Capture individual part positions
      if (group.current.children[0]) { // Head
        const head = group.current.children[0] as THREE.Mesh;
        snapshot.parts.head = {
          rotation: {
            x: head.rotation.x || 0,
            y: head.rotation.y || 0,
            z: head.rotation.z || 0
          }
        };
      }
      
      if (group.current.children[1]) { // Left arm
        const leftArm = group.current.children[1] as THREE.Mesh;
        snapshot.parts.leftArm = {
          rotation: {
            x: leftArm.rotation.x || 0,
            y: leftArm.rotation.y || 0,
            z: leftArm.rotation.z || 0
          }
        };
      }
      
      if (group.current.children[2]) { // Right arm
        const rightArm = group.current.children[2] as THREE.Mesh;
        snapshot.parts.rightArm = {
          rotation: {
            x: rightArm.rotation.x || 0,
            y: rightArm.rotation.y || 0,
            z: rightArm.rotation.z || 0
          }
        };
      }
      
      if (group.current.children[3]) { // Left leg
        const leftLeg = group.current.children[3] as THREE.Mesh;
        snapshot.parts.leftLeg = {
          rotation: {
            x: leftLeg.rotation.x || 0,
            y: leftLeg.rotation.y || 0,
            z: leftLeg.rotation.z || 0
          }
        };
      }
      
      if (group.current.children[4]) { // Right leg
        const rightLeg = group.current.children[4] as THREE.Mesh;
        snapshot.parts.rightLeg = {
          rotation: {
            x: rightLeg.rotation.x || 0,
            y: rightLeg.rotation.y || 0,
            z: rightLeg.rotation.z || 0
          }
        };
      }
      
      // Start transition
      setInitialPoseSnapshot(snapshot);
      setTransitionProgress(0);
      setTransitionStartTime(getElapsedTime());
      setPrevSequence(currentSequence);
    }
  }, [currentSequence, prevSequence, getElapsedTime]);
  
  // Enhanced robot colors and material properties using advanced PBR settings
  const colors = useMemo(() => {
    // Base color palette with metallic space-age appearance
    const baseColors = {
      body: new THREE.Color("#E8ECEF"),     // Slightly lighter/whiter base for higher contrast
      joints: new THREE.Color("#9CA3AF"),   // Neutral joint color
      accent: new THREE.Color("#3B82F6"),   // Primary blue accent
      eyes: new THREE.Color("#10B981"),     // Default teal eyes
      energyCore: new THREE.Color("#3B82F6"), // Default blue energy core
    };
    
    // PBR material properties with realistic values
    const pbrProperties = {
      body: {
        roughness: 0.15,       // Polished metal finish
        metalness: 0.85,       // High metalness for robot body
        envMapIntensity: 1.2,  // Slightly enhanced reflections
        clearcoat: 0.5,        // Subtle clearcoat layer
        clearcoatRoughness: 0.2, // Slightly textured clearcoat
      },
      joints: {
        roughness: 0.4,        // More matte for joints
        metalness: 0.6,        // Less metallic than body
        envMapIntensity: 0.9,  // Standard reflections
      },
      accent: {
        roughness: 0.1,        // Very smooth for accent parts
        metalness: 0.9,        // Highly metallic for accent features
        envMapIntensity: 1.5,  // Enhanced reflections for accents
        emissive: 0.15,        // Slight glow on accent parts
      },
      eyes: {
        roughness: 0.05,       // Almost mirror-like
        metalness: 0.2,        // Low metalness for glass-like eyes
        envMapIntensity: 1.8,  // High reflectivity
        emissive: 0.6,         // Strong glow for eyes
        transmission: 0.4,     // Partial transparency
      },
      energyCore: {
        roughness: 0.1,        // Smooth energy core
        metalness: 0.3,        // Low metalness for energy effect
        envMapIntensity: 1.3,  // Enhanced reflections
        emissive: 0.8,         // Strong glow
        transmission: 0.7,     // High transparency
      }
    };
    
    // Material property settings based on emotional state
    const materialProperties = {
      // Default/neutral state - balanced PBR properties
      neutral: {
        body: { ...pbrProperties.body },
        joints: { ...pbrProperties.joints },
        accent: { ...pbrProperties.accent },
        eyes: { ...pbrProperties.eyes },
        energyCore: { ...pbrProperties.energyCore },
      },
      
      // Happy state - brighter, more vibrant, slightly more reflective
      happy: {
        body: { 
          ...pbrProperties.body,
          roughness: 0.12,       // Smoother, more polished
          metalness: 0.9,        // More metallic
          envMapIntensity: 1.4,  // More reflective
          clearcoat: 0.7,        // Enhanced clearcoat
        },
        joints: {
          ...pbrProperties.joints,
          roughness: 0.35,       // Smoother joints
          metalness: 0.65,       // Slightly more metallic
        },
        accent: {
          ...pbrProperties.accent,
          roughness: 0.08,       // Very smooth
          emissive: 0.25,        // Enhanced glow
          envMapIntensity: 1.7,  // More reflective
        },
        eyes: {
          ...pbrProperties.eyes,
          emissive: 0.8,         // Brighter eyes
          transmission: 0.5,     // More transparent
        },
        energyCore: {
          ...pbrProperties.energyCore,
          emissive: 1.0,         // Maximum glow
          transmission: 0.8,     // More transparent
        },
      },
      
      // Sad state - duller, less reflective, more matte
      sad: {
        body: { 
          ...pbrProperties.body,
          roughness: 0.25,       // More matte, less polished
          metalness: 0.7,        // Less metallic
          envMapIntensity: 0.9,  // Less reflective
          clearcoat: 0.3,        // Reduced clearcoat
        },
        joints: {
          ...pbrProperties.joints,
          roughness: 0.5,        // More matte joints
          metalness: 0.5,        // Less metallic
        },
        accent: {
          ...pbrProperties.accent,
          roughness: 0.2,        // Less smooth
          emissive: 0.1,         // Reduced glow
          envMapIntensity: 1.2,  // Less reflective
        },
        eyes: {
          ...pbrProperties.eyes,
          emissive: 0.4,         // Dimmer eyes
          transmission: 0.3,     // Less transparent
        },
        energyCore: {
          ...pbrProperties.energyCore,
          emissive: 0.6,         // Reduced glow
          transmission: 0.5,     // Less transparent
        },
      },
      
      // Alert state - sharper, more intense, high contrast
      alert: {
        body: { 
          ...pbrProperties.body,
          roughness: 0.13,       // Sharper finish
          metalness: 0.85,       // Standard metalness
          envMapIntensity: 1.3,  // Enhanced reflections
          clearcoat: 0.6,        // Enhanced clearcoat
        },
        joints: {
          ...pbrProperties.joints,
          roughness: 0.35,       // Sharper joints
          metalness: 0.7,        // More metallic for joints
        },
        accent: {
          ...pbrProperties.accent,
          roughness: 0.07,       // Very smooth
          emissive: 0.3,         // Enhanced glow for warning
          envMapIntensity: 1.6,  // More reflective
        },
        eyes: {
          ...pbrProperties.eyes,
          emissive: 0.9,         // Very bright eyes
          transmission: 0.35,    // Less transparent for intensity
        },
        energyCore: {
          ...pbrProperties.energyCore,
          emissive: 0.9,         // Very bright core
          transmission: 0.6,     // Moderate transparency
        },
      },
      
      // Thinking state - balanced, slightly enhanced reflection for processing
      thinking: {
        body: { 
          ...pbrProperties.body,
          roughness: 0.16,       // Standard finish
          metalness: 0.83,       // Slightly less metallic
          envMapIntensity: 1.1,  // Standard reflections
          clearcoat: 0.5,        // Standard clearcoat
        },
        joints: {
          ...pbrProperties.joints,
          roughness: 0.42,       // Standard joints
          metalness: 0.62,       // Standard metalness
        },
        accent: {
          ...pbrProperties.accent,
          roughness: 0.09,       // Very smooth
          emissive: 0.2,         // Moderate glow
          envMapIntensity: 1.55, // Enhanced reflections for processing
        },
        eyes: {
          ...pbrProperties.eyes,
          emissive: 0.7,         // Bright eyes for focus
          transmission: 0.45,    // Moderate transparency
        },
        energyCore: {
          ...pbrProperties.energyCore,
          emissive: 0.85,        // Enhanced glow for processing
          transmission: 0.75,    // Enhanced transparency for activity
        },
      },
      
      // Confused state - uneven, mixed properties
      confused: {
        body: { 
          ...pbrProperties.body,
          roughness: 0.2,        // More matte than normal
          metalness: 0.8,        // Slightly less metallic
          envMapIntensity: 1.0,  // Standard reflections
          clearcoat: 0.4,        // Reduced clearcoat
        },
        joints: {
          ...pbrProperties.joints,
          roughness: 0.45,       // More matte joints
          metalness: 0.55,       // Less metallic
        },
        accent: {
          ...pbrProperties.accent,
          roughness: 0.15,       // Less smooth
          emissive: 0.18,        // Fluctuating glow
          envMapIntensity: 1.4,  // Standard reflections
        },
        eyes: {
          ...pbrProperties.eyes,
          emissive: 0.5,         // Moderate glow
          transmission: 0.35,    // Reduced transparency
        },
        energyCore: {
          ...pbrProperties.energyCore,
          emissive: 0.7,         // Reduced glow
          transmission: 0.65,    // Moderate transparency
        },
      },
      // Legacy values - will be migrated to PBR properties
      legacy: {
        eyeEmissiveIntensity: 2.5,
        eyeOpacity: 0.9,
        energyCoreEmissiveIntensity: 3.0,
        energyCoreTransmission: 0.4,
        bodyMetalness: 0.85,
        bodyRoughness: 0.25
      },
      // Other emotional states modify these properties
    };
    
    // Modify colors and material properties based on emotional state
    switch(emotionalState) {
      case "happy":
        return {
          ...baseColors,
          eyes: new THREE.Color("#34D399"),        // Brighter green
          energyCore: new THREE.Color("#60A5FA"),  // Lighter blue - more energetic
          // Happy state has more vibrant, energetic appearance
          eyeEmissiveIntensity: 3.0,               // Brighter eyes
          eyeOpacity: 0.95,                        // More solid eyes
          energyCoreEmissiveIntensity: 3.5,        // Stronger energy glow
          energyCoreTransmission: 0.5,             // More transmission
          bodyMetalness: 0.9,                      // Slightly more reflective
          bodyRoughness: 0.2,                      // Smoother/shinier surface
          // Include advanced PBR material settings
          materials: materialProperties.happy,     // Comprehensive happy state PBR settings
        };
      
      case "thinking":
        return {
          ...baseColors,
          eyes: new THREE.Color("#0EA5E9"),        // Blue eyes for calculation/processing
          accent: new THREE.Color("#6366F1"),      // Purple-tinted accent for intellectual look
          // Thinking state has focused, computational appearance
          eyeEmissiveIntensity: 2.0,               // Slightly dimmer, focused eyes
          eyeOpacity: 0.85,                        // Slightly more transparent 
          energyCoreEmissiveIntensity: 4.0,        // Stronger core processing power
          energyCoreTransmission: 0.6,             // More energy transmission
          energyCorePulseFrequency: 2.5,           // Faster thinking pulse
          bodyMetalness: 0.85,                     
          bodyRoughness: 0.3,                      // Slightly rougher for focused look
        };
      
      case "alert":
        return {
          ...baseColors,
          eyes: new THREE.Color("#F59E0B"),        // Amber alert eyes
          accent: new THREE.Color("#EF4444"),      // Red accent for warning
          energyCore: new THREE.Color("#F87171"),  // Red-tinted core for alert state
          // Alert state has urgent, attention-grabbing appearance
          eyeEmissiveIntensity: 4.0,               // Very bright alert eyes
          eyeOpacity: 1.0,                         // Fully solid eyes
          energyCoreEmissiveIntensity: 5.0,        // Maximum energy output
          energyCoreTransmission: 0.3,             // Less transmission - more solid appearance
          energyCorePulseFrequency: 4.0,           // Rapid alert pulsing
          bodyMetalness: 0.95,                     // High reflectivity for alert visibility
          bodyRoughness: 0.15,                     // Smoother surface for alert state
        };
      
      case "sad":
        return {
          ...baseColors,
          eyes: new THREE.Color("#6B7280"),        // Gray, dimmed eyes
          energyCore: new THREE.Color("#93C5FD"),  // Lighter, cooler core
          accent: new THREE.Color("#4B5563"),      // Darker accent for somber mood
          // Sad state has subdued, lower-energy appearance
          eyeEmissiveIntensity: 1.5,               // Dimmer eyes
          eyeOpacity: 0.7,                         // More transparent eyes
          energyCoreEmissiveIntensity: 2.0,        // Lower energy output
          energyCoreTransmission: 0.35,            // Less energetic transmission
          energyCorePulseFrequency: 0.75,          // Slower, subdued pulsing
          bodyMetalness: 0.7,                      // Less reflective
          bodyRoughness: 0.4,                      // Rougher, less polished appearance
        };
      
      case "confused":
        return {
          ...baseColors,
          eyes: new THREE.Color("#8B5CF6"),        // Purple questioning eyes
          energyCore: new THREE.Color("#A78BFA"),  // Purple-tinted uncertain energy
          // Confused state has inconsistent, variable appearance
          eyeEmissiveIntensity: 2.5,               // Normal brightness but unusual color
          eyeOpacity: 0.8,                         // Slightly uncertain transparency
          energyCoreEmissiveIntensity: 3.0,        // Normal energy but unusual pattern
          energyCoreTransmission: 0.45,            // Slightly irregular transmission
          energyCorePulseFrequency: 1.5,           // Irregular pulsing pattern
          bodyMetalness: 0.8,                      
          bodyRoughness: 0.35,                     // Slightly more textured
          irregularPulse: true,                    // Flag for irregular pulsing pattern
        };
      
      default:
        return {
          ...baseColors,
          ...materialProperties.neutral
        };
    }
  }, [emotionalState]);
  
  // Animation timing with cursor-based interactivity and transitions
  useFrame((state) => {
    if (!animate || !group.current) return;
    
    // Use globalTimeRef instead of state.clock for stable animations
    // This prevents hydration mismatches and keeps consistent timing
    const time = globalTimeRef.current.value;
    
    // Update transition progress if in transition
    if (transitionProgress < 1) {
      const elapsedTransitionTime = time - transitionStartTime;
      const newProgress = Math.min(1, elapsedTransitionTime / TRANSITION_DURATION);
      
      // Use easing function for smoother transition (cubic ease-in-out)
      const easedProgress = newProgress < 0.5
        ? 4 * newProgress * newProgress * newProgress
        : 1 - Math.pow(-2 * newProgress + 2, 3) / 2;
      
      setTransitionProgress(easedProgress);
    }
    
    // Define a helper function for blending values during transitions
    const blendValue = (startValue: number, targetValue: number): number => {
      if (transitionProgress >= 1 || !initialPoseSnapshot) {
        return targetValue; // If transition complete, use target value directly
      }
      
      // Blend between start and target values based on transition progress
      return startValue + (targetValue - startValue) * transitionProgress;
    };
    
    // Enhanced physics-based micro-movements responsive to emotional state for more natural, lifelike behavior
    
    // Create physics constants for advanced spring-mass-damper system simulation
    // These values create a physically accurate model for more natural mechanical movement
    const physicsConstants = {
      springConstant: 0.8,      // Controls stiffness of movement (N/m in physics)
      dampingFactor: 0.92,      // Controls how quickly movements settle (damping ratio)
      responseSpeed: 0.04,      // How quickly the system responds to changes (time constant)
      massInertia: 1.2,         // Simulated mass/inertia for more realistic physics (kg)
      noiseInfluence: 0.3,      // How much random environmental noise affects movement
      breathingDepth: 0.15,     // Depth of breathing cycle
      equilibriumRestore: 0.05, // How strongly system returns to center position
      secondaryOscillation: 0.2 // Secondary oscillation influence for more complex motion
    };

    // Calculate emotion-influenced micro-movement parameters with enhanced physics
    const microMovements = {
      // Default neutral state
      primaryFreq: 0.5,         // Main oscillation frequency
      primaryAmp: 0.05,         // Main oscillation amplitude
      secondaryFreq: 0.3,       // Secondary movement frequency
      secondaryAmp: 0.015,      // Secondary movement amplitude
      tertiaryFreq: 1.2,        // Micro-movement frequency
      tertiaryAmp: 0.008,       // Micro-movement amplitude
      lateralMovement: 0.002,   // Side-to-side movement amount
      rotationAmount: 0.001,    // Base rotation variation
      
      // Advanced physics-based parameters
      springConstant: physicsConstants.springConstant,
      dampingFactor: physicsConstants.dampingFactor,
      responseSpeed: physicsConstants.responseSpeed,
      massInertia: physicsConstants.massInertia,
      noiseInfluence: physicsConstants.noiseInfluence,
      breathingDepth: physicsConstants.breathingDepth
    };
    
    // Adjust micro-movement parameters based on emotional state
    switch (emotionalState) {
      case "happy":
        // More energetic, bouncy movements
        microMovements.primaryFreq = 0.7;
        microMovements.primaryAmp = 0.06;
        microMovements.secondaryFreq = 0.4;
        microMovements.secondaryAmp = 0.02;
        microMovements.tertiaryFreq = 1.5;
        microMovements.tertiaryAmp = 0.01;
        microMovements.lateralMovement = 0.003;
        microMovements.rotationAmount = 0.0015;
        break;
      case "sad":
        // Slower, heavier movements
        microMovements.primaryFreq = 0.3;
        microMovements.primaryAmp = 0.04;
        microMovements.secondaryFreq = 0.2;
        microMovements.secondaryAmp = 0.01;
        microMovements.tertiaryFreq = 0.9;
        microMovements.tertiaryAmp = 0.005;
        microMovements.lateralMovement = 0.001;
        microMovements.rotationAmount = 0.0005;
        break;
      case "alert":
        // Quick, tense, alert movements
        microMovements.primaryFreq = 0.8;
        microMovements.primaryAmp = 0.045;
        microMovements.secondaryFreq = 0.5;
        microMovements.secondaryAmp = 0.012;
        microMovements.tertiaryFreq = 2.0;
        microMovements.tertiaryAmp = 0.015;
        microMovements.lateralMovement = 0.0025;
        microMovements.rotationAmount = 0.002;
        break;
      case "thinking":
        // Slightly slower, more deliberate movements
        microMovements.primaryFreq = 0.4;
        microMovements.primaryAmp = 0.045;
        microMovements.secondaryFreq = 0.25;
        microMovements.secondaryAmp = 0.018;
        microMovements.tertiaryFreq = 1.0;
        microMovements.tertiaryAmp = 0.007;
        microMovements.lateralMovement = 0.0015;
        microMovements.rotationAmount = 0.0012;
        break;
      case "confused":
        // Irregular, slightly jerky movements
        microMovements.primaryFreq = 0.6;
        microMovements.primaryAmp = 0.055;
        microMovements.secondaryFreq = 0.35;
        microMovements.secondaryAmp = 0.025;
        microMovements.tertiaryFreq = 1.7;
        microMovements.tertiaryAmp = 0.012;
        microMovements.lateralMovement = 0.004;
        microMovements.rotationAmount = 0.0025;
        break;
    }
    
    // Apply the physics-based emotion-influenced micro-movements
    
    // Initialize velocity and position vectors if they don't exist yet
    if (!group.current.userData.velocity) {
      group.current.userData.velocity = {
        y: 0, x: 0, rotY: 0, rotZ: 0
      };
      group.current.userData.lastTime = time;
    }
    
    // Calculate time delta to scale physics simulation
    const deltaTime = time - group.current.userData.lastTime;
    group.current.userData.lastTime = time;
    
    // Simulate spring-mass-damper system for vertical movement (y-axis)
    
    // Calculate target position - composite of multiple sine waves
    const targetY = 
      Math.sin(time * microMovements.primaryFreq) * microMovements.primaryAmp + // Primary breathing motion
      Math.sin(time * microMovements.secondaryFreq) * microMovements.secondaryAmp + // Secondary slower motion
      Math.sin(time * microMovements.tertiaryFreq) * microMovements.tertiaryAmp; // Tertiary faster micro-movement
    
    // Add some random noise for natural environmental influence
    const environmentalNoise = (Math.random() - 0.5) * 0.002 * microMovements.noiseInfluence;
    
    // Breathing cycle - slow rhythmic movement simulating breathing
    const breathingCycle = Math.sin(time * 0.3) * microMovements.breathingDepth * 0.01;
    
    // Calculate spring force (hooke's law: F = -k * x) where x is displacement from target
    const springDisplacementY = targetY - group.current.position.y + breathingCycle + environmentalNoise;
    const springForceY = springDisplacementY * microMovements.springConstant;
    
    // Update velocity with spring force considering mass/inertia
    group.current.userData.velocity.y += springForceY / microMovements.massInertia;
    
    // Apply damping (gradually reduces movement)
    group.current.userData.velocity.y *= microMovements.dampingFactor;
    
    // Update position with velocity and response speed factor
    group.current.position.y += group.current.userData.velocity.y * microMovements.responseSpeed * deltaTime * 60;
    
    // Apply similar physics model to x-axis (lateral) movement
    const targetX = Math.sin(time * 0.4) * microMovements.lateralMovement;
    const lateralNoise = (Math.random() - 0.5) * 0.001 * microMovements.noiseInfluence;
    const springDisplacementX = targetX - group.current.position.x + lateralNoise;
    const springForceX = springDisplacementX * microMovements.springConstant;
    
    group.current.userData.velocity.x += springForceX / microMovements.massInertia;
    group.current.userData.velocity.x *= microMovements.dampingFactor;
    group.current.position.x += group.current.userData.velocity.x * microMovements.responseSpeed * deltaTime * 60;
    
    // Add subtle rotational micro-movements with physics for added naturalism
    if (currentSequence === ANIMATION_SEQUENCES.IDLE) {
      // Y-axis rotation (head turning slightly)
      const targetRotY = Math.sin(time * 0.3) * microMovements.rotationAmount;
      const springDisplacementRotY = targetRotY - group.current.rotation.y;
      const springForceRotY = springDisplacementRotY * microMovements.springConstant * 0.8;
      
      group.current.userData.velocity.rotY += springForceRotY / (microMovements.massInertia * 1.2); // Higher inertia for rotation
      group.current.userData.velocity.rotY *= microMovements.dampingFactor;
      group.current.rotation.y += group.current.userData.velocity.rotY * microMovements.responseSpeed * deltaTime * 60;
      
      // Z-axis rotation (slight tilting)
      const targetRotZ = Math.sin(time * 0.5) * microMovements.rotationAmount * 0.7;
      const springDisplacementRotZ = targetRotZ - group.current.rotation.z;
      const springForceRotZ = springDisplacementRotZ * microMovements.springConstant * 0.9;
      
      group.current.userData.velocity.rotZ += springForceRotZ / (microMovements.massInertia * 1.1);
      group.current.userData.velocity.rotZ *= microMovements.dampingFactor;
      group.current.rotation.z += group.current.userData.velocity.rotZ * microMovements.responseSpeed * deltaTime * 60;
    }
      
    // Cursor-based interactive movement - subtle leaning toward cursor
    // Only apply if cursor is not at center (indicates active movement)
    if (cursorPosition.x !== 0 || cursorPosition.y !== 0) {
      // Add subtle lean in direction of cursor (max 3 degrees)
      // Multiple by small factor to make movement subtle
      const cursorInfluenceX = cursorPosition.x * 0.015; 
      const cursorInfluenceY = cursorPosition.y * 0.01;
      
      // Apply cursor-influenced rotation with smooth dampening
      // More natural-looking than direct application
      group.current.rotation.z = THREE.MathUtils.lerp(
        group.current.rotation.z || 0,
        -cursorInfluenceX * 0.3, // Negative to lean toward cursor
        0.05 // Smooth dampening factor
      );
      
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x || 0,
        -cursorInfluenceY * 0.2, // Negative to lean toward cursor
        0.05 // Smooth dampening factor
      );
    } else {
      // Return to neutral position when cursor is centered/inactive
      group.current.rotation.z = THREE.MathUtils.lerp(
        group.current.rotation.z || 0,
        0,
        0.03
      );
      
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x || 0,
        0,
        0.03
      );
    }
    
    // Create stateful physics simulation variables with useRef to persist between frames
    const physicsState = useRef({
      // Position state
      xPos: 0, yPos: 0, zPos: 0,
      // Velocity state
      xVel: 0, yVel: 0, zVel: 0,
      // Force accumulators
      xForce: 0, yForce: 0, zForce: 0,
      // Rotation state 
      rotX: 0, rotY: 0, rotZ: 0,
      // Rotational velocity
      rotVelX: 0, rotVelY: 0, rotVelZ: 0,
      // Time tracking for physics calculations
      lastTime: time,
      // Environmental input trackers
      noiseX: 0, noiseY: 0, noiseZ: 0,
      // Breathing cycle tracking
      breathPhase: 0
    }).current;
    
    // Calculate time delta for physics simulation (with safety limits)
    const physicsDeltaTime = Math.min(time - physicsState.lastTime, 0.05);
    physicsState.lastTime = time;
    
    // Base physical parameters adjusted by emotional state
    let springConstant = microMovements.springConstant; // Stiffness
    let dampingFactor = microMovements.dampingFactor;   // Energy dissipation
    let massInertia = microMovements.massInertia;       // Mass/inertia simulation
    let noiseInfluence = microMovements.noiseInfluence; // Environmental influence
    let breathingDepth = microMovements.breathingDepth; // Depth of breathing cycle
    
    // Adjust physics parameters based on emotional state for more natural behavior
    switch(emotionalState) {
      case "happy":
        // Energetic, lively movements with more bounce
        springConstant *= 1.2;    // More responsive/springy
        dampingFactor *= 0.8;     // Less damping - bouncier motion
        massInertia *= 0.9;       // Lower mass - more responsive
        noiseInfluence *= 1.3;    // More environmental reactivity
        breathingDepth *= 1.2;    // Deeper breathing
        break;
        
      case "sad":
        // Heavy, sluggish movements with high damping
        springConstant *= 0.7;    // Less responsive
        dampingFactor *= 1.3;     // Higher damping - less oscillation
        massInertia *= 1.4;       // Higher mass - more inertia
        noiseInfluence *= 0.6;    // Less environmental reactivity
        breathingDepth *= 0.8;    // Shallower breathing
        break;
        
      case "thinking":
        // Deliberate, controlled movements with focus
        springConstant *= 0.9;    // Slightly less responsive
        dampingFactor *= 1.1;     // Slightly more controlled
        massInertia *= 1.1;       // Slightly higher mass for deliberate movement 
        noiseInfluence *= 0.8;    // Less distraction from environment
        breathingDepth *= 0.9;    // Controlled breathing
        break;
        
      case "alert":
        // Quick, responsive movements with lower damping
        springConstant *= 1.4;    // Much more responsive
        dampingFactor *= 0.7;     // Lower damping - quicker response
        massInertia *= 0.8;       // Lower mass - faster movement
        noiseInfluence *= 1.1;    // More environmental awareness
        breathingDepth *= 1.1;    // Deeper alert breathing
        break;
        
      case "confused":
        // Erratic, unpredictable movements with varying parameters
        // Add time-based variation to physics parameters
        const confusionFactor = Math.sin(time * 1.1) * 0.2;
        springConstant *= 1.0 + confusionFactor;
        dampingFactor *= 1.0 - confusionFactor;
        massInertia *= 1.0;
        noiseInfluence *= 1.5;    // High environmental noise
        breathingDepth *= 1.0 + Math.sin(time * 0.7) * 0.2; // Irregular breathing
        break;
    }
    
    // Advanced Spring-Mass-Damper Physics System implementation
    // F = -kx - cv (Force = -spring constant * displacement - damping * velocity)
    
    // Generate environmental noise inputs with multiple frequencies for natural feel
    physicsState.noiseX = THREE.MathUtils.lerp(
      physicsState.noiseX,
      (Math.sin(time * 0.7) + Math.sin(time * 1.3)) * 0.5 * noiseInfluence,
      physicsDeltaTime * 2
    );
    
    physicsState.noiseY = THREE.MathUtils.lerp(
      physicsState.noiseY,
      (Math.sin(time * 0.5) + Math.sin(time * 1.1)) * 0.5 * noiseInfluence,
      physicsDeltaTime * 2
    );
    
    physicsState.noiseZ = THREE.MathUtils.lerp(
      physicsState.noiseZ,
      (Math.sin(time * 0.3) + Math.sin(time * 0.9)) * 0.5 * noiseInfluence,
      physicsDeltaTime * 2
    );
    
    // Calculate breathing cycle with natural irregular pattern
    physicsState.breathPhase += physicsDeltaTime * 0.3;
    const breathingMotion = Math.sin(physicsState.breathPhase) * breathingDepth;
    
    // Apply cursor influence as external force
    const cursorInfluenceX = cursorPosition.x * 0.01;
    const cursorInfluenceY = cursorPosition.y * 0.005;
    
    // Calculate forces for each axis using spring-mass-damper formula
    
    // X-axis force calculation (side-to-side)
    physicsState.xForce = 
      -springConstant * physicsState.xPos              // Spring force (proportional to displacement)
      - dampingFactor * physicsState.xVel              // Damping force (proportional to velocity)
      + physicsState.noiseX                            // Environmental influence
      + cursorInfluenceX                               // User interaction
      + Math.sin(time * 0.2) * 0.003;                  // Base oscillation
      
    // Y-axis force calculation (up-down)
    physicsState.yForce = 
      -springConstant * physicsState.yPos              // Spring force
      - dampingFactor * physicsState.yVel              // Damping force
      + physicsState.noiseY                            // Environmental influence
      + cursorInfluenceY                               // User interaction 
      + breathingMotion * 0.02;                        // Breathing cycle influence
      
    // Z-axis force calculation (forward-backward)
    physicsState.zForce = 
      -springConstant * physicsState.zPos              // Spring force
      - dampingFactor * physicsState.zVel              // Damping force
      + physicsState.noiseZ                            // Environmental influence
      + Math.sin(time * 0.15) * 0.002;                 // Base oscillation
    
    // Apply forces to update velocities (a = F/m)
    physicsState.xVel += (physicsState.xForce / massInertia) * physicsDeltaTime;
    physicsState.yVel += (physicsState.yForce / massInertia) * physicsDeltaTime;
    physicsState.zVel += (physicsState.zForce / massInertia) * physicsDeltaTime;
    
    // Update positions from velocities
    physicsState.xPos += physicsState.xVel * physicsDeltaTime;
    physicsState.yPos += physicsState.yVel * physicsDeltaTime;
    physicsState.zPos += physicsState.zVel * physicsDeltaTime;
    
    // Apply subtle rotation forces with the same physics model
    physicsState.rotVelX += ((-springConstant * 0.5 * physicsState.rotX 
                            - dampingFactor * physicsState.rotVelX
                            + physicsState.noiseY * 0.1) / massInertia) * physicsDeltaTime;
                            
    physicsState.rotVelY += ((-springConstant * 0.5 * physicsState.rotY
                            - dampingFactor * physicsState.rotVelY
                            + physicsState.noiseX * 0.05) / massInertia) * physicsDeltaTime;
                            
    physicsState.rotVelZ += ((-springConstant * 0.5 * physicsState.rotZ
                            - dampingFactor * physicsState.rotVelZ
                            + physicsState.noiseZ * 0.1) / massInertia) * physicsDeltaTime;
    
    // Update rotations
    physicsState.rotX += physicsState.rotVelX * physicsDeltaTime;
    physicsState.rotY += physicsState.rotVelY * physicsDeltaTime;
    physicsState.rotZ += physicsState.rotVelZ * physicsDeltaTime;
    
    // Apply the physically simulated movements to the robot
    // Scale the physics simulation to appropriate visual range
    const positionScale = 2; // Global scaling factor
    
    // Apply to position with appropriate scaling for each axis
    group.current.position.x = physicsState.xPos * 0.006 * positionScale;
    group.current.position.z = physicsState.zPos * 0.004 * positionScale;
    
    // Only apply vertical movement if not in a specific animation sequence
    if (currentSequence === ANIMATION_SEQUENCES.IDLE && transitionProgress >= 1) {
      group.current.position.y = physicsState.yPos * 0.003 * positionScale;
      
      // Apply subtle rotation from physics sim for more natural movement
      group.current.rotation.x += physicsState.rotX * 0.003;
      group.current.rotation.y += physicsState.rotY * 0.002;
      group.current.rotation.z += physicsState.rotZ * 0.004;
    }
    
    // Advanced Energy Core pulsing with dynamic visual feedback based on emotional state and system status
    // Let's handle this safely to avoid errors when the robot model is updating or loading
    if (group.current && group.current.children && group.current.children[0]) {
      try {
        const torso = group.current.children[0] as THREE.Mesh;
        
        // Energy core is positioned within the torso
        if (torso.children && torso.children.length >= 3) {
          // Get the energy core (should be the 3rd child of torso)
          const energyCore = torso.children[2] as THREE.Mesh;
          
          // Calculate system status and energy level parameters
          // These would normally be based on real system metrics 
          // For demo, we'll base them on the emotional state
          
          // System status parameters for visual feedback
          const systemParams = {
            // Base parameters that will be modified by emotional state
            energyLevel: 0.85, // 0-1 scale of power level
            systemLoad: 0.5, // 0-1 scale of processing load
            temperature: 0.4, // 0-1 scale of temperature (affecting color tint)
            stability: 0.95, // 0-1 scale of system stability (affecting pulse regularity)
            complexity: 0.5, // 0-1 scale of operational complexity (affecting secondary pulses)
            
            // Dynamic parameters calculated from base + emotionState
            pulseFrequency: 1.5, // Hz
            pulseAmplitude: 0.03, // Scale
            pulseOffset: 0, // Offset
            secondaryFrequency: 0.8, // Hz for secondary pulse
            irregularity: 0, // Randomness in pulse
            harmonicInfluence: 0.5, // Secondary wave influence
          };
          
          // Adjust system parameters based on emotional state
          switch (emotionalState) {
            case "happy":
              systemParams.energyLevel = 0.9;
              systemParams.systemLoad = 0.6; 
              systemParams.temperature = 0.5;
              systemParams.stability = 0.98;
              systemParams.complexity = 0.6;
              break;
            case "sad":
              systemParams.energyLevel = 0.7;
              systemParams.systemLoad = 0.4;
              systemParams.temperature = 0.3;
              systemParams.stability = 0.85;
              systemParams.complexity = 0.4;
              break;
            case "alert":
              systemParams.energyLevel = 0.95;
              systemParams.systemLoad = 0.85;
              systemParams.temperature = 0.7;
              systemParams.stability = 0.75;
              systemParams.complexity = 0.8;
              break;
            case "thinking":
              systemParams.energyLevel = 0.8;
              systemParams.systemLoad = 0.75;
              systemParams.temperature = 0.5;
              systemParams.stability = 0.9;
              systemParams.complexity = 0.7;
              break;
            case "confused":
              systemParams.energyLevel = 0.75;
              systemParams.systemLoad = 0.65;
              systemParams.temperature = 0.6;
              systemParams.stability = 0.7;
              systemParams.complexity = 0.8;
              break;
          }
          
          // Calculate derived visual parameters from system status
          systemParams.pulseFrequency = 1.2 + systemParams.systemLoad * 1.5; // Higher load = faster pulse
          systemParams.pulseAmplitude = 0.02 + systemParams.energyLevel * 0.03; // Higher energy = stronger pulse
          systemParams.irregularity = (1 - systemParams.stability) * 0.2; // Lower stability = more irregular
          systemParams.harmonicInfluence = systemParams.complexity * 0.6; // More complex = more harmonic patterns
          systemParams.secondaryFrequency = 0.6 + systemParams.systemLoad * 0.8; // Secondary pulse frequency
          
          // Base pulse parameters
          let pulseFrequency = systemParams.pulseFrequency; 
          let pulseAmplitude = systemParams.pulseAmplitude;
          let pulseOffset = systemParams.pulseOffset;
          let useComplexPulse = false; // Use simpler pulse by default
          
          // Configure pulse based on emotional state
          switch(emotionalState) {
            case "happy":
              // Energetic, regular pulsing
              pulseFrequency = 2.0;
              pulseAmplitude = 0.04; // Larger amplitude for more visible pulse
              break;
              
            case "sad":
              // Slower, subdued pulsing 
              pulseFrequency = 0.75;
              pulseAmplitude = 0.02; // Smaller amplitude for subtle effect
              break;
              
            case "thinking":
              // Faster analytical pattern
              pulseFrequency = 2.5;
              pulseAmplitude = 0.035;
              // Add secondary frequency for more complex pattern
              useComplexPulse = true; 
              break;
              
            case "alert":
              // Rapid urgent pulsing
              pulseFrequency = 4.0;
              pulseAmplitude = 0.05; // More pronounced pulse
              break;
              
            case "confused":
              // Irregular pulsing
              pulseFrequency = 1.5;
              pulseAmplitude = 0.03;
              useComplexPulse = true;
              pulseOffset = 0.7; // Phase offset for secondary wave creates irregular pattern
              break;
          }
          
          // Calculate advanced pulse effects with harmonic patterns and organic variations
          let pulseEffect, stabilityFactor, complexityFactor, irregularityComponent;
          
          // Generate noise/irregularity component based on system stability
          // Lower stability = more noise/irregularity
          irregularityComponent = systemParams.irregularity * (Math.random() * 2 - 1) * pulseAmplitude * 0.5;
          
          // Calculate harmonic complexity factor for richer visual patterns
          // Higher complexity = more harmonics in the pulse
          complexityFactor = systemParams.harmonicInfluence;
          
          // Stability factor for smooth vs jerky transitions
          // Higher stability = smoother transitions
          stabilityFactor = systemParams.stability * 0.3 + 0.7; // Range from 0.7-1.0
          
          if (useComplexPulse) {
            // Advanced complex pulse combines multiple harmonics for rich, organic pattern
            pulseEffect = 1 + 
              // Primary wave
              Math.sin(time * pulseFrequency) * pulseAmplitude * stabilityFactor + 
              // Secondary wave with phase offset
              Math.sin(time * (pulseFrequency * 1.3) + pulseOffset) * (pulseAmplitude * 0.7) * complexityFactor +
              // Tertiary fast micro-oscillation for added detail
              Math.sin(time * pulseFrequency * 3.7) * (pulseAmplitude * 0.2) * complexityFactor * stabilityFactor +
              // Add controlled randomness for organic feel
              irregularityComponent;
          } else {
            // Enhanced simple pulse with slight organic variations
            pulseEffect = 1 + 
              Math.sin(time * pulseFrequency) * pulseAmplitude * stabilityFactor + 
              // Add subtle secondary oscillation
              Math.sin(time * pulseFrequency * 2.2) * (pulseAmplitude * 0.15) * complexityFactor +
              // Add minimal controlled randomness 
              irregularityComponent * 0.5;
          }
          
          // Apply system status-based color shifts to core
          if (energyCore.material) {
            const material = energyCore.material as THREE.MeshPhysicalMaterial;
            
            // Blend between normal color and "temperature" color based on system load
            // Ensure we're using a valid Color object by checking the type
            const normalColor = new THREE.Color(
              colors.energyCore instanceof THREE.Color 
                ? colors.energyCore 
                : "#3B82F6" // Fallback to default blue if not a Color object
            );
            const tempColor = new THREE.Color().setHSL(
              // Shift hue toward red as temperature increases
              0.05 + (1 - systemParams.temperature) * 0.1, 
              // Increase saturation with temperature
              0.7 + systemParams.temperature * 0.3,
              // Brightness increases with temperature
              0.5 + systemParams.temperature * 0.2
            );
            
            // Blend colors based on temperature
            const blendedColor = normalColor.clone().lerp(
              tempColor, 
              systemParams.temperature * 0.7 // Maximum 70% blend toward temperature color
            );
            
            // Apply the color
            material.emissive = blendedColor;
          }
          
          // Apply smooth, organic pulse to energy core scale
          energyCore.scale.set(pulseEffect, pulseEffect, pulseEffect);
          
          // Also make emissive intensity vary with pulse and system energy level
          if (energyCore.material && 'emissiveIntensity' in energyCore.material) {
            // Check if material is the right type with emissive properties
            const material = energyCore.material as THREE.MeshPhysicalMaterial;
            
            // Base intensity affected by system energy level
            // Type guard to handle different color object structures
            const baseIntensity = typeof colors === 'object' && 
              'energyCoreEmissiveIntensity' in colors ? 
              colors.energyCoreEmissiveIntensity : 3.0;
            const energyLevelFactor = 0.7 + systemParams.energyLevel * 0.6; // Range 0.7-1.3
            
            // Scale emissive intensity with pulse for enhanced effect
            // Add slight randomness for organic feel based on system stability
            const randomFactor = 1 + (1 - systemParams.stability) * (Math.random() * 0.1 - 0.05);
            material.emissiveIntensity = baseIntensity * energyLevelFactor * (0.8 + pulseEffect * 0.2) * randomFactor;
          }
        }
      } catch (error) {
        // Silently handle any errors with the energy core
        // console.error("Error with energy core pulse:", error);
      }
    }
    
    // Different animations based on current sequence
    switch(currentSequence) {
      case ANIMATION_SEQUENCES.IDLE:
        // Enhanced idle animation with naturalistic micro-movements and cursor tracking
        if (group.current.children[0]) { // Head
          const head = group.current.children[0] as THREE.Mesh;
          
          // Get starting values for head if in transition
          let startHeadX = 0, startHeadY = 0, startHeadZ = 0;
          if (initialPoseSnapshot && transitionProgress < 1 && initialPoseSnapshot.parts.head) {
            startHeadX = initialPoseSnapshot.parts.head.rotation.x;
            startHeadY = initialPoseSnapshot.parts.head.rotation.y;
            startHeadZ = initialPoseSnapshot.parts.head.rotation.z;
          }
          
          // Calculate target values based on cursor or idle motion
          let targetHeadX, targetHeadY, targetHeadZ;
          
          if (cursorPosition.x !== 0 || cursorPosition.y !== 0) {
            // Define base sensitivity values for cursor tracking
            let sensitivityX = 0.3; // Base X-axis sensitivity
            let sensitivityY = 0.2; // Base Y-axis sensitivity 
            let tiltFactor = 0.05;  // Base tilt factor
            let responseSpeed = 0.1; // Base response speed (used later for lerp)
            
            // Modify tracking behavior based on emotional state
            switch(emotionalState) {
              case "happy":
                // More enthusiastic tracking - higher sensitivity and extra tilt
                sensitivityX = 0.4;
                sensitivityY = 0.25;
                tiltFactor = 0.08;
                responseSpeed = 0.15; // Faster response
                break;
                
              case "sad":
                // Subdued, slower tracking - lower sensitivity
                sensitivityX = 0.2;
                sensitivityY = 0.15;
                tiltFactor = 0.03;
                responseSpeed = 0.05; // Much slower response
                break;
                
              case "alert":
                // Sharp, precise tracking - high sensitivity, fast response
                sensitivityX = 0.5;
                sensitivityY = 0.3;
                tiltFactor = 0.06;
                responseSpeed = 0.2; // Fastest response
                break;
                
              case "thinking":
                // Distracted tracking - occasional randomness
                sensitivityX = 0.25 + Math.sin(time * 0.5) * 0.05;
                sensitivityY = 0.15 + Math.cos(time * 0.7) * 0.05;
                tiltFactor = 0.04;
                responseSpeed = 0.08; // Slightly slower response
                break;
                
              case "confused":
                // Erratic tracking - random variations and occasional opposite movement
                const confusion = Math.sin(time * 3) > 0.7 ? -1 : 1; // Occasionally inverts
                sensitivityX = 0.3 * confusion + Math.sin(time * 2) * 0.1;
                sensitivityY = 0.2 * confusion + Math.cos(time * 2.5) * 0.1;
                tiltFactor = 0.07 + Math.sin(time * 4) * 0.03;
                responseSpeed = 0.07 + Math.sin(time * 5) * 0.05; // Variable speed
                break;
            }
            
            // Target rotation when tracking cursor with emotional influence
            targetHeadY = cursorPosition.x * sensitivityX; // Side-to-side following cursor X
            targetHeadX = -cursorPosition.y * sensitivityY; // Up-down following cursor Y (inverted)
            targetHeadZ = cursorPosition.x * tiltFactor; // Slight tilt when looking to sides
            
            // Apply blended values with emotion-influenced response speed
            head.rotation.y = THREE.MathUtils.lerp(
              head.rotation.y || 0,
              blendValue(startHeadY, targetHeadY),
              responseSpeed // Use emotion-based response speed
            );
            
            head.rotation.x = THREE.MathUtils.lerp(
              head.rotation.x || 0,
              blendValue(startHeadX, targetHeadX),
              responseSpeed // Use emotion-based response speed
            );
            
            // Subtle head tilt based on cursor position - more human-like
            head.rotation.z = THREE.MathUtils.lerp(
              head.rotation.z || 0,
              blendValue(startHeadZ, targetHeadZ),
              responseSpeed // Use emotion-based response speed
            );
          } else {
            // When no cursor movement, apply emotion-driven micro-movements with transitions
            // Calculate idle animation positions based on emotional state
            switch(emotionalState) {
              case "happy":
                // More energetic, lively micro-movements
                targetHeadX = Math.sin(time * 0.5) * 0.02; // Faster up/down nodding
                targetHeadY = Math.sin(time * 0.6) * 0.025; // More pronounced side to side
                targetHeadZ = Math.sin(time * 0.9) * 0.01; // Playful tilt
                break;
                
              case "sad":
                // Downward-oriented, slower movements
                targetHeadX = Math.sin(time * 0.2) * 0.01 - 0.03; // Lowered head positioning
                targetHeadY = Math.sin(time * 0.25) * 0.01; // Minimal side-to-side
                targetHeadZ = Math.sin(time * 0.4) * 0.003; // Minimal tilt
                break;
                
              case "thinking":
                // Contemplative, focused micro-movements
                targetHeadX = Math.sin(time * 0.3) * 0.008 + 0.01; // Slightly raised, thinking position
                targetHeadY = Math.sin(time * 0.5) * 0.02; // Occasional analyzing side glances
                targetHeadZ = Math.cos(time * 0.45) * 0.01; // Curious tilt
                break;
                
              case "alert":
                // Sharper, more responsive movements
                targetHeadX = Math.sin(time * 0.7) * 0.015; // Quicker scanning movements
                targetHeadY = Math.sin(time * 0.8) * 0.03; // Wider area surveillance
                targetHeadZ = Math.sin(time * 1.2) * 0.008; // Alert positioning
                break;
                
              case "confused":
                // Irregular, uncertain movements
                targetHeadX = Math.sin(time * 0.4) * 0.015 + Math.sin(time * 0.7) * 0.01; // Combined frequencies
                targetHeadY = Math.sin(time * 0.5) * 0.02 + Math.cos(time * 0.8) * 0.01; // Complex pattern
                targetHeadZ = Math.sin(time * 0.6) * 0.015; // More pronounced tilt showing confusion
                break;
                
              default: // neutral
                // Standard subtle micro-movements
                targetHeadX = Math.sin(time * 0.3) * 0.01; // Slow up/down
                targetHeadY = Math.sin(time * 0.4) * 0.015; // Occasional side to side
                targetHeadZ = Math.sin(time * 0.7) * 0.005; // Slight tilt
                break;
            }
            
            // Apply with transition blending
            head.rotation.x = blendValue(startHeadX, targetHeadX);
            head.rotation.y = blendValue(startHeadY, targetHeadY);
            head.rotation.z = blendValue(startHeadZ, targetHeadZ);
          }
        }
        
        // Arm movements - subtle shifting that suggests readiness
        if (group.current.children[1] && group.current.children[2]) { // Left and right arms
          const leftArm = group.current.children[1] as THREE.Mesh;
          const rightArm = group.current.children[2] as THREE.Mesh;
          
          // Get starting values for arms if in transition
          let startLeftArmZ = 0, startRightArmZ = 0;
          if (initialPoseSnapshot && transitionProgress < 1) {
            if (initialPoseSnapshot.parts.leftArm) {
              startLeftArmZ = initialPoseSnapshot.parts.leftArm.rotation.z;
            }
            if (initialPoseSnapshot.parts.rightArm) {
              startRightArmZ = initialPoseSnapshot.parts.rightArm.rotation.z;
            }
          }
          
          // Calculate target arm positions
          let leftArmTarget, rightArmTarget;
          
          // When cursor is at edges, arms react with emotion-influenced gestures
          if (Math.abs(cursorPosition.x) > 0.7) {
            // Base gesture values
            let armGestureAmount = 0.05; // Default gesture amount
            let gestureThreshold = 0.7;  // Default edge threshold
            let armResponseSpeed = 0.05; // Default response speed
            
            // Modify arm gestures based on emotional state
            switch(emotionalState) {
              case "happy":
                // More enthusiastic, exaggerated gestures
                armGestureAmount = 0.08; // Larger gesture
                gestureThreshold = 0.6;  // Trigger earlier
                armResponseSpeed = 0.08; // Faster response
                break;
                
              case "sad":
                // Minimal, subdued gestures
                armGestureAmount = 0.03; // Smaller gesture
                gestureThreshold = 0.8;  // Trigger later
                armResponseSpeed = 0.03; // Slower response
                break;
                
              case "alert":
                // Quick, precise gestures
                armGestureAmount = 0.06; // Moderate gesture
                gestureThreshold = 0.5;  // Trigger much earlier
                armResponseSpeed = 0.1;  // Fastest response
                break;
                
              case "thinking":
                // Distracted, inconsistent gestures
                armGestureAmount = 0.04 + Math.sin(time * 0.5) * 0.01; // Variable
                gestureThreshold = 0.75; // Standard threshold
                armResponseSpeed = 0.04; // Slower response
                break;
                
              case "confused":
                // Erratic, sometimes inappropriate gestures
                const confusionFactor = Math.sin(time * 3) > 0.7 ? -1 : 1; // Occasionally backwards
                armGestureAmount = 0.05 * confusionFactor; // Sometimes incorrect
                gestureThreshold = 0.7 + Math.sin(time * 2) * 0.1; // Variable threshold
                armResponseSpeed = 0.05 + Math.sin(time * 4) * 0.02; // Variable speed
                break;
            }
            
            // Adjust gestures based on emotion-influenced values
            if (Math.abs(cursorPosition.x) > gestureThreshold) {
              // Arm on side of cursor moves in anticipatory gesture with emotional influence
              leftArmTarget = cursorPosition.x < 0 ? armGestureAmount : 0;
              rightArmTarget = cursorPosition.x > 0 ? -armGestureAmount : 0;
              
              leftArm.rotation.z = THREE.MathUtils.lerp(
                leftArm.rotation.z || 0,
                blendValue(startLeftArmZ, leftArmTarget),
                armResponseSpeed
              );
              
              rightArm.rotation.z = THREE.MathUtils.lerp(
                rightArm.rotation.z || 0,
                blendValue(startRightArmZ, rightArmTarget),
                armResponseSpeed
              );
            }
          } else {
            // Arm movements based on emotional state
            switch(emotionalState) {
              case "happy":
                // More open, energetic arm positions
                leftArmTarget = Math.sin(time * 0.35) * 0.04; // More amplitude
                rightArmTarget = Math.sin(time * 0.45) * 0.035; // Higher frequency movement
                
                // Add some x-rotation for additional expressiveness
                leftArm.rotation.x = Math.sin(time * 0.4) * 0.025;
                rightArm.rotation.x = Math.sin(time * 0.5) * 0.02;
                break;
                
              case "sad":
                // Drooping, lower energy arm positions
                leftArmTarget = Math.sin(time * 0.15) * 0.01 - 0.03; // Lowered position with minimal movement
                rightArmTarget = Math.sin(time * 0.2) * 0.01 - 0.025; // Slight asymmetry for natural look
                
                // Subtle x-rotation for dejected look
                leftArm.rotation.x = -0.02;
                rightArm.rotation.x = -0.015;
                break;
                
              case "thinking":
                // One arm more active, analytical positioning
                leftArmTarget = Math.sin(time * 0.28) * 0.025; // Regular movement
                rightArmTarget = Math.sin(time * 0.3) * 0.015 + 0.03; // Slightly raised as if pondering
                
                // Thoughtful x-rotation
                leftArm.rotation.x = Math.sin(time * 0.25) * 0.01;
                rightArm.rotation.x = 0.05 + Math.sin(time * 0.4) * 0.01; // Slightly forward
                break;
                
              case "alert":
                // Readiness position, faster but controlled movements
                leftArmTarget = Math.sin(time * 0.5) * 0.025; // Quicker movements
                rightArmTarget = Math.sin(time * 0.55) * 0.03; // Asymmetrical motion for dynamism
                
                // Ready stance x-rotation
                leftArm.rotation.x = 0.03 + Math.sin(time * 0.6) * 0.02;
                rightArm.rotation.x = 0.025 + Math.sin(time * 0.65) * 0.02;
                break;
                
              case "confused":
                // Asymmetrical, uncoordinated movements
                leftArmTarget = Math.sin(time * 0.33) * 0.03 + Math.cos(time * 0.5) * 0.01; // Complex pattern
                rightArmTarget = Math.sin(time * 0.28) * 0.025 + Math.sin(time * 0.6) * 0.015; // Different rhythm
                
                // Uncertain x-rotation
                leftArm.rotation.x = Math.sin(time * 0.4) * 0.03;
                rightArm.rotation.x = Math.cos(time * 0.35) * 0.025;
                break;
                
              default: // neutral
                // Default subtle arm adjustments
                leftArmTarget = Math.sin(time * 0.25) * 0.02;
                rightArmTarget = Math.sin(time * 0.35) * 0.018;
                
                // Reset any x-rotation
                leftArm.rotation.x = 0;
                rightArm.rotation.x = 0;
                break;
            }
            
            // Apply with transition blending
            leftArm.rotation.z = blendValue(startLeftArmZ, leftArmTarget);
            rightArm.rotation.z = blendValue(startRightArmZ, rightArmTarget);
          }
        }
        
        // Leg movements - emotional state influences stance and subtle shifts
        if (group.current.children[3] && group.current.children[4]) { // Left and right legs
          const leftLeg = group.current.children[3] as THREE.Mesh;
          const rightLeg = group.current.children[4] as THREE.Mesh;
          
          // Get starting values for legs if in transition
          let startLeftLegX = 0, startLeftLegZ = 0;
          let startRightLegX = 0, startRightLegZ = 0;
          
          if (initialPoseSnapshot && transitionProgress < 1) {
            if (initialPoseSnapshot.parts.leftLeg) {
              startLeftLegX = initialPoseSnapshot.parts.leftLeg.rotation.x;
              startLeftLegZ = initialPoseSnapshot.parts.leftLeg.rotation.z;
            }
            if (initialPoseSnapshot.parts.rightLeg) {
              startRightLegX = initialPoseSnapshot.parts.rightLeg.rotation.x;
              startRightLegZ = initialPoseSnapshot.parts.rightLeg.rotation.z;
            }
          }
          
          // Calculate target leg positions based on emotional state
          let leftLegTargetX = 0, leftLegTargetZ = 0;
          let rightLegTargetX = 0, rightLegTargetZ = 0;
          
          switch(emotionalState) {
            case "happy":
              // More energetic stance, slightly bouncy
              leftLegTargetX = Math.sin(time * 0.35) * 0.015 + 0.01; // Slight knee bounce
              leftLegTargetZ = -0.03 + Math.sin(time * 0.4) * 0.01; // Wider stance
              
              rightLegTargetX = Math.sin(time * 0.35 + 0.2) * 0.015 + 0.01; // Offset bounce for naturalism
              rightLegTargetZ = 0.03 + Math.sin(time * 0.4) * 0.01; // Wider stance
              break;
              
            case "sad":
              // Drooping, lower energy stance
              leftLegTargetX = Math.sin(time * 0.15) * 0.005; // Minimal movement
              leftLegTargetZ = -0.02; // Narrower, closed-in stance
              
              rightLegTargetX = Math.sin(time * 0.15) * 0.005; // Minimal movement
              rightLegTargetZ = 0.02; // Narrower stance
              break;
              
            case "thinking":
              // Slightly asymmetrical stance suggesting thought
              leftLegTargetX = 0.02; // Slight knee bend for weight shift
              leftLegTargetZ = -0.02 + Math.sin(time * 0.2) * 0.005; // Subtle shift
              
              rightLegTargetX = 0; // Straight supporting leg
              rightLegTargetZ = 0.03; // Slightly outward for stability
              break;
              
            case "alert":
              // Ready stance, weight evenly distributed
              leftLegTargetX = 0.03 + Math.sin(time * 0.5) * 0.01; // Alert knee bend
              leftLegTargetZ = -0.04; // Wider stance for stability
              
              rightLegTargetX = 0.03 + Math.sin(time * 0.5) * 0.01; // Matching alert stance
              rightLegTargetZ = 0.04; // Wider stance
              break;
              
            case "confused":
              // Uncertain, shifting stance
              leftLegTargetX = Math.sin(time * 0.3) * 0.02; // Variable weight shift
              leftLegTargetZ = -0.03 + Math.sin(time * 0.25) * 0.01; // Shifting position
              
              rightLegTargetX = Math.sin(time * 0.3 + 0.5) * 0.02; // Opposing pattern
              rightLegTargetZ = 0.03 + Math.sin(time * 0.25 + 0.5) * 0.01; // Matching shifting
              break;
              
            default: // neutral
              // Balanced, default stance
              leftLegTargetX = Math.sin(time * 0.2) * 0.008; // Subtle natural movement
              leftLegTargetZ = -0.025; // Standard stance width
              
              rightLegTargetX = Math.sin(time * 0.2 + 0.3) * 0.008; // Slightly offset for naturalism
              rightLegTargetZ = 0.025; // Standard stance width
              break;
          }
          
          // Apply with transition blending
          leftLeg.rotation.x = blendValue(startLeftLegX, leftLegTargetX);
          leftLeg.rotation.z = blendValue(startLeftLegZ, leftLegTargetZ);
          
          rightLeg.rotation.x = blendValue(startRightLegX, rightLegTargetX);
          rightLeg.rotation.z = blendValue(startRightLegZ, rightLegTargetZ);
        }
        break;
        
      case ANIMATION_SEQUENCES.GREETING:
        // Enhanced greeting animation with natural physics-based movement and transitions
        if (group.current.children[0]) { // Head
          const head = group.current.children[0] as THREE.Mesh;
          
          // Get starting values for head if in transition
          let startHeadX = 0, startHeadY = 0;
          if (initialPoseSnapshot && transitionProgress < 1 && initialPoseSnapshot.parts.head) {
            startHeadX = initialPoseSnapshot.parts.head.rotation.x;
            startHeadY = initialPoseSnapshot.parts.head.rotation.y;
          }
          
          // Calculate greeting animation target positions
          // Friendly nodding motion with natural timing
          const targetHeadX = Math.sin(time * 2) * 0.1;
          // Subtle side-to-side movement
          const targetHeadY = Math.sin(time * 1.5) * 0.05;
          
          // Apply with transition blending
          head.rotation.x = blendValue(startHeadX, targetHeadX);
          head.rotation.y = blendValue(startHeadY, targetHeadY);
        }
        
        // Calculate whole body friendly bounce with transition blending
        const greetingBodyY = Math.sin(time * 2.2) * 0.04 + 0.02;
        
        // Get starting body Y position from snapshot for blending
        const greetingStartY = initialPoseSnapshot && transitionProgress < 1 ? 
                              initialPoseSnapshot.position.y : 0;
        
        // Apply with transition blending
        group.current.position.y = blendValue(greetingStartY, greetingBodyY);
        
        // Arm wave animation with physics-based movement
        if (group.current.children[2]) { // Right arm
          const rightArm = group.current.children[2] as THREE.Mesh;
          
          // Get starting values for arm if in transition
          let startRightArmX = 0, startRightArmY = 0, startRightArmZ = 0;
          if (initialPoseSnapshot && transitionProgress < 1 && initialPoseSnapshot.parts.rightArm) {
            startRightArmX = initialPoseSnapshot.parts.rightArm.rotation.x;
            startRightArmY = initialPoseSnapshot.parts.rightArm.rotation.y;
            startRightArmZ = initialPoseSnapshot.parts.rightArm.rotation.z;
          }
          
          // Create natural wave cycle with proper acceleration/deceleration
          const waveCycle = time % 3.0; // 3-second wave cycle
          
          // Calculate target arm rotation based on wave cycle
          let targetRotationZ = 0;
          
          if (waveCycle < 0.6) {
            // Initial raise of arm with proper physics acceleration
            const progress = waveCycle / 0.6;
            // Ease-out cubic for natural raising motion
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            targetRotationZ = -0.3 - (easedProgress * 0.3);
          } else if (waveCycle < 2.4) {
            // Actual waving motion - sides to side
            const waveProgress = (waveCycle - 0.6) / 1.8;
            // Base wave position
            const baseWave = -0.6;
            // Add sine wave motion with decreasing amplitude for natural damping
            targetRotationZ = baseWave + Math.sin(waveProgress * Math.PI * 3) * 0.2 * (1 - waveProgress/2);
          } else {
            // Return arm to neutral position with natural deceleration
            const progress = (waveCycle - 2.4) / 0.6;
            // Ease-in cubic for natural lowering motion
            const easedProgress = Math.pow(progress, 3);
            targetRotationZ = -0.6 + (easedProgress * 0.3);
          }
          
          // Apply with transition blending for z rotation
          rightArm.rotation.z = blendValue(startRightArmZ, targetRotationZ);
          
          // Add slight forward tilt during wave with transition blending
          const targetTiltY = Math.sin(time * 2) * 0.1;
          rightArm.rotation.y = blendValue(startRightArmY, targetTiltY);
        }
        
        // Left arm subtle complementary movement
        if (group.current.children[1]) { // Left arm
          const leftArm = group.current.children[1] as THREE.Mesh;
          
          // Get starting values for arm if in transition
          let startLeftArmZ = 0;
          if (initialPoseSnapshot && transitionProgress < 1 && initialPoseSnapshot.parts.leftArm) {
            startLeftArmZ = initialPoseSnapshot.parts.leftArm.rotation.z;
          }
          
          // Calculate subtle opposite movement for balance
          const targetLeftArmZ = Math.sin(time * 1.5) * 0.05;
          
          // Apply with transition blending
          leftArm.rotation.z = blendValue(startLeftArmZ, targetLeftArmZ);
        }
        break;
        
      case ANIMATION_SEQUENCES.WAVE:
        // More energetic wave with enhanced physics-based movement
        if (group.current.children[0]) { // Head
          const head = group.current.children[0] as THREE.Mesh;
          
          // Get starting values for head if in transition
          let startHeadX = 0, startHeadY = 0;
          if (initialPoseSnapshot && transitionProgress < 1 && initialPoseSnapshot.parts.head) {
            startHeadX = initialPoseSnapshot.parts.head.rotation.x;
            startHeadY = initialPoseSnapshot.parts.head.rotation.y;
          }
          
          // Calculate target positions for head movement
          const targetHeadX = Math.sin(time * 3 + 0.5) * 0.15; // Enthusiastic nodding with slight delay
          const targetHeadY = Math.sin(time * 2) * 0.08; // Side-to-side enthusiasm
          
          // Apply with transition blending
          head.rotation.x = blendValue(startHeadX, targetHeadX);
          head.rotation.y = blendValue(startHeadY, targetHeadY);
        }
        
        // Calculate excited full-body energy with transition blending
        const waveBodyY = Math.sin(time * 3) * 0.06 + 0.03;
        
        // Get starting body Y position from snapshot for blending
        const waveStartY = initialPoseSnapshot && transitionProgress < 1 ? 
                          initialPoseSnapshot.position.y : 0;
        
        // Apply with transition blending
        group.current.position.y = blendValue(waveStartY, waveBodyY);
        
        // Energetic arm waves with proper articulation and physics
        if (group.current.children[2]) { // Right arm
          const rightArm = group.current.children[2] as THREE.Mesh;
          
          // Get starting values for arm if in transition
          let startRightArmZ = 0, startRightArmY = 0, startRightArmX = 0;
          if (initialPoseSnapshot && transitionProgress < 1 && initialPoseSnapshot.parts.rightArm) {
            startRightArmZ = initialPoseSnapshot.parts.rightArm.rotation.z;
            startRightArmY = initialPoseSnapshot.parts.rightArm.rotation.y;
            startRightArmX = initialPoseSnapshot.parts.rightArm.rotation.x;
          }
          
          // Create a more energetic but still natural wave pattern
          // Faster frequency with higher amplitude
          const t = time * 6; // Higher frequency for energetic wave
          
          // Combination of primary and secondary motion for complex movement
          const primaryWave = Math.sin(t) * 0.4;
          const secondaryWave = Math.sin(t * 1.3) * 0.1; // Slight variation for natural feel
          
          // Calculate target rotation values
          const targetRotZ = primaryWave + secondaryWave - 0.5; // Raised arm position
          const targetRotY = Math.cos(t * 0.5) * 0.15; // Forward/backward movement
          const targetRotX = Math.sin(t * 0.7) * 0.08; // Subtle twisting motion
          
          // Apply with transition blending for all rotations
          rightArm.rotation.z = blendValue(startRightArmZ, targetRotZ);
          rightArm.rotation.y = blendValue(startRightArmY, targetRotY);
          rightArm.rotation.x = blendValue(startRightArmX, targetRotX);
        }
        
        // Left arm complementary motion
        if (group.current.children[1]) { // Left arm
          const leftArm = group.current.children[1] as THREE.Mesh;
          
          // Get starting values for arm if in transition
          let startLeftArmZ = 0;
          if (initialPoseSnapshot && transitionProgress < 1 && initialPoseSnapshot.parts.leftArm) {
            startLeftArmZ = initialPoseSnapshot.parts.leftArm.rotation.z;
          }
          
          // Calculate slight opposite phase movement for balance and natural feel
          const targetLeftZ = Math.sin(time * 3 + Math.PI) * 0.1;
          
          // Apply with transition blending
          leftArm.rotation.z = blendValue(startLeftArmZ, targetLeftZ);
        }
        break;
        
      case ANIMATION_SEQUENCES.THINK:
        // Thinking pose with natural cognitive gestures
        if (group.current.children[0]) { // Head
          const head = group.current.children[0] as THREE.Mesh;
          
          // Natural contemplative head movements
          const thinkCycle = time % 6.0; // 6-second thinking cycle
          let primaryTilt = 0;
          
          // Physics-based head movements simulating cognitive process
          if (thinkCycle < 1.0) {
            // Initial contemplation tilt
            primaryTilt = Math.sin(thinkCycle/1.0 * Math.PI/2) * 0.12;
          } else if (thinkCycle < 2.5) {
            // Maintain thinking pose with subtle variations (simulating processing)
            primaryTilt = 0.12 + Math.sin((thinkCycle-1.0)*8) * 0.02;
          } else if (thinkCycle < 3.0) {
            // Slight shift to another angle (new thought)
            const progress = (thinkCycle - 2.5) / 0.5;
            primaryTilt = 0.12 * (1-progress) + (-0.08 * progress);
          } else if (thinkCycle < 4.2) {
            // Hold alternative perspective
            primaryTilt = -0.08 + Math.sin((thinkCycle-3.0)*7) * 0.015;
          } else if (thinkCycle < 4.8) {
            // Return to neutral with natural curve (conclusion)
            primaryTilt = -0.08 * (1 - Math.sin((thinkCycle-4.2)/0.6 * Math.PI/2));
          }
          
          // Apply complex head rotations suggesting deep thought
          head.rotation.z = primaryTilt + Math.sin(time * 0.7) * 0.03; // Primary thinking tilt
          head.rotation.x = Math.sin(time * 0.4) * 0.05; // Subtle up/down consideration
          head.rotation.y = Math.sin(time * 0.3) * 0.05; // Occasional looking around for inspiration
        }
        
        // Subtle body movements during contemplation
        group.current.position.y = Math.sin(time * 0.8) * 0.02; // Gentle breathing/hovering
        
        // Thoughtful arm poses
        if (group.current.children[1] && group.current.children[2]) { // Left and right arms
          const leftArm = group.current.children[1] as THREE.Mesh;
          const rightArm = group.current.children[2] as THREE.Mesh;
          
          // Right arm occasionally moves to "chin" in thinking gesture
          const armThinkCycle = time % 8.0;
          if (armThinkCycle < 3.0) {
            // Move arm up to thinking position with natural easing
            const progress = Math.min(1, armThinkCycle / 1.0);
            const easedProgress = progress < 0.5 
              ? 2 * progress * progress 
              : 1 - Math.pow(-2 * progress + 2, 2) / 2; // Ease in-out quad
            
            rightArm.rotation.z = 0.3 * easedProgress;
            rightArm.rotation.y = 0.1 * easedProgress;
          } else if (armThinkCycle < 6.0) {
            // Hold thinking position with subtle movements
            rightArm.rotation.z = 0.3 + Math.sin((armThinkCycle - 3.0) * 4) * 0.02;
            rightArm.rotation.y = 0.1 + Math.sin((armThinkCycle - 3.0) * 3) * 0.01;
          } else {
            // Lower arm gradually with natural easing
            const progress = Math.min(1, (armThinkCycle - 6.0) / 1.5);
            const easedProgress = progress < 0.5 
              ? 2 * progress * progress 
              : 1 - Math.pow(-2 * progress + 2, 2) / 2; // Ease in-out quad
            
            rightArm.rotation.z = 0.3 * (1 - easedProgress);
            rightArm.rotation.y = 0.1 * (1 - easedProgress);
          }
          
          // Left arm stays more neutral with subtle movements
          leftArm.rotation.z = Math.sin(time * 0.5) * 0.05;
        }
        break;
        
      case ANIMATION_SEQUENCES.SURPRISED:
        // Surprised reaction
        if (group.current.children[0]) { // Head
          const head = group.current.children[0] as THREE.Mesh;
          head.position.y = Math.sin(time * 8) * 0.05 + 0.05;
          head.scale.setScalar(1 + Math.sin(time * 8) * 0.05);
        }
        break;
        
      case ANIMATION_SEQUENCES.HAPPY:
        // Happy bouncy animation with realistic physics
        if (group.current.children[0]) { // Head
          const head = group.current.children[0] as THREE.Mesh;
          
          // Natural nodding motion
          const nodCycle = time % 3.0; // 3-second joy cycle
          let primaryNod = 0;
          
          // Physics-based nodding with proper acceleration/deceleration
          if (nodCycle < 0.4) {
            // Quick upward look (anticipation)
            primaryNod = -Math.sin(nodCycle/0.4 * Math.PI/2) * 0.2;
          } else if (nodCycle < 0.6) {
            // Hold the happy look with subtle motion
            primaryNod = -0.2 + Math.sin((nodCycle-0.4)*20) * 0.01;
          } else if (nodCycle < 1.0) {
            // Return to neutral with natural curve
            primaryNod = -0.2 * (1 - Math.sin((nodCycle-0.6)/0.4 * Math.PI/2));
          } else if (nodCycle < 1.3) {
            // Smaller secondary nod (subtler, different rhythm)
            primaryNod = -Math.sin((nodCycle-1.0)/0.3 * Math.PI) * 0.1;
          }
          
          // Add secondary playful movements
          const secondaryNod = Math.sin(time * 0.7) * 0.05;
          
          // Apply head rotations
          head.rotation.x = primaryNod + secondaryNod;
          head.rotation.y = Math.sin(time * 0.85) * 0.08; // Side-to-side happy movement
          head.rotation.z = Math.sin(time * 0.5) * 0.05; // Joyful tilting
        }
        
        // Bouncy body movement with enhanced spring physics
        // Combine multiple sine waves for more complex, energetic bouncing
        // Primary energetic bounce with higher frequency
        const primaryBounce = Math.sin(time * 2.8) * 0.06;
        // Secondary lower bounce with slight phase difference
        const secondaryBounce = Math.sin(time * 2.3 + 0.2) * 0.04;
        // Small tertiary micro-bounce for added realism
        const microBounce = Math.sin(time * 4.2) * 0.02;
        
        // Apply composite bouncy movement for more natural, energetic feel
        group.current.position.y = primaryBounce + secondaryBounce + microBounce;
        
        // Add slight side-to-side sway for increased happiness expression
        group.current.position.x = Math.sin(time * 1.4) * 0.02;
        
        // Subtle forward-backward movement timed with bounces
        group.current.position.z = Math.sin(time * 1.7) * 0.015;
        
        // Joyful rotation with the bounces - this creates a slight twist as it bounces
        group.current.rotation.y = Math.sin(time * 1.5) * 0.03;
        
        // Arm animations with enhanced enthusiasm and coordination
        if (group.current.children[1] && group.current.children[2]) { // Left and right arms
          const leftArm = group.current.children[1] as THREE.Mesh;
          const rightArm = group.current.children[2] as THREE.Mesh;
          
          // More complex arm swinging with varied amplitude and frequency
          // Create a non-repeating pattern by combining multiple sine waves
          
          // Left arm enthusiastic movements
          const leftPrimary = Math.sin(time * 2.2) * 0.18; // Main swing
          const leftSecondary = Math.sin(time * 3.1) * 0.06; // Secondary quicker motion
          
          // Right arm with opposite phase but similar enthusiasm
          const rightPrimary = Math.sin(time * 2.2 + Math.PI) * 0.18; // Main swing (opposite phase)
          const rightSecondary = Math.sin(time * 3.1 + Math.PI) * 0.06; // Secondary motion (opposite)
          
          // Apply composite arm movements
          leftArm.rotation.z = leftPrimary + leftSecondary;
          rightArm.rotation.z = rightPrimary + rightSecondary;
          
          // Add slight forward/backward arm rotation for more dynamic movement
          leftArm.rotation.x = Math.sin(time * 2.5) * 0.08;
          rightArm.rotation.x = Math.sin(time * 2.5 + Math.PI) * 0.08;
        }
        break;
        
      case ANIMATION_SEQUENCES.SAD:
        // Melancholic, subdued animation with physics-based naturalistic movements
        if (group.current.children[0]) { // Head
          const head = group.current.children[0] as THREE.Mesh;
          
          // Create a natural head drooping cycle
          const droopCycle = time % 8.0; // 8-second melancholy cycle
          let primaryDroop = 0;
          
          // Physics-based drooping with proper weight simulation
          if (droopCycle < 1.5) {
            // Gradually looking down (weighted)
            primaryDroop = 0.2 + Math.sin(droopCycle/1.5 * Math.PI/4) * 0.05;
          } else if (droopCycle < 4.0) {
            // Hold the sad look with subtle motion
            primaryDroop = 0.2 + Math.sin((droopCycle-1.5)*3) * 0.01;
          } else if (droopCycle < 5.0) {
            // Brief attempt to look up (resilience)
            primaryDroop = 0.2 - Math.sin((droopCycle-4.0)/1.0 * Math.PI/2) * 0.08;
          } else if (droopCycle < 6.0) {
            // Return to drooped position
            primaryDroop = 0.12 + Math.sin((droopCycle-5.0)/1.0 * Math.PI/2) * 0.08;
          } else {
            // Subtle movements while maintaining sad posture
            primaryDroop = 0.2 + Math.sin((droopCycle-6.0)*2) * 0.02;
          }
          
          // Apply head rotations
          head.rotation.x = primaryDroop; // Looking down
          head.rotation.y = Math.sin(time * 0.35) * 0.03; // Subtle side-to-side
          head.rotation.z = Math.sin(time * 0.25) * 0.03; // Subtle tilt
        }
        
        // Enhanced slumped, weighted body movements with realistic gravity simulation
        // Multiple components for more realistic weighted body language
        
        // Primary weighted breathing - slower and more labored
        const sadBreathing = Math.sin(time * 0.3) * 0.02;
        
        // Occasional weary shifting of weight 
        // Less frequent, deeper weight shifts that occur only occasionally
        const weightShift = Math.sin(time * 0.12) > 0.7 ? 
          Math.sin((time % 3.0) * 0.5) * 0.03 : 0;
        
        // Very subtle micromovements to prevent complete stillness
        const microSadMovements = Math.sin(time * 2.5) * 0.002;
        
        // Apply combined slumped positioning with permanent downward displacement
        group.current.position.y = sadBreathing + weightShift + microSadMovements - 0.06; // Lower base position
        
        // Apply slight forward slump characteristic of sadness
        group.current.rotation.x = -0.03 + Math.sin(time * 0.2) * 0.01;
        
        // Occasional subtle side-lean - shows imbalance/weariness
        group.current.rotation.z = Math.sin(time * 0.14) * 0.015;
        
        // Drooping arm movements with enhanced weight simulation
        if (group.current.children[1] && group.current.children[2]) { // Left and right arms
          const leftArm = group.current.children[1] as THREE.Mesh;
          const rightArm = group.current.children[2] as THREE.Mesh;
          
          // Create non-synchronized arm movements with weighted physics
          // Deeper base drooping position
          const baseLeftDroop = -0.18;
          const baseRightDroop = -0.18;
          
          // Various influence components with different timing
          
          // Slow primary swaying with proper gravity simulation
          const leftPrimary = Math.sin(time * 0.3) * 0.04;
          // Different frequency for right arm - makes movement more natural
          const rightPrimary = Math.sin(time * 0.28) * 0.045;
          
          // Occasional slight fidget only when triggered by threshold
          const leftFidget = Math.sin(time * 0.1) > 0.85 ? Math.sin(time * 2) * 0.02 : 0;
          const rightFidget = Math.sin(time * 0.13) > 0.82 ? Math.sin(time * 1.8) * 0.025 : 0;
          
          // Apply weighted arm movements
          leftArm.rotation.z = baseLeftDroop + leftPrimary + leftFidget;
          rightArm.rotation.z = baseRightDroop + rightPrimary + rightFidget;
          
          // Add subtle forward/back rotation to enhance weight simulation
          leftArm.rotation.x = Math.sin(time * 0.25) * 0.02;
          rightArm.rotation.x = Math.sin(time * 0.35) * 0.025;
        }
        break;
        
      case ANIMATION_SEQUENCES.CONFUSED:
        // Enhanced confused animation with complex fidgeting and uncertainty simulation
        if (group.current.children[0]) { // Head
          const head = group.current.children[0] as THREE.Mesh;
          
          // Create more complex head movement patterns to show cognitive confusion
          const confusedCycle = time % 5.0; // 5-second confusion cycle
          
          // Create irregular, non-rhythmic head movements by combining different frequencies
          
          // Primary confusion components - multi-axis uncertainty
          // Vertical looking (searching for understanding)
          const verticalSearch = Math.sin(time * 0.7) * 0.08 + 
                                Math.sin(time * 1.5) * 0.03;
          
          // Horizontal searching that speeds up periodically based on threshold
          const searchIntensifier = Math.sin(time * 0.2) > 0.5 ? 2 : 1;
          const horizontalSearch = Math.sin(time * 0.3 * searchIntensifier) * 0.12;
          
          // Add sudden pauses and changes of direction for more realistic confusion
          // Threshold-based abrupt movements
          const abruptPause = Math.sin(time * 0.8) > 0.7 ? 0 : 1; // Sudden freezes
          const suddenShift = Math.sin(time * 1.2) > 0.85 ? Math.sin(time * 5) * 0.05 : 0;
          
          // Apply complex head movements
          head.rotation.x = verticalSearch * abruptPause + suddenShift;
          head.rotation.y = horizontalSearch * abruptPause;
          
          // Characteristic confused head tilt with sudden adjustments
          const baseTilt = 0.12; // Permanent confused tilt
          const tiltVariation = Math.sin(time * 0.5) * 0.08; // Gradual variation
          const suddenTiltAdjustment = Math.sin(time * 0.25) > 0.85 ? 
                                    Math.sin(time * 3) * 0.06 : 0; // Occasional correction
                                    
          head.rotation.z = baseTilt + tiltVariation + suddenTiltAdjustment;
        }
        
        // Enhanced fidgeting body movements with multiple components
        // Primary fidget - more frequent, multi-axis
        const primaryFidget = Math.sin(time * 1.2) * 0.025;
        // Secondary slower fidget - different frequency creates non-repeating pattern
        const secondaryFidget = Math.sin(time * 0.7) * 0.018;
        // Occasional larger adjustment that happens rarely
        const occasionalAdjustment = Math.sin(time * 0.15) > 0.85 ? 
                                  Math.sin(time * 0.6) * 0.04 : 0;
        
        // Apply composite fidgeting
        group.current.position.y = primaryFidget + secondaryFidget + occasionalAdjustment;
        
        // Add slight side-to-side uncertainty
        group.current.position.x = Math.sin(time * 0.9) * 0.015;
        
        // Small rotation shows balance shifting, characteristic of confusion
        group.current.rotation.z = Math.sin(time * 0.4) * 0.02;
        group.current.rotation.y = Math.sin(time * 0.5) * 0.02; // Turning slightly
        
        // Enhanced indecisive arm movements with realistic physics
        if (group.current.children[1] && group.current.children[2]) { // Left and right arms
          const leftArm = group.current.children[1] as THREE.Mesh;
          const rightArm = group.current.children[2] as THREE.Mesh;
          
          // Create complex, asynchronous movements for both arms
          
          // Left arm uncertainty pattern - multi-component for naturalism
          const leftArmBase = Math.sin(time * 0.9) * 0.08; // Primary motion
          const leftArmSecondary = Math.sin(time * 1.7) * 0.04; // Secondary faster component
          const leftArmFidget = Math.sin(time * 0.3) > 0.7 ? Math.sin(time * 3) * 0.06 : 0; // Occasional twitch
          
          // Right arm may be scratching head - different pattern
          const rightArmBase = Math.sin(time * 0.7) * 0.12; // Base motion
          const rightArmSecondary = Math.sin(time * 2.1) * 0.05; // Faster component
          
          // Complex scratching motion with proper timing
          let rightArmScratching = 0;
          
          // Occasional scratching motion with realistic sequence
          if (Math.sin(time * 0.2) > 0.8) {
            // Duration-based animation creates more realistic scratching
            const scratchCycle = (time % 2.0); // 2-second scratch cycle
            
            if (scratchCycle < 0.3) {
              // Initial raise of arm
              const progress = scratchCycle / 0.3;
              rightArmScratching = -0.3 * progress;
            } else if (scratchCycle < 1.5) {
              // Actual scratching motion - several back and forth
              rightArmScratching = -0.3 + Math.sin((scratchCycle - 0.3) * 8) * 0.1;
            } else {
              // Return to normal position
              const progress = (scratchCycle - 1.5) / 0.5;
              rightArmScratching = -0.3 * (1 - progress);
            }
          }
          
          // Apply all arm movements with proper compositing
          leftArm.rotation.z = leftArmBase + leftArmSecondary + leftArmFidget;
          
          // For right arm, use either normal movement or scratching based on condition
          rightArm.rotation.z = rightArmScratching !== 0 ? 
                              rightArmScratching : // Use scratching when active
                              rightArmBase + rightArmSecondary; // Otherwise use normal fidgeting
          
          // Add multi-axis movement for more realistic confusion
          leftArm.rotation.x = Math.sin(time * 1.1) * 0.04; // Slight forward/back
          rightArm.rotation.x = Math.sin(time * 1.4) * 0.06; // More pronounced forward/back
          
          // Occasional y-axis rotation creates more natural movement
          leftArm.rotation.y = Math.sin(time * 0.4) > 0.75 ? Math.sin(time * 0.8) * 0.05 : 0;
          rightArm.rotation.y = Math.sin(time * 0.5) > 0.7 ? Math.sin(time * 0.9) * 0.07 : 0;
        }
        break;
        
      case ANIMATION_SEQUENCES.TYPING:
        // Enhanced typing animation with realistic keyboard interactions and ergonomic posture
        if (group.current.children[0]) { // Head
          const head = group.current.children[0] as THREE.Mesh;
          
          // Create more complex, realistic head movements of someone typing
          
          // Focused downward gaze with varied patterns
          // Base position looking at keyboard
          const baseGaze = 0.15;
          // Micro-movements from breathing and tiny adjustments
          const microMovements = Math.sin(time * 0.5) * 0.02 + Math.sin(time * 1.3) * 0.01;
          // Occasional deeper focus on difficult typing sections
          const focusIntensity = Math.sin(time * 0.13) > 0.7 ? Math.sin(time * 0.3) * 0.03 : 0;
          
          // Apply composite head movements
          head.rotation.x = baseGaze + microMovements + focusIntensity;
          
          // More sophisticated screen scanning pattern
          // Create a natural reading/checking pattern that incorporates:
          // 1. Checking different parts of screen
          // 2. Referring back to keyboard
          // 3. Natural pauses at different sections
          
          const screenScanCycle = time % 7.0; // 7-second cycle for more variation
          
          if (screenScanCycle < 0.3) {
            // Quick glance left (checking left side of screen)
            head.rotation.y = -0.12 * Math.sin(screenScanCycle/0.3 * Math.PI/2);
          } else if (screenScanCycle > 2.2 && screenScanCycle < 2.5) {
            // Quick glance right (checking right side of code)
            head.rotation.y = 0.13 * Math.sin((screenScanCycle-2.2)/0.3 * Math.PI/2);
          } else if (screenScanCycle > 4.0 && screenScanCycle < 4.7) {
            // Slower check of entire screen (reviewing work)
            const scanProgress = (screenScanCycle - 4.0) / 0.7;
            // Smooth scan from left to right using easing function
            head.rotation.y = -0.14 + scanProgress * 0.28;
          } else {
            // Default focus on center screen/keyboard with realistic micro-movements
            // Multiple frequencies create more organic motion
            head.rotation.y = Math.sin(time * 2) * 0.015 + Math.sin(time * 3.1) * 0.005;
          }
          
          // Occasional concentration tilt with variable intensity
          // More pronounced when focusing on difficult sections
          const concentrationIntensity = Math.sin(time * 0.17) > 0.6 ? 0.06 : 0.03;
          head.rotation.z = Math.sin(time * 0.2) * concentrationIntensity;
        }
        
        // Enhanced body movements while typing - realistic ergonomic positioning
        
        // Forward lean while typing - subtle variation to prevent stiffness
        const typingBaseLean = 0.05; // Base forward position
        const leanVariation = Math.sin(time * 0.3) * 0.01; // Subtle adjustment over time
        group.current.position.z = typingBaseLean + leanVariation;
        
        // Multiple breathing and shifting movements - prevents "robotic" appearance
        // Primary breathing movement
        const primaryBreathing = Math.sin(time * 0.8) * 0.018;
        // Secondary slower body adjustment (shifting weight)
        const typingWeightShift = Math.sin(time * 0.2) * 0.01;
        // Apply composite movement
        group.current.position.y = primaryBreathing + typingWeightShift;
        
        // Slight body rotation as hands reach different areas of keyboard
        group.current.rotation.y = Math.sin(time * 0.4) * 0.02;
        
        // Enhanced rapid, precise typing movements with realistic typing patterns
        if (group.current.children[1] && group.current.children[2]) { // Left and right arms
          const leftArm = group.current.children[1] as THREE.Mesh;
          const rightArm = group.current.children[2] as THREE.Mesh;
          
          // Set ergonomic base position for typing pose
          // Arms forward and slightly down at proper typing angle
          leftArm.rotation.x = 0.32;
          rightArm.rotation.x = 0.32;
          
          // Create natural typing rhythm that varies over time
          // Typists don't maintain constant speed - they have bursts and pauses
          
          // Typing intensity varies based on sine wave (simulates bursts of typing)
          const leftTypingIntensity = (Math.sin(time * 0.2) * 0.3 + 0.7); // 0.4 to 1.0 range
          const rightTypingIntensity = (Math.sin(time * 0.3 + 1.1) * 0.3 + 0.7); // Different phase
          
          // Typing frequency varies based on intensity (faster during bursts)
          const leftFrequency = 10 + leftTypingIntensity * 8; // 10-18 Hz
          const rightFrequency = 13 + rightTypingIntensity * 8; // 13-21 Hz
          
          // Typing amplitude larger during faster typing (more enthusiastic keystrokes)
          const leftAmplitude = 0.04 * leftTypingIntensity;
          const rightAmplitude = 0.04 * rightTypingIntensity;
          
          // Apply sophisticated typing motion
          leftArm.rotation.z = -0.22 + Math.sin(time * leftFrequency) * leftAmplitude;
          rightArm.rotation.z = -0.22 + Math.sin(time * rightFrequency + 1.5) * rightAmplitude;
          
          // Add subtle side-to-side movement as hands navigate keyboard
          leftArm.rotation.y = Math.sin(time * 0.7) * 0.04;
          rightArm.rotation.y = Math.sin(time * 0.9) * 0.04;
          
          // Enhanced special key presses with proper timing and mechanics
          // Create a typing cycle with realistic special key presses
          const typingCycle = time % 10.0; // 10-second varied typing cycle
          
          // Shift key press (left pinky extending)
          if (typingCycle > 2.2 && typingCycle < 2.5) {
            // Reaching for shift with proper articulation
            leftArm.rotation.z = -0.35; // Extended reach
            leftArm.rotation.y = -0.06; // Slight inward rotation
          } 
          // Spacebar hit (thumb motion)
          else if (typingCycle > 4.5 && typingCycle < 4.6) {
            // Quick thumb motion for space
            rightArm.rotation.z = -0.25;
            rightArm.rotation.y = 0.08; // Thumb extending inward
          }
          // Enter/Return key (right pinky reaching)
          else if (typingCycle > 7.2 && typingCycle < 7.5) {
            // Distinctive return key motion
            rightArm.rotation.z = -0.32; // Extended reach
            rightArm.rotation.y = 0.12; // Reaching to the side
            rightArm.rotation.x = 0.34; // Slight adjustment to angle
          }
          // Backspace key (quick correction)
          else if (typingCycle > 9.1 && typingCycle < 9.25) {
            // Fast reach to backspace
            rightArm.rotation.z = -0.28;
            rightArm.rotation.y = 0.15;
          }
        }
        break;
        
      case ANIMATION_SEQUENCES.WALK:
        // Enhanced walking animation with realistic gait physics and biomechanics
        
        // Configure the gait cycle parameters for realistic walking
        const strideFrequency = 2.0; // Steps per second - realistic human cadence
        const gaitCycle = time * strideFrequency * Math.PI; // Convert to radians
        
        // Create a more natural walking pattern with biomechanically accurate phases
        // Complete gait cycle includes: heel strike, foot flat, mid-stance, heel off, toe off, swing
        
        if (group.current.children[0]) { // Head
          const head = group.current.children[0] as THREE.Mesh;
          
          // Enhanced natural head movements with multi-axis coordination
          
          // Vertical bobbing follows double-bump pattern of real walking
          // Each step creates one small bump (2 bumps per gait cycle)
          // Using abs(sin) creates realistic up-down pattern with proper timing
          const verticalBob = Math.abs(Math.sin(gaitCycle)) * 0.02;
          
          // Side-to-side shifting as weight transfers during gait
          // Phase offset creates correct weight shift timing
          const lateralShift = Math.sin(gaitCycle) * 0.015;
          
          // Apply complex head movements
          head.position.y = verticalBob;
          head.position.x = lateralShift;
          
          // Add natural head rotation - people scan environment while walking
          // Look in direction of travel with occasional glances around
          
          // Base forward-focused gaze with slight downward angle to see path
          const baseGaze = -0.05;
          
          // Small vertical scan to check path ahead and distance
          const verticalScan = Math.sin(gaitCycle * 0.5) * 0.02;
          
          // Wider horizontal scanning of environment with occasional interest points
          // The combined sine waves create a non-repeating scan pattern
          const horizontalScan = Math.sin(gaitCycle * 0.3) * 0.03 + 
                              (Math.sin(time * 0.3) > 0.7 ? Math.sin(gaitCycle * 2) * 0.04 : 0);
          
          // Apply coordinated head rotations
          head.rotation.x = baseGaze + verticalScan;
          head.rotation.y = horizontalScan;
          
          // Add subtle head tilt coordinated with weight shifts
          head.rotation.z = Math.sin(gaitCycle + Math.PI * 0.1) * 0.02; // Slight phase offset
        }
        
        // Enhanced whole body movement coordinated with gait cycle
        
        // Vertical body movement - follows double-bump pattern
        // Uses a modified sine curve to create proper rise and fall timing
        const verticalBodyMovement = Math.abs(Math.sin(gaitCycle)) * 0.05 + 
                                 Math.abs(Math.sin(gaitCycle * 2)) * 0.01;
        
        // Forward progression with each step (actual forward movement)
        // This moves the body forward with each step in a smooth pattern
        const forwardProgress = 0.1; // The distance covered per cycle
        const stepProgress = (Math.sin(gaitCycle) * 0.5 + 0.5) * forwardProgress;
        group.current.position.z = stepProgress;
        
        // Apply vertical body movement
        group.current.position.y = verticalBodyMovement;
        
        // Side-to-side weight shifting during walking
        // Phase aligned with the gait cycle
        group.current.position.x = Math.sin(gaitCycle) * 0.03;
        
        // Forward leaning that varies with speed (more lean = faster walking)
        // Add subtle forward/backward rock with each step
        const walkBaseLean = 0.05; // Base forward lean for walking
        const stepRock = Math.sin(gaitCycle * 2) * 0.01; // Subtle rock with each step
        group.current.rotation.x = walkBaseLean + stepRock;
        
        // Natural side-to-side balance shifts coordinated with weight transfer
        // Pelvis/torso rotation counters leg movement for balance
        group.current.rotation.z = Math.sin(gaitCycle) * 0.025;
        
        // Slight torso rotation counter to leg movement (natural counter-rotation)
        group.current.rotation.y = Math.sin(gaitCycle) * 0.04;
        
        // Enhanced arm swing animations with proper physics and counter-balance
        if (group.current.children[1] && group.current.children[2]) { // Left and right arms
          const leftArm = group.current.children[1] as THREE.Mesh;
          const rightArm = group.current.children[2] as THREE.Mesh;
          
          // Configure arm swing parameters for natural counter-balancing
          // Arms swing opposite to legs for balance (opposite-phase)
          // Should have slight delay compared to leg movement for physics accuracy
          const armPhaseOffset = Math.PI * 0.1; // Slight phase delay for natural motion
          
          // Primary arm swing with proper shoulder rotation and pendulum physics
          // Arms follow pendulum motion (greater at bottom of swing, slower at extremes)
          const leftArmSwing = Math.sin(gaitCycle + Math.PI + armPhaseOffset) * 0.25;
          const rightArmSwing = Math.sin(gaitCycle + armPhaseOffset) * 0.25;
          
          // Apply primary arm swings
          leftArm.rotation.z = leftArmSwing;
          rightArm.rotation.z = rightArmSwing;
          
          // Add natural elbow bend that varies during swing
          // Elbows bend slightly more on forward swing, straighten more on back swing
          // Use absolute value of sin to create appropriate pattern
          const leftElbowBend = 0.05 + Math.abs(Math.sin(gaitCycle + Math.PI + armPhaseOffset)) * 0.15;
          const rightElbowBend = 0.05 + Math.abs(Math.sin(gaitCycle + armPhaseOffset)) * 0.15;
          
          // Apply elbow bend - greater on forward swing
          leftArm.rotation.x = leftElbowBend;
          rightArm.rotation.x = rightElbowBend;
          
          // Add slight arm rotation during swing (pronation/supination)
          leftArm.rotation.y = Math.sin(gaitCycle + Math.PI + armPhaseOffset) * 0.06;
          rightArm.rotation.y = Math.sin(gaitCycle + armPhaseOffset) * 0.06;
        }
        
        // Enhanced leg movements with complete gait cycle biomechanics
        if (group.current.children[3] && group.current.children[4]) { // Left and right legs
          const leftLeg = group.current.children[3] as THREE.Mesh;
          const rightLeg = group.current.children[4] as THREE.Mesh;
          
          // Primary leg swing with proper hip rotation
          // Each leg follows a full gait cycle (stance and swing phases)
          const leftLegSwing = Math.sin(gaitCycle) * 0.25;
          const rightLegSwing = Math.sin(gaitCycle + Math.PI) * 0.25;
          
          // Apply hip rotation for stride
          leftLeg.rotation.x = leftLegSwing;
          rightLeg.rotation.x = rightLegSwing;
          
          // Add knee bend that increases during swing phase and straightens during stance
          // Creates push-off and ground clearance during swing
          const leftKneeBend = Math.max(0, Math.sin(gaitCycle - Math.PI/4)) * 0.15;
          const rightKneeBend = Math.max(0, Math.sin(gaitCycle + Math.PI - Math.PI/4)) * 0.15;
          
          // Apply knee bend
          leftLeg.rotation.z = leftKneeBend;
          rightLeg.rotation.z = rightKneeBend;
          
          // Add subtle toe-out during walking (slight external rotation)
          leftLeg.rotation.y = -0.05;
          rightLeg.rotation.y = 0.05;
        }
        break;
        
      case ANIMATION_SEQUENCES.BUILD:
        // Enhanced building/construction animation with realistic physics and craftsmanship
        
        // Configure the building activity parameters for realism
        const buildingPhaseLength = 8.0; // Longer, more complex build cycle
        const buildCycle = time % buildingPhaseLength; // Complete building sequence
        
        if (group.current.children[0]) { // Head
          const head = group.current.children[0] as THREE.Mesh;
          
          // Enhanced cognitive focus patterns of someone performing precision work
          // Humans follow specific visual attention patterns during construction:
          // 1. Examining materials/parts
          // 2. Planning/visualizing next steps
          // 3. Focused execution
          // 4. Verification of work
          
          // Create more realistic inspection and building visual focus
          
          // Base downward work focus - varies based on current task
          const focusIntensity = 
            // More intense focus during precision tasks
            (buildCycle > 3.2 && buildCycle < 4.0) ? 0.25 :
            // Moderate focus during regular assembly
            (buildCycle > 1.0 && buildCycle < 3.0) ? 0.2 :
            // Relaxed focus during planning/preparation
            0.15;
            
          // Add micro-focus adjustments - small movements as focus shifts between details
          // Multiple frequencies create more organic, non-repeating motion
          const microFocusMovements = 
            Math.sin(time * 0.7) * 0.02 + 
            Math.sin(time * 1.3) * 0.01 * (Math.sin(time * 0.4) * 0.5 + 0.5); // Variable intensity
            
          // Apply primary focus to head
          head.rotation.x = focusIntensity + microFocusMovements;
          
          // Create realistic visual inspection patterns - scanning between:
          // - The work area (center focus)
          // - Tools and parts (right side glances)
          // - Reference materials or measurements (left side glances)
          // - Results/verification (slight up-tilt glances)
          
          // Determine specific glance type based on current build phase
          
          if (buildCycle < 0.3) {
            // Initial planning - checking reference design/blueprint (left glance)
            // Smooth, deliberate movement showing careful consideration
            const progress = buildCycle / 0.3; // 0 to 1 over 0.3 seconds
            // Use easing function for natural acceleration/deceleration 
            const easedProgress = progress < 0.5 ? 
              2 * progress * progress : 
              1 - Math.pow(-2 * progress + 2, 2) / 2;
            head.rotation.y = -0.22 * Math.sin(easedProgress * Math.PI);
            
            // Slight upward tilt during planning phase
            head.rotation.x = focusIntensity - 0.05 * easedProgress;
          } 
          else if (buildCycle > 1.2 && buildCycle < 1.6) {
            // Looking at tools/parts (right glance with purpose)
            const progress = (buildCycle - 1.2) / 0.4;
            // Faster acquisition, slower return creates realistic motion
            const asymmetricProgress = progress < 0.4 ? 
              progress * 2.5 : 
              1 - (progress - 0.4) * 1.0; // Faster out, slower return
            head.rotation.y = 0.25 * asymmetricProgress;
          } 
          else if (buildCycle > 3.8 && buildCycle < 4.3) {
            // Precise measurement check (left glance with careful attention)
            const progress = (buildCycle - 3.8) / 0.5;
            // Careful measurement motion with pause at full extension
            const calibratedProgress = progress < 0.3 ? 
              progress * 3.3 : 
              (progress > 0.7 ? (progress - 0.7) * 3.3 : 1.0); // Hold position in middle
            head.rotation.y = -0.18 * calibratedProgress;
            
            // Extra focus when measuring
            head.rotation.x = focusIntensity + 0.05;
          }
          else if (buildCycle > 6.5 && buildCycle < 7.0) {
            // Final inspection of work (scanning motion)
            const progress = (buildCycle - 6.5) / 0.5;
            // Create S-curve scanning pattern to check all aspects of work
            const scanPhase = progress * 2 * Math.PI;
            head.rotation.y = 0.12 * Math.sin(scanPhase) - 0.05;
            
            // Varied vertical inspection
            head.rotation.x = focusIntensity + Math.sin(scanPhase * 2) * 0.04;
          } 
          else {
            // Default focused on building with subtle, natural adjustments
            // Combine multiple sine waves of different frequencies for organic motion
            head.rotation.y = Math.sin(time * 1.2) * 0.04 + Math.sin(time * 2.3) * 0.01;
          }
          
          // Add subtle head tilt that follows from concentration
          // More pronounced during precision work phases
          const concentrationTilt = 
            (buildCycle > 2.0 && buildCycle < 3.0) ? 
              Math.sin(time * 0.3) * 0.05 : 
              Math.sin(time * 0.5) * 0.02;
          head.rotation.z = concentrationTilt;
        }
        
        // Enhanced body movements coordinated with construction tasks
        
        // Dynamic body positioning based on current task
        // Forward lean intensifies during precision work
        const buildLeanIntensity = 
          (buildCycle > 2.0 && buildCycle < 4.0) ? 0.1 : // More lean during precision work
          (buildCycle > 6.0) ? 0.05 : // Less lean during inspection
          0.08; // Default working position
        
        // Apply forward lean with subtle variations
        group.current.position.z = buildLeanIntensity + Math.sin(time * 0.4) * 0.01;
        
        // Body rotates slightly to accommodate different work angles
        // Working on different sides of the project
        const workAngle = Math.sin(buildCycle * 0.25) * 0.1;
        group.current.rotation.y = workAngle;
        
        // Forward tilt varies with task intensity
        const workTilt = 0.05 + 
          (buildCycle > 3.0 && buildCycle < 3.8 ? Math.sin((buildCycle - 3.0) * 2.5) * 0.03 : 0);
        group.current.rotation.x = workTilt;
        
        // Subtle weight shifts during extended construction
        // Engineers/builders shift weight during long tasks
        group.current.position.y = Math.sin(time * 0.2) * 0.02;
        
        // Enhanced hand/arm movements with accurate construction biomechanics
        if (group.current.children[1] && group.current.children[2]) { // Left and right arms
          const leftArm = group.current.children[1] as THREE.Mesh;
          const rightArm = group.current.children[2] as THREE.Mesh;
          
          // Create more nuanced construction sequence
          // Realistic building involves multiple distinct phases:
          
          // Select phase of construction based on cycle time
          if (buildCycle < 1.0) {
            // PHASE 1: Planning/preparation - examining and retrieving parts
            const phase1Progress = buildCycle / 1.0;
            
            // Right hand reaching for and selecting parts with careful consideration
            const rightReach = Math.sin(phase1Progress * Math.PI) * 0.4;
            rightArm.rotation.z = -0.2 - rightReach;
            rightArm.rotation.y = 0.2 * rightReach;
            
            // Left hand supporting or holding base material
            leftArm.rotation.z = -0.25 - phase1Progress * 0.1;
            leftArm.rotation.x = 0.2;
            
          } else if (buildCycle < 3.0) {
            // PHASE 2: Primary assembly - joining parts with control and precision
            const phase2Progress = (buildCycle - 1.0) / 2.0;
            
            // Breaking phase into sub-motions for realistic assembly work
            const assemblySubPhase = phase2Progress * 6; // Creates 6 sub-movements
            const subPhasePosition = assemblySubPhase % 1.0; // 0-1 for each sub-movement
            const subPhaseIndex = Math.floor(assemblySubPhase); // Which sub-movement (0-5)
            
            // Right hand performs different assembly actions based on sub-phase
            switch (subPhaseIndex) {
              case 0: // Positioning part
                rightArm.rotation.z = -0.3 - subPhasePosition * 0.1;
                rightArm.rotation.y = 0.15 * (1 - subPhasePosition);
                rightArm.rotation.x = 0.1 * subPhasePosition;
                break;
              case 1: // Aligning/adjusting
                rightArm.rotation.z = -0.4 + Math.sin(subPhasePosition * Math.PI * 2) * 0.05;
                rightArm.rotation.y = 0.05 + Math.sin(subPhasePosition * Math.PI * 3) * 0.08;
                break;
              case 2: // Securing/fastening
                rightArm.rotation.z = -0.35 + Math.sin(subPhasePosition * Math.PI * 8) * 0.07;
                rightArm.rotation.x = 0.1 - Math.sin(subPhasePosition * Math.PI * 4) * 0.05;
                break;
              case 3: // Checking alignment
                rightArm.rotation.z = -0.25 - subPhasePosition * 0.1;
                rightArm.rotation.y = -0.1 * subPhasePosition;
                break;
              case 4: // Fine adjustment
                rightArm.rotation.z = -0.35 + Math.sin(subPhasePosition * Math.PI * 3) * 0.05;
                rightArm.rotation.y = -0.1 * (1 - subPhasePosition);
                break;
              case 5: // Repositioning for next action
                rightArm.rotation.z = -0.3 * (1 - subPhasePosition);
                rightArm.rotation.x = 0.05 * (1 - subPhasePosition);
                break;
            }
            
            // Left hand stabilizing work with subtle adjustments to maintain position
            leftArm.rotation.z = -0.35 + Math.sin(time * 0.7) * 0.03;
            // Apply pressure at key moments of assembly
            leftArm.rotation.x = 0.2 + 
              (subPhaseIndex === 2 ? Math.sin(subPhasePosition * Math.PI) * 0.08 : 0);
            
          } else if (buildCycle < 4.5) {
            // PHASE 3: Precision adjustments - fine-tuning and detail work
            const phase3Progress = (buildCycle - 3.0) / 1.5;
            
            // Right hand doing precise adjustments - smaller, more focused movements
            // Use multiple oscillations to create realistic adjustment patterns
            
            // Combine multiple frequencies to create realistic precision work
            // Engineers make tiny adjustments with high precision during this phase
            const precisionAdjustment = 
              Math.sin(phase3Progress * Math.PI * 5) * 0.04 + // Rapid adjustments
              Math.sin(phase3Progress * Math.PI * 2) * 0.08;  // Overall position change
              
            rightArm.rotation.z = -0.3 + precisionAdjustment;
            
            // Fine motor control in wrist/hand - subtle rotation adjustments
            rightArm.rotation.y = Math.sin(phase3Progress * Math.PI * 4) * 0.07;
            rightArm.rotation.x = 0.1 + Math.sin(phase3Progress * Math.PI * 3) * 0.05;
            
            // Left hand maintaining stable hold with subtle pressure changes
            // Supporting role during precision work
            leftArm.rotation.z = -0.35;
            leftArm.rotation.x = 0.25 + Math.sin(phase3Progress * Math.PI * 1.5) * 0.03;
            
          } else if (buildCycle < 6.0) {
            // PHASE 4: Testing/verification - checking work quality
            const phase4Progress = (buildCycle - 4.5) / 1.5;
            
            // Both hands involved in checking/testing the assembly
            // Testing involves manipulation, measurement, and verification
            
            if (phase4Progress < 0.3) {
              // Initial verification - hands pull back slightly to observe
              const observeProgress = phase4Progress / 0.3;
              rightArm.rotation.z = -0.2 * (1 - observeProgress);
              leftArm.rotation.z = -0.35 * (1 - observeProgress);
            } else if (phase4Progress < 0.6) {
              // Checking from different angles
              const checkProgress = (phase4Progress - 0.3) / 0.3;
              rightArm.rotation.z = -0.15 - checkProgress * 0.15;
              rightArm.rotation.y = 0.1 * Math.sin(checkProgress * Math.PI * 2);
              leftArm.rotation.z = -0.2 - checkProgress * 0.15;
            } else {
              // Final testing - applying pressure or checking connections
              const testProgress = (phase4Progress - 0.6) / 0.4;
              
              // Testing sequence with coordinated two-hand movements
              rightArm.rotation.z = -0.3 - Math.sin(testProgress * Math.PI) * 0.15;
              rightArm.rotation.x = Math.sin(testProgress * Math.PI) * 0.12;
              
              // Left hand assists in testing
              leftArm.rotation.z = -0.3 - Math.sin(testProgress * Math.PI) * 0.1;
              leftArm.rotation.x = 0.1 + Math.sin(testProgress * Math.PI + 0.2) * 0.1;
            }
            
          } else {
            // PHASE 5: Finishing and cleanup - wrapping up construction
            const phase5Progress = (buildCycle - 6.0) / (buildingPhaseLength - 6.0);
            
            // Final polish/cleanup movements
            // Broader, smoother motions for finishing work
            
            if (phase5Progress < 0.4) {
              // Final adjustments - small tweaks to perfection
              const finalProgress = phase5Progress / 0.4;
              rightArm.rotation.z = -0.25 - Math.sin(finalProgress * Math.PI * 3) * 0.08;
              rightArm.rotation.y = Math.sin(finalProgress * Math.PI * 2) * 0.1;
              leftArm.rotation.z = -0.3;
              leftArm.rotation.x = 0.15;
            } else {
              // Standing back to admire completed work
              const admirationProgress = (phase5Progress - 0.4) / 0.6;
              // Arms gradually returning to neutral positions
              rightArm.rotation.z = -0.25 * (1 - admirationProgress);
              rightArm.rotation.y = 0.05 * (1 - admirationProgress);
              leftArm.rotation.z = -0.3 * (1 - admirationProgress);
              leftArm.rotation.x = 0.15 * (1 - admirationProgress);
            }
          }
        }
        break;
        
      case ANIMATION_SEQUENCES.REPAIR:
        // Enhanced repair animation with diagnostic procedures and technical precision
        
        // Configure the repair cycle parameters for realistic troubleshooting behavior
        const repairSequenceLength = 6.0; // Complete repair sequence with diagnostic and fix phases
        const repairCycle = time % repairSequenceLength;
        
        if (group.current.children[0]) { // Head
          const head = group.current.children[0] as THREE.Mesh;
          
          // Create realistic diagnostic and repair visual focus
          // Repair work follows specific cognitive patterns:
          // 1. Initial assessment (overview)
          // 2. Diagnostic focus (problem identification)
          // 3. Strategic planning (solution formulation)
          // 4. Technical execution (precise repair)
          // 5. Verification testing (checking work)
          
          // Determine current diagnostic/repair phase
          // Each phase has distinct head movements representing different cognitive focus
          
          if (repairCycle < 1.0) {
            // PHASE 1: Initial assessment - examining the issue from multiple angles
            const assessProgress = repairCycle / 1.0;
            
            // Systematic inspection pattern with pauses at critical angles
            // Create smooth inspection movement with subtle acceleration/deceleration
            
            // Multi-angle examination with natural movement progression
            if (assessProgress < 0.25) {
              // Right side inspection
              const rightProgress = assessProgress / 0.25;
              // Use easing function for natural look angle
              const easedRight = rightProgress < 0.5 ? 
                2 * rightProgress * rightProgress : 
                1 - Math.pow(-2 * rightProgress + 2, 2) / 2;
              head.rotation.y = 0.18 * easedRight;
            } else if (assessProgress < 0.5) {
              // Left side inspection
              const leftProgress = (assessProgress - 0.25) / 0.25;
              // Use easing function with momentary hold at extreme
              const easedLeft = leftProgress < 0.7 ? 
                leftProgress * 1.4 : 
                1.0; // Hold at max inspection angle
              head.rotation.y = 0.18 * (1 - easedLeft * 2); // Right to left transition
            } else if (assessProgress < 0.75) {
              // Top inspection (if applicable to repair)
              const topProgress = (assessProgress - 0.5) / 0.25;
              // Smoother transition with subtle bobbing
              head.rotation.y = -0.18 * (1 - topProgress); // Return from left
              // Adjust vertical look angle to see top
              head.rotation.x = 0.15 * (1 - topProgress);
            } else {
              // Return to center with assessment conclusion
              const centerProgress = (assessProgress - 0.75) / 0.25;
              // Slow, deliberate return to center suggesting processing
              head.rotation.y = 0; 
              // Transition to focused downward gaze for repair
              head.rotation.x = 0.15 * (1 - centerProgress) + 0.22 * centerProgress;
            }
            
            // Thoughtful head tilt during assessment phase
            head.rotation.z = Math.sin(assessProgress * Math.PI * 1.5) * 0.12;
            
          } else if (repairCycle < 2.0) {
            // PHASE 2: Detailed diagnostic - intense focus on problem area
            const diagnosticProgress = (repairCycle - 1.0) / 1.0;
            
            // Very focused examination with micro-movements
            // Engineers make tiny head adjustments to see detail from optimal angle
            
            // Primary focus direction - slightly varies based on repair type
            const primaryFocusAngle = 0.05 * Math.sin(diagnosticProgress * Math.PI * 0.5);
            
            // Micro-adjustments for optimal viewing angles (3 frequency components)
            const microAdjustments = 
              Math.sin(diagnosticProgress * Math.PI * 3) * 0.02 + // Medium adjustments
              Math.sin(diagnosticProgress * Math.PI * 8) * 0.01 + // Fine adjustments
              Math.sin(time * 3) * 0.005; // Continuous subtle movement
            
            // Apply complex diagnostic gaze pattern
            head.rotation.y = primaryFocusAngle + microAdjustments;
            
            // Intense downward focus with slight variations for depth perception
            head.rotation.x = 0.28 + Math.sin(diagnosticProgress * Math.PI * 2) * 0.04;
            
            // Subtle thoughtful head tilt while identifying issue
            head.rotation.z = 0.08 * Math.sin(diagnosticProgress * Math.PI + Math.PI/4);
            
          } else if (repairCycle < 4.0) {
            // PHASE 3: Active repair work - intense precision with occasional reference checks
            const repairWorkProgress = (repairCycle - 2.0) / 2.0;
            
            // During active repair, focus alternates between:
            // - Current work area (main focus)
            // - Reference checks (brief glances)
            // - Tool/part selection (quick side glances)
            
            // Determine specific focus based on current work sub-phase
            const repairSubPhase = repairWorkProgress * 12; // 12 distinct moments in repair
            const subPhaseIndex = Math.floor(repairSubPhase);
            
            // Create specific focus patterns based on current repair step
            switch (subPhaseIndex % 4) { // Create repeating pattern of 4 types
              case 0: // Primary work focus
                head.rotation.y = Math.sin(time * 1.5) * 0.03; // Tiny work adjustments
                head.rotation.x = 0.3; // Deep focus angle
                break;
              case 1: // Quick reference check (left glance)
                const refCheckTime = repairSubPhase % 1;
                // Fast check with natural acceleration/deceleration  
                if (refCheckTime < 0.3) {
                  // Quick glance to reference
                  head.rotation.y = -0.15 * (refCheckTime / 0.3);
                } else if (refCheckTime < 0.7) {
                  // Hold at reference point
                  head.rotation.y = -0.15;
                } else {
                  // Return to work
                  head.rotation.y = -0.15 * (1 - (refCheckTime - 0.7) / 0.3);
                }
                // Maintain primary work focus with slight adjustment  
                head.rotation.x = 0.28;
                break;
              case 2: // Intense precision moment
                head.rotation.y = Math.sin(time * 2) * 0.02; // Minimal movement
                // Extra downward angle for critical moments
                head.rotation.x = 0.32 + Math.sin(time * 0.8) * 0.01;
                break;
              case 3: // Tool/part selection (right glance)
                const toolSelectTime = repairSubPhase % 1;
                // Precise tool selection timing
                if (toolSelectTime < 0.25) {
                  // Quick glance to tools
                  head.rotation.y = 0.18 * (toolSelectTime / 0.25);
                } else if (toolSelectTime < 0.5) {
                  // Brief selection moment
                  head.rotation.y = 0.18;
                } else {
                  // Return to work
                  head.rotation.y = 0.18 * (1 - (toolSelectTime - 0.5) / 0.5);
                }
                // Slightly less downward focus while selecting tools
                head.rotation.x = 0.25;
                break;
            }
            
            // Add subtle concentration head tilt that varies with precision needs
            const concentrationIntensity = (subPhaseIndex === 2) ? 0.07 : 0.03; // More during high precision
            head.rotation.z = Math.sin(time * 0.3) * concentrationIntensity;
            
          } else {
            // PHASE 4: Testing and verification - systematic checking
            const verifyProgress = (repairCycle - 4.0) / 2.0;
            
            // Testing follows a methodical pattern similar to initial inspection
            // But with more purpose and focus on function rather than fault
            
            if (verifyProgress < 0.3) {
              // Functional testing - focused observation
              head.rotation.y = Math.sin(verifyProgress * Math.PI * 2) * 0.1;
              head.rotation.x = 0.25 - verifyProgress * 0.1; // Looking more level at function
            } else if (verifyProgress < 0.6) {
              // Detail verification - careful final checks
              const detailCheck = (verifyProgress - 0.3) / 0.3;
              // S-curve scan to verify all aspects
              head.rotation.y = Math.sin(detailCheck * Math.PI * 3) * 0.08;
              head.rotation.x = 0.22 + Math.sin(detailCheck * Math.PI * 2) * 0.05;
            } else {
              // Final satisfaction survey - taking in completed work
              const finalCheck = (verifyProgress - 0.6) / 0.4;
              // Wider scan with slower, satisfied movement
              head.rotation.y = Math.sin(finalCheck * Math.PI) * 0.15;
              // Gradually raising head as verification completes
              head.rotation.x = 0.22 * (1 - finalCheck * 0.7);
              // Slight pleased head tilt at successful completion
              head.rotation.z = finalCheck > 0.8 ? Math.sin((finalCheck - 0.8) / 0.2 * Math.PI) * 0.05 : 0;
            }
          }
        }
        
        // Enhanced body movements coordinated with repair phases
        
        // Body positioning varies with repair phase
        // More forward lean during precision work, more upright during testing
        const repairLeanIntensity = 
          (repairCycle > 2.5 && repairCycle < 3.5) ? 0.12 : // Maximum lean during critical repair
          (repairCycle < 1.0) ? 0.07 : // Moderate during assessment
          (repairCycle > 4.0) ? 0.05 : // Minimal during verification
          0.1; // Default repair position
          
        // Apply dynamic positioning with subtle variations
        group.current.position.z = repairLeanIntensity + Math.sin(time * 0.4) * 0.01;
        
        // Body rotates slightly to accommodate repair angle
        const repairAngle = 
          (repairCycle > 1.0 && repairCycle < 2.0) ? Math.sin((repairCycle - 1.0) * Math.PI) * 0.08 : // Diagnostic rotation
          Math.sin(repairCycle * 0.3) * 0.05; // General subtle rotation
          
        group.current.rotation.y = repairAngle;
        
        // Forward tilt varies with repair intensity
        const repairTilt = 0.08 + 
          (repairCycle > 2.0 && repairCycle < 4.0 ? Math.sin((repairCycle - 2.0) * Math.PI) * 0.04 : 0);
        group.current.rotation.x = repairTilt;
        
        // Weight shifts during extended repair work
        // Technicians adjust position during long tasks to prevent fatigue
        group.current.position.y = 0.05 + Math.sin(time * 0.2) * 0.02 + Math.sin(time * 0.6) * 0.01;
        
        // Enhanced arm & hand movements with technical precision
        if (group.current.children[1] && group.current.children[2]) { // Left and right arms
          const leftArm = group.current.children[1] as THREE.Mesh;
          const rightArm = group.current.children[2] as THREE.Mesh;
          
          // Create realistic technical repair sequence 
          // Professional repair involves several distinct phases
          
          // Determine current repair phase and progress
          if (repairCycle < 1.0) {
            // PHASE 1: Assessment - Both hands examining the problem
            const assessProgress = repairCycle / 1.0;
            
            // Left hand gently supporting or rotating component for examination
            leftArm.rotation.z = -0.3 - assessProgress * 0.1;
            leftArm.rotation.x = 0.2 + Math.sin(assessProgress * Math.PI * 2) * 0.1;
            leftArm.rotation.y = Math.sin(assessProgress * Math.PI) * 0.15 - 0.05;
            
            // Right hand gesturing, pointing, or gently testing components
            rightArm.rotation.z = -0.25 - Math.sin(assessProgress * Math.PI * 1.5) * 0.15;
            rightArm.rotation.x = 0.15 + Math.sin(assessProgress * Math.PI * 2 + 0.5) * 0.1;
            rightArm.rotation.y = Math.sin(assessProgress * Math.PI * 0.5) * 0.1;
            
          } else if (repairCycle < 2.0) {
            // PHASE 2: Preparation - Selecting and preparing tools/parts
            const prepProgress = (repairCycle - 1.0) / 1.0;
            
            // Left hand stabilizing the work area
            leftArm.rotation.z = -0.4;
            leftArm.rotation.x = 0.25 + Math.sin(prepProgress * Math.PI) * 0.05;
            leftArm.rotation.y = -0.1;
            
            // Right hand selecting and positioning tools
            if (prepProgress < 0.4) {
              // Reaching for tool
              const reachProgress = prepProgress / 0.4;
              rightArm.rotation.z = -0.2 - reachProgress * 0.2;
              rightArm.rotation.y = 0.15 * reachProgress;
            } else if (prepProgress < 0.7) {
              // Checking/adjusting tool
              const checkProgress = (prepProgress - 0.4) / 0.3;
              rightArm.rotation.z = -0.4;
              rightArm.rotation.y = 0.15 + Math.sin(checkProgress * Math.PI * 2) * 0.05;
              rightArm.rotation.x = 0.1 + checkProgress * 0.1;
            } else {
              // Positioning tool for work
              const positionProgress = (prepProgress - 0.7) / 0.3;
              rightArm.rotation.z = -0.4 + positionProgress * 0.1;
              rightArm.rotation.y = 0.15 * (1 - positionProgress);
              rightArm.rotation.x = 0.2 + positionProgress * 0.1;
            }
            
          } else if (repairCycle < 4.0) {
            // PHASE 3: Technical repair - Precision work with specialized tools
            const repairWorkProgress = (repairCycle - 2.0) / 2.0;
            
            // Create a complex repair sequence with multiple tool actions
            // Professional repair involves varied techniques and tool uses
            
            // Break down into tool-specific repair actions
            const repairAction = repairWorkProgress * 8; // 8 distinct repair actions
            const actionIndex = Math.floor(repairAction);
            const actionProgress = repairAction % 1.0;
            
            // Left hand maintains stable platform with subtle adaptive movements
            // Provides counter-pressure and stabilization during repair
            leftArm.rotation.z = -0.4 - Math.sin(repairAction * 0.5) * 0.05;
            leftArm.rotation.x = 0.3 + 
              // Additional pressure at key moments
              (actionIndex % 4 === 2 ? Math.sin(actionProgress * Math.PI) * 0.08 : 0);
            leftArm.rotation.y = -0.1 + Math.sin(repairAction * 0.25) * 0.05;
            
            // Right hand performs varied technical actions based on current tool/task
            switch (actionIndex % 4) { // Create repeating pattern of 4 repair actions
              case 0: // Precision screwdriver/adjustments
                // Fast, precise rotational movement
                rightArm.rotation.z = -0.35 + Math.sin(actionProgress * Math.PI * 8) * 0.03;
                rightArm.rotation.x = 0.3;
                rightArm.rotation.y = Math.sin(actionProgress * Math.PI * 4) * 0.04;
                break;
                
              case 1: // Component replacement/insertion
                if (actionProgress < 0.3) {
                  // Alignment phase
                  rightArm.rotation.z = -0.35 + Math.sin(actionProgress/0.3 * Math.PI) * 0.05;
                  rightArm.rotation.x = 0.3;
                } else if (actionProgress < 0.7) {
                  // Insertion/pressure phase
                  const insertPressure = (actionProgress - 0.3) / 0.4;
                  rightArm.rotation.z = -0.35 - insertPressure * 0.1;
                  rightArm.rotation.x = 0.3 + insertPressure * 0.05;
                } else {
                  // Securing phase
                  const securingProgress = (actionProgress - 0.7) / 0.3;
                  rightArm.rotation.z = -0.45 + Math.sin(securingProgress * Math.PI * 3) * 0.03;
                  rightArm.rotation.x = 0.35 - securingProgress * 0.05;
                }
                break;
                
              case 2: // Cable/connection management
                // Delicate finger work
                rightArm.rotation.z = -0.4 + Math.sin(actionProgress * Math.PI * 2) * 0.05;
                rightArm.rotation.x = 0.25 + Math.sin(actionProgress * Math.PI * 3) * 0.04;
                rightArm.rotation.y = Math.sin(actionProgress * Math.PI * 4) * 0.06;
                break;
                
              case 3: // Testing/adjustment after repair step
                if (actionProgress < 0.5) {
                  // Position adjustment
                  rightArm.rotation.z = -0.3 - actionProgress * 0.1;
                  rightArm.rotation.x = 0.28;
                } else {
                  // Verification movement
                  const verifyMotion = (actionProgress - 0.5) / 0.5;
                  rightArm.rotation.z = -0.35 + verifyMotion * 0.2;
                  rightArm.rotation.x = 0.28 - verifyMotion * 0.1;
                }
                break;
            }
            
          } else {
            // PHASE 4: Verification and refinement - Testing repair quality
            const verifyProgress = (repairCycle - 4.0) / 2.0;
            
            // Both hands involved in testing the repair
            
            if (verifyProgress < 0.3) {
              // Initial functional test
              leftArm.rotation.z = -0.3;
              leftArm.rotation.x = 0.2;
              leftArm.rotation.y = -0.05;
              
              // Right hand performing test actions
              rightArm.rotation.z = -0.25 - verifyProgress/0.3 * 0.1;
              rightArm.rotation.x = 0.2;
            } else if (verifyProgress < 0.6) {
              // Adjustment based on test results
              const adjustProgress = (verifyProgress - 0.3) / 0.3;
              
              // Both hands making final adjustments
              leftArm.rotation.z = -0.3 - adjustProgress * 0.05;
              rightArm.rotation.z = -0.35 + Math.sin(adjustProgress * Math.PI * 4) * 0.05;
              rightArm.rotation.x = 0.2 + adjustProgress * 0.05;
            } else {
              // Final satisfaction check and cleanup
              const finalizeProgress = (verifyProgress - 0.6) / 0.4;
              
              // Hands returning to neutral as work completes
              leftArm.rotation.z = -0.35 * (1 - finalizeProgress * 0.8);
              leftArm.rotation.x = 0.2 * (1 - finalizeProgress * 0.8);
              leftArm.rotation.y = -0.05 * (1 - finalizeProgress);
              
              rightArm.rotation.z = -0.3 * (1 - finalizeProgress * 0.8);
              rightArm.rotation.x = 0.25 * (1 - finalizeProgress * 0.8);
            }
          }
        }
        break;
        
      case ANIMATION_SEQUENCES.SCAN:
        // Enhanced scanning animation with professional methodical movement and data collection behaviors
        
        // Configure scan parameters for realistic technical scanning behavior
        const scanSequenceLength = 9.0; // Complete multi-phase scan sequence
        const scanCycle = time % scanSequenceLength;
        
        if (group.current.children[0]) { // Head
          const head = group.current.children[0] as THREE.Mesh;
          
          // Create realistic scan behavior based on professional scanning techniques
          // Technical scanning follows distinct methodical patterns:
          // 1. Initial broad sweep (situational awareness)
          // 2. Grid-pattern systematic scan (thorough coverage)
          // 3. Anomaly focus (detailed examination)
          // 4. Verification scan (confirmation)
          // 5. Data analysis (processing collected information)
          
          // Determine current scan phase based on time
          if (scanCycle < 1.5) {
            // PHASE 1: Initial broad sweep scan - understanding the environment
            const sweepProgress = scanCycle / 1.5;
            
            // Create a smooth acceleration/deceleration scanning motion
            // Professionals take time at endpoints to ensure coverage
            const sweepEasing = 
              sweepProgress < 0.1 ? // Slow start
                sweepProgress * 10 * 0.1 : 
              sweepProgress > 0.9 ? // Slow end
                0.9 + (sweepProgress - 0.9) * 0.1 :
              // Smooth middle section
                0.1 + (sweepProgress - 0.1) * (0.8 / 0.8);
                
            // Apply horizontal sweep with controlled speed
            head.rotation.y = -0.35 + sweepEasing * 0.7;
            
            // Slight vertical adjustment to cover more area
            head.rotation.x = -0.05 + Math.sin(sweepProgress * Math.PI) * 0.05;
            
          } else if (scanCycle < 4.0) {
            // PHASE 2: Grid-pattern systematic scan - thorough area coverage
            const gridProgress = (scanCycle - 1.5) / 2.5;
            
            // Create a grid-scanning pattern with multiple passes
            // Real scanning uses a methodical grid to ensure complete coverage
            
            // Calculate current scan line index and progress within line
            const totalLines = 4; // 4 horizontal scan lines
            const scanLine = Math.floor(gridProgress * totalLines); // Which scan line (0-3)
            const lineProgress = (gridProgress * totalLines) % 1.0; // Progress within current line (0-1)
            
            // Create alternating left-to-right and right-to-left scanning
            const isRightToLeft = scanLine % 2 === 1;
            const horizontalPosition = isRightToLeft ? 
              1.0 - lineProgress : // Right to left
              lineProgress;        // Left to right
            
            // Apply horizontal scanning with proper direction
            head.rotation.y = -0.3 + horizontalPosition * 0.6;
            
            // Vertical position based on current scan line (top to bottom)
            const verticalPosition = scanLine / (totalLines - 1);
            head.rotation.x = -0.2 + verticalPosition * 0.3;
            
            // Add micro-focus adjustments for detailed scanning
            const microFocus = Math.sin(gridProgress * Math.PI * 20) * 0.01;
            head.rotation.y += microFocus;
            head.rotation.x += microFocus * 0.5;
            
          } else if (scanCycle < 5.5) {
            // PHASE 3: Anomaly focus - detailed examination of points of interest
            const anomalyProgress = (scanCycle - 4.0) / 1.5;
            
            // Create focused anomaly examination with multiple interest points
            // Simulate finding and examining 3 points of interest
            
            // Determine which anomaly point is being examined
            const anomalyPoints = 3; // 3 distinct points of interest
            const currentAnomaly = Math.floor(anomalyProgress * anomalyPoints);
            const anomalyFocusProgress = (anomalyProgress * anomalyPoints) % 1.0;
            
            // Pre-defined anomaly positions (simulating detected points of interest)
            const anomalyPositions = [
              {x: -0.1, y: 0.1},  // Upper left
              {x: 0.15, y: 0.05},  // Upper right
              {x: 0.0, y: -0.15}   // Lower middle
            ];
            
            // Create transition between anomaly points
            if (anomalyFocusProgress < 0.2) {
              // Quick movement to anomaly location
              const transitionProgress = anomalyFocusProgress / 0.2;
              // Ease-in for natural motion
              const easedTransition = transitionProgress * transitionProgress;
              
              // Previous position (or center position if first anomaly)
              const prevPos = currentAnomaly === 0 ? 
                {x: 0, y: 0} : 
                anomalyPositions[currentAnomaly - 1];
              
              // Current target position
              const targetPos = anomalyPositions[currentAnomaly];
              
              // Interpolate between positions
              head.rotation.x = prevPos.x + (targetPos.x - prevPos.x) * easedTransition;
              head.rotation.y = prevPos.y + (targetPos.y - prevPos.y) * easedTransition;
              
            } else {
              // Detailed examination of current anomaly
              const examProgress = (anomalyFocusProgress - 0.2) / 0.8;
              
              // Get current anomaly position
              const anomaly = anomalyPositions[currentAnomaly];
              
              // Create detailed scanning pattern around anomaly point
              // Professional scanners examine anomalies from multiple angles
              const detailScan = examProgress * Math.PI * 2; // Full circle examination
              
              // Apply circular scanning pattern around point of interest
              head.rotation.x = anomaly.x + Math.sin(detailScan) * 0.05;
              head.rotation.y = anomaly.y + Math.cos(detailScan) * 0.05;
              
              // Add micro-adjustments to simulate focus adjustments
              const microAdjust = Math.sin(examProgress * Math.PI * 8) * 0.01;
              head.rotation.x += microAdjust;
              head.rotation.y += microAdjust;
            }
            
          } else if (scanCycle < 7.0) {
            // PHASE 4: Verification scan - quick re-check of key areas
            const verifyProgress = (scanCycle - 5.5) / 1.5;
            
            // Create verification pattern that hits key points quickly
            // Professional scanners do a final sweep to ensure complete data
            
            if (verifyProgress < 0.3) {
              // Verify left side
              const leftProgress = verifyProgress / 0.3;
              head.rotation.y = -0.2;
              head.rotation.x = -0.15 + leftProgress * 0.3;
            } else if (verifyProgress < 0.6) {
              // Verify center
              const centerProgress = (verifyProgress - 0.3) / 0.3;
              head.rotation.y = -0.2 + centerProgress * 0.4;
              head.rotation.x = 0.15 - centerProgress * 0.2;
            } else {
              // Verify right side
              const rightProgress = (verifyProgress - 0.6) / 0.4;
              head.rotation.y = 0.2;
              head.rotation.x = -0.05 + rightProgress * 0.2;
            }
            
          } else {
            // PHASE 5: Data analysis - processing collected information
            const analysisProgress = (scanCycle - 7.0) / 2.0;
            
            // Create thoughtful analysis movement patterns
            // After scanning, professionals process and analyze findings
            
            if (analysisProgress < 0.6) {
              // Active processing - rapid eye movements analyzing data
              const processRate = 12.0; // Fast data processing
              
              // Create rapid but small movements indicating data processing
              head.rotation.x = Math.sin(analysisProgress * Math.PI * processRate) * 0.04;
              head.rotation.y = Math.cos(analysisProgress * Math.PI * (processRate * 1.3)) * 0.06;
              
              // Add slight head tilt during intense processing
              head.rotation.z = Math.sin(analysisProgress * Math.PI * 2) * 0.03;
              
            } else {
              // Conclusion and synthesis - slower, more deliberate movements
              const concludeProgress = (analysisProgress - 0.6) / 0.4;
              
              // Gradually return to center with thoughtful micro-movements
              head.rotation.x = Math.sin(concludeProgress * Math.PI * 2) * 0.03 * (1 - concludeProgress);
              head.rotation.y = Math.sin(concludeProgress * Math.PI * 1.5) * 0.05 * (1 - concludeProgress);
              
              // Slight satisfied head tilt at successful scan completion
              head.rotation.z = concludeProgress > 0.7 ? 
                Math.sin((concludeProgress - 0.7) / 0.3 * Math.PI) * 0.04 : 0;
            }
          }
        }
        
        // Enhanced body movements coordinated with scan phases
        
        // Body positioning varies based on scan phase for optimal data collection
        if (scanCycle < 1.5) {
          // Initial sweep - neutral stable position
          group.current.position.y = Math.sin(time * 0.5) * 0.01;
          group.current.rotation.x = 0.0;
          group.current.rotation.y = 0.0;
        } else if (scanCycle < 4.0) {
          // Grid scan - subtle adjustments following scan pattern
          const gridPhase = (scanCycle - 1.5) / 2.5;
          
          // Very slight height adjustments to optimize scan position
          group.current.position.y = Math.sin(gridPhase * Math.PI * 4) * 0.02;
          
          // Subtle torso rotations to extend scan range
          group.current.rotation.y = Math.sin(gridPhase * Math.PI * 2) * 0.03;
        } else if (scanCycle < 5.5) {
          // Anomaly focus - leaning in for better examination
          const anomalyPhase = (scanCycle - 4.0) / 1.5;
          
          // Lean in slightly during anomaly examination
          group.current.position.z = 0.03 + Math.sin(anomalyPhase * Math.PI) * 0.02;
          
          // Tilt forward during focused examination
          group.current.rotation.x = 0.04;
        } else {
          // Verification and analysis - return to neutral with processing micromovements
          group.current.position.z = Math.max(0, group.current.position.z - 0.005); // Gradually return to neutral
          group.current.position.y = Math.sin(time * 0.3) * 0.01 + Math.sin(time * 0.7) * 0.005;
          group.current.rotation.x = Math.max(0, group.current.rotation.x - 0.002); // Gradually return to upright
        }
        
        // Enhanced arm movements with professional scanning device handling
        if (group.current.children[1] && group.current.children[2]) { // Left and right arms
          const leftArm = group.current.children[1] as THREE.Mesh;
          const rightArm = group.current.children[2] as THREE.Mesh;
          
          // Create phase-specific arm behaviors for realistic scanning
          if (scanCycle < 1.5) {
            // PHASE 1: Broad sweep - scanner held in standard position
            
            // Right arm holding scanning device with professional grip
            rightArm.rotation.z = -0.4;
            rightArm.rotation.x = 0.2;
            rightArm.rotation.y = Math.sin(scanCycle / 1.5 * Math.PI) * 0.1; // Follow sweep pattern
            
            // Left arm in balanced support position
            leftArm.rotation.z = -0.2;
            leftArm.rotation.x = 0.1;
            leftArm.rotation.y = Math.sin(scanCycle / 1.5 * Math.PI) * 0.05; // Partial follow
            
          } else if (scanCycle < 4.0) {
            // PHASE 2: Grid scan - precise methodical movements
            const gridPhase = (scanCycle - 1.5) / 2.5;
            
            // Calculate current scan line for coordinated arm movement
            const scanLine = Math.floor(gridPhase * 4); // 4 scan lines
            const lineProgress = (gridPhase * 4) % 1.0;
            
            // Determine scan direction based on line
            const isRightToLeft = scanLine % 2 === 1;
            const horizontalProgress = isRightToLeft ? 1.0 - lineProgress : lineProgress;
            
            // Right arm with scanner follows precise grid pattern
            rightArm.rotation.z = -0.4 - Math.sin(gridPhase * Math.PI * 4) * 0.05; // Vertical adjustment
            rightArm.rotation.x = 0.2 + scanLine * 0.02; // Progressive adjustment by scan line
            rightArm.rotation.y = (horizontalProgress - 0.5) * 0.2; // Horizontal scan motion
            
            // Left arm provides stability with subtle counterbalance
            leftArm.rotation.z = -0.2 - Math.sin(gridPhase * Math.PI * 4) * 0.02;
            leftArm.rotation.y = (horizontalProgress - 0.5) * 0.08; // Partial matching movement
            
          } else if (scanCycle < 5.5) {
            // PHASE 3: Anomaly focus - steady, precise targeting
            const anomalyPhase = (scanCycle - 4.0) / 1.5;
            
            // Determine which anomaly point is being examined
            const currentPoint = Math.floor(anomalyPhase * 3);
            const pointExamProgress = (anomalyPhase * 3) % 1.0;
            
            // Pre-defined arm positions for each anomaly point
            const armPositions = [
              {z: -0.45, x: 0.25, y: 0.1},  // Upper left position
              {z: -0.4, x: 0.2, y: -0.1},   // Upper right position
              {z: -0.5, x: 0.3, y: 0.0}     // Lower middle position
            ];
            
            if (pointExamProgress < 0.2) {
              // Transitioning to new anomaly point
              const transition = pointExamProgress / 0.2;
              
              // Get previous and target positions
              const prevPos = currentPoint === 0 ? 
                {z: -0.4, x: 0.2, y: 0.0} : // Default position
                armPositions[currentPoint - 1];
              const targetPos = armPositions[currentPoint];
              
              // Smoothly move arm to new position
              rightArm.rotation.z = prevPos.z + (targetPos.z - prevPos.z) * transition;
              rightArm.rotation.x = prevPos.x + (targetPos.x - prevPos.x) * transition;
              rightArm.rotation.y = prevPos.y + (targetPos.y - prevPos.y) * transition;
            } else {
              // Examining current anomaly with micro-adjustments
              const examProgress = (pointExamProgress - 0.2) / 0.8;
              
              // Get base position for current anomaly
              const pos = armPositions[currentPoint];
              
              // Add precision micro-movements for detailed scanning
              rightArm.rotation.z = pos.z + Math.sin(examProgress * Math.PI * 8) * 0.02;
              rightArm.rotation.x = pos.x + Math.sin(examProgress * Math.PI * 6) * 0.015;
              rightArm.rotation.y = pos.y + Math.sin(examProgress * Math.PI * 10) * 0.01;
            }
            
            // Left arm stabilizes during precise work
            leftArm.rotation.z = -0.3;
            leftArm.rotation.x = 0.15;
            // Subtle counter-movements for balance
            leftArm.rotation.y = -rightArm.rotation.y * 0.3;
            
          } else if (scanCycle < 7.0) {
            // PHASE 4: Verification - quick, efficient movements
            const verifyPhase = (scanCycle - 5.5) / 1.5;
            
            // Right arm makes efficient verification movements
            if (verifyPhase < 0.3) {
              // Check left side
              rightArm.rotation.z = -0.4;
              rightArm.rotation.y = 0.1;
            } else if (verifyPhase < 0.6) {
              // Check center
              rightArm.rotation.z = -0.45;
              rightArm.rotation.y = 0.0;
            } else {
              // Check right side
              rightArm.rotation.z = -0.4;
              rightArm.rotation.y = -0.1;
            }
            
            // Maintain consistent professional scanner handling
            rightArm.rotation.x = 0.2 + Math.sin(verifyPhase * Math.PI * 3) * 0.03;
            
            // Left arm follows with reduced motion for stability
            leftArm.rotation.z = -0.25;
            leftArm.rotation.y = rightArm.rotation.y * 0.4;
            
          } else {
            // PHASE 5: Analysis - relaxed, thoughtful positioning
            const analysisPhase = (scanCycle - 7.0) / 2.0;
            
            // Gradually lower scanning device as analysis progresses
            const scannerLowering = Math.min(1.0, analysisPhase * 2);
            rightArm.rotation.z = -0.4 + scannerLowering * 0.2;
            rightArm.rotation.x = 0.2 - scannerLowering * 0.1;
            
            // Subtle mechanical movements simulating data transfer/processing
            if (analysisPhase < 0.6) {
              // Active data processing vibrations
              rightArm.rotation.z += Math.sin(analysisPhase * Math.PI * 20) * 0.01;
              rightArm.rotation.y = Math.sin(analysisPhase * Math.PI * 3) * 0.03;
            } else {
              // Completion - relaxed position
              rightArm.rotation.y = Math.sin(time * 0.5) * 0.02;
            }
            
            // Left arm returns to neutral with subtle movements
            leftArm.rotation.z = -0.2 - scannerLowering * 0.05;
            leftArm.rotation.y = Math.sin(time * 0.4) * 0.03;
          }
        }
        break;
        
      case ANIMATION_SEQUENCES.HOLOGRAM:
        // Hologram display/interaction animation
        if (group.current.children[0]) { // Head
          const head = group.current.children[0] as THREE.Mesh;
          
          // Looking at hologram with fascination
          head.rotation.y = Math.sin(time * 0.4) * 0.1;
          head.rotation.x = -0.1 + Math.sin(time * 0.3) * 0.05;
        }
        
        // Body positioning - slightly back to view hologram
        group.current.position.z = -0.05;
        group.current.position.y = Math.sin(time * 0.5) * 0.02;
        
        // Arms positioned to manipulate hologram
        if (group.current.children[1] && group.current.children[2]) { // Left and right arms
          const leftArm = group.current.children[1] as THREE.Mesh;
          const rightArm = group.current.children[2] as THREE.Mesh;
          
          // Arms raised to interact with hologram at chest height
          const holoCycle = time % 8.0;
          
          // Base position for hologram interaction
          leftArm.rotation.z = -0.2;
          rightArm.rotation.z = -0.2;
          
          // Forward extension to "touch" hologram
          leftArm.rotation.x = 0.3;
          rightArm.rotation.x = 0.3;
          
          // Manipulating hologram with both hands
          if (holoCycle < 2.0) {
            // Right hand gesture - expanding/zooming
            rightArm.rotation.z = -0.2 - Math.sin(holoCycle/2.0 * Math.PI) * 0.1;
            rightArm.rotation.y = Math.sin(holoCycle/2.0 * Math.PI) * 0.1;
          } else if (holoCycle < 4.0) {
            // Left hand gesture - scrolling/moving
            leftArm.rotation.z = -0.2 - Math.sin((holoCycle-2.0)/2.0 * Math.PI) * 0.15;
            leftArm.position.x = Math.sin((holoCycle-2.0)/2.0 * Math.PI) * 0.05;
          } else if (holoCycle < 5.0) {
            // Pinch-to-zoom with both hands
            const progress = (holoCycle - 4.0);
            leftArm.rotation.z = -0.2 - 0.1 + progress * 0.2;
            rightArm.rotation.z = -0.2 - 0.1 + progress * 0.2;
            
            leftArm.rotation.y = -0.1 + progress * 0.2;
            rightArm.rotation.y = 0.1 - progress * 0.2;
          } else {
            // Subtle floating hands/waiting
            leftArm.rotation.z = -0.2 + Math.sin((holoCycle-5.0)/3.0 * Math.PI * 2) * 0.05;
            rightArm.rotation.z = -0.2 + Math.sin((holoCycle-5.0)/3.0 * Math.PI * 2 + 0.5) * 0.05;
          }
        }
        break;
        
      case ANIMATION_SEQUENCES.ALERT:
        // Enhanced alert/alarm response animation with heightened reactivity and dynamic threat response
        
        // Configure alert parameters for realistic threat response behavior
        const alertSequenceLength = 5.0; // Extended alert response cycle
        const alertCycle = time % alertSequenceLength;
        
        // Apply alert-specific modifiers to create urgency
        const alertLevel = 0.8 + Math.sin(time * 0.5) * 0.2; // Fluctuating alert level (0.6-1.0)
        const rapidityFactor = 1.0 + alertLevel * 0.5; // Speed increases with alert level
        
        if (group.current.children[0]) { // Head
          const head = group.current.children[0] as THREE.Mesh;
          
          // Create realistic alert behavior based on threat response patterns
          // Professional security/threat response protocols follow specific patterns:
          // 1. Initial alert reaction (startle/orient toward threat)
          // 2. Rapid environment assessment (identify threat source)
          // 3. Situational awareness scan (check surroundings)
          // 4. Continuous monitoring (track threat)
          // 5. Tactical evaluation (assess response options)
          
          // Determine current alert phase based on time
          if (alertCycle < 0.7) {
            // PHASE 1: Initial alert reaction - sharp orientation toward threat source
            
            // Create realistic startle response with initial jerk followed by focused attention
            const startleProgress = alertCycle / 0.7;
            
            if (startleProgress < 0.2) {
              // Initial startle - fast jerky movement toward alert source
              const initialStartle = startleProgress / 0.2;
              // Use elastic easing for realistic startle motion
              const elastic = (t: number) => {
                return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
              };
              const startleEasing = elastic(initialStartle);
              
              // Apply sharp startle motion - simulating sudden threat detection
              // Random direction since threat source is unknown
              head.rotation.y = ((Math.random() > 0.5 ? 1 : -1) * 0.3) * startleEasing;
              head.rotation.x = -0.1 * startleEasing;
            } else {
              // Post-startle focus toward threat direction
              const focusProgress = (startleProgress - 0.2) / 0.8;
              
              // The head moves more deliberately toward the likely threat direction
              // Create side-to-side searching that gradually focuses
              const focusDirection = Math.sin(focusProgress * Math.PI * 3) * 
                                (1.0 - focusProgress * 0.7); // Amplitude decreases as focus increases
              
              head.rotation.y = focusDirection * 0.3;
              
              // Vertical adjustment to locate threat
              head.rotation.x = -0.1 + Math.sin(focusProgress * Math.PI * 2) * 0.1;
            }
            
          } else if (alertCycle < 2.0) {
            // PHASE 2: Rapid environment assessment - scanning for additional threats
            const assessProgress = (alertCycle - 0.7) / 1.3;
            
            // Create professional security assessment scan
            // During real threat assessments, rapid systematic scans are performed
            
            // Horizontal threat scan with tactical pauses at key observation points
            // Security professionals use specific scan patterns with deliberate stops
            const scanPhase = assessProgress * 8; // Multiple scan points
            const scanPosition = scanPhase % 1.0;
            const scanIndex = Math.floor(scanPhase);
            
            // Create scan pattern with distinct pause points
            if (scanPosition < 0.3) {
              // Hold at tactical observation position
              switch (scanIndex % 4) {
                case 0: head.rotation.y = -0.3; break; // Far left
                case 1: head.rotation.y = -0.1; break; // Left center
                case 2: head.rotation.y = 0.1; break;  // Right center
                case 3: head.rotation.y = 0.3; break;  // Far right
              }
              
              // Add micro-adjustments during observation (vigilance)
              head.rotation.y += Math.sin(time * 15) * 0.01;
              
            } else {
              // Quick movement between observation points
              const transition = (scanPosition - 0.3) / 0.7;
              const currentPos = (() => {
                switch (scanIndex % 4) {
                  case 0: return -0.3; // Far left
                  case 1: return -0.1; // Left center
                  case 2: return 0.1;  // Right center
                  case 3: return 0.3;  // Far right
                }
                return 0; // Fallback
              })();
              
              const nextPos = (() => {
                switch ((scanIndex + 1) % 4) {
                  case 0: return -0.3; // Far left
                  case 1: return -0.1; // Left center
                  case 2: return 0.1;  // Right center
                  case 3: return 0.3;  // Far right
                }
                return 0; // Fallback
              })();
              
              // Apply tactical scan transition with proper easing
              // Security-trained individuals move deliberately between observation points
              head.rotation.y = currentPos + (nextPos - currentPos) * 
                              (transition < 0.5 ? 2 * transition * transition : 1 - Math.pow(-2 * transition + 2, 2) / 2);
            }
            
            // Vertical scanning component - checking high and low
            // Security scan pattern includes vertical element with heightened awareness
            head.rotation.x = -0.05 + Math.sin(assessProgress * Math.PI * 3) * 0.15;
            
          } else if (alertCycle < 3.5) {
            // PHASE 3: Continuous monitoring - tracking the threat
            const monitorProgress = (alertCycle - 2.0) / 1.5;
            
            // Create focused threat tracking behavior
            // Security professionals maintain visual on threat while remaining vigilant
            
            // Simulate tracking moving threat with appropriate anticipation
            const targetAngle = Math.sin(monitorProgress * Math.PI * 2) * 0.25; // Target moving side to side
            
            // Add micro-adjustments to create realistic tracking
            // Includes small lag/prediction effects for natural motion
            const trackingOffset = Math.sin(monitorProgress * Math.PI * 8) * 0.03; // Small tracking adjustments
            
            // Apply tracking motion with natural precision and micro-corrections
            head.rotation.y = targetAngle + trackingOffset;
            
            // Vertical tracking component with tactical awareness
            const targetHeight = Math.sin(monitorProgress * Math.PI) * 0.1; // Target moving up/down
            head.rotation.x = -0.05 + targetHeight + Math.sin(monitorProgress * Math.PI * 5) * 0.02;
            
          } else {
            // PHASE 4: Tactical evaluation - ready for action/response
            const evaluateProgress = (alertCycle - 3.5) / 1.5;
            
            // Create alert readiness with heightened awareness
            // Final phase prepares for action with controlled alertness
            
            // Head maintains overall alertness while preparing for action
            // Scan rate increases as action becomes imminent
            const readinessScan = evaluateProgress * (4 + evaluateProgress * 8); // Scan rate accelerates
            
            // Apply action-ready head movements - controlled but hyper-alert
            head.rotation.y = Math.sin(readinessScan) * 0.2 * (1.0 - evaluateProgress * 0.5);
            head.rotation.x = Math.sin(readinessScan * 1.3) * 0.1 * (1.0 - evaluateProgress * 0.5);
            
            // Add slight head tilt for combat readiness as sequence concludes
            head.rotation.z = evaluateProgress > 0.8 ? 
                            ((evaluateProgress - 0.8) / 0.2) * Math.sin(time * 8) * 0.05 : 0;
          }
        }
        
        // Enhanced body movements for tactical alert response
        
        // Physical readiness indicated by posture changes
        // Professional alert stance with proper biomechanics
        
        // Alert stance - slightly higher position (ready to move)
        const alertHeight = 0.1; // Base height increase during alert
        const readinessHeight = alertHeight + Math.sin(time * 8 * rapidityFactor) * 0.02 * alertLevel;
        group.current.position.y = readinessHeight;
        
        // Tactical rotation - scanning surroundings while maintaining awareness
        const alertRotation = Math.sin(time * 3 * rapidityFactor) * 0.05 * alertLevel;
        group.current.rotation.y = alertRotation;
        
        // Slight forward lean for action readiness
        const actionReadyLean = 0.03 + Math.sin(time * 2) * 0.01 * alertLevel;
        group.current.position.z = actionReadyLean;
        group.current.rotation.x = actionReadyLean * 0.5;
        
        // Enhanced arm positions for defensive/ready stance
        if (group.current.children[1] && group.current.children[2]) { // Left and right arms
          const leftArm = group.current.children[1] as THREE.Mesh;
          const rightArm = group.current.children[2] as THREE.Mesh;
          
          // Determine alert response mode based on cycle
          if (alertCycle < 1.0) {
            // Initial defense posture - protective positioning
            const initialResponse = alertCycle / 1.0;
            
            // Rapid deployment to defensive position
            // Arms move quickly to protect vital areas with proper form
            
            // Protective arm positioning develops over time
            const defensePosProgress = Math.min(1.0, initialResponse * 3); // Accelerated to final position
            
            // Apply defensive positioning with appropriate motion curve
            // Arms raise to guard position with tactical speed
            leftArm.rotation.z = -0.3 - defensePosProgress * 0.3;
            rightArm.rotation.z = -0.3 - defensePosProgress * 0.3;
            
            // Forward positioning for protection
            leftArm.rotation.x = defensePosProgress * 0.3;
            rightArm.rotation.x = defensePosProgress * 0.3;
            
            // Slight outward rotation for better coverage
            leftArm.rotation.y = -defensePosProgress * 0.15;
            rightArm.rotation.y = defensePosProgress * 0.15;
            
          } else if (alertCycle < 3.0) {
            // Active scanning and ready stance
            const activeResponse = (alertCycle - 1.0) / 2.0;
            
            // Create tactical readiness with appropriate biomechanics
            // Security-trained individuals maintain specific arm positions during alerts
            
            // Base defensive position
            const leftBase = -0.6 + Math.sin(activeResponse * Math.PI * 3) * 0.05;
            const rightBase = -0.6 + Math.sin(activeResponse * Math.PI * 3 + 1) * 0.05;
            
            // Apply base position with appropriate micro-movements
            // Alert stance includes constant minor adjustments for maximum readiness
            leftArm.rotation.z = leftBase + Math.sin(time * 8 * rapidityFactor) * 0.03 * alertLevel;
            rightArm.rotation.z = rightBase + Math.sin(time * 8 * rapidityFactor + 1) * 0.03 * alertLevel;
            
            // Optimal defensive angle with slight variations for monitoring
            leftArm.rotation.x = 0.3 + Math.sin(time * 5 * rapidityFactor) * 0.05 * alertLevel;
            rightArm.rotation.x = 0.3 + Math.sin(time * 5 * rapidityFactor + 1.5) * 0.05 * alertLevel;
            
            // Protective rotation maintained with vigilance
            leftArm.rotation.y = -0.15 + Math.sin(time * 3) * 0.02;
            rightArm.rotation.y = 0.15 + Math.sin(time * 3 + 1) * 0.02;
            
          } else {
            // Action-ready positioning
            const actionReady = (alertCycle - 3.0) / 2.0;
            
            // Transition to even higher alert as action becomes imminent
            // Final positioning optimized for immediate response
            
            // More pronounced ready position with focused intent
            const readyPoseIntensity = Math.min(1.0, actionReady * 2); // Quick transition to ready
            
            // Action-ready arm position with appropriate tension
            leftArm.rotation.z = -0.55 - readyPoseIntensity * 0.1 - Math.sin(time * 12 * rapidityFactor) * 0.03 * alertLevel;
            rightArm.rotation.z = -0.55 - readyPoseIntensity * 0.1 - Math.sin(time * 12 * rapidityFactor + 0.8) * 0.03 * alertLevel;
            
            // Forward positioning with tactical advantage
            leftArm.rotation.x = 0.35 + readyPoseIntensity * 0.05 + Math.sin(time * 6 * rapidityFactor) * 0.04 * alertLevel;
            rightArm.rotation.x = 0.35 + readyPoseIntensity * 0.05 + Math.sin(time * 6 * rapidityFactor + 1.2) * 0.04 * alertLevel;
            
            // Optimal response angle maintained with heightened readiness
            leftArm.rotation.y = -0.2 + Math.sin(time * 4) * 0.03 * alertLevel;
            rightArm.rotation.y = 0.2 + Math.sin(time * 4 + 0.5) * 0.03 * alertLevel;
          }
          
          // Add combat breathing effects - measured breathing during alert
          const combatBreathRate = 1.5; // Tactical breathing pace
          const breathIntensity = Math.sin(time * combatBreathRate) * 0.02;
          
          // Apply subtle combat breathing to maintain optimum positioning
          leftArm.rotation.z += breathIntensity;
          rightArm.rotation.z += breathIntensity;
        }
        
        // Optional: If legs are available, add tactical stance
        if (group.current.children[3] && group.current.children[4]) {
          const leftLeg = group.current.children[3] as THREE.Mesh;
          const rightLeg = group.current.children[4] as THREE.Mesh;
          
          // Balanced combat stance
          leftLeg.rotation.z = -0.05;
          rightLeg.rotation.z = 0.05;
          
          // Ready position with slight knee bend
          leftLeg.rotation.x = 0.1;
          rightLeg.rotation.x = 0.1;
        }
        break;
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]} dispose={null}>
      {/* Temporary robot representation using basic geometries */}
      {/* Would be replaced with proper GLTF model */}
      
      {/* Head - Enhanced with PBR materials */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.25, 0.25, 0.25]} />
        <meshPhysicalMaterial 
          color={colors.body instanceof THREE.Color ? colors.body : "#E8ECEF"} 
          metalness={typeof colors === 'object' && 'bodyMetalness' in colors ? colors.bodyMetalness : 0.9} 
          roughness={typeof colors === 'object' && 'bodyRoughness' in colors ? colors.bodyRoughness : 0.2} 
          clearcoat={0.8} 
          clearcoatRoughness={0.2}
          reflectivity={0.9}
          envMapIntensity={1.5}
        />
        <Edges scale={1.02} threshold={15} color={typeof colors.accent === 'object' && 'getHex' in colors.accent ? colors.accent.getHex() : '#3B82F6'} />
        
        {/* Eyes - Enhanced with advanced glow and depth */}
        <mesh position={[0.07, 0.05, 0.13]} scale={[0.08, 0.08, 0.01]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial
            color={colors.eyes instanceof THREE.Color ? colors.eyes : "#10B981"}
            emissive={colors.eyes instanceof THREE.Color ? colors.eyes : "#10B981"}
            emissiveIntensity={typeof colors === 'object' && 'eyeEmissiveIntensity' in colors ? colors.eyeEmissiveIntensity : 2.5}
            toneMapped={false}
            transparent={true}
            opacity={typeof colors === 'object' && 'eyeOpacity' in colors ? colors.eyeOpacity : 0.9}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            ior={1.5} // Higher index of refraction for glass-like effect
            transmission={0.2} // Slight transparency
          />
        </mesh>
        
        <mesh position={[-0.07, 0.05, 0.13]} scale={[0.08, 0.08, 0.01]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial
            color={colors.eyes instanceof THREE.Color ? colors.eyes : "#10B981"}
            emissive={colors.eyes instanceof THREE.Color ? colors.eyes : "#10B981"}
            emissiveIntensity={typeof colors === 'object' && 'eyeEmissiveIntensity' in colors ? colors.eyeEmissiveIntensity : 2.5}
            toneMapped={false}
            transparent={true}
            opacity={typeof colors === 'object' && 'eyeOpacity' in colors ? colors.eyeOpacity : 0.9}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            ior={1.5}
            transmission={0.2}
          />
        </mesh>
      </mesh>
      
      {/* Torso - Enhanced with PBR materials */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.35, 0.5, 0.2]} />
        <meshPhysicalMaterial 
          color={colors.body instanceof THREE.Color ? colors.body : "#E8ECEF"} 
          metalness={typeof colors === 'object' && 'bodyMetalness' in colors ? colors.bodyMetalness : 0.85} 
          roughness={typeof colors === 'object' && 'bodyRoughness' in colors ? colors.bodyRoughness : 0.25} 
          clearcoat={0.6} 
          clearcoatRoughness={0.2}
          reflectivity={0.8}
          envMapIntensity={1.2}
        />
        <Edges scale={1.02} threshold={15} color={typeof colors.accent === 'object' && 'getHex' in colors.accent ? colors.accent.getHex() : '#3B82F6'} />
        
        {/* Energy Core - Enhanced with advanced glow and depth effects */}
        <mesh position={[0, 0, 0.11]} scale={[0.15, 0.15, 0.05]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial
            color={colors.energyCore instanceof THREE.Color ? colors.energyCore : "#3B82F6"}
            emissive={colors.energyCore instanceof THREE.Color ? colors.energyCore : "#3B82F6"}
            emissiveIntensity={typeof colors === 'object' && 'energyCoreEmissiveIntensity' in colors ? colors.energyCoreEmissiveIntensity : 3.0}
            toneMapped={false}
            transparent={true}
            opacity={0.9}
            transmission={typeof colors === 'object' && 'energyCoreTransmission' in colors ? colors.energyCoreTransmission : 0.4}
            ior={1.8}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            attenuationColor={new THREE.Color(0.5, 0.8, 1.0)}
            attenuationDistance={0.5}
          />
        </mesh>
      </mesh>
      
      {/* Right Arm - Enhanced with PBR materials */}
      <group position={[0.25, 0.6, 0]}>
        <mesh position={[0.1, -0.15, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 12]} />
          <meshPhysicalMaterial 
            color={colors.body instanceof THREE.Color ? colors.body : "#E8ECEF"} 
            metalness={typeof colors === 'object' && 'bodyMetalness' in colors ? colors.bodyMetalness : 0.85}
            roughness={typeof colors === 'object' && 'bodyRoughness' in colors ? colors.bodyRoughness : 0.2}
            clearcoat={0.7} 
            clearcoatRoughness={0.2}
            reflectivity={0.8}
            envMapIntensity={1.3}
          />
        </mesh>
        <mesh position={[0.1, -0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.08, 0.1, 0.08]} />
          <meshPhysicalMaterial 
            color={colors.joints instanceof THREE.Color ? colors.joints : "#64748B"} 
            metalness={0.9} 
            roughness={0.15} 
            clearcoat={0.8}
            reflectivity={0.9}
            envMapIntensity={1.2}
          />
        </mesh>
      </group>
      
      {/* Left Arm - Enhanced with PBR materials */}
      <group position={[-0.25, 0.6, 0]}>
        <mesh position={[-0.1, -0.15, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 12]} />
          <meshPhysicalMaterial 
            color={colors.body instanceof THREE.Color ? colors.body : "#E8ECEF"} 
            metalness={typeof colors === 'object' && 'bodyMetalness' in colors ? colors.bodyMetalness : 0.85}
            roughness={typeof colors === 'object' && 'bodyRoughness' in colors ? colors.bodyRoughness : 0.2}
            clearcoat={0.7} 
            clearcoatRoughness={0.2}
            reflectivity={0.8}
            envMapIntensity={1.3}
          />
        </mesh>
        <mesh position={[-0.1, -0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.08, 0.1, 0.08]} />
          <meshPhysicalMaterial 
            color={colors.joints instanceof THREE.Color ? colors.joints : "#64748B"}
            metalness={0.9} 
            roughness={0.15} 
            clearcoat={0.8}
            reflectivity={0.9}
            envMapIntensity={1.2}
          />
        </mesh>
      </group>
      
      {/* Legs - Enhanced with PBR materials and improved geometry */}
      <group position={[0.1, 0.1, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 12]} />
          <meshPhysicalMaterial 
            color={colors.body instanceof THREE.Color ? colors.body : "#E8ECEF"} 
            metalness={typeof colors === 'object' && 'bodyMetalness' in colors ? colors.bodyMetalness : 0.85}
            roughness={typeof colors === 'object' && 'bodyRoughness' in colors ? colors.bodyRoughness : 0.25}
            clearcoat={0.6} 
            clearcoatRoughness={0.2}
            reflectivity={0.8}
            envMapIntensity={1.2}
          />
        </mesh>
        <mesh position={[0, -0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.1, 0.1, 0.15]} />
          <meshPhysicalMaterial 
            color={colors.joints instanceof THREE.Color ? colors.joints : "#9CA3AF"}
            metalness={0.9} 
            roughness={0.2} 
            clearcoat={0.7}
            reflectivity={0.9}
            envMapIntensity={1.2}
          />
        </mesh>
        
        {/* Add visible internal mechanisms - hydraulic details */}
        <mesh position={[0, -0.3, 0.06]} rotation={[0, 0, Math.PI / 2]} scale={[0.02, 0.15, 0.02]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
          <meshPhysicalMaterial 
            color={new THREE.Color("#999999")}
            metalness={0.95} 
            roughness={0.1}
            envMapIntensity={1.5}
          />
        </mesh>
      </group>
      
      <group position={[-0.1, 0.1, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 12]} />
          <meshPhysicalMaterial 
            color={colors.body instanceof THREE.Color ? colors.body : "#E8ECEF"} 
            metalness={typeof colors === "object" && "bodyMetalness" in colors ? colors.bodyMetalness : 0.85}
            roughness={typeof colors === "object" && "bodyRoughness" in colors ? colors.bodyRoughness : 0.25}
            clearcoat={0.6} 
            clearcoatRoughness={0.2}
            reflectivity={0.8}
            envMapIntensity={1.2}
          />
        </mesh>
        <mesh position={[0, -0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.1, 0.1, 0.15]} />
          <meshPhysicalMaterial 
            color={colors.joints instanceof THREE.Color ? colors.joints : "#9CA3AF"}
            metalness={0.9} 
            roughness={0.2} 
            clearcoat={0.7}
            reflectivity={0.9}
            envMapIntensity={1.2}
          />
        </mesh>
        
        {/* Add visible internal mechanisms - hydraulic details */}
        <mesh position={[0, -0.3, 0.06]} rotation={[0, 0, Math.PI / 2]} scale={[0.02, 0.15, 0.02]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
          <meshPhysicalMaterial 
            color={new THREE.Color("#999999")}
            metalness={0.95} 
            roughness={0.1}
            envMapIntensity={1.5}
          />
        </mesh>
      </group>
      
      {/* Particles if enabled */}
      {showParticles !== "none" && (
        <ParticleSystem 
          intensity={showParticles === "intense" ? 2 : showParticles === "typing" ? 1.5 : 1}
          color={colors.accent instanceof THREE.Color ? colors.accent : new THREE.Color("#3B82F6")}
          emotionalState={emotionalState as "happy" | "sad" | "alert" | "thinking" | "confused" | "neutral"}
        />
      )}
      
      {/* Hologram projection if enabled - with emotion-based effects */}
      {hologramText && (
        <HologramProjection 
          text={hologramText} 
          color={colors.accent instanceof THREE.Color ? colors.accent : new THREE.Color("#3B82F6")} 
          emotionalState={emotionalState as "happy" | "sad" | "alert" | "thinking" | "confused" | "neutral"}
        />
      )}
    </group>
  );
};

// Define Particle interface for improved type safety
interface Particle {
  position: [number, number, number] | THREE.Vector3;
  size: number;
  speed: number;
  type: 'energy' | 'orbit' | 'data' | 'ambient';
  color?: THREE.Color;
  opacity: number;
  isHighActivity?: boolean;
}

// Enhanced particle system component with advanced PBR effects and emotional responsiveness
const ParticleSystem = ({ 
  intensity = 1, 
  color, 
  emotionalState = "neutral" 
}: { 
  intensity: number, 
  color: THREE.Color | any, // Allow other types but convert later
  emotionalState?: "neutral" | "happy" | "thinking" | "alert" | "sad" | "confused"
}) => {
  // Ensure we have a valid THREE.Color
  const safeColor = color instanceof THREE.Color ? color : new THREE.Color("#3B82F6");
  // Define the system status based on emotional state - these would normally be actual system metrics
  const systemStatus = useMemo(() => {
    // Default neutral values
    const status = {
      energyLevel: 0.85, // Power level (0-1)
      processingLoad: 0.5, // CPU/processing load (0-1)
      dataTransferRate: 0.6, // Data transfer activity (0-1)
      systemStability: 0.95, // System stability (0-1)
      taskComplexity: 0.5, // Task complexity (0-1)
      
      // Derived particle properties
      particleSpeed: 1.0, // Relative speed multiplier
      particleLifespan: 1.0, // Relative lifespan multiplier
      particleBrightness: 1.0, // Relative brightness
      particleSize: 1.0, // Relative size multiplier
      particleTurbulence: 0.0, // Added randomness (0-1)
      
      // Distribution of particle types (percentages)
      energyCoreParticleRatio: 0.2, // % of particles around energy core
      orbitingParticleRatio: 0.3, // % of particles orbiting robot
      dataStreamParticleRatio: 0.4, // % of particles in data streams
      ambientParticleRatio: 0.1, // % of particles in ambient space
    };
    
    // Adjust based on emotional state
    switch(emotionalState) {
      case "happy":
        status.energyLevel = 0.9;
        status.processingLoad = 0.6;
        status.dataTransferRate = 0.7;
        status.systemStability = 0.98;
        status.taskComplexity = 0.6;
        
        status.particleSpeed = 1.2;
        status.particleLifespan = 1.1;
        status.particleBrightness = 1.2;
        status.particleSize = 1.1;
        status.particleTurbulence = 0.1;
        
        // Happy state has more ambient particles floating around
        status.energyCoreParticleRatio = 0.2;
        status.orbitingParticleRatio = 0.35;
        status.dataStreamParticleRatio = 0.25;
        status.ambientParticleRatio = 0.2;
        break;
        
      case "sad":
        status.energyLevel = 0.7;
        status.processingLoad = 0.4;
        status.dataTransferRate = 0.4;
        status.systemStability = 0.9;
        status.taskComplexity = 0.4;
        
        status.particleSpeed = 0.8;
        status.particleLifespan = 0.9;
        status.particleBrightness = 0.8;
        status.particleSize = 0.9;
        status.particleTurbulence = 0.05;
        
        // Sad state has more particles around energy core (less active)
        status.energyCoreParticleRatio = 0.3;
        status.orbitingParticleRatio = 0.3;
        status.dataStreamParticleRatio = 0.3;
        status.ambientParticleRatio = 0.1;
        break;
        
      case "alert":
        status.energyLevel = 0.95;
        status.processingLoad = 0.85;
        status.dataTransferRate = 0.9;
        status.systemStability = 0.7;
        status.taskComplexity = 0.8;
        
        status.particleSpeed = 1.5;
        status.particleLifespan = 0.9;
        status.particleBrightness = 1.3;
        status.particleSize = 1.2;
        status.particleTurbulence = 0.25;
        
        // Alert state has more data stream particles (high activity)
        status.energyCoreParticleRatio = 0.15;
        status.orbitingParticleRatio = 0.25;
        status.dataStreamParticleRatio = 0.55;
        status.ambientParticleRatio = 0.05;
        break;
        
      case "thinking":
        status.energyLevel = 0.8;
        status.processingLoad = 0.75;
        status.dataTransferRate = 0.7;
        status.systemStability = 0.85;
        status.taskComplexity = 0.85;
        
        status.particleSpeed = 1.1;
        status.particleLifespan = 1.0;
        status.particleBrightness = 1.1;
        status.particleSize = 1.05;
        status.particleTurbulence = 0.15;
        
        // Thinking state has more orbiting particles (computing activity)
        status.energyCoreParticleRatio = 0.2;
        status.orbitingParticleRatio = 0.45;
        status.dataStreamParticleRatio = 0.3;
        status.ambientParticleRatio = 0.05;
        break;
        
      case "confused":
        status.energyLevel = 0.75;
        status.processingLoad = 0.7;
        status.dataTransferRate = 0.6;
        status.systemStability = 0.6;
        status.taskComplexity = 0.7;
        
        status.particleSpeed = 1.0;
        status.particleLifespan = 0.8;
        status.particleBrightness = 1.0;
        status.particleSize = 1.0;
        status.particleTurbulence = 0.35; // Most turbulence/chaos
        
        // Confused state has random distribution
        status.energyCoreParticleRatio = 0.25;
        status.orbitingParticleRatio = 0.3;
        status.dataStreamParticleRatio = 0.35;
        status.ambientParticleRatio = 0.1;
        break;
    }
    
    return status;
  }, [emotionalState]);
  
  const particles = useMemo<Particle[]>(() => {
    // Base particle count influenced by intensity
    let baseCount = 30 * intensity;
    
    // Modify particle count based on emotional state and activity levels
    const particleCount = Math.floor(
      emotionalState === "happy" ? baseCount * 1.3 : // More particles for happy
      emotionalState === "sad" ? baseCount * 0.7 : // Fewer particles for sad
      emotionalState === "alert" ? baseCount * 1.5 : // Most particles for alert
      emotionalState === "thinking" ? baseCount * 1.2 : // More for thinking (high processing)
      emotionalState === "confused" ? baseCount * 1.1 : // Slightly more for confused
      baseCount // Default count for neutral
    );
    
    // Create array of randomized type assignments for particles based on system status ratios
    return Array.from({ length: particleCount }).map<Particle>((_, i) => {
      // Determine particle type using weighted random distribution from system status
      const typeRandom = Math.random();
      
      // Cumulative distribution for particle type assignment
      const isEnergyCore = typeRandom < systemStatus.energyCoreParticleRatio;
      const isOrbitingParticle = !isEnergyCore && typeRandom < 
        (systemStatus.energyCoreParticleRatio + systemStatus.orbitingParticleRatio);
      const isDataStream = !isEnergyCore && !isOrbitingParticle && typeRandom < 
        (systemStatus.energyCoreParticleRatio + systemStatus.orbitingParticleRatio + systemStatus.dataStreamParticleRatio);
      // Remainder are ambient particles
      
      // Create special high-activity particles for alert state
      const isHighActivityParticle = emotionalState === "alert" && Math.random() < 0.3;
      
      // Calculate position based on particle type
      let position: [number, number, number];
      
      // Apply turbulence factor from system status
      const turbulenceFactor = systemStatus.particleTurbulence;
      const turbulenceX = turbulenceFactor > 0 ? (Math.random() - 0.5) * turbulenceFactor : 0;
      const turbulenceY = turbulenceFactor > 0 ? (Math.random() - 0.5) * turbulenceFactor : 0;
      const turbulenceZ = turbulenceFactor > 0 ? (Math.random() - 0.5) * turbulenceFactor : 0;
      
      if (isEnergyCore) {
        // Energy core particles stay closer to the core with density based on energy level
        const coreSize = 0.18 + (systemStatus.energyLevel * 0.14); // Core size grows with energy
        const coreHeight = 0.4 + (systemStatus.energyLevel * 0.1); // Position varies with energy
        
        // Add more variance for alert state
        const spreadFactor = emotionalState === "alert" ? 1.2 : 
                            emotionalState === "confused" ? 1.3 : 1.0;
                            
        position = [
          (Math.random() - 0.5) * coreSize * spreadFactor + turbulenceX,
          (Math.random() - 0.5) * (coreSize * 0.8) + coreHeight + turbulenceY, // Centered near energy core
          (Math.random() - 0.5) * coreSize * spreadFactor + turbulenceZ
        ];
        
        // Special high-activity particles have wider spread
        if (isHighActivityParticle) {
          position[0] *= 1.5;
          position[2] *= 1.5;
        }
      } else if (isOrbitingParticle) {
        // Particles that orbit around the robot based on processing activity
        const angle = Math.random() * Math.PI * 2;
        
        // Orbit radius influenced by processing load - higher load = wider orbit
        const baseRadius = 0.4 + (systemStatus.processingLoad * 0.3);
        // Add randomness to radius
        const radius = baseRadius + Math.random() * 0.3;
        
        // Orbit height varies with task complexity
        const heightVariance = 0.8 + (systemStatus.taskComplexity * 0.4);
        const baseHeight = 0.5 - (systemStatus.taskComplexity * 0.1); // Lower center with higher complexity
        
        position = [
          Math.cos(angle) * radius * 0.7 + turbulenceX,
          (Math.random() - 0.3) * heightVariance + baseHeight + turbulenceY,
          Math.sin(angle) * radius * 0.7 + turbulenceZ
        ];
        
        // For thinking state, create more structured orbits
        if (emotionalState === "thinking") {
          // More organized orbit planes for thinking state
          const planeIndex = i % 3; // Three orbit planes
          if (planeIndex === 0) {
            // Horizontal plane
            position[1] = 0.4 + Math.random() * 0.2; 
          } else if (planeIndex === 1) {
            // Mid plane
            position[1] = 0.5 + Math.random() * 0.3;
          } else {
            // Upper plane
            position[1] = 0.7 + Math.random() * 0.2;
          }
        }
      } else if (isDataStream) {
        // Data stream particles flow in organized streams based on data transfer rate
        
        // More streams for higher data transfer rates
        const streamCount = 4 + Math.floor(systemStatus.dataTransferRate * 4); 
        const streamAngle = (i % streamCount) * (Math.PI * 2 / streamCount);
        
        // Stream distance from center based on data rate
        const streamRadius = 0.2 + (systemStatus.dataTransferRate * 0.15);
        
        // Stream height based on task complexity
        const streamHeight = 0.9 + (systemStatus.taskComplexity * 0.2);
        
        position = [
          Math.cos(streamAngle) * (streamRadius + Math.random() * 0.1) + turbulenceX,
          (Math.random() - 0.5) * streamHeight + 0.5 + turbulenceY,
          Math.sin(streamAngle) * (streamRadius + Math.random() * 0.1) + turbulenceZ
        ];
        
        // For alert state, create faster, more directional streams
        if (emotionalState === "alert") {
          // More focused streams for alert state
          position[0] *= 0.8;
          position[2] *= 0.8;
          // Higher velocity (will be used in animation)
        }
        
        // For confused state, create chaotic streams
        if (emotionalState === "confused") {
          // Add extra random displacement
          position[0] += (Math.random() - 0.5) * 0.2;
          position[2] += (Math.random() - 0.5) * 0.2;
        }
      } else {
        // Ambient particles with behavior influenced by emotional state
        // Spread varies with emotional state - happy has wider spread, sad has tighter
        let spreadFactor = 1.0;
        
        // Adjust ambient particle distribution by emotional state
        switch (emotionalState) {
          case "happy":
            // Wider, more abundant ambient field
            spreadFactor = 1.3;
            break;
          case "sad":
            // Tighter, more confined ambient field
            spreadFactor = 0.8;
            break;
          case "alert":
            // Focused ambient field
            spreadFactor = 0.9;
            break;
          case "thinking":
            // Standard ambient field with slight upward bias
            spreadFactor = 1.1;
            break;
          case "confused":
            // Wide, chaotic ambient field
            spreadFactor = 1.4;
            break;
        }
        
        // Calculate base position with spread factor
        position = [
          (Math.random() - 0.5) * 0.6 * spreadFactor + turbulenceX,
          (Math.random() - 0.5) * 0.7 * spreadFactor + 0.5 + turbulenceY,
          (Math.random() - 0.5) * 0.6 * spreadFactor + turbulenceZ
        ];
        
        // For happy state, create more upper atmosphere particles
        if (emotionalState === "happy" && Math.random() < 0.4) {
          position[1] += 0.3; // More particles above the robot
        }
        
        // For sad state, create more lower atmosphere particles
        if (emotionalState === "sad" && Math.random() < 0.4) {
          position[1] -= 0.2; // More particles below the robot
        }
      }
      
      // Base particle properties based on type
      let baseSize, baseSpeed;
      
      // System status-influenced size calculation
      const sizeMultiplier = systemStatus.particleSize;
      
      // Base size by particle type with system influence
      if (isEnergyCore) {
        // Energy core particles size based on energy level
        baseSize = (0.03 + Math.random() * 0.02) * // Base range
                  sizeMultiplier * // System-wide size modifier
                  (0.8 + systemStatus.energyLevel * 0.4); // Energy influence
                  
        // Special particles for alert/happy states are larger
        if (isHighActivityParticle) {
          baseSize *= 1.3; // 30% larger for high activity particles
        }
      } else if (isOrbitingParticle) {
        // Orbiting particles size based on processing complexity
        baseSize = (0.02 + Math.random() * 0.01) * // Base range
                  sizeMultiplier * // System-wide size modifier
                  (0.8 + systemStatus.taskComplexity * 0.4); // Complexity influence
                  
        // Thinking state has more uniform sizes for computational particles
        if (emotionalState === "thinking") {
          // More uniform sizes for organized thinking state
          baseSize = 0.02 * sizeMultiplier * (0.9 + systemStatus.taskComplexity * 0.2);
        }
      } else if (isDataStream) {
        // Data stream particles size based on data transfer rate
        baseSize = (0.01 + Math.random() * 0.01) * // Base range
                  sizeMultiplier * // System-wide size modifier
                  (0.7 + systemStatus.dataTransferRate * 0.6); // Data rate influence
                  
        // Alert state has more prominent data streams
        if (emotionalState === "alert") {
          baseSize *= 1.2; // 20% larger in alert state
        }
      } else {
        // Ambient particle size based on stability and energy
        const ambientFactor = (systemStatus.systemStability * 0.3 + 
                              systemStatus.energyLevel * 0.7); // Weighted influence
                              
        baseSize = (0.005 + Math.random() * 0.015) * // Base range 
                  sizeMultiplier * // System-wide size modifier
                  (0.8 + ambientFactor * 0.4); // Ambient influence
      }
      
      // System status-influenced speed calculation
      const speedMultiplier = systemStatus.particleSpeed;
      
      // Base speed by particle type, influenced by system status
      if (isEnergyCore) {
        // Energy core particle speed varies with energy level
        baseSpeed = (0.05 + Math.random() * 0.1) * // Base range
          speedMultiplier * // System-wide speed modifier
          (0.8 + systemStatus.energyLevel * 0.4); // Energy level influence
          
        // Higher energy = faster pulse
        if (isHighActivityParticle) {
          baseSpeed *= 1.5; // High activity particles move faster
        }
      } else if (isOrbitingParticle) {
        // Orbiting particle speed varies with processing load
        baseSpeed = (0.2 + Math.random() * 0.2) * // Base range
          speedMultiplier * // System-wide speed modifier
          (0.7 + systemStatus.processingLoad * 0.6); // Processing load influence
          
        // Thinking state has more consistent orbit speeds
        if (emotionalState === "thinking") {
          // Less randomness in thinking state
          baseSpeed = 0.25 * speedMultiplier * (0.9 + systemStatus.processingLoad * 0.2);
        }
      } else if (isDataStream) {
        // Data stream speed varies with data transfer rate
        baseSpeed = (0.3 + Math.random() * 0.3) * // Base range
          speedMultiplier * // System-wide speed modifier
          (0.6 + systemStatus.dataTransferRate * 0.8); // Data rate influence
          
        // Alert state has much faster data streams
        if (emotionalState === "alert") {
          baseSpeed *= 1.5; // 50% faster in alert state
        }
        // Sad state has slower data streams
        else if (emotionalState === "sad") {
          baseSpeed *= 0.7; // 30% slower in sad state
        }
      } else {
        // Ambient particle speed varies with overall activity
        // Calculate activity level as average of energy, processing and data rate
        const activityLevel = (systemStatus.energyLevel +
                            systemStatus.processingLoad +
                            systemStatus.dataTransferRate) / 3;
                            
        baseSpeed = (0.1 + Math.random() * 0.15) * // Base range
          speedMultiplier * // System-wide speed modifier
          (0.7 + activityLevel * 0.6); // Activity level influence
      }
      
      // Apply final emotional state modifiers
      // These fine-tune the system status calculations based on the specific emotion
      let emotionSizeModifier = 1.0;
      let emotionSpeedModifier = 1.0;
      
      // Fine-tune particle characteristics based on emotional state
      switch (emotionalState) {
        case "happy":
          emotionSizeModifier = 1.1; // Slightly larger particles (joyful)
          emotionSpeedModifier = 1.2; // Faster particles (energetic)
          break;
        case "sad":
          emotionSizeModifier = 0.9; // Slightly smaller particles (subdued)
          emotionSpeedModifier = 0.9; // Slower particles (lethargic)
          break;
        case "alert":
          emotionSizeModifier = 1.05; // Barely larger particles (urgent)
          emotionSpeedModifier = 1.3; // Much faster particles (alarmed)
          break;
        case "thinking":
          emotionSizeModifier = 1.0; // Normal size (focused)
          emotionSpeedModifier = 1.1; // Slightly faster (active mind)
          break;
        case "confused":
          emotionSizeModifier = 0.95; // Slightly smaller (unsure)
          emotionSpeedModifier = 1.0; // Normal speed but with more randomness
          break;
      }
      
      // Additional particle properties based on type and emotional state
      let particleColor;
      let particleOpacity;
      
      // Assign particle color based on type and emotional state
      if (isEnergyCore) {
        // Energy core particles take color from the energy core with emotional tint
        switch(emotionalState) {
          case "happy":
            particleColor = new THREE.Color(0x3B82F6).lerp(new THREE.Color(0x06B6D4), 0.3); // Blend with cyan
            break;
          case "sad":
            particleColor = new THREE.Color(0x3B82F6).lerp(new THREE.Color(0x4F46E5), 0.3); // Blend with indigo
            break;
          case "alert":
            particleColor = new THREE.Color(0x3B82F6).lerp(new THREE.Color(0xEF4444), 0.3); // Blend with red
            break;
          case "thinking":
            particleColor = new THREE.Color(0x3B82F6).lerp(new THREE.Color(0x10B981), 0.2); // Blend with emerald
            break;
          case "confused":
            particleColor = new THREE.Color(0x3B82F6).lerp(new THREE.Color(0xF59E0B), 0.2); // Blend with amber
            break;
          default:
            particleColor = new THREE.Color(0x3B82F6); // Default blue
        }
        particleOpacity = 0.7 + (systemStatus.energyLevel * 0.3); // Opacity based on energy
      } else if (isOrbitingParticle) {
        // Orbiting particles have colors influenced by processing activity
        switch(emotionalState) {
          case "happy":
            particleColor = new THREE.Color(0x06B6D4); // Cyan
            break;
          case "sad":
            particleColor = new THREE.Color(0x4F46E5); // Indigo
            break;
          case "alert":
            particleColor = new THREE.Color(0xF43F5E); // Rose
            break;
          case "thinking":
            particleColor = new THREE.Color(0x10B981); // Emerald
            break;
          case "confused":
            particleColor = new THREE.Color(0xF59E0B); // Amber
            break;
          default:
            particleColor = new THREE.Color(0x60A5FA); // Light blue
        }
        particleOpacity = 0.6 + (systemStatus.processingLoad * 0.4); // Opacity based on processing
      } else if (isDataStream) {
        // Data stream particles have colors based on data transfer activity
        switch(emotionalState) {
          case "happy":
            particleColor = new THREE.Color(0x22D3EE); // Lighter cyan
            break;
          case "sad":
            particleColor = new THREE.Color(0x818CF8); // Lighter indigo
            break;
          case "alert":
            particleColor = new THREE.Color(0xFB7185); // Lighter rose
            break;
          case "thinking":
            particleColor = new THREE.Color(0x34D399); // Lighter emerald
            break;
          case "confused":
            particleColor = new THREE.Color(0xFBBF24); // Lighter amber
            break;
          default:
            particleColor = new THREE.Color(0x93C5FD); // Lighter blue
        }
        particleOpacity = 0.5 + (systemStatus.dataTransferRate * 0.5); // Opacity based on data rate
      } else {
        // Ambient particles have subtle color influence from emotional state
        switch(emotionalState) {
          case "happy":
            particleColor = new THREE.Color(0xBAE6FD); // Very light cyan
            break;
          case "sad":
            particleColor = new THREE.Color(0xC7D2FE); // Very light indigo
            break;
          case "alert":
            particleColor = new THREE.Color(0xFECACA); // Very light rose
            break;
          case "thinking":
            particleColor = new THREE.Color(0xA7F3D0); // Very light emerald
            break;
          case "confused":
            particleColor = new THREE.Color(0xFDE68A); // Very light amber
            break;
          default:
            particleColor = new THREE.Color(0xDCEFFF); // Very light blue
        }
        // Opacity based on system stability - more stable = more transparent ambient particles
        particleOpacity = 0.4 + ((1 - systemStatus.systemStability) * 0.4); 
      }
      
      // Apply high-activity special case for alert state
      if (isHighActivityParticle) {
        // Brighter, more opaque particles for high activity
        particleColor = particleColor.clone().multiplyScalar(1.3); // Brighter
        particleOpacity = Math.min(1.0, particleOpacity * 1.3); // More opaque, max 1.0
      }
      
      // Customized properties based on particle type, system status, and emotional state
      return {
        position,
        size: baseSize * emotionSizeModifier, // Apply emotion-based size modifier
        speed: baseSpeed * emotionSpeedModifier, // Apply emotion-based speed modifier
        color: particleColor,
        opacity: particleOpacity,
        type: isEnergyCore ? 'energy' :
              isOrbitingParticle ? 'orbit' :
              isDataStream ? 'data' : 'ambient',
        isHighActivity: isHighActivityParticle
      };
    });
  }, [intensity, emotionalState, systemStatus]); // Re-generate particles when emotional state or system status changes
  
  return (
    <group>
      {particles.map((particle, i) => (
        <ParticlePoint 
          key={i} 
          position={particle.position as [number, number, number]} 
          size={particle.size} 
          speed={particle.speed}
          type={particle.type}
          color={particle.color || color} // Use particle-specific color if available, fallback to default
          opacity={particle.opacity} // Use emotion-responsive opacity
          isHighActivity={particle.isHighActivity} // Pass high activity status
        />
      ))}
    </group>
  );
};

// Enhanced individual particle with advanced visual effects
const ParticlePoint = ({ 
  position, 
  size, 
  speed, 
  type, 
  color, 
  opacity = 0.8, 
  isHighActivity = false
}: { 
  position: [number, number, number], 
  size: number, 
  speed: number,
  type: 'energy' | 'orbit' | 'data' | 'ambient', // Properly define valid type values
  color: THREE.Color | any, // Allow other types but convert later
  opacity?: number,
  isHighActivity?: boolean
}) => {
  // Ensure we have a valid THREE.Color
  const safeColor = color instanceof THREE.Color ? color : new THREE.Color("#3B82F6");
  const meshRef = useRef<THREE.Mesh>(null);
  const baseColor = useMemo(() => {
    // Different colors based on particle type
    if (type === 'energy') {
      // Brighter version of base color for energy particles
      const energyColor = safeColor.clone().multiplyScalar(1.4);
      return energyColor;
    } else if (type === 'orbit') {
      // Slightly altered hue for orbiting particles
      const orbitColor = safeColor.clone();
      const hsl = {h: 0, s: 0, l: 0};
      orbitColor.getHSL(hsl);
      hsl.h = (hsl.h + 0.1) % 1; // Slight hue shift
      orbitColor.setHSL(hsl.h, hsl.s, hsl.l);
      return orbitColor;
    } else if (type === 'data') {
      // More saturated for data particles
      const dataColor = safeColor.clone();
      const hsl = {h: 0, s: 0, l: 0};
      dataColor.getHSL(hsl);
      hsl.s = Math.min(1, hsl.s * 1.3); // Increase saturation
      dataColor.setHSL(hsl.h, hsl.s, hsl.l);
      return dataColor;
    }
    return safeColor.clone();
  }, [safeColor, type]);
  
  useFrame(() => {
    if (!meshRef.current) return;
    
    // Use globalTimeRef for consistent animations across all components
    const time = globalTimeRef.current.value;
    
    if (type === 'energy') {
      // Energy particles hover near the core with subtle movements
      meshRef.current.position.y += Math.sin(time * speed) * 0.0015;
      meshRef.current.position.x += Math.cos(time * speed * 0.7) * 0.0005;
      meshRef.current.position.z += Math.sin(time * speed * 0.5) * 0.0005;
      
      // Energetic rotation
      meshRef.current.rotation.x += 0.02 * speed;
      meshRef.current.rotation.z += 0.02 * speed;
      
      // Strong pulsing
      const energyScale = 1 + Math.sin(time * speed * 3) * 0.3;
      meshRef.current.scale.set(energyScale, energyScale, energyScale);
      
    } else if (type === 'orbit') {
      // Orbiting particles follow curved paths around the robot
      const radius = Math.sqrt(position[0] * position[0] + position[2] * position[2]);
      const angle = time * speed * 0.2;
      meshRef.current.position.x = Math.cos(angle) * radius;
      meshRef.current.position.z = Math.sin(angle) * radius;
      meshRef.current.position.y += Math.sin(time * speed) * 0.001;
      
      // Gentle rotation following orbital path
      meshRef.current.rotation.y += 0.03 * speed;
      meshRef.current.rotation.x += 0.01 * speed;
      
      // Subtle pulsing
      const orbitScale = 1 + Math.sin(time * speed * 1.5) * 0.15;
      meshRef.current.scale.set(orbitScale, orbitScale, orbitScale);
      
    } else if (type === 'data') {
      // Data particles move in more linear paths like streaming data
      meshRef.current.position.y += 0.002 * speed; 
      // Reset position when it gets too high
      if (meshRef.current.position.y > 1.2) {
        meshRef.current.position.y = -0.2;
      }
      
      // Add subtle sideways motion
      meshRef.current.position.x += Math.sin(time * 5 * speed) * 0.0003;
      meshRef.current.position.z += Math.cos(time * 5 * speed) * 0.0003;
      
      // Fast rotation for data particles
      meshRef.current.rotation.x += 0.03 * speed;
      meshRef.current.rotation.z += 0.04 * speed;
      
      // Digital-like flicker
      const dataScale = 1 + (Math.sin(time * speed * 8) > 0.7 ? 0.3 : 0);
      meshRef.current.scale.set(dataScale, dataScale, dataScale);
      
    } else {
      // Default ambient particles with improved motion
      meshRef.current.position.y += Math.sin(time * speed) * 0.001;
      meshRef.current.position.x += Math.cos(time * speed * 0.6) * 0.0005;
      meshRef.current.position.z += Math.sin(time * speed * 0.8) * 0.0005;
      
      // Gentle rotation
      meshRef.current.rotation.x += 0.01 * speed;
      meshRef.current.rotation.z += 0.01 * speed;
      
      // Pulsing size
      const scale = 1 + Math.sin(time * speed * 2) * 0.2;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });
  
  // Use different geometries and materials based on particle type
  return (
    <mesh ref={meshRef} position={position}>
      {type === 'energy' ? (
        // Glowing energy particle with higher polycount
        <sphereGeometry args={[size, 12, 12]} />
      ) : type === 'orbit' ? (
        // Slightly elongated orbiting particles
        <octahedronGeometry args={[size, 2]} />
      ) : type === 'data' ? (
        // Cubic/digital data particles
        <boxGeometry args={[size, size, size]} />
      ) : (
        // Standard ambient particles
        <sphereGeometry args={[size, 8, 8]} />
      )}
      
      {type === 'energy' ? (
        // Enhanced glowing energy material with emotion-responsive properties
        <meshPhysicalMaterial 
          color={baseColor} 
          emissive={baseColor}
          emissiveIntensity={isHighActivity ? 3.0 : 2.0} // Brighter for high activity
          transparent={true}
          opacity={opacity}
          toneMapped={false}
          transmission={0.3}
          thickness={0.5}
          clearcoat={0.5} // Add subtle glossy coating
          clearcoatRoughness={0.2}
          envMapIntensity={1.2} // Enhanced reflections
        />
      ) : type === 'data' ? (
        // Enhanced digital-looking material for data particles
        <meshBasicMaterial 
          color={baseColor} 
          transparent={true}
          opacity={opacity}
          toneMapped={false}
          // Higher output for high activity particles
          blending={THREE.AdditiveBlending} // More vibrant blending
        />
      ) : type === 'orbit' ? (
        // Enhanced orbiting particle material with metallic properties
        <meshPhysicalMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={isHighActivity ? 1.5 : 1.0} // Brighter for high activity
          transparent={true}
          opacity={opacity}
          roughness={0.25} // Smoother finish
          metalness={0.6} // More metallic
          toneMapped={false}
          reflectivity={0.8} // Higher reflectivity
          clearcoat={0.3} // Subtle coating
          envMapIntensity={1.0} // Standard reflections
        />
      ) : (
        // Enhanced ambient particle material with atmospheric properties
        <meshPhysicalMaterial
          color={baseColor}
          emissive={baseColor.clone().multiplyScalar(0.8)} // Slightly dimmer emissive 
          emissiveIntensity={isHighActivity ? 1.2 : 0.8} // Brighter for high activity
          transparent={true}
          opacity={opacity}
          roughness={0.5} // More diffuse
          metalness={0.1} // Less metallic
          toneMapped={false}
          transmission={0.1} // Slight transparency
          ior={1.4} // Light refraction
        />
      )}
    </mesh>
  );
};

// Hologram projection component
const HologramProjection = ({ 
  text, 
  color,
  emotionalState = "neutral" 
}: { 
  text: string, 
  color: THREE.Color | any, // Allow other types but convert later
  emotionalState?: "neutral" | "happy" | "thinking" | "alert" | "sad" | "confused"
}) => {
  // Ensure we have a valid THREE.Color
  const safeColor = color instanceof THREE.Color ? color : new THREE.Color("#3B82F6");
  const groupRef = useRef<THREE.Group>(null);
  const htmlRef = useRef<any>(null);
  
  // Calculate emotion-influenced parameters with enhanced visual effects
  const emotionModifiers = useMemo(() => {
    // Default values
    let flickerSpeed = 5;              // Base speed of flicker effect (higher = faster)
    let flickerIntensity = 0.2;        // How much the hologram flickers (0-1)
    let floatAmplitude = 0.01;         // How much the hologram floats up/down
    let floatSpeed = 2;                // Speed of floating animation
    let beamOpacity = 0.3;             // Opacity of the projection beam
    let bgOpacity = 0.2;               // Background panel opacity
    let borderOpacity = 0.3;           // Border opacity
    let rotationFactor = 0.01;         // How much the hologram rotates
    let particleCount = 0;             // Number of particles in the hologram
    let textColor = "text-blue-300";   // Text color
    let borderColor = "border-blue-400"; // Border color
    let bgColor = "bg-blue-500";       // Background color
    
    // Enhanced hologram parameters
    let glitchIntensity = 0.05;        // Intensity of glitch effect (0-1)
    let glitchFrequency = 0.8;         // How often glitches occur (0-5)
    let scanlineOpacity = 0.15;        // Opacity of scanlines effect
    let scanlineDensity = 15;          // Density of scanlines
    let textBlurAmount = 0.2;          // Amount of blur on text (0-1)
    let textGlowIntensity = 1.0;       // Intensity of text glow effect
    let hologramDistortion = 0.1;      // Amount of wavey distortion (0-1)
    let digitalArtifacts = 0.3;        // Amount of digital artifacts/noise (0-1)
    let textFlutterAmount = 0.0;       // Characters randomly changing (0-1)
    let edgeGlowIntensity = 0.5;       // Intensity of edge glow effect
    
    // Adjust based on emotional state
    switch (emotionalState) {
      case "happy":
        // Vibrant, energetic, smooth-flowing hologram
        flickerSpeed = 7;
        flickerIntensity = 0.15;
        floatAmplitude = 0.015;
        floatSpeed = 2.5;
        beamOpacity = 0.35;
        bgOpacity = 0.25;
        borderOpacity = 0.4;
        rotationFactor = 0.015;
        particleCount = 5;
        textColor = "text-cyan-300";
        borderColor = "border-cyan-400";
        bgColor = "bg-cyan-500";
        
        // Enhanced parameters for happy state
        glitchIntensity = 0.02;        // Minimal glitches
        glitchFrequency = 0.3;         // Rare glitches
        scanlineOpacity = 0.1;         // Subtle scanlines
        scanlineDensity = 10;          // Fewer scanlines
        textBlurAmount = 0.0;          // Sharp text
        textGlowIntensity = 1.4;       // Enhanced glow
        hologramDistortion = 0.05;     // Minimal wavey distortion
        digitalArtifacts = 0.1;        // Few artifacts
        textFlutterAmount = 0.0;       // No random character changes
        edgeGlowIntensity = 0.8;       // Strong edge glow
        break;
      case "sad":
        // Somber, unstable, dimmer hologram
        flickerSpeed = 3;
        flickerIntensity = 0.25;
        floatAmplitude = 0.008;
        floatSpeed = 1.3;
        beamOpacity = 0.25;
        bgOpacity = 0.15;
        borderOpacity = 0.25;
        rotationFactor = 0.008;
        particleCount = 2;
        textColor = "text-indigo-300";
        borderColor = "border-indigo-400";
        bgColor = "bg-indigo-500";
        
        // Enhanced parameters for sad state
        glitchIntensity = 0.1;         // More glitches
        glitchFrequency = 1.5;         // Relatively frequent glitches
        scanlineOpacity = 0.25;        // More visible scanlines
        scanlineDensity = 20;          // Higher density of scanlines
        textBlurAmount = 0.3;          // Slight blurring effect
        textGlowIntensity = 0.7;       // Reduced glow
        hologramDistortion = 0.15;     // Moderate wavey distortion
        digitalArtifacts = 0.4;        // More artifacts
        textFlutterAmount = 0.03;      // Occasional character changes
        edgeGlowIntensity = 0.3;       // Weak edge glow
        break;
      case "thinking":
        // Analytical, precise, slightly pulsating hologram
        flickerSpeed = 4;
        flickerIntensity = 0.18;
        floatAmplitude = 0.012;
        floatSpeed = 1.7;
        beamOpacity = 0.3;
        bgOpacity = 0.2;
        borderOpacity = 0.3;
        rotationFactor = 0.01;
        particleCount = 3;
        textColor = "text-emerald-300";
        borderColor = "border-emerald-400";
        bgColor = "bg-emerald-500";
        
        // Enhanced parameters for thinking state
        glitchIntensity = 0.05;        // Minimal glitches
        glitchFrequency = 0.6;         // Occasional glitches
        scanlineOpacity = 0.2;         // Moderate scanlines
        scanlineDensity = 25;          // High density of precise scanlines
        textBlurAmount = 0.1;          // Very slight blur
        textGlowIntensity = 1.1;       // Moderate glow
        hologramDistortion = 0.08;     // Slight wavey distortion
        digitalArtifacts = 0.2;        // Some artifacts around edges
        textFlutterAmount = 0.01;      // Rare character changes
        edgeGlowIntensity = 0.6;       // Moderate edge glow with slight pulsing
        break;
      case "alert":
        // Urgent, intense, rapidly-fluctuating hologram
        flickerSpeed = 9;
        flickerIntensity = 0.3;
        floatAmplitude = 0.018;
        floatSpeed = 3;
        beamOpacity = 0.4;
        bgOpacity = 0.3;
        borderOpacity = 0.5;
        rotationFactor = 0.02;
        particleCount = 7;
        textColor = "text-red-300";
        borderColor = "border-red-400";
        bgColor = "bg-red-500";
        
        // Enhanced parameters for alert state
        glitchIntensity = 0.15;        // Frequent glitches
        glitchFrequency = 2.5;         // High frequency glitches
        scanlineOpacity = 0.3;         // Very visible scanlines
        scanlineDensity = 30;          // High density scanlines
        textBlurAmount = 0.05;         // Slight blur for urgency
        textGlowIntensity = 1.6;       // Strong intense glow
        hologramDistortion = 0.2;      // More wavey distortion
        digitalArtifacts = 0.5;        // Many digital artifacts
        textFlutterAmount = 0.05;      // Moderate character changes
        edgeGlowIntensity = 1.0;       // Maximum edge glow with rapid pulsing
        break;
      case "confused":
        // Erratic, unstable, inconsistent hologram
        flickerSpeed = 6;
        flickerIntensity = 0.28;
        floatAmplitude = 0.014;
        floatSpeed = 2.2;
        beamOpacity = 0.28;
        bgOpacity = 0.18;
        borderOpacity = 0.35;
        rotationFactor = 0.025;
        particleCount = 4;
        textColor = "text-amber-300";
        borderColor = "border-amber-400";
        bgColor = "bg-amber-500";
        
        // Enhanced parameters for confused state
        glitchIntensity = 0.12;        // Noticeable glitches
        glitchFrequency = 1.8;         // Frequent but irregular glitches
        scanlineOpacity = 0.22;        // Moderate scanlines
        scanlineDensity = 18;          // Medium density, erratic pattern
        textBlurAmount = 0.25;         // Noticeable blurring
        textGlowIntensity = 0.9;       // Inconsistent glow
        hologramDistortion = 0.25;     // Significant wavey distortion
        digitalArtifacts = 0.45;       // Obvious digital artifacts
        textFlutterAmount = 0.07;      // Frequent character changes
        edgeGlowIntensity = 0.4;       // Erratic, fluctuating edge glow
        break;
    }
    
    return {
      // Base parameters
      flickerSpeed,
      flickerIntensity,
      floatAmplitude,
      floatSpeed,
      beamOpacity,
      bgOpacity,
      borderOpacity,
      rotationFactor,
      particleCount,
      textColor,
      borderColor,
      bgColor,
      
      // Enhanced parameters
      glitchIntensity,
      glitchFrequency,
      scanlineOpacity,
      scanlineDensity,
      textBlurAmount,
      textGlowIntensity,
      hologramDistortion,
      digitalArtifacts,
      textFlutterAmount,
      edgeGlowIntensity
    };
  }, [emotionalState]);
  
  useFrame(() => {
    if (!groupRef.current || !htmlRef.current) return;
    
    const { 
      flickerSpeed, 
      flickerIntensity, 
      floatAmplitude, 
      floatSpeed,
      rotationFactor,
      // Enhanced visual effects parameters
      glitchIntensity,
      glitchFrequency,
      scanlineOpacity,
      scanlineDensity,
      textBlurAmount,
      textGlowIntensity,
      hologramDistortion,
      digitalArtifacts,
      textFlutterAmount,
      edgeGlowIntensity
    } = emotionModifiers;
    
    // Enhanced floating/flickering animation with emotional influence
    // Use globalTimeRef for consistent timing across components
    const t = globalTimeRef.current.value;
    
    // Position with emotion-based movement
    groupRef.current.position.y = Math.sin(t * floatSpeed) * floatAmplitude;
    
    // Add slight rotation based on emotional state
    if (emotionalState === "confused") {
      groupRef.current.rotation.z = Math.sin(t * 1.5) * rotationFactor * 2;
    } else if (emotionalState === "alert") {
      groupRef.current.rotation.y = Math.sin(t * 2) * rotationFactor * 1.5;
    } else {
      groupRef.current.rotation.z = Math.sin(t * 1.2) * rotationFactor;
    }
    
    // Apply advanced visual effects - ThreeHtml doesn't have material property so we use CSS
    const opacityValue = 0.7 + Math.sin(t * flickerSpeed) * flickerIntensity;
    
    if (htmlRef.current.el) {
      const el = htmlRef.current.el;
      
      // Base opacity effect
      el.style.opacity = opacityValue;
      
      // Apply hologram distortion (wavey effect)
      const waveAmplitude = hologramDistortion * 6; // Scale to appropriate values
      const waveFrequency = 1 + hologramDistortion * 10; // Higher frequency with more distortion
      const wavePhase = t * (1 + hologramDistortion * 3); // Phase changes with time
      const distortionFilter = `wave(${waveAmplitude}px, ${waveFrequency}, ${wavePhase})`;
      
      // Apply glitch effect conditionally based on frequency and intensity
      const shouldShowGlitch = Math.random() < glitchFrequency * 0.025; // Probability based on frequency
      const glitchX = shouldShowGlitch ? (Math.random() - 0.5) * glitchIntensity * 10 : 0;
      const glitchY = shouldShowGlitch ? (Math.random() - 0.5) * glitchIntensity * 5 : 0;
      const glitchFilter = shouldShowGlitch 
        ? `hue-rotate(${Math.random() * 360}deg) saturate(${1 + Math.random() * 3}) contrast(${1 + Math.random() * 2})`
        : '';
        
      // Apply text glow effect
      const glowColor = el.querySelector('div')?.classList.contains('text-red-300') 
        ? 'rgba(254, 80, 80, ' 
        : el.querySelector('div')?.classList.contains('text-cyan-300')
        ? 'rgba(80, 210, 254, '
        : el.querySelector('div')?.classList.contains('text-indigo-300')
        ? 'rgba(110, 120, 254, '
        : el.querySelector('div')?.classList.contains('text-amber-300')
        ? 'rgba(254, 210, 80, '
        : el.querySelector('div')?.classList.contains('text-emerald-300')
        ? 'rgba(80, 254, 170, '
        : 'rgba(120, 180, 254, ';
      
      const glowRadius = textGlowIntensity * 10;
      const glowOpacity = textGlowIntensity * 0.4;
      const textGlowFilter = `drop-shadow(0 0 ${glowRadius}px ${glowColor}${glowOpacity}))`;
      
      // Apply scanlines effect
      const scanlinePercentage = 100 / scanlineDensity; // Scanline spacing
      const scanlineBackground = 
        `repeating-linear-gradient(0deg, 
          rgba(0, 0, 0, 0) 0%, 
          rgba(0, 0, 0, 0) ${scanlinePercentage - 1}%, 
          rgba(0, 0, 0, ${scanlineOpacity}) ${scanlinePercentage}%)`;
      
      // Apply blur effect
      const blurFilter = textBlurAmount > 0 ? `blur(${textBlurAmount * 2}px)` : '';
      
      // Apply digital artifacts
      let noiseFilter = '';
      if (digitalArtifacts > 0) {
        // Create pixelation and noise effect for digital artifacts
        const pixelSize = Math.max(1, Math.floor(digitalArtifacts * 6)); // Pixelation level
        noiseFilter = `url(#noise) brightness(${1 + digitalArtifacts * 0.3}) pixelate(${pixelSize})`;
      }
      
      // Apply edge glow
      const edgeColor = el.querySelector('div')?.className.includes('text-red-300') 
        ? 'rgba(254, 60, 60, ' 
        : el.querySelector('div')?.className.includes('text-cyan-300')
        ? 'rgba(60, 210, 254, '
        : el.querySelector('div')?.className.includes('text-indigo-300')
        ? 'rgba(90, 100, 254, '
        : el.querySelector('div')?.className.includes('text-amber-300')
        ? 'rgba(254, 190, 60, '
        : el.querySelector('div')?.className.includes('text-emerald-300')
        ? 'rgba(60, 254, 150, '
        : 'rgba(100, 160, 254, ';
      
      const edgeGlowSize = edgeGlowIntensity * 5;
      const edgeOpacity = Math.min(0.9, edgeGlowIntensity * 0.6);
      const edgeGlowFilter = `outline(${edgeGlowSize}px, ${edgeColor}${edgeOpacity}))`;
      
      // Combine all filters
      const combinedFilters = [];
      if (glitchFilter) combinedFilters.push(glitchFilter);
      if (textGlowFilter) combinedFilters.push(textGlowFilter);
      if (blurFilter) combinedFilters.push(blurFilter);
      if (noiseFilter) combinedFilters.push(noiseFilter);
      if (edgeGlowFilter) combinedFilters.push(edgeGlowFilter);
      if (distortionFilter) combinedFilters.push(distortionFilter);
      
      // Apply all CSS properties
      if (combinedFilters.length > 0) {
        el.style.filter = combinedFilters.join(' ');
      }
      
      // Apply translate for glitch effect
      el.style.transform = `translate(${glitchX}px, ${glitchY}px)`;
      
      // Apply scanlines as background
      const contentDiv = el.querySelector('div');
      if (contentDiv) {
        const currentBackground = contentDiv.style.background || '';
        if (!currentBackground.includes('repeating-linear-gradient')) {
          contentDiv.style.backgroundImage = scanlineBackground;
        }
      }
    }
  });
  
  return (
    <group ref={groupRef} position={[0.7, 0.5, 0]} rotation={[0, -Math.PI / 4, 0]}>
      {/* Emotion-influenced hologram beam */}
      <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.05, 0.4, 8, 1, true]} />
        <meshBasicMaterial 
          color={safeColor} 
          transparent 
          opacity={emotionModifiers.beamOpacity} 
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Enhanced hologram content with advanced emotion-based styling */}
      <ThreeHtml
        ref={htmlRef}
        position={[0.4, 0, 0]}
        className="select-none pointer-events-none"
        transform
        occlude
        distanceFactor={0.5}
      >
        <div 
          className={`w-32 h-32 rounded ${emotionModifiers.bgColor} bg-opacity-${Math.round(emotionModifiers.bgOpacity * 100)} 
            flex items-center justify-center p-2 text-center font-mono text-xs 
            ${emotionModifiers.textColor} border ${emotionModifiers.borderColor} 
            border-opacity-${Math.round(emotionModifiers.borderOpacity * 100)} transform 
            ${emotionalState === "happy" ? hologramStyles.happyHologram : 
              emotionalState === "alert" ? hologramStyles.alertHologram :
              emotionalState === "sad" ? hologramStyles.sadHologram :
              emotionalState === "thinking" ? hologramStyles.thinkingHologram :
              emotionalState === "confused" ? hologramStyles.confusedHologram :
              hologramStyles.neutralHologram} 
            ${emotionalState === "alert" || emotionalState === "happy" ? 
              hologramStyles.edgeGlowEnhanced : hologramStyles.edgeGlowEffect}
            ${emotionalState === "thinking" ? hologramStyles.digitalDistortionEffect : ""}`}
          style={{
            textShadow: `0 0 ${emotionModifiers.textGlowIntensity * 5}px currentColor`,
            backdropFilter: `blur(${emotionModifiers.hologramDistortion * 2}px)`,
            WebkitBackdropFilter: `blur(${emotionModifiers.hologramDistortion * 2}px)`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Advanced hologram effects for more realism */}
          <div className={emotionalState === "alert" || emotionalState === "confused" ? 
                           hologramStyles.hdScanlineEffect : 
                           hologramStyles.scanlineEffect}></div>
          <div className={hologramStyles.digitalNoiseEffect}></div>
          
          {/* Apply advanced text effects with character-by-character animations */}
          {typeof text === 'string' ? text.split('').map((char, i) => {
            // Determine character effect based on emotional state and position
            const charEffect = (() => {
              if (emotionalState === "alert") {
                return Math.random() < 0.2 ? hologramStyles.glitchChar : 
                       Math.random() < 0.3 ? hologramStyles.flickerChar : '';
              } else if (emotionalState === "happy") {
                return Math.random() < 0.15 ? hologramStyles.flutterChar : '';
              } else if (emotionalState === "confused") {
                return Math.random() < 0.3 ? hologramStyles.scrambleChar : 
                       Math.random() < 0.2 ? hologramStyles.glitchChar : '';
              } else if (emotionalState === "thinking") {
                return Math.random() < 0.1 ? hologramStyles.flickerChar : '';
              } else if (emotionalState === "sad") {
                return Math.random() < 0.05 ? hologramStyles.flickerChar : '';
              } else {
                return '';
              }
            })();
            
            // Random chance to show a glitched character based on emotional state
            const shouldGlitch = Math.random() < emotionModifiers.textFlutterAmount;
            const glitchChars = '@#$%&*!?<>[]{}~^';
            const glitchedChar = glitchChars[Math.floor(Math.random() * glitchChars.length)];
            
            return (
              <span 
                key={i} 
                className={shouldGlitch ? 
                  (emotionalState === "alert" ? hologramStyles.glitchChar : 
                   emotionalState === "confused" ? hologramStyles.scrambleChar : 
                   hologramStyles.flickerChar) 
                  : charEffect}
                style={{
                  opacity: shouldGlitch ? 0.9 : 1,
                  display: 'inline-block',
                  textShadow: shouldGlitch ? `0 0 ${emotionModifiers.textGlowIntensity * 8}px currentColor` : 'inherit',
                  // Set a CSS variable for character index to enable sequential animations
                  ['--char-index' as any]: i
                }}
              >
                {shouldGlitch ? glitchedChar : char}
              </span>
            );
          }) : text}
          
          {/* Enhanced volumetric glow effect for more depth */}
          {(emotionalState === "alert" || emotionalState === "happy") && (
            <div 
              className={`absolute inset-0 pointer-events-none ${hologramStyles.volumetricGlow}`}
              style={{
                borderRadius: 'inherit',
                opacity: emotionalState === "alert" ? 0.5 : 0.3,
                animationDuration: `${emotionalState === "alert" ? 2 : 3}s`
              }}
            />
          )}
          
          {/* Add hologram glow overlay based on emotional intensity */}
          <div 
            className={`absolute inset-0 pointer-events-none ${hologramStyles.hologramGlow}`}
            style={{
              borderRadius: 'inherit',
              opacity: emotionModifiers.textGlowIntensity * 0.3,
              // Adjust animation speed based on emotional state
              animationDuration: `${emotionalState === "alert" ? 1 : 
                                   emotionalState === "happy" ? 2 : 
                                   emotionalState === "thinking" ? 3 : 
                                   emotionalState === "confused" ? 2.5 : 
                                   emotionalState === "sad" ? 4 : 3}s`
            }}
          />
        </div>
      </ThreeHtml>
      
      {/* Add subtle data particles for certain emotional states */}
      {emotionModifiers.particleCount > 0 && (
        <group position={[0.4, 0, 0]}>
          {[...Array(emotionModifiers.particleCount)].map((_, i) => (
            <HologramParticle 
              key={i} 
              index={i} 
              color={safeColor}
              emotionalState={emotionalState}
            />
          ))}
        </group>
      )}
    </group>
  );
};

// Enhanced hologram particles with emotion-responsive behaviors and visual effects
// Define the particle types for improved type safety
type ParticleType = 'energy' | 'orbit' | 'data' | 'ambient';

const HologramParticle = ({ 
  index, 
  color,
  emotionalState
}: {
  index: number,
  color: THREE.Color | any, // Allow other types but convert later
  emotionalState: string
}) => {
  // Ensure we have a valid THREE.Color
  const safeColor = color instanceof THREE.Color ? color : new THREE.Color("#3B82F6");
  // Determine particle type based on index and emotional state for variety
  const type = useMemo<ParticleType>(() => {
    // Emotion-influenced particle type distribution
    if (emotionalState === "alert") {
      // Alert state has more energy particles
      return Math.random() < 0.6 ? 'energy' : 
             Math.random() < 0.8 ? 'orbit' : 'data';
    } else if (emotionalState === "happy") {
      // Happy state has balanced energy and orbit particles
      return Math.random() < 0.4 ? 'energy' : 
             Math.random() < 0.8 ? 'orbit' : 'data';
    } else if (emotionalState === "thinking") {
      // Thinking state has more data particles
      return Math.random() < 0.3 ? 'energy' : 
             Math.random() < 0.5 ? 'orbit' : 'data';
    } else if (emotionalState === "confused") {
      // Confused state has a random mix
      return Math.random() < 0.25 ? 'energy' : 
             Math.random() < 0.5 ? 'orbit' :
             Math.random() < 0.75 ? 'data' : 'ambient';
    } else if (emotionalState === "sad") {
      // Sad state has more ambient particles
      return Math.random() < 0.2 ? 'energy' : 
             Math.random() < 0.4 ? 'orbit' : 
             Math.random() < 0.7 ? 'data' : 'ambient';
    } else {
      // Neutral state has balanced distribution
      return Math.random() < 0.33 ? 'energy' : 
             Math.random() < 0.66 ? 'orbit' : 'data';
    }
  }, [emotionalState]);
  const meshRef = useRef<THREE.Mesh>(null);
  const particleGeometryType = useMemo(() => {
    // Different particle shapes based on emotional state
    const shapes = ['sphere', 'box', 'octahedron', 'tetrahedron', 'torus'];
    
    if (emotionalState === "alert") {
      // Alert state - more angular, sharp shapes (box, tetrahedron)
      return shapes[Math.random() > 0.5 ? 1 : 3];
    } else if (emotionalState === "happy") {
      // Happy state - rounded, smooth shapes (sphere, torus)
      return shapes[Math.random() > 0.5 ? 0 : 4]; 
    } else if (emotionalState === "thinking") {
      // Thinking state - complex shape (octahedron)
      return shapes[2];
    } else if (emotionalState === "confused") {
      // Confused state - mix of different shapes
      return shapes[Math.floor(Math.random() * shapes.length)];
    } else if (emotionalState === "sad") {
      // Sad state - simpler shapes (sphere, box)
      return shapes[Math.random() > 0.5 ? 0 : 1];
    } else {
      // Neutral - default to sphere
      return shapes[0];
    }
  }, [emotionalState]);
  
  // Derive particle color from base hologram color with emotional tinting
  const particleColor = useMemo(() => {
    const baseColor = safeColor.clone();
    
    if (emotionalState === "alert") {
      // Alert - shift toward red
      return baseColor.lerp(new THREE.Color(0xff3030), 0.3);
    } else if (emotionalState === "happy") {
      // Happy - shift toward cyan
      return baseColor.lerp(new THREE.Color(0x30e0ff), 0.3);
    } else if (emotionalState === "thinking") {
      // Thinking - shift toward green
      return baseColor.lerp(new THREE.Color(0x30ff80), 0.2);
    } else if (emotionalState === "confused") {
      // Confused - shift toward amber
      return baseColor.lerp(new THREE.Color(0xffb830), 0.3);
    } else if (emotionalState === "sad") {
      // Sad - shift toward indigo
      return baseColor.lerp(new THREE.Color(0x5060ff), 0.3);
    } else {
      // Neutral - maintain base color
      return baseColor;
    }
  }, [safeColor, emotionalState]);
  
  useFrame(() => {
    if (!meshRef.current) return;
    
    // Enhanced emotion-based movement parameters
    const speed = emotionalState === "alert" ? 2.5 : 
                  emotionalState === "happy" ? 2.0 :
                  emotionalState === "confused" ? 1.8 :
                  emotionalState === "thinking" ? 1.6 :
                  emotionalState === "sad" ? 1.2 : 1.5;
                  
    const size = emotionalState === "alert" ? 0.012 : 
                 emotionalState === "happy" ? 0.01 :
                 emotionalState === "confused" ? 0.009 :
                 emotionalState === "thinking" ? 0.008 :
                 emotionalState === "sad" ? 0.007 : 0.008;
                 
    const turbulence = emotionalState === "alert" ? 0.4 : 
                       emotionalState === "happy" ? 0.2 :
                       emotionalState === "confused" ? 0.5 :
                       emotionalState === "thinking" ? 0.1 :
                       emotionalState === "sad" ? 0.05 : 0.1;
                  
    const pulseSpeed = emotionalState === "alert" ? 5 : 
                       emotionalState === "happy" ? 4 :
                       emotionalState === "confused" ? 3.5 :
                       emotionalState === "thinking" ? 3 :
                       emotionalState === "sad" ? 2 : 3;
                       
    const pulseAmplitude = emotionalState === "alert" ? 0.5 : 
                          emotionalState === "happy" ? 0.4 :
                          emotionalState === "confused" ? 0.5 :
                          emotionalState === "thinking" ? 0.3 :
                          emotionalState === "sad" ? 0.2 : 0.3;
    
    // Time-based animation using globalTimeRef for consistent timing
    const t = globalTimeRef.current.value + index;
    
    // Enhanced circular floating motion with emotional turbulence
    const radius = 0.15 + index * 0.03;
    const wobble = Math.sin(t * 5 * turbulence) * turbulence * 0.02; // Emotional turbulence
    meshRef.current.position.x = Math.sin(t * speed + index) * (radius + wobble);
    meshRef.current.position.z = Math.cos(t * speed + index) * (radius + wobble);
    
    // Enhanced vertical oscillation with emotional characteristics
    const verticalSpeed = emotionalState === "happy" ? 1.5 : 
                         emotionalState === "sad" ? 0.8 : 
                         1 + index * 0.2;
    const verticalAmplitude = emotionalState === "alert" ? 0.07 :
                             emotionalState === "happy" ? 0.06 : 
                             emotionalState === "sad" ? 0.03 : 
                             0.05;
    meshRef.current.position.y = Math.sin(t * verticalSpeed) * verticalAmplitude;
    
    // Enhanced rotation based on emotional state
    if (emotionalState === "confused") {
      // Erratic rotation for confused state
      meshRef.current.rotation.x += Math.sin(t * 3) * 0.02;
      meshRef.current.rotation.y += Math.cos(t * 2) * 0.03;
      meshRef.current.rotation.z += Math.sin(t * 4) * 0.02;
    } else if (emotionalState === "alert") {
      // Rapid consistent rotation for alert state
      meshRef.current.rotation.y += 0.03;
      meshRef.current.rotation.z += 0.02;
    } else if (emotionalState === "happy") {
      // Smooth, pleasant rotation for happy state
      meshRef.current.rotation.x = Math.sin(t * 2) * 0.2;
      meshRef.current.rotation.y += 0.01;
    } else if (emotionalState === "thinking") {
      // Methodical rotation for thinking state
      meshRef.current.rotation.y += 0.02;
      meshRef.current.rotation.x = Math.sin(t) * 0.1;
    } else if (emotionalState === "sad") {
      // Slow, minimal rotation for sad state
      meshRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;
    } else {
      // Neutral state rotation
      meshRef.current.rotation.y += 0.01;
    }
    
    // Enhanced scale pulsing with emotional characteristics
    const pulseFactor = (1 + Math.sin(t * pulseSpeed) * pulseAmplitude * 0.1);
    const baseScale = size * (emotionalState === "alert" ? 1.2 : 
                             emotionalState === "happy" ? 1.1 : 
                             emotionalState === "sad" ? 0.9 : 
                             1.0);
    const scale = baseScale * pulseFactor;
    meshRef.current.scale.set(scale, scale, scale);
  });
  
  // Opacity based on emotional state
  const opacity = useMemo(() => {
    if (emotionalState === "alert") return 0.85;
    if (emotionalState === "happy") return 0.8;
    if (emotionalState === "thinking") return 0.75;
    if (emotionalState === "confused") return 0.7;
    if (emotionalState === "sad") return 0.6;
    return 0.7; // default neutral
  }, [emotionalState]);
  
  // Choose particle rendering based on geometry type
  return (
    <mesh ref={meshRef}>
      {particleGeometryType === 'sphere' && <sphereGeometry args={[0.01, 8, 8]} />}
      {particleGeometryType === 'box' && <boxGeometry args={[0.012, 0.012, 0.012]} />}
      {particleGeometryType === 'octahedron' && <octahedronGeometry args={[0.013, 0]} />}
      {particleGeometryType === 'tetrahedron' && <tetrahedronGeometry args={[0.014, 0]} />}
      {particleGeometryType === 'torus' && <torusGeometry args={[0.008, 0.003, 8, 12]} />}
      
      {/* Advanced physically-based material with emotion-responsive properties */}
      <meshPhysicalMaterial 
        // Base color from emotional state with enhanced vibrancy
        color={particleColor}
        // Self-illumination with emotional intensity modulation
        emissive={particleColor}
        emissiveIntensity={
          (() => {
            // Enhanced emotion-based emission with particle type influence
            let baseIntensity = emotionalState === "alert" ? 2.0 :
                               emotionalState === "happy" ? 1.5 :
                               emotionalState === "thinking" ? 1.2 :
                               emotionalState === "sad" ? 0.8 : 
                               emotionalState === "confused" ? 1.3 :
                               1.0;
                               
            // Further modify intensity based on particle type
            switch(type) {
              case 'energy': return baseIntensity * 1.3; // Energy particles are brighter
              case 'orbit': return baseIntensity * 1.1;  // Orbit particles have moderate brightness
              case 'data': return baseIntensity * 0.9;   // Data particles are more subdued
              case 'ambient': return baseIntensity * 0.7; // Ambient particles are most subtle
              default: return baseIntensity;
            }
          })()
        }
        transparent={true}
        opacity={opacity}
        toneMapped={false}
        
        // Set PBR metalness property based on particle type and emotional state
        metalness={
          (() => {
            // Base metalness by particle type
            let baseMetal = 
              type === 'energy' ? 0.9 :
              type === 'orbit' ? 0.7 :
              type === 'data' ? 0.5 :
              type === 'ambient' ? 0.3 : 0.5;
            
            // Emotional state influences metalness
            if (emotionalState === "alert") return Math.min(1.0, baseMetal * 1.2); // More metallic/reflective
            if (emotionalState === "happy") return Math.min(1.0, baseMetal * 1.1); // Slightly more metallic
            if (emotionalState === "sad") return baseMetal * 0.8; // Less metallic, more matte
            
            return baseMetal;
          })()
        }
        
        // Set PBR roughness property based on particle type and emotional state
        roughness={
          (() => {
            // Base roughness by particle type
            let baseRough = 
              type === 'energy' ? 0.1 : // Energy particles are smooth and glossy
              type === 'orbit' ? 0.2 :  // Orbit particles are moderately smooth
              type === 'data' ? 0.3 :   // Data particles have medium roughness
              type === 'ambient' ? 0.4 : 0.3; // Ambient particles are roughest
            
            // Emotional state influences roughness
            if (emotionalState === "alert") return Math.max(0.05, baseRough * 0.8); // Smoother/sharper
            if (emotionalState === "confused") return Math.min(0.9, baseRough * 1.3); // Rougher/scattered
            if (emotionalState === "sad") return Math.min(0.9, baseRough * 1.2); // Rougher/diffused
            
            return baseRough;
          })()
        }
        
        // Light transmission for enhanced glow/halo effect
        transmission={
          (() => {
            // Base transmission by particle type
            let baseTrans = 
              type === 'energy' ? 0.4 : // Energy particles have highest light transmission
              type === 'orbit' ? 0.3 :  // Orbit particles have moderate transmission
              type === 'data' ? 0.2 :   // Data particles have lower transmission
              type === 'ambient' ? 0.1 : 0.2; // Ambient particles have lowest transmission
            
            // Emotional state influences transmission
            if (emotionalState === "happy") return Math.min(0.6, baseTrans * 1.2); // More transmission for happy
            if (emotionalState === "sad") return baseTrans * 0.8; // Less transmission for sad
            
            return baseTrans;
          })()
        }
        
        // Realistic light refraction with emotional variation
        ior={
          emotionalState === "alert" ? 1.6 : // Higher refraction for alert state
          emotionalState === "happy" ? 1.55 : // Slightly higher for happy
          emotionalState === "sad" ? 1.4 :    // Lower for sad
          1.5 // Default
        }
        
        // Advanced clearcoat layer for added realism
        clearcoat={
          (() => {
            // Base clearcoat by particle type
            let baseClear = 
              type === 'energy' ? 0.8 : // Energy particles have highest clearcoat
              type === 'orbit' ? 0.6 :  // Orbit particles have good clearcoat
              type === 'data' ? 0.4 :   // Data particles have moderate clearcoat
              type === 'ambient' ? 0.2 : 0.5; // Ambient particles have minimal clearcoat
            
            // Emotional state influences clearcoat
            if (emotionalState === "alert") return Math.min(1.0, baseClear * 1.2); // Enhanced for alert
            if (emotionalState === "happy") return Math.min(1.0, baseClear * 1.1); // Slightly enhanced for happy
            if (emotionalState === "sad") return baseClear * 0.8; // Reduced for sad
            
            return baseClear;
          })()
        }
        
        // Clearcoat roughness for more realistic clearcoat layer
        clearcoatRoughness={
          (() => {
            // Base clearcoat roughness with emotional influence
            if (emotionalState === "alert") return 0.1; // Very smooth clearcoat for sharp look
            if (emotionalState === "happy") return 0.15; // Fairly smooth clearcoat
            if (emotionalState === "confused") return 0.3; // Rougher clearcoat
            if (emotionalState === "sad") return 0.25; // Moderately rough clearcoat
            
            return 0.2; // Default
          })()
        }
        
        // Add env map influence for more realistic reflections
        envMapIntensity={
          emotionalState === "alert" ? 1.2 :
          emotionalState === "happy" ? 1.1 :
          emotionalState === "sad" ? 0.8 :
          1.0
        }
        
        // Add displacement effect for more realistic surface details
        displacementScale={
          type === 'energy' ? 0.05 :
          type === 'orbit' ? 0.03 :
          type === 'data' ? 0.02 :
          0.01
        }
        
        // Realistic reflectivity
        reflectivity={(() => {
          switch(type) {
            case 'energy': return 0.8;
            case 'orbit': return 0.6;
            case 'data': return 0.4;
            default: return 0.3;
          }
        })()}
        
        // Subtle iridescence for energy particles
        iridescence={(() => {
          switch(type) {
            case 'energy': return 0.7;
            case 'orbit': return 0.4;
            default: return 0.1;
          }
        })()}
        
        iridescenceIOR={1.3}
        
        // Emotion-specific coloring for scattered light
        attenuationColor={new THREE.Color(
          emotionalState === "alert" ? 0xff6b6b :
          emotionalState === "happy" ? 0x48bb78 :
          emotionalState === "thinking" ? 0x4299e1 :
          emotionalState === "sad" ? 0x9f7aea :
          emotionalState === "confused" ? 0xecc94b :
          0x4299e1
        )}
        
        attenuationDistance={(() => {
          switch(type) {
            case 'energy': return 0.2;
            default: return 0.5;
          }
        })()}
      />
    </mesh>
  );
};

export default AstroBotMascot3D;