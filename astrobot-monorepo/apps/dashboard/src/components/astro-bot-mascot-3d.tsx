"use client";

import React, { useRef, useState, useEffect, useMemo, useCallback, Suspense, createContext, useContext } from "react";
import dynamic from 'next/dynamic';
import { useFrame, useThree, Canvas } from '@react-three/fiber';
import ThreeJsErrorBoundary from './three-js-error-boundary';
import RobotFallback from './robot-fallback';
import ThreeJsCanvas from './three-js-canvas';
import UniversalClientOnly from './universal-client-only';
import * as THREE from 'three';
import RobotTimeKeeper, { globalTimeRef as robotTimeRef } from './robot-timekeeper';
import { 
  safeRandom, 
  isClient,
  safeColor as utilSafeColor, 
  safeColorModify, 
  createAnimatableColor, 
  createGlowColor 
} from '../utils/three-utils';

// Sync our local time reference with the globally shared robotTimeRef
// This ensures all components use the same stable timer
const globalTimeRef = robotTimeRef;

// Use the imported UniversalClientOnly component for all client-side rendering
// to maintain consistency across the application and prevent hook issues
const ClientOnly = UniversalClientOnly;

// Instead of a separate TimeUpdater component, we'll update global time in each component that uses it

// Utility function to safely get hex color
const safeGetHex = (color: any): string => {
  // Check if color is a proper THREE.Color with getHex method
  if (color && typeof color === 'object' && 'getHex' in color && typeof color.getHex === 'function') {
    try {
      return `#${color.getHex().toString(16).padStart(6, '0')}`;
    } catch (e) {
      console.warn('Error getting hex color:', e);
      return '#5e81ac'; // Default fallback color
    }
  }
  // Return default color if not a proper color object
  return '#5e81ac';
};

// Use the imported utilSafeColor function for all color operations
// We're aliasing it to safeColor for backward compatibility with existing code
const safeColor = utilSafeColor;

// Dynamically import Three.js components to avoid SSR issues
const ThreeCanvas = dynamic(() => import('@react-three/fiber').then(mod => mod.Canvas), { ssr: false });
const ThreeEnvironment = dynamic(() => import('@react-three/drei').then(mod => mod.Environment), { ssr: false });
const ThreeEdges = dynamic(() => import('@react-three/drei').then(mod => mod.Edges), { ssr: false });
const Edges = ThreeEdges; // Alias for easier component usage
const ThreeHtml = dynamic(() => import('@react-three/drei').then(mod => mod.Html), { ssr: false });
const Html = ThreeHtml; // Alias for easier component usage
const ThreeContactShadows = dynamic(() => import('@react-three/drei').then(mod => mod.ContactShadows), { ssr: false });
const ThreePresentationControls = dynamic(() => import('@react-three/drei').then(mod => mod.PresentationControls), { ssr: false });
const ThreeEffectComposer = dynamic(() => import('@react-three/postprocessing').then(mod => mod.EffectComposer), { ssr: false });
const ThreeBloom = dynamic(() => import('@react-three/postprocessing').then(mod => mod.Bloom), { ssr: false });
const ThreeChromaticAberration = dynamic(() => import('@react-three/postprocessing').then(mod => mod.ChromaticAberration), { ssr: false });
const ThreeNoise = dynamic(() => import('@react-three/postprocessing').then(mod => mod.Noise), { ssr: false });
const ThreeDepthOfField = dynamic(() => import('@react-three/postprocessing').then(mod => mod.DepthOfField), { ssr: false });

// THREE is already imported at the top of the file

// Import CSS module for hologram effects
import styles from '../styles/hologram-effects.module.css';

// Define interface for ClientSideRenderer props
// Import shared type definitions from utils
import { EmotionalState, ParticleType, ParticleDisplay, ComponentSize } from '../utils/types';

interface ClientSideRendererProps {
  dimensions: { width: number; height: number };
  performanceSettings: {
    shadows: boolean;
    pixelRatio: number;
    environment: boolean;
    postProcessing: boolean;
  };
  currentSequence: string;
  emotionalState: EmotionalState;
  showParticles: ParticleDisplay | string;
  hologramText: string | null;
  animate: boolean;
  interactive: boolean;
  onAnimationComplete: () => void;
}

// Define the component separately to avoid hook issues
const ClientSideRendererComponent: React.FC<ClientSideRendererProps> = ({ 
  dimensions, 
  performanceSettings, 
  currentSequence, 
  emotionalState, 
  showParticles, 
  hologramText, 
  animate, 
  interactive,
  onAnimationComplete 
}) => {
  // Handle errors with THREE.js rendering to prevent total component failure
  const [renderingError, setRenderingError] = useState<string | null>(null);
  
  // Error handler callback - using a stable reference with useCallback
  const handleRenderError = useCallback((error: Error) => {
    console.error("THREE.js rendering error:", error);
    setRenderingError(error.message);
  }, []);
  return (
    <ThreeCanvas
      shadows={performanceSettings.shadows}
      dpr={performanceSettings.pixelRatio}
      camera={{ position: [0, 0.5, 2.5], fov: 45 }}
      gl={{ antialias: true }}
    >
      {/* Global timekeeper to manage consistent animation timing */}
      <RobotTimeKeeper 
        isPaused={!animate}
        timeScale={1.0}
        onTick={(elapsedTime) => {
          // Optional callback for time-based events
          // This will run on each animation frame
        }}
      />
      
      {/* Environment and lighting */}
      {performanceSettings.environment && (
        <ThreeEnvironment
          preset="studio"
          background={false}
        />
      )}
      
      {/* Main directional light with shadow */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* Ambient light for fill */}
      <ambientLight intensity={0.5} />
      
      {/* Rim light to highlight edges */}
      <spotLight
        position={[-5, 5, -5]}
        intensity={0.5}
        color="#b0c4de"
      />
      
      {/* Robot model */}
      <RobotModel 
        currentSequence={currentSequence}
        emotionalState={emotionalState}
        showParticles={showParticles}
        hologramText={hologramText}
        animate={animate}
        onAnimationComplete={onAnimationComplete}
      />
      
      {/* Ground shadow */}
      <ThreeContactShadows
        position={[0, -1, 0]}
        opacity={0.5}
        scale={10}
        blur={1}
        far={10}
        resolution={256}
        color="#000000"
      />
      
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
      
      {/* Advanced post-processing effects with multi-layered emotion-responsive configuration */}
      {performanceSettings.postProcessing && (
        <ThreeEffectComposer>
          {/* Base bloom layer - applied to all states with emotion-specific tuning */}
          <ThreeBloom
            luminanceThreshold={
              emotionalState === "alert" ? 0.65 :    // Lower threshold for alert - more elements glow
              emotionalState === "happy" ? 0.7 :     // Slightly lower for happy - vibrant glow
              emotionalState === "thinking" ? 0.8 :  // Higher for thinking - focused glow on important elements
              emotionalState === "sad" ? 0.85 :      // Higher for sad - subdued glow
              emotionalState === "confused" ? 0.75 : // Medium for confused - slightly inconsistent glow
              0.75                                   // Default - balanced
            }
            luminanceSmoothing={
              emotionalState === "alert" ? 0.8 :     // Smoother transitions for alert - cohesive urgent glow
              emotionalState === "happy" ? 0.85 :    // Very smooth for happy - pleasant, soft transitions
              emotionalState === "thinking" ? 0.75 : // Moderate for thinking - defined edges but not harsh
              emotionalState === "sad" ? 0.9 :       // Very smooth for sad - soft, subdued transitions
              emotionalState === "confused" ? 0.65 : // Less smooth for confused - more variation
              0.8                                    // Default - balanced smoothing
            }
            height={300}
            opacity={
              emotionalState === "alert" ? 0.7 :     // High opacity for alert - prominent glow
              emotionalState === "happy" ? 0.65 :    // Medium-high for happy - vibrant but not overwhelming
              emotionalState === "thinking" ? 0.5 :  // Medium for thinking - noticeable but focused
              emotionalState === "sad" ? 0.3 :       // Low for sad - subtle, subdued glow
              emotionalState === "confused" ? 0.55 : // Medium with variation for confused
              0.5                                    // Default
            }
            blendMode="add"  // Fixed to add to avoid dynamic blend mode errors
            intensity={
              emotionalState === "alert" ? 1.5 :     // High intensity for alert - intense glow
              emotionalState === "happy" ? 1.4 :     // Medium-high for happy - cheerful glow
              emotionalState === "thinking" ? 1.1 :  // Moderate for thinking - controlled glow
              emotionalState === "sad" ? 0.7 :       // Low for sad - subdued, dim glow
              emotionalState === "confused" ? 1.3 :  // Variable for confused - inconsistent brightness
              1.0                                    // Default
            }
            radius={
              emotionalState === "alert" ? 0.7 :     // Medium radius for alert - focused but spread
              emotionalState === "happy" ? 0.9 :     // Larger radius for happy - expansive, radiant glow 
              emotionalState === "thinking" ? 0.6 :  // Smaller radius for thinking - precise, focused
              emotionalState === "sad" ? 1.0 :       // Largest radius for sad - diffuse, soft glow
              emotionalState === "confused" ? 0.8 :  // Medium-large for confused - slightly unfocused
              0.75                                   // Default - balanced bloom radius
            }
          />
          
          {/* Mid-range selective bloom - accent features based on emotional state */}
          <ThreeBloom
            blendMode="add"  // Fixed to add to avoid dynamic blend mode errors
            luminanceThreshold={
              emotionalState === "alert" ? 0.75 :    // Medium threshold for mid-tones
              emotionalState === "happy" ? 0.8 :     // Medium-high
              emotionalState === "thinking" ? 0.9 :  // High - very selective accents
              emotionalState === "sad" ? 0.95 :      // Very high - minimal accents
              emotionalState === "confused" ? 0.85 : // Medium-high with inconsistency
              0.85                                   // Default
            }
            luminanceSmoothing={0.7}                 // Consistent mid-range smoothing
            height={250}                            // Slightly lower resolution than base layer
            opacity={
              emotionalState === "alert" ? 0.5 :     // Medium opacity for secondary highlights
              emotionalState === "happy" ? 0.45 :    // Medium
              emotionalState === "thinking" ? 0.3 :  // Low-medium
              emotionalState === "sad" ? 0.2 :       // Low
              emotionalState === "confused" ? 0.35 : // Low-medium with variation
              0.35                                   // Default
            }
            intensity={
              emotionalState === "alert" ? 1.8 :     // High intensity for secondary highlights
              emotionalState === "happy" ? 1.6 :     // Medium-high
              emotionalState === "thinking" ? 1.2 :  // Medium
              emotionalState === "sad" ? 0.9 :       // Low
              emotionalState === "confused" ? 1.4 :  // Medium with variation
              1.3                                    // Default
            }
            radius={0.5}                             // Focused radius for accent features
          />
          
          {/* High-energy bloom layer - only for high-energy emotional states */}
          {(emotionalState === "alert" || emotionalState === "happy" || emotionalState === "confused") && (
            <ThreeBloom
              blendMode="add"  // Fixed to add to avoid dynamic blend mode errors
              luminanceThreshold={
                emotionalState === "alert" ? 0.9 :      // Very selective for highest intensity points
                emotionalState === "happy" ? 0.88 :     // Slightly more inclusive
                emotionalState === "confused" ? 0.92 :  // Very selective with erratic pattern
                0.9                                     // Default
              }
              luminanceSmoothing={
                emotionalState === "alert" ? 0.4 :      // Low smoothing - sharp, intense points
                emotionalState === "happy" ? 0.6 :      // Medium - softer points
                emotionalState === "confused" ? 0.3 :   // Very low - erratic points
                0.5                                     // Default
              }
              height={200}                              // Lower resolution for optimization
              opacity={
                emotionalState === "alert" ? 0.4 :      // High opacity for intense points
                emotionalState === "happy" ? 0.35 :     // Medium-high
                emotionalState === "confused" ? 0.25 :  // Medium-low
                0.3                                     // Default
              }
              intensity={
                emotionalState === "alert" ? 2.0 :      // Maximum intensity for alert
                emotionalState === "happy" ? 1.9 :      // Very high for happy
                emotionalState === "confused" ? 1.7 :   // High but erratic for confused
                1.8                                     // Default
              }
              radius={
                emotionalState === "alert" ? 0.3 :      // Very focused for alert - sharp points
                emotionalState === "happy" ? 0.4 :      // Slightly wider for happy - soft points
                emotionalState === "confused" ? 0.35 :  // Medium-focused for confused
                0.35                                    // Default
              }
            />
          )}
          
          {/* Ultra-fine detail bloom for eyes and energy core - based on emotional state */}
          <ThreeBloom
            // Removed blendMode property to fix "getShaderCode is not a function" error
            luminanceThreshold={0.95}                   // Very high threshold - only brightest elements
            luminanceSmoothing={0.2}                    // Low smoothing - sharp details
            height={150}                                // Low resolution for optimization
            opacity={
              emotionalState === "alert" ? 0.6 :       // Very high for alert - intense eye glow
              emotionalState === "happy" ? 0.5 :       // High for happy - bright eyes
              emotionalState === "thinking" ? 0.4 :    // Medium-high for thinking - focused eye glow
              emotionalState === "sad" ? 0.2 :         // Low for sad - dim eyes
              emotionalState === "confused" ? 0.35 :   // Medium-low for confused - inconsistent
              0.4                                      // Default
            }
            intensity={
              emotionalState === "alert" ? 2.5 :       // Maximum for alert - extremely bright highlights
              emotionalState === "happy" ? 2.2 :       // Very high for happy - radiant highlights
              emotionalState === "thinking" ? 1.8 :    // High for thinking - focused highlights
              emotionalState === "sad" ? 1.2 :         // Medium-low for sad - subtle highlights
              emotionalState === "confused" ? 2.0 :    // High but irregular for confused
              1.8                                      // Default
            }
            radius={0.2}                               // Very tight radius - pinpoint highlights
          />
          
          {/* Enhanced chromatic aberration with sophisticated emotion-responsive physics */}
          <ThreeChromaticAberration
            // Remove blendMode to fix "getShaderCode is not a function" error
            offset={[
              // X-axis offset - horizontal separation of RGB channels
              emotionalState === "alert" ? 0.0025 : // Maximum for alert - urgent visual cue
              emotionalState === "happy" ? 0.0015 : // Moderate for happy - pleasant energy
              emotionalState === "thinking" ? 0.0008 : // Minimal for thinking - clarity of thought
              emotionalState === "sad" ? 0.0004 : // Very minimal for sad - emotional restraint
              emotionalState === "confused" ? 0.0022 : // Strong for confused - perceptual distortion
              0.001, // Default x offset
              
              // Y-axis offset - vertical separation creates more dramatic visual effect
              emotionalState === "alert" ? 0.003 : // Extreme for alert - attention-grabbing warning
              emotionalState === "happy" ? 0.0018 : // Moderate for happy - uplifting positivity 
              emotionalState === "thinking" ? 0.001 : // Subtle for thinking - focused precision
              emotionalState === "sad" ? 0.0005 : // Minimal for sad - subdued emotion
              emotionalState === "confused" ? 0.0025 : // Strong for confused - cognitive dissonance
              0.0012 // Default y offset
            ]}
            radialModulation={
              // Radial modulation creates lens-like effect that increases toward the edges
              emotionalState === "alert" || 
              emotionalState === "confused" || 
              emotionalState === "happy" // Added for happy to enhance positive emotional impact
            }
            modulationOffset={
              // Controls the intensity of the radial distortion pattern
              emotionalState === "alert" ? 0.95 : // Maximum for alert - urgent visual distortion
              emotionalState === "happy" ? 0.6 : // Moderate for happy - pleasant enhancement
              emotionalState === "thinking" ? 0.4 : // Subtle for thinking - minimal distraction
              emotionalState === "sad" ? 0.3 : // Minimal for sad - emotional distance
              emotionalState === "confused" ? 0.85 : // Strong for confused - perceptual uncertainty
              0.5 // Default modulation
            }
          />
          
          {/* Cinematic film grain with precise emotion-driven visual styling and physically accurate parameters */}
          <ThreeNoise 
            // Remove blendMode to fix "getShaderCode is not a function" error
            opacity={
              // Precise opacity values create specific atmospheric moods reflecting emotional states
              emotionalState === "alert" ? 0.042 :       // High for alert - heightened visual intensity for danger perception
              emotionalState === "happy" ? 0.018 :       // Low for happy - clean, vibrant, joyful image clarity
              emotionalState === "thinking" ? 0.026 :    // Moderate for thinking - subtle analytical texture that enhances focus
              emotionalState === "sad" ? 0.052 :         // High for sad - vintage film look creating melancholic atmosphere
              emotionalState === "confused" ? 0.062 :    // Maximum for confused - extreme visual noise representing cognitive static
              0.025                                      // Default - balanced standard grain
            } 
            premultiply={
              // Premultiply affects how the noise blends with underlying colors
              // Creates different visual signatures for emotional states
              emotionalState === "happy" || 
              emotionalState === "thinking" ||
              emotionalState === "neutral"               // Only use premultiply for positive/neutral states
            }                           
            frameRate={
              // Frame rate controls the temporal frequency of grain pattern changes
              // Creates a more authentic film-like appearance at different emotional intensities
              emotionalState === "alert" ? 30 :          // Higher for alert - modern digital clarity
              emotionalState === "happy" ? 24 :          // Classic film rate for happy - nostalgic warmth
              emotionalState === "thinking" ? 24 :       // Standard film rate for thinking - balanced cognitive state
              emotionalState === "sad" ? 18 :            // Lower rate for sad - dreamlike, heavy emotional weight
              emotionalState === "confused" ? 16 :       // Lowest rate for confused - stuttering perceptual uncertainty
              24                                         // Default cinematic frame rate
            }
          />
          
          {/* Advanced physically accurate depth of field with cinematic quality and emotion-responsive visual physics */}
          <ThreeDepthOfField
            focusDistance={
              // Precise control over focal plane distance with physically accurate values
              emotionalState === "thinking" ? 0.022 :    // Pinpoint focus for thinking - analytical precision focus
              emotionalState === "confused" ? 0.014 :    // Unstable focus for confused - cognitive struggle 
              emotionalState === "alert" ? 0.018 :       // Sharp tactical focus for alert - survival-oriented clarity
              emotionalState === "happy" ? 0.020 :       // Balanced focus for happy - present-moment engagement
              emotionalState === "sad" ? 0.026 :         // Distant focus for sad - emotional detachment, withdrawal
              0.020                                      // Default - standard balanced focus
            }
            focalLength={
              // Controls the range of distances that appear in focus (smaller = more in focus)
              emotionalState === "alert" ? 0.015 :       // Very sharp for alert - hypervigilant clarity
              emotionalState === "happy" ? 0.022 :       // Moderately sharp for happy - positive clarity with aesthetic softness
              emotionalState === "thinking" ? 0.028 :    // Moderate focus for thinking - selective attention
              emotionalState === "sad" ? 0.045 :         // Very soft focus for sad - dreamlike emotional distance
              emotionalState === "confused" ? 0.035 :    // Inconsistent focus for confused - perceptual uncertainty
              0.025                                      // Default - balanced cinematic focus
            }
            // First bokehScale param removed to avoid duplicate properties
            // This is handled by the second bokehScale parameter below
            // Higher resolution and advanced cinematic settings for premium visual quality
            height={720}                                 // Higher resolution for more precise depth mapping (720p)
            width={1280}                                 // Widescreen aspect (16:9) for cinematic presentation
            // maxBlur property converted to bokehScale for compatibility
            // ThreeDepthOfField doesn't accept maxBlur directly, so we use bokehScale instead
            // with values scaled appropriately to achieve similar visual effect
            bokehScale={
              // Controls the intensity of the bokeh blur effect (uses bokehScale instead of maxBlur)
              emotionalState === "alert" ? 2.0 :         // Lower for alert - maintain tactical awareness
              emotionalState === "happy" ? 3.5 :         // Medium for happy - pleasant bokeh without excessive blur
              emotionalState === "thinking" ? 2.5 :      // Moderate for thinking - reduce visual distractions
              emotionalState === "sad" ? 5.0 :           // Very high for sad - extreme dreamlike isolation
              emotionalState === "confused" ? 4.0 :      // High for confused - perceptual disorientation
              3.0                                        // Default - balanced cinematic blur
            }
          />
        </ThreeEffectComposer>
      )}
    </ThreeCanvas>
  );
};

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
  size?: ComponentSize;
  showText?: boolean;
  animate?: boolean;
  showParticles?: ParticleDisplay;
  animationSequence?: string | null;
  hologramText?: string | null;
  interactive?: boolean;
  emotionalState?: EmotionalState;
  onAnimationComplete?: () => void;
  onInteraction?: (type: string) => void;
  highQuality?: boolean;
}

// Base component implementation
const AstroBotMascot3DBase: React.FC<AstroBotMascot3DProps> = ({
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
}) => {
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

  // Mouse interaction handlers
  const handleMouseEnter = () => {
    setHovering(true);
    if (onInteraction) onInteraction("hover_start");
  };

  const handleMouseLeave = () => {
    setHovering(false);
    if (onInteraction) onInteraction("hover_end");
  };

  // Performance settings based on quality option, safely calculated for SSR
  // Avoiding window reference during server-side rendering
  const performanceSettings = useMemo(() => {
    // Base quality settings that don't depend on window
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

  // Use a client-side effect to handle mounting and animation
  const [isMounted, setIsMounted] = useState(false);
  
  // Only mount the 3D components on the client to avoid hydration mismatch
  useEffect(() => {
    // Use requestAnimationFrame to ensure we're in a browser environment
    const timeout = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    
    return () => {
      cancelAnimationFrame(timeout);
    };
  }, []);
  
  return (
    <div
      style={{ width: dimensions.width, height: dimensions.height, position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="robot-container"
    >
      {!isMounted ? (
        <Fallback />
      ) : (
        <Suspense fallback={<Fallback />}>
          <ThreeJsErrorBoundary>
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
            />
          </ThreeJsErrorBoundary>
        </Suspense>
      )}
      
      {/* Optional text display */}
      {showText && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-center font-mono text-blue-400">
          <span>{currentSequence || "idle"}</span>
        </div>
      )}
    </div>
  );
};

// Define interface for RobotModel props using the EmotionalState type
interface RobotModelProps {
  currentSequence: string | null;
  emotionalState: EmotionalState;
  showParticles: "none" | "temporary" | "typing" | "intense" | string;
  hologramText: string | null;
  animate: boolean;
  onAnimationComplete?: () => void;
}

// Robot model component (placeholder - would be replaced with actual GLTF model)
const RobotModel: React.FC<RobotModelProps> = ({ 
  currentSequence, 
  emotionalState, 
  showParticles, 
  hologramText, 
  animate, 
  onAnimationComplete 
}) => {
  const group = useRef<THREE.Group>(null);
  
  // Time updates are now handled by the RobotTimeKeeper component
  // This ensures only one component is responsible for time updates
  
  // Robot colors based on emotional state
  const colors = useMemo(() => {
    const baseColors = {
      body: new THREE.Color("#F0F2F5"),
      joints: new THREE.Color("#9CA3AF"),
      accent: new THREE.Color("#3B82F6"),
      eyes: new THREE.Color("#10B981"),
      energyCore: new THREE.Color("#3B82F6"),
    };
    
    // Modify colors based on emotional state
    switch(emotionalState) {
      case "happy":
        return {
          ...baseColors,
          eyes: new THREE.Color("#34D399"),
          energyCore: new THREE.Color("#60A5FA"),
        };
      case "thinking":
        return {
          ...baseColors,
          eyes: new THREE.Color("#0EA5E9"),
          accent: new THREE.Color("#6366F1"),
        };
      case "alert":
        return {
          ...baseColors,
          eyes: new THREE.Color("#F59E0B"),
          accent: new THREE.Color("#EF4444"),
          energyCore: new THREE.Color("#F87171"),
        };
      case "sad":
        return {
          ...baseColors,
          eyes: new THREE.Color("#6B7280"),
          energyCore: new THREE.Color("#93C5FD"),
          accent: new THREE.Color("#4B5563"),
        };
      case "confused":
        return {
          ...baseColors,
          eyes: new THREE.Color("#8B5CF6"),
          energyCore: new THREE.Color("#A78BFA"),
        };
      default:
        return baseColors;
    }
  }, [emotionalState]);
  
  // Animation timing
  useFrame(() => {
    if (!animate || !group.current) return;
    
    // Use global time reference for consistent animations across components
    const time = globalTimeRef.current.value;
    
    // Advanced physics-based animation with spring-mass-damper system
    // Using dampened sine waves for organic, natural feel
    const breathingRate = 0.5; // Base breathing frequency
    const breathingAmplitude = 0.03; // Base breathing amplitude
    
    // Apply emotional modifiers to breathing
    const emotionalBreathingModifiers = {
      "alert": { rate: 0.7, amplitude: 0.025 },   // Faster, shallower breaths - alert/nervous
      "happy": { rate: 0.6, amplitude: 0.04 },    // Deeper, relaxed breaths - content
      "thinking": { rate: 0.45, amplitude: 0.035 }, // Slow, deliberate breaths - focused
      "confused": { rate: 0.65, amplitude: 0.035, irregularity: 0.2 }, // Slightly irregular - unsure
      "sad": { rate: 0.4, amplitude: 0.045 },     // Deep, slow breaths - melancholy
      "neutral": { rate: 0.5, amplitude: 0.03 }   // Baseline breathing
    };
    
    // Get modifiers for current emotional state or use neutral as fallback
    const breathMod = emotionalBreathingModifiers[emotionalState] || emotionalBreathingModifiers.neutral;
    
    // Apply breathing to torso with subtle emotional variations
    const breathValue = Math.sin(time * breathMod.rate) * breathMod.amplitude;
    
    // Create small random micro-movements for added realism
    // Using deterministic noise based on time for consistent behavior
    const microMovementX = Math.sin(time * 0.6 + 0.1) * 0.005;
    const microMovementZ = Math.sin(time * 0.5 + 0.3) * 0.005;
    
    // Apply breathing and micro-movements to the main group
    group.current.position.y = breathValue;
    group.current.rotation.x = microMovementX;
    group.current.rotation.z = microMovementZ;
    
    // Find body components for more precise animations
    // Using safer type casting and null checks to avoid crashes
    const headGroup = group.current.children.find((child, i) => i === 0) as THREE.Group;
    const torsoGroup = group.current.children.find((child, i) => i === 1) as THREE.Group;
    const rightArmGroup = group.current.children.find((child, i) => i === 2) as THREE.Group;
    const leftArmGroup = group.current.children.find((child, i) => i === 3) as THREE.Group;
    const lowerBodyGroup = group.current.children.find((child, i) => i === 4) as THREE.Group;
    
    // Apply emotional modifiers to idle pose
    if (emotionalState === "alert") {
      // Alert: slightly raised head, prepared stance
      if (headGroup) headGroup.rotation.x = -0.1 + microMovementX * 2;
      if (torsoGroup) torsoGroup.rotation.x = -0.05;
    } 
    else if (emotionalState === "sad") {
      // Sad: head tilted down, slumped shoulders
      if (headGroup) headGroup.rotation.x = 0.15;
      if (torsoGroup) torsoGroup.rotation.x = 0.05;
      if (rightArmGroup) rightArmGroup.rotation.x = 0.1;
      if (leftArmGroup) leftArmGroup.rotation.x = 0.1;
    }
    else if (emotionalState === "thinking") {
      // Thinking: head slightly tilted, hand near face
      if (headGroup) headGroup.rotation.z = Math.sin(time * 0.2) * 0.05 + 0.1;
      if (rightArmGroup) rightArmGroup.rotation.z = 0.4;
    }
    else if (emotionalState === "confused") {
      // Confused: slight head tilt, asymmetric posture
      if (headGroup) headGroup.rotation.z = Math.sin(time * 0.3) * 0.1;
      if (headGroup) headGroup.rotation.y = Math.sin(time * 0.25) * 0.05;
    }
    else if (emotionalState === "happy") {
      // Happy: slight head tilt up, open posture
      if (headGroup) headGroup.rotation.x = -0.05 + Math.sin(time * 0.6) * 0.03;
      if (torsoGroup) torsoGroup.rotation.x = -0.03;
    }
    
    // Different animations based on current sequence, now with full body coordination
    switch(currentSequence) {
      case ANIMATION_SEQUENCES.IDLE:
        // Use the emotional idle poses defined above
        break;
        
      case ANIMATION_SEQUENCES.GREETING:
        // Natural wave animation with whole arm articulation
        if (rightArmGroup) {
          // Shoulder movement
          rightArmGroup.rotation.z = Math.sin(time * 3) * 0.15 + 0.2;
          
          // Find elbow and hand components
          const elbow = rightArmGroup.children.find((child, i) => i === 2);
          const wrist = rightArmGroup.children.find((child, i) => i === 4);
          
          // Coordinated elbow and wrist movement
          if (elbow) elbow.rotation.z = Math.sin(time * 3) * 0.3 - 0.2;
          if (wrist) wrist.rotation.z = Math.sin(time * 3 + 0.3) * 0.2;
        }
        // Subtly turn body toward greeting direction
        group.current.rotation.y = Math.sin(time * 0.5) * 0.1;
        break;
        
      case ANIMATION_SEQUENCES.WAVE:
        // More energetic wave with full arm articulation
        if (rightArmGroup) {
          // Shoulder raises higher
          rightArmGroup.rotation.z = Math.sin(time * 4) * 0.2 + 0.3;
          rightArmGroup.rotation.y = -0.2;
          
          // Find elbow and hand components
          const elbow = rightArmGroup.children.find((child, i) => i === 2);
          const wrist = rightArmGroup.children.find((child, i) => i === 4);
          
          // Energetic elbow and wrist movement
          if (elbow) elbow.rotation.z = Math.sin(time * 4) * 0.4 - 0.3;
          if (wrist) wrist.rotation.z = Math.sin(time * 4 + 0.4) * 0.3;
        }
        // More pronounced body turning toward wave direction
        group.current.rotation.y = Math.sin(time * 0.5) * 0.15 + 0.1;
        break;
        
      case ANIMATION_SEQUENCES.THINK:
        // Sophisticated thinking pose with hand-to-chin gesture
        if (headGroup) {
          // Thoughtful head tilt
          headGroup.rotation.z = Math.sin(time * 0.8) * 0.08 + 0.1;
          headGroup.rotation.x = -0.05;
        }
        
        if (rightArmGroup) {
          // Arm raised toward chin
          rightArmGroup.rotation.z = 0.5;
          rightArmGroup.rotation.x = 0.2;
          
          // Hand positioned near chin
          const wrist = rightArmGroup.children.find((child, i) => i === 4);
          if (wrist) wrist.rotation.z = 0.5;
        }
        break;
        
      case ANIMATION_SEQUENCES.SURPRISED:
        // Full-body surprise reaction with physics-based follow-through
        if (headGroup) {
          // Head jerks back slightly
          headGroup.position.z = -0.02 - Math.sin(time * 5) * 0.01;
          headGroup.rotation.x = -0.2 - Math.sin(time * 5) * 0.05;
        }
        
        // Subtle torso recoil with dampening
        if (torsoGroup) {
          torsoGroup.position.z = -0.01 - Math.sin(time * 5 + 0.1) * 0.005;
          torsoGroup.rotation.x = -0.05 - Math.sin(time * 5 + 0.1) * 0.02;
        }
        
        // Arms move slightly outward in surprise
        if (rightArmGroup) rightArmGroup.rotation.z = 0.1 + Math.sin(time * 5 + 0.2) * 0.05;
        if (leftArmGroup) leftArmGroup.rotation.z = -0.1 - Math.sin(time * 5 + 0.2) * 0.05;
        
        break;
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]} dispose={null}>
      {/* Temporary robot representation using basic geometries */}
      {/* Would be replaced with proper GLTF model */}
      
      {/* ------ REALISTIC HUMANOID ANDROID DESIGN ------ */}
      
      {/* Head - Realistic humanoid shape with natural proportions */}
      <group position={[0, 0.98, 0]} scale={[1, 1, 1]}>
        {/* Cranium - Sculpted human-like head with subtle tech details */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.13, 32, 24]} />
          <meshPhysicalMaterial 
            color={colors.body} 
            metalness={0.85} 
            roughness={0.2} 
            clearcoat={0.5}
            clearcoatRoughness={0.3}
            reflectivity={0.8}
          />
        </mesh>
        
        {/* Face plate - Slightly different material to create facial structure */}
        <mesh position={[0, -0.02, 0.07]} castShadow receiveShadow>
          <sphereGeometry args={[0.12, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshPhysicalMaterial 
            color={colors.body} 
            metalness={0.8} 
            roughness={0.3}
            clearcoat={0.4}
            reflectivity={0.7}
          />
        </mesh>
        
        {/* Advanced articulated eyes with glowing iris and dynamic pupil */}
        <group position={[0.04, 0.02, 0.1]}>
          {/* Eye socket */}
          <mesh position={[0, 0, 0.005]} castShadow receiveShadow>
            <sphereGeometry args={[0.025, 16, 16, 0, Math.PI * 2, 0, Math.PI]} />
            <meshStandardMaterial color={colors.joints} metalness={0.9} roughness={0.2} />
          </mesh>
          
          {/* Eyeball - White sclera portion */}
          <mesh position={[0, 0, 0.01]} castShadow receiveShadow>
            <sphereGeometry args={[0.022, 16, 16]} />
            <meshStandardMaterial color={'#f5f5f5'} metalness={0.2} roughness={0.3} />
          </mesh>
          
          {/* Iris with glowing emissive material */}
          <mesh position={[0, 0, 0.022]} castShadow>
            <circleGeometry args={[0.012, 16]} />
            <meshStandardMaterial
              color={colors.eyes}
              emissive={colors.eyes}
              emissiveIntensity={1.2}
              toneMapped={false}
            />
          </mesh>
          
          {/* Pupil - Dynamic size based on emotional state */}
          <mesh position={[0, 0, 0.023]} castShadow>
            <circleGeometry args={[
              emotionalState === "alert" ? 0.006 : 
              emotionalState === "thinking" ? 0.005 :
              emotionalState === "confused" ? 0.008 :
              emotionalState === "sad" ? 0.009 :
              emotionalState === "happy" ? 0.004 : 0.006, 
              16
            ]} />
            <meshStandardMaterial color={'#000000'} />
          </mesh>
        </group>
        
        {/* Second eye - mirrored */}
        <group position={[-0.04, 0.02, 0.1]}>
          <mesh position={[0, 0, 0.005]} castShadow receiveShadow>
            <sphereGeometry args={[0.025, 16, 16, 0, Math.PI * 2, 0, Math.PI]} />
            <meshStandardMaterial color={colors.joints} metalness={0.9} roughness={0.2} />
          </mesh>
          
          <mesh position={[0, 0, 0.01]} castShadow receiveShadow>
            <sphereGeometry args={[0.022, 16, 16]} />
            <meshStandardMaterial color={'#f5f5f5'} metalness={0.2} roughness={0.3} />
          </mesh>
          
          <mesh position={[0, 0, 0.022]} castShadow>
            <circleGeometry args={[0.012, 16]} />
            <meshStandardMaterial
              color={colors.eyes}
              emissive={colors.eyes}
              emissiveIntensity={1.2}
              toneMapped={false}
            />
          </mesh>
          
          <mesh position={[0, 0, 0.023]} castShadow>
            <circleGeometry args={[
              emotionalState === "alert" ? 0.006 : 
              emotionalState === "thinking" ? 0.005 :
              emotionalState === "confused" ? 0.008 :
              emotionalState === "sad" ? 0.009 :
              emotionalState === "happy" ? 0.004 : 0.006, 
              16
            ]} />
            <meshStandardMaterial color={'#000000'} />
          </mesh>
        </group>
        
        {/* Ear-like audio sensors */}
        <mesh position={[0.13, 0.0, 0]} rotation={[0, 0, Math.PI/2]} castShadow receiveShadow>
          <capsuleGeometry args={[0.015, 0.04, 8, 8]} />
          <meshStandardMaterial color={colors.accent} metalness={0.8} roughness={0.2} />
        </mesh>
        
        <mesh position={[-0.13, 0.0, 0]} rotation={[0, 0, -Math.PI/2]} castShadow receiveShadow>
          <capsuleGeometry args={[0.015, 0.04, 8, 8]} />
          <meshStandardMaterial color={colors.accent} metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Neck with realistic articulation */}
        <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.04, 0.06, 0.1, 16]} />
          <meshPhysicalMaterial 
            color={colors.joints} 
            metalness={0.9} 
            roughness={0.3}
            clearcoat={0.2}
          />
        </mesh>
      </group>
      
      {/* Torso - Realistic human proportions with visible tech elements */}
      <group position={[0, 0.6, 0]}>
        {/* Upper torso/chest with pectoral definition */}
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.28, 0.2, 0.16]} />
          <meshPhysicalMaterial 
            color={colors.body} 
            metalness={0.85} 
            roughness={0.25}
            clearcoat={0.4}
            clearcoatRoughness={0.2}
          />
          <Edges scale={1.01} threshold={15} color={safeGetHex(colors.accent)} />
        </mesh>
        
        {/* Abdominal section with segmentation for natural articulation */}
        <mesh position={[0, -0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.25, 0.25, 0.14]} />
          <meshPhysicalMaterial 
            color={colors.body} 
            metalness={0.85} 
            roughness={0.25}
            clearcoat={0.4}
            clearcoatRoughness={0.2}
          />
        </mesh>
        
        {/* Spinal structure (visible from behind) */}
        <mesh position={[0, 0.05, -0.06]} rotation={[Math.PI/12, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
          <meshStandardMaterial color={colors.joints} metalness={0.9} roughness={0.2} />
        </mesh>
        
        {/* Energy Core - Central reactor with pulsing glow */}
        <mesh position={[0, 0.05, 0.09]} castShadow>
          <sphereGeometry args={[0.06, 32, 32]} />
          <meshPhysicalMaterial
            color={colors.energyCore}
            emissive={colors.energyCore}
            emissiveIntensity={
              emotionalState === "alert" ? 1.5 :
              emotionalState === "happy" ? 1.3 :
              emotionalState === "thinking" ? 1.0 :
              emotionalState === "confused" ? 0.8 + Math.sin(globalTimeRef.current.value * 5) * 0.5 :
              emotionalState === "sad" ? 0.7 : 1.0
            }
            toneMapped={false}
            transparent={true}
            opacity={0.9}
            clearcoat={0.8}
            clearcoatRoughness={0.1}
            transmission={0.2}
            thickness={1}
          />
        </mesh>
        
        {/* Energy conduits radiating from core */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh 
            key={i} 
            position={[
              Math.sin(i * Math.PI/3) * 0.1, 
              0.05 + Math.cos(i * Math.PI/3) * 0.1, 
              0.05
            ]} 
            scale={[0.01, 0.01, 0.08]}
            castShadow
          >
            <boxGeometry />
            <meshStandardMaterial
              color={colors.energyCore}
              emissive={colors.energyCore}
              emissiveIntensity={0.7}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
      
      {/* Arms with natural articulation and anatomical structure */}
      {/* Right Arm */}
      <group position={[0.17, 0.75, 0]}>
        {/* Shoulder joint */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={colors.joints} metalness={0.9} roughness={0.2} />
        </mesh>
        
        {/* Upper arm */}
        <mesh position={[0.07, -0.1, 0]} rotation={[0, 0, 0.2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.04, 0.035, 0.2, 16]} />
          <meshPhysicalMaterial 
            color={colors.body} 
            metalness={0.85} 
            roughness={0.25}
            clearcoat={0.4}
          />
        </mesh>
        
        {/* Elbow joint */}
        <mesh position={[0.14, -0.2, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial color={colors.joints} metalness={0.9} roughness={0.2} />
        </mesh>
        
        {/* Forearm with visible tech details */}
        <mesh position={[0.18, -0.32, 0]} rotation={[0, 0, 0.3]} castShadow receiveShadow>
          <cylinderGeometry args={[0.03, 0.035, 0.2, 16]} />
          <meshPhysicalMaterial 
            color={colors.body} 
            metalness={0.85} 
            roughness={0.25}
            clearcoat={0.3}
          />
        </mesh>
        
        {/* Wrist joint */}
        <mesh position={[0.23, -0.42, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshStandardMaterial color={colors.joints} metalness={0.9} roughness={0.2} />
        </mesh>
        
        {/* Hand with articulated fingers */}
        <group position={[0.25, -0.48, 0]}>
          {/* Palm */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.04, 0.07, 0.02]} />
            <meshPhysicalMaterial 
              color={colors.body} 
              metalness={0.85} 
              roughness={0.3}
            />
          </mesh>
          
          {/* Fingers */}
          {[0, 1, 2, 3].map((i) => (
            <group key={i} position={[(i-1.5) * 0.01, -0.05, 0]} rotation={[0, 0, -0.3]}>
              <mesh position={[0, -0.02, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.008, 0.04, 0.01]} />
                <meshStandardMaterial color={colors.body} metalness={0.85} roughness={0.3} />
              </mesh>
              <mesh position={[0, -0.05, 0]} rotation={[0, 0, 0.4]} castShadow receiveShadow>
                <boxGeometry args={[0.007, 0.02, 0.008]} />
                <meshStandardMaterial color={colors.body} metalness={0.85} roughness={0.3} />
              </mesh>
            </group>
          ))}
          
          {/* Thumb */}
          <group position={[0.025, -0.03, 0]} rotation={[0, 0, 0.7]}>
            <mesh position={[0, -0.015, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.008, 0.03, 0.01]} />
              <meshStandardMaterial color={colors.body} metalness={0.85} roughness={0.3} />
            </mesh>
          </group>
        </group>
      </group>
      
      {/* Left Arm - mirrored from right */}
      <group position={[-0.17, 0.75, 0]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={colors.joints} metalness={0.9} roughness={0.2} />
        </mesh>
        
        <mesh position={[-0.07, -0.1, 0]} rotation={[0, 0, -0.2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.04, 0.035, 0.2, 16]} />
          <meshPhysicalMaterial 
            color={colors.body} 
            metalness={0.85} 
            roughness={0.25}
            clearcoat={0.4}
          />
        </mesh>
        
        <mesh position={[-0.14, -0.2, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial color={colors.joints} metalness={0.9} roughness={0.2} />
        </mesh>
        
        <mesh position={[-0.18, -0.32, 0]} rotation={[0, 0, -0.3]} castShadow receiveShadow>
          <cylinderGeometry args={[0.03, 0.035, 0.2, 16]} />
          <meshPhysicalMaterial 
            color={colors.body} 
            metalness={0.85} 
            roughness={0.25}
            clearcoat={0.3}
          />
        </mesh>
        
        <mesh position={[-0.23, -0.42, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshStandardMaterial color={colors.joints} metalness={0.9} roughness={0.2} />
        </mesh>
        
        <group position={[-0.25, -0.48, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.04, 0.07, 0.02]} />
            <meshPhysicalMaterial 
              color={colors.body} 
              metalness={0.85} 
              roughness={0.3}
            />
          </mesh>
          
          {[0, 1, 2, 3].map((i) => (
            <group key={i} position={[-(i-1.5) * 0.01, -0.05, 0]} rotation={[0, 0, 0.3]}>
              <mesh position={[0, -0.02, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.008, 0.04, 0.01]} />
                <meshStandardMaterial color={colors.body} metalness={0.85} roughness={0.3} />
              </mesh>
              <mesh position={[0, -0.05, 0]} rotation={[0, 0, -0.4]} castShadow receiveShadow>
                <boxGeometry args={[0.007, 0.02, 0.008]} />
                <meshStandardMaterial color={colors.body} metalness={0.85} roughness={0.3} />
              </mesh>
            </group>
          ))}
          
          <group position={[-0.025, -0.03, 0]} rotation={[0, 0, -0.7]}>
            <mesh position={[0, -0.015, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.008, 0.03, 0.01]} />
              <meshStandardMaterial color={colors.body} metalness={0.85} roughness={0.3} />
            </mesh>
          </group>
        </group>
      </group>
      
      {/* Lower Body - Hips and articulated legs */}
      <group position={[0, 0.35, 0]}>
        {/* Hip structure */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.24, 0.12, 0.14]} />
          <meshPhysicalMaterial 
            color={colors.body} 
            metalness={0.85} 
            roughness={0.25}
            clearcoat={0.3}
          />
        </mesh>
        
        {/* Leg joints and structure - Right Leg */}
        <group position={[0.08, 0, 0]}>
          {/* Hip joint */}
          <mesh position={[0, -0.07, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color={colors.joints} metalness={0.9} roughness={0.2} />
          </mesh>
          
          {/* Thigh with anatomical shape */}
          <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.05, 0.04, 0.25, 16]} />
            <meshPhysicalMaterial 
              color={colors.body} 
              metalness={0.85} 
              roughness={0.25}
              clearcoat={0.3}
            />
          </mesh>
          
          {/* Knee joint with mechanical details */}
          <mesh position={[0, -0.35, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color={colors.joints} metalness={0.9} roughness={0.2} />
          </mesh>
          
          {/* Lower leg/calf with tech enhancements */}
          <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.04, 0.035, 0.25, 16]} />
            <meshPhysicalMaterial 
              color={colors.body} 
              metalness={0.85} 
              roughness={0.25}
              clearcoat={0.3}
            />
          </mesh>
          
          {/* Ankle joint */}
          <mesh position={[0, -0.65, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshStandardMaterial color={colors.joints} metalness={0.9} roughness={0.2} />
          </mesh>
          
          {/* Foot with arch and articulated design */}
          <mesh position={[0, -0.69, 0.04]} castShadow receiveShadow>
            <boxGeometry args={[0.06, 0.04, 0.14]} />
            <meshPhysicalMaterial 
              color={colors.body} 
              metalness={0.85} 
              roughness={0.35}
            />
          </mesh>
        </group>
        
        {/* Left Leg - mirrored */}
        <group position={[-0.08, 0, 0]}>
          <mesh position={[0, -0.07, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color={colors.joints} metalness={0.9} roughness={0.2} />
          </mesh>
          
          <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.05, 0.04, 0.25, 16]} />
            <meshPhysicalMaterial 
              color={colors.body} 
              metalness={0.85} 
              roughness={0.25}
              clearcoat={0.3}
            />
          </mesh>
          
          <mesh position={[0, -0.35, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color={colors.joints} metalness={0.9} roughness={0.2} />
          </mesh>
          
          <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.04, 0.035, 0.25, 16]} />
            <meshPhysicalMaterial 
              color={colors.body} 
              metalness={0.85} 
              roughness={0.25}
              clearcoat={0.3}
            />
          </mesh>
          
          <mesh position={[0, -0.65, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshStandardMaterial color={colors.joints} metalness={0.9} roughness={0.2} />
          </mesh>
          
          <mesh position={[0, -0.69, 0.04]} castShadow receiveShadow>
            <boxGeometry args={[0.06, 0.04, 0.14]} />
            <meshPhysicalMaterial 
              color={colors.body} 
              metalness={0.85} 
              roughness={0.35}
            />
          </mesh>
        </group>
      </group>
      
      {/* Particles if enabled with emotion-responsive behaviors */}
      {showParticles !== "none" && (
        <ParticleSystem 
          intensity={showParticles === "intense" ? 2 : showParticles === "typing" ? 1.5 : 1}
          color={colors.accent}
          emotionalState={emotionalState}
        />
      )}
      
      {/* Emotion-responsive hologram projection if enabled */}
      {hologramText && (
        <HologramProjection 
          text={hologramText} 
          color={colors.accent} 
          emotionalState={emotionalState}
        />
      )}
    </group>
  );
};

// Particle system component
// Using standardized ParticleType imported from types.ts

// Enhanced particle interface with additional properties for visual effects
interface Particle {
  position: [number, number, number];
  size: number;
  speed: number;
  type: ParticleType;
  color?: THREE.Color;
  opacity: number;
  isHighActivity?: boolean;
}

// Define interface for ParticleSystem props with enhanced emotion response
interface ParticleSystemProps {
  intensity: number;
  color: THREE.Color | string | number;
  emotionalState?: EmotionalState;
  particleScale?: number; // Overall particle size multiplier
  particleSpeed?: number; // Overall particle speed multiplier
  particleTypes?: ('energy' | 'orbit' | 'data' | 'ambient')[]; // Allowed particle types
}

// Advanced emotion-responsive particle system with neuromorphic behavior patterns
// This system simulates synthetic emotional expressions through emergent visual patterns
const ParticleSystem: React.FC<ParticleSystemProps> = ({ 
  intensity = 1, 
  color,
  emotionalState = "neutral",
  particleScale = 1.0,
  particleSpeed = 1.0,
  particleTypes = ['energy', 'orbit', 'data', 'ambient']
}) => {
  const particles = useMemo(() => {
    // Dynamically adjust particle count based on emotional state
    // These values are calibrated to create perceptually distinct visual signatures 
    // for each emotional state while maintaining system performance
    const emotionParticleMap = {
      "alert": 30,    // High particle count creates urgent, active appearance
      "happy": 25,    // Moderate-high count for lively but not overwhelming effect
      "thinking": 20, // Balanced count for focused, deliberate appearance
      "confused": 22, // Slightly erratic count suggesting cognitive dissonance
      "sad": 15,      // Reduced count creating sparse, subdued appearance
      "neutral": 20   // Baseline reference count for standard operation
    };
    
    // Get the base count from our emotion map or use neutral as fallback
    const baseCount = emotionParticleMap[emotionalState] || emotionParticleMap.neutral;
    
    // Scale by intensity and ensure integer value
    const particleCount = Math.floor(baseCount * intensity);
    
    // Create the array of particles with emotion-specific properties
    return Array.from({ length: particleCount }).map((_, i): Particle => {
      // Base positioning with deterministic randomization
      // Using particle index for stable SSR and consistent positions
      const basePosition: [number, number, number] = [
        (safeRandom(i * 3) - 0.5) * 0.5,
        (safeRandom(i * 3 + 1) - 0.5) * 0.5 + 0.5,
        (safeRandom(i * 3 + 2) - 0.5) * 0.5
      ];
      
      // Determine particle type with emotion-influenced distribution
      // Using deterministic randomness for stable SSR
      let particleType: ParticleType;
      
      // Seed based on particle index for deterministic selection
      const typeSeed = i * 10;
      
      // Define particle type distribution maps for each emotional state
      // These distributions create distinct visual patterns characteristic of each emotion
      const emotionParticleDistributions = {
        "alert": {
          // Alert state features many high-energy, rapidly moving particles
          // Creates a sense of urgency, attention, and heightened activity
          energy: 0.60,   // High energy particles dominate - rapid, bright 
          orbit: 0.30,    // Moderate orbital patterns - structured movement
          data: 0.10,     // Few data particles - focused information 
          ambient: 0.00   // No ambient particles - all activity is purposeful
        },
        "happy": {
          // Happy state has colorful, actively moving particles with gentle orbits
          // Creates a sense of harmonious activity and positive movement
          energy: 0.40,   // Moderate energy - friendly, active appearance
          orbit: 0.40,    // Equally balanced with orbits - harmonious cycles
          data: 0.15,     // Some data particles - organized information
          ambient: 0.05   // Few ambient particles - slight dreamy quality
        },
        "thinking": {
          // Thinking state emphasizes data particles with precise movements
          // Creates a sense of careful processing and information analysis
          energy: 0.25,   // Reduced energy - focused rather than excited
          orbit: 0.25,    // Some orbital patterns - structured thought
          data: 0.45,     // Data dominates - analytical processing
          ambient: 0.05   // Minimal ambient - mind is clear and focused
        },
        "confused": {
          // Confused state has unpredictable mix with erratic movements
          // Creates a sense of uncertainty and cognitive dissonance
          energy: 0.20,   // Less directed energy - efforts scattered
          orbit: 0.20,    // Fewer stable orbits - disrupted patterns
          data: 0.30,     // Moderate data - attempting to process
          ambient: 0.30   // High ambient - unclear perceptions
        },
        "sad": {
          // Sad state has slow, ambient particles with minimal energy
          // Creates a sense of introspection and emotional withdrawal
          energy: 0.10,   // Minimal energy - subdued emotional state
          orbit: 0.20,    // Few orbits - reduced cyclical thinking
          data: 0.30,     // Moderate data - internal reflection
          ambient: 0.40   // Mostly ambient - dreamlike, detached state
        },
        "neutral": {
          // Neutral state has balanced distribution of all particle types
          // Creates a sense of calm readiness and balanced operation
          energy: 0.30,   // Balanced energy - stable operation
          orbit: 0.30,    // Equal orbits - structured movement
          data: 0.30,     // Equal data - processing information
          ambient: 0.10   // Some ambient - open to environment
        }
      };
      
      // Get distribution for current emotional state or default to neutral
      const distribution = emotionParticleDistributions[emotionalState] || 
                          emotionParticleDistributions.neutral;
      
      // Filter available particle types based on allowed types
      const allowedTypes = Object.entries(distribution)
        .filter(([type]) => particleTypes.includes(type as ParticleType))
        .map(([type, probability]) => ({ type: type as ParticleType, probability }));
      
      // Normalize probabilities of allowed types to sum to 1
      const totalProbability = allowedTypes.reduce((sum, { probability }) => sum + probability, 0);
      const normalizedTypes = allowedTypes.map(item => ({
        ...item, 
        probability: totalProbability > 0 ? item.probability / totalProbability : 1 / allowedTypes.length
      }));
      
      // Use deterministic random selection based on cumulative probability
      const rand = safeRandom(typeSeed);
      let cumulativeProbability = 0;
      
      // Default to first type in case something goes wrong
      particleType = (normalizedTypes[0]?.type || 'energy') as ParticleType;
      
      // Select particle type based on emotion-specific probability distribution
      for (const { type, probability } of normalizedTypes) {
        cumulativeProbability += probability;
        if (rand < cumulativeProbability) {
          particleType = type;
          break;
        }
      }
      
      // Advanced emotional spatial mapping for particles
      // Each emotional state has a characteristic spatial distribution
      // that helps convey the robot's emotional state through visual pattern
      let position = [...basePosition] as [number, number, number];
      
      // Define spatial distribution parameters for each emotional state
      const emotionalSpatialMaps = {
        "alert": {
          // Alert creates expanded, vigilant space around the robot
          // Wider coverage suggests heightened awareness of surroundings
          scale: [1.3, 1.2, 1.3],      // Expanded in all directions, especially x/z planes
          offset: [0, 0.1, 0],          // Slight upward shift - alertness, attention
          distribution: 'spherical'     // Uniform coverage of surrounding space
        },
        "happy": {
          // Happy creates open, welcoming space with upward tendency
          // Suggests positivity and openness to interaction
          scale: [1.15, 1.25, 1.15],   // Expanded, especially upward
          offset: [0, 0.15, 0],         // Distinctly upward - elevating, positive
          distribution: 'elliptical'    // Slightly focused pattern
        },
        "thinking": {
          // Thinking creates forward and upward focused space
          // Suggests concentration and forward-directed thought
          scale: [1.1, 1.1, 1.2],      // Expanded forward slightly
          offset: [0, 0.05, 0.08],      // Forward bias - looking ahead, planning
          distribution: 'focused'       // More organized, directed pattern
        },
        "confused": {
          // Confused creates asymmetric, irregular space
          // Suggests disorientation and cognitive imbalance
          scale: [1.15, 1.0, 0.9],     // Asymmetrical scaling - imbalanced perception
          offset: [0.08, -0.05, -0.02], // Offset from center - confusion, disorientation
          distribution: 'chaotic'       // Less structured pattern
        },
        "sad": {
          // Sad creates downward-focused, contracted space
          // Suggests withdrawal and emotional heaviness
          scale: [0.8, 0.7, 0.8],      // Contracted in all directions - withdrawal
          offset: [0, -0.1, 0],         // Downward bias - emotional weight
          distribution: 'downward'      // Downward-focusing pattern
        },
        "neutral": {
          // Neutral creates balanced, symmetrical space
          // Suggests stability and equilibrium
          scale: [1.0, 1.0, 1.0],      // Balanced, no directional bias
          offset: [0, 0, 0],            // Centered - balanced emotional state
          distribution: 'balanced'      // Even distribution
        }
      };
      
      // Get spatial parameters for current emotional state or default to neutral
      const spatialMap = emotionalSpatialMaps[emotionalState] || emotionalSpatialMaps.neutral;
      
      // Apply the emotional spatial mapping
      position[0] *= spatialMap.scale[0]; // X-axis scaling
      position[1] *= spatialMap.scale[1]; // Y-axis scaling 
      position[2] *= spatialMap.scale[2]; // Z-axis scaling
      
      // Apply positional offsets
      position[0] += spatialMap.offset[0];
      position[1] += spatialMap.offset[1];
      position[2] += spatialMap.offset[2];
      
      // Apply distribution-specific modifications
      if (spatialMap.distribution === 'chaotic') {
        // Add minor deterministic chaos for confused state
        const chaosFactor = 0.15;
        position[0] += (safeRandom(i * 7) - 0.5) * chaosFactor;
        position[1] += (safeRandom(i * 17) - 0.5) * chaosFactor;
        position[2] += (safeRandom(i * 37) - 0.5) * chaosFactor;
      } else if (spatialMap.distribution === 'downward') {
        // For sad state, add slight gravitational effect
        position[1] = Math.max(-0.1, position[1] - safeRandom(i * 5) * 0.2);
      } else if (spatialMap.distribution === 'focused') {
        // For thinking state, particles are more orderly
        const focusSeed = Math.floor(i / 3) * 3; // Group particles in threes
        position[0] = (safeRandom(focusSeed) - 0.5) * spatialMap.scale[0];
        position[2] = (safeRandom(focusSeed + 2) - 0.5) * spatialMap.scale[2];
      }
      
      // Determine high activity particles - these particles receive special visual treatment
      // Create a deterministic seed for activity check based on particle index and type
      const activitySeed = i * 3 + (particleType === 'energy' ? 3 : 
                          particleType === 'orbit' ? 13 : 
                          particleType === 'data' ? 23 : 33);
                         
      // Define high activity probability for each emotional state and particle type
      const highActivityProbabilities = {
        "alert": {
          energy: 0.40,     // Many energy particles are high activity - heightened energy
          orbit: 0.30,      // Some orbit particles are high activity - enhanced awareness
          data: 0.25,       // Some data particles are high activity - critical information
          ambient: 0.20     // Some ambient particles are high activity - environmental alerts
        },
        "happy": {
          energy: 0.35,     // Many energy particles are high activity - positive energy
          orbit: 0.40,      // Many orbit particles are high activity - social connection
          data: 0.20,       // Some data particles are high activity - interesting information
          ambient: 0.15     // Some ambient particles are high activity - pleasant environment
        },
        "thinking": {
          energy: 0.20,     // Few energy particles are high activity - focus conservation
          orbit: 0.15,      // Few orbit particles are high activity - reduced distraction
          data: 0.40,       // Many data particles are high activity - information processing
          ambient: 0.10     // Few ambient particles are high activity - reduced awareness
        },
        "confused": {
          energy: 0.25,     // Some energy particles are high activity - scattered energy
          orbit: 0.15,      // Few orbit particles are high activity - disrupted patterns
          data: 0.30,       // Some data particles are high activity - confusing information
          ambient: 0.35     // Many ambient particles are high activity - overwhelming environment
        },
        "sad": {
          energy: 0.15,     // Few energy particles are high activity - low energy
          orbit: 0.10,      // Few orbit particles are high activity - social withdrawal
          data: 0.20,       // Some data particles are high activity - introspection
          ambient: 0.15     // Few ambient particles are high activity - subdued environment
        },
        "neutral": {
          energy: 0.25,     // Some energy particles are high activity - baseline energy
          orbit: 0.20,      // Some orbit particles are high activity - standard awareness
          data: 0.25,       // Some data particles are high activity - routine information
          ambient: 0.10     // Few ambient particles are high activity - background awareness
        }
      };
      
      // Get probabilities for current emotional state or default to neutral
      const activityProbs = highActivityProbabilities[emotionalState] || 
                           highActivityProbabilities.neutral;
      
      // Get the probability for this particle type
      const activityProb = activityProbs[particleType] || 0.2;
      
      // Deterministically determine if this is a high activity particle
      const isHighActivity = safeRandom(activitySeed) < activityProb;
      
      // Advanced emotional scaling system for particles
      // Different emotional states emphasize different particle sizes
      // to create characteristic visual patterns
      let particleSize = 0;
      
      // Use particle index and type for deterministic size calculation
      // Ensuring consistent behavior across renders
      const sizeSeed = i * 5 + (particleType === 'energy' ? 0 : 
                             particleType === 'orbit' ? 10 : 
                             particleType === 'data' ? 20 : 30);
      
      // Define base size ranges for each particle type
      const baseSizeRanges = {
        'energy': { min: 0.015, max: 0.055 },  // Energy particles are largest
        'orbit': { min: 0.010, max: 0.040 },   // Orbit particles are medium-large
        'data': { min: 0.008, max: 0.033 },    // Data particles are medium-small
        'ambient': { min: 0.005, max: 0.025 }  // Ambient particles are smallest
      };
      
      // Define size modifiers for each emotional state and particle type
      const emotionalSizeModifiers = {
        "alert": {
          // Alert state has larger energy particles and smaller ambient ones
          // Creates visual sense of focused energy and attention
          energy: 0.2,      // Energy particles larger - urgent, active energy
          orbit: 0.1,       // Orbit particles slightly larger - enhanced awareness
          data: 0.0,        // Data particles normal size - precise information
          ambient: -0.2     // Ambient particles smaller - reduced environmental noise
        },
        "happy": {
          // Happy state has moderately enlarged particles with emphasis on orbits
          // Creates visual sense of expansive, positive energy
          energy: 0.15,     // Energy particles larger - positive, vibrant energy
          orbit: 0.2,       // Orbit particles largest - social connection emphasized
          data: 0.05,       // Data particles slightly larger - clear perception
          ambient: 0.1      // Ambient particles larger - environmental engagement
        },
        "thinking": {
          // Thinking state emphasizes data particles
          // Creates visual sense of information processing
          energy: -0.1,     // Energy particles smaller - focused, efficient energy
          orbit: 0.0,       // Orbit particles normal size - stable structure
          data: 0.25,       // Data particles much larger - highlighted information
          ambient: -0.15    // Ambient particles smaller - reduced distraction
        },
        "confused": {
          // Confused state has inconsistent sizing with emphasized ambient particles
          // Creates visual sense of disorientation and environmental overwhelm
          energy: -0.05,    // Energy particles slightly smaller - diffused focus
          orbit: -0.15,     // Orbit particles smaller - disrupted patterns
          data: 0.0,        // Data particles normal size - attempting to process
          ambient: 0.2      // Ambient particles larger - environmental overwhelm
        },
        "sad": {
          // Sad state has generally smaller particles with slightly enlarged ambient ones
          // Creates visual sense of withdrawal and dreamlike distance
          energy: -0.3,     // Energy particles much smaller - depleted energy
          orbit: -0.2,      // Orbit particles smaller - reduced social connection
          data: -0.1,       // Data particles slightly smaller - introspection
          ambient: 0.05     // Ambient particles slightly larger - dreamlike state
        },
        "neutral": {
          // Neutral state has balanced sizing across all particle types
          // Creates visual sense of equilibrium and stability
          energy: 0.0,      // Energy particles normal size - balanced energy
          orbit: 0.0,       // Orbit particles normal size - stable structure
          data: 0.0,        // Data particles normal size - normal processing
          ambient: 0.0      // Ambient particles normal size - normal awareness
        }
      };
      
      // Get base size range for this particle type
      const sizeRange = baseSizeRanges[particleType] || { min: 0.01, max: 0.03 };
      
      // Get size modifiers for current emotional state or default to neutral
      const sizeMods = emotionalSizeModifiers[emotionalState] || 
                       emotionalSizeModifiers.neutral;
                       
      // Get modifier for this particle type
      const sizeMod = sizeMods[particleType] || 0;
      
      // Calculate base size with deterministic randomization between min and max
      const baseSize = sizeRange.min + safeRandom(sizeSeed) * (sizeRange.max - sizeRange.min);
      
      // Apply emotional modifier (as a percentage adjustment)
      particleSize = baseSize * (1 + sizeMod);
      
      // Ensure size stays in reasonable range
      particleSize = Math.max(0.003, Math.min(0.06, particleSize));
      
      // Make high activity particles slightly larger
      if (isHighActivity) {
        particleSize *= 1.15;
      }
      
      // Adjust particle speed based on type and emotional state
      // Using deterministic speed calculation for consistent rendering
      let particleSpeed = 0;
      
      // Use different seed for speed calculation
      const speedSeed = i * 7 + (particleType === 'energy' ? 1 : 
                               particleType === 'orbit' ? 11 : 
                               particleType === 'data' ? 21 : 31);
      
      switch(particleType) {
        case 'energy':
          particleSpeed = safeRandom(speedSeed) * 0.25 + 0.15;
          break;
        case 'orbit':
          particleSpeed = safeRandom(speedSeed) * 0.2 + 0.1;
          break;
        case 'data':
          particleSpeed = safeRandom(speedSeed) * 0.15 + 0.08;
          break;
        case 'ambient':
          particleSpeed = safeRandom(speedSeed) * 0.1 + 0.05;
          break;
      }
      
      // Advanced particle kinetics that respond to emotional state
      // These velocity mappings create visually distinct movement characteristics
      // that help convey the robot's emotional state through motion patterns
      
      // Define speed parameters for each emotional state
      const emotionalKineticMaps = {
        "alert": {
          // Alert features rapid, decisive movements
          // Creates visual sense of urgency and heightened activity
          baseMultiplier: 1.5,             // Faster overall - high energy state
          variability: 0.2,                // Low variability - focused, directed energy
          accelerationPattern: 'sharp',    // Quick direction changes - reactive capability
          particleMultipliers: {           // Type-specific speed adjustments
            energy: 1.2,  // Energy particles especially fast - urgent response
            orbit: 1.0,   // Orbit particles at baseline - maintained structure
            data: 1.1,    // Data particles slightly faster - rapid processing
            ambient: 0.9  // Ambient particles slower - focus on immediate environment
          }
        },
        "happy": {
          // Happy features smooth, flowing, moderate-speed movements
          // Creates visual sense of positive energy and harmony
          baseMultiplier: 1.2,             // Moderately faster - positive energy
          variability: 0.3,                // Moderate variability - natural, relaxed flow
          accelerationPattern: 'smooth',   // Gentle transitions - harmonious movement
          particleMultipliers: {           // Type-specific speed adjustments
            energy: 1.1,  // Energy particles moderately faster - cheerful energy
            orbit: 1.2,   // Orbit particles faster - social engagement
            data: 0.9,    // Data particles slower - less analytical focus
            ambient: 1.0  // Ambient particles normal - present in the moment
          }
        },
        "thinking": {
          // Thinking features deliberate, measured movements
          // Creates visual sense of careful processing and analysis
          baseMultiplier: 0.9,             // Slightly slower - deliberate, thoughtful
          variability: 0.1,                // Low variability - focused attention
          accelerationPattern: 'steady',   // Consistent, predictable - methodical
          particleMultipliers: {           // Type-specific speed adjustments
            energy: 0.8,  // Energy particles slower - careful energy expenditure  
            orbit: 0.9,   // Orbit particles slower - thoughtful consideration
            data: 1.3,    // Data particles faster - active information processing
            ambient: 0.7  // Ambient particles much slower - reduced environmental awareness
          }
        },
        "confused": {
          // Confused features erratic, unpredictable movements
          // Creates visual sense of disorientation and inconsistency
          baseMultiplier: 1.0,             // Normal base speed - neither fast nor slow
          variability: 0.6,                // High variability - unpredictable behavior
          accelerationPattern: 'erratic',  // Unpredictable changes - disorganized thought
          particleMultipliers: {           // Type-specific speed adjustments
            energy: 0.9,  // Energy particles slower - inefficient energy use
            orbit: 0.7,   // Orbit particles much slower - disrupted patterns
            data: 1.1,    // Data particles faster - attempting to process
            ambient: 1.3  // Ambient particles much faster - environmental overwhelm
          }
        },
        "sad": {
          // Sad features slow, downward-trending movements
          // Creates visual sense of emotional heaviness and withdrawal
          baseMultiplier: 0.7,             // Much slower - low energy state
          variability: 0.15,               // Low variability - subdued responsiveness
          accelerationPattern: 'heavy',    // Dampened transitions - emotional weight
          particleMultipliers: {           // Type-specific speed adjustments
            energy: 0.7,  // Energy particles much slower - depleted energy
            orbit: 0.8,   // Orbit particles slower - reduced social engagement
            data: 0.9,    // Data particles slightly slower - introspective processing
            ambient: 1.1  // Ambient particles faster - dream-like disconnection
          }
        },
        "neutral": {
          // Neutral features balanced, consistent movements
          // Creates visual sense of calm readiness and stability
          baseMultiplier: 1.0,             // Baseline speed - balanced energy
          variability: 0.2,                // Moderate variability - natural flow
          accelerationPattern: 'balanced', // Smooth transitions - stability
          particleMultipliers: {           // Type-specific speed adjustments
            energy: 1.0,  // Energy particles at baseline - balanced energy
            orbit: 1.0,   // Orbit particles at baseline - stable patterns
            data: 1.0,    // Data particles at baseline - steady processing
            ambient: 1.0  // Ambient particles at baseline - open awareness
          }
        }
      };
      
      // Get kinetic parameters for current emotional state or default to neutral
      const kineticMap = emotionalKineticMaps[emotionalState] || emotionalKineticMaps.neutral;
      
      // Apply the base multiplier for the emotional state
      particleSpeed *= kineticMap.baseMultiplier;
      
      // Apply type-specific multiplier
      particleSpeed *= kineticMap.particleMultipliers[particleType] || 1.0;
      
      // Apply emotion-specific variability using deterministic randomization
      const variabilityFactor = (safeRandom(i * 13) - 0.5) * 2 * kineticMap.variability;
      
      // Apply acceleration pattern adjustments
      if (kineticMap.accelerationPattern === 'erratic') {
        // Erratic pattern has more random variation
        particleSpeed *= (1.0 + variabilityFactor);
      } else if (kineticMap.accelerationPattern === 'sharp') {
        // Sharp pattern has less variation but distinct speeds
        particleSpeed *= (1.0 + Math.floor(variabilityFactor * 3) / 3);
      } else {
        // Other patterns have smoother variations
        particleSpeed *= (1.0 + variabilityFactor * 0.7);
      }
      
      // Advanced visual opacity system with emotion-responsive transparency
      // Each emotional state has characteristic transparency patterns
      // that help convey the robot's emotional state through visual density
      let opacity = 0;
      
      // Use a different seed for opacity calculation to ensure
      // deterministic but varied results for consistent SSR rendering
      const opacitySeed = i * 9 + (particleType === 'energy' ? 2 : 
                                 particleType === 'orbit' ? 12 : 
                                 particleType === 'data' ? 22 : 32);
      
      // Define base opacity ranges for each particle type
      const baseOpacityRanges = {
        'energy': { min: 0.7, max: 1.0 },   // Energy particles are most visible
        'orbit': { min: 0.6, max: 0.9 },    // Orbit particles are moderately visible
        'data': { min: 0.5, max: 0.8 },     // Data particles have medium visibility
        'ambient': { min: 0.3, max: 0.6 }   // Ambient particles are most transparent
      };
      
      // Define opacity modifiers for each emotional state and particle type
      const emotionalOpacityModifiers = {
        "alert": {
          // Alert state has high contrast, clearly visible particles
          // Creates visual sense of clarity and importance
          energy: 0.15,     // Energy particles more visible - urgent information
          orbit: 0.10,      // Orbit particles more visible - important structure
          data: 0.15,       // Data particles more visible - critical information
          ambient: -0.10    // Ambient particles less visible - focus on foreground
        },
        "happy": {
          // Happy state has moderately high visibility with harmonious transparency
          // Creates visual sense of openness and clarity
          energy: 0.10,     // Energy particles more visible - positive energy
          orbit: 0.05,      // Orbit particles slightly more visible - social harmony
          data: 0.00,       // Data particles normal visibility - balanced processing
          ambient: 0.10     // Ambient particles more visible - environmental engagement
        },
        "thinking": {
          // Thinking state emphasizes data particles visibility
          // Creates visual sense of focus on information
          energy: -0.05,    // Energy particles less visible - reserved energy
          orbit: 0.00,      // Orbit particles normal visibility - stable structure
          data: 0.20,       // Data particles much more visible - highlighted information
          ambient: -0.15    // Ambient particles much less visible - reduced distraction
        },
        "confused": {
          // Confused state has irregular, inconsistent transparency
          // Creates visual sense of uncertainty and perceptual variance
          energy: -0.10,    // Energy particles less visible - scattered focus
          orbit: -0.15,     // Orbit particles much less visible - disrupted patterns
          data: 0.00,       // Data particles normal visibility - processing attempt
          ambient: 0.15     // Ambient particles more visible - environmental overwhelm
        },
        "sad": {
          // Sad state has lower overall opacity with dreamy transparency
          // Creates visual sense of emotional distance and withdrawal
          energy: -0.20,    // Energy particles much less visible - depleted energy
          orbit: -0.10,     // Orbit particles less visible - reduced engagement
          data: -0.05,      // Data particles slightly less visible - introspection
          ambient: 0.05     // Ambient particles slightly more visible - dreamlike state
        },
        "neutral": {
          // Neutral state has balanced transparency with moderate contrast
          // Creates visual sense of balance and stability
          energy: 0.00,     // Energy particles normal visibility - balanced energy
          orbit: 0.00,      // Orbit particles normal visibility - stable structure
          data: 0.00,       // Data particles normal visibility - normal processing
          ambient: 0.00     // Ambient particles normal visibility - balanced awareness
        }
      };
      
      // Get base opacity range for this particle type
      const opacityRange = baseOpacityRanges[particleType] || { min: 0.5, max: 0.8 };
      
      // Get opacity modifiers for current emotional state or default to neutral
      const opacityMods = emotionalOpacityModifiers[emotionalState] || 
                          emotionalOpacityModifiers.neutral;
                          
      // Get modifier for this particle type
      const opacityMod = opacityMods[particleType] || 0;
      
      // Calculate base opacity with deterministic randomization between min and max
      const baseOpacity = opacityRange.min + safeRandom(opacitySeed) * (opacityRange.max - opacityRange.min);
      
      // Apply emotional modifier, ensuring opacity stays in valid range [0,1]
      opacity = Math.max(0.1, Math.min(1.0, baseOpacity + opacityMod));
      
      // Add subtle pulsing effect for high activity particles
      if (isHighActivity) {
        // Calculate pulse rate based on emotional state
        const pulseRate = emotionalState === "alert" ? 1.5 :
                         emotionalState === "happy" ? 1.2 :
                         emotionalState === "thinking" ? 0.8 :
                         emotionalState === "confused" ? 1.1 :
                         emotionalState === "sad" ? 0.6 :
                         1.0; // neutral
                         
        // This will be used in the ParticlePoint component to create pulsing
        opacity *= 0.85; // Reduce base opacity to allow for pulsing range
      }
      
      return {
        position,
        size: particleSize,
        speed: particleSpeed,
        type: particleType,
        opacity,
        isHighActivity
      };
    });
  }, [intensity, emotionalState, color]);
  
  return (
    <group>
      {particles.map((particle, i) => (
        <ParticlePoint 
          key={i} 
          position={particle.position} 
          size={particle.size} 
          speed={particle.speed}
          color={color}
          type={particle.type}
          opacity={particle.opacity}
          emotionalState={emotionalState}
          isHighActivity={particle.isHighActivity}
        />
      ))}
    </group>
  );
};

// Define interface for ParticlePoint props
interface ParticlePointProps {
  position: [number, number, number];
  size: number;
  speed: number;
  color: THREE.Color | string | number;
  type?: ParticleType;
  opacity?: number;
  emotionalState?: EmotionalState;
  isHighActivity?: boolean;
}

// Enhanced individual particle with PBR materials and emotional responsiveness
const ParticlePoint: React.FC<ParticlePointProps> = ({ 
  position, 
  size, 
  speed, 
  color,
  type = 'energy',
  opacity = 0.8,
  emotionalState = 'neutral',
  isHighActivity = false
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Update global time reference in animation frame
  useFrame((_, delta) => {
    // Update the shared global time reference used across components
    globalTimeRef.current.value += delta;
  });
  
  // Enhanced animation frame with emotion-responsive behaviors
  useFrame(() => {
    if (!meshRef.current) return;
    
    // Use global time reference for consistent animations across components
    const time = globalTimeRef.current.value;
    
    // Create a spring-mass-damper system for more natural movement
    // Different behavior based on emotional state and particle type
    const springFrequency = 
      isHighActivity ? 4.0 : 
      emotionalState === "alert" ? 3.5 :
      emotionalState === "happy" ? 2.5 :
      emotionalState === "thinking" ? 1.5 :
      emotionalState === "confused" ? (2.0 + Math.sin(time * 0.5) * 1.0) : // Variable for confused
      emotionalState === "sad" ? 0.8 :
      1.2; // default
    
    const dampingFactor = 
      emotionalState === "alert" ? 0.3 :
      emotionalState === "happy" ? 0.4 :
      emotionalState === "sad" ? 0.8 :
      emotionalState === "confused" ? (0.5 + Math.sin(time * 0.3) * 0.2) : // Variable for confused
      0.5; // default
      
    // Spring-mass-damper floating movement
    const displacement = Math.sin(time * springFrequency) * Math.exp(-dampingFactor * (time % 5));
    const vDisplacement = displacement * (type === 'energy' ? 0.003 : 
                                         type === 'orbit' ? 0.002 : 
                                         type === 'data' ? 0.0015 : 0.001);
    
    // Apply vertical position with spring physics
    meshRef.current.position.y += vDisplacement;
    
    // Apply different horizontal motions based on particle type and emotional state
    if (type === 'orbit') {
      // Orbit particles have circular motion
      const orbitRadius = isHighActivity ? 0.01 : 0.005;
      const orbitSpeed = speed * (emotionalState === "alert" ? 1.5 : 
                                 emotionalState === "happy" ? 1.2 : 
                                 emotionalState === "sad" ? 0.7 : 1.0);
      
      meshRef.current.position.x += Math.cos(time * orbitSpeed) * orbitRadius;
      meshRef.current.position.z += Math.sin(time * orbitSpeed) * orbitRadius;
    } else if (type === 'energy') {
      // Energy particles have more erratic motion
      const energyFactor = isHighActivity ? 0.005 : 0.002;
      meshRef.current.position.x += (Math.sin(time * speed * 2.5) + Math.cos(time * speed * 1.5)) * energyFactor;
      meshRef.current.position.z += (Math.cos(time * speed * 2.0) + Math.sin(time * speed * 1.0)) * energyFactor;
    } else if (type === 'data') {
      // Data particles have more structured motion
      const dataFactor = 0.002;
      meshRef.current.position.x += Math.sin(time * speed + Math.PI/4) * dataFactor;
      meshRef.current.position.z += Math.sin(time * speed * 1.5) * dataFactor;
    } else {
      // Ambient particles have subtle random motion
      const ambientFactor = 0.001;
      meshRef.current.position.x += (Math.sin(time * speed * 0.5) + Math.sin(time * speed * 0.3)) * ambientFactor;
      meshRef.current.position.z += (Math.cos(time * speed * 0.7) + Math.cos(time * speed * 0.4)) * ambientFactor;
    }
    
    // Rotation rate based on particle type and emotional state
    const baseRotationRate = 
      type === 'energy' ? 0.015 :
      type === 'orbit' ? 0.01 :
      type === 'data' ? 0.008 :
      0.005;
      
    const emotionRotationModifier =
      emotionalState === "alert" ? 1.5 :
      emotionalState === "happy" ? 1.2 :
      emotionalState === "thinking" ? 0.9 :
      emotionalState === "confused" ? (1.0 + Math.sin(time * 0.5) * 0.4) : // Variable for confused
      emotionalState === "sad" ? 0.7 :
      1.0;
    
    // Apply rotation with spring-based micro-movements
    meshRef.current.rotation.x += baseRotationRate * speed * emotionRotationModifier + vDisplacement * 0.1;
    meshRef.current.rotation.z += baseRotationRate * speed * emotionRotationModifier * 0.8 + vDisplacement * 0.05;
    if (isHighActivity) {
      meshRef.current.rotation.y += baseRotationRate * speed * emotionRotationModifier * 0.5;
    }
    
    // Enhanced pulsing size with spring physics
    const basePulseFactor = 
      type === 'energy' ? 0.25 :
      type === 'orbit' ? 0.2 :
      type === 'data' ? 0.15 :
      0.1;
      
    const emotionPulseModifier =
      emotionalState === "alert" ? 1.3 :
      emotionalState === "happy" ? 1.2 :
      emotionalState === "thinking" ? 0.9 :
      emotionalState === "confused" ? (1.0 + Math.sin(time * 0.3) * 0.3) : // Variable for confused
      emotionalState === "sad" ? 0.7 :
      1.0;
    
    // Apply pulsing size with damped harmonic oscillator model
    const pulseScale = 1 + Math.sin(time * springFrequency) * Math.exp(-dampingFactor * (time % 3)) * 
                      basePulseFactor * emotionPulseModifier;
    
    // Apply different scale factors to create less uniform shapes
    if (type === 'energy' || isHighActivity) {
      meshRef.current.scale.set(pulseScale, pulseScale * 1.1, pulseScale * 0.9);
    } else if (type === 'data') {
      meshRef.current.scale.set(pulseScale * 0.9, pulseScale * 1.05, pulseScale);
    } else {
      meshRef.current.scale.set(pulseScale, pulseScale, pulseScale);
    }
  });
  
  // Calculate particle color and advanced PBR material properties with emotional influence
  const particleColor = useMemo(() => {
    // Start with the base color and ensure it's a valid THREE.Color
    let resultColor = safeColor(color).clone();
    
    // Adjust color based on particle type with advanced color theory
    if (type === 'energy') {
      // Energy particles have more saturated color with optimal hue shift for visual prominence
      const hsl = {} as THREE.HSL;
      resultColor.getHSL(hsl);
      // Apply golden ratio hue shift for harmonious color variation
      const goldenRatioConjugate = 0.618033988749895;
      resultColor.setHSL(
        ((hsl.h + goldenRatioConjugate) % 1.0),  // Harmonic hue shift
        Math.min(1.0, hsl.s * 1.25),  // More saturation for energy particles
        Math.min(1.0, hsl.l * 1.15)   // Brighter for energy particles
      );
    } else if (type === 'orbit') {
      // Orbit particles have analogous color scheme (nearby on color wheel)
      const hsl = {} as THREE.HSL;
      resultColor.getHSL(hsl);
      resultColor.setHSL(
        ((hsl.h + 0.05) % 1.0),  // Slight positive hue shift (analogous)
        Math.min(1.0, hsl.s * 1.05),  // Slightly more saturation
        Math.min(1.0, hsl.l * 1.08)   // Slightly brighter
      );
    } else if (type === 'data') {
      // Data particles have split-complementary color scheme for visual distinction
      const hsl = {} as THREE.HSL;
      resultColor.getHSL(hsl);
      // Split-complementary color (not directly opposite but offset from complement)
      resultColor.setHSL(
        ((hsl.h + 0.58) % 1.0),  // Near-complementary hue shift
        Math.min(1.0, hsl.s * 0.95), // Slightly less saturation
        Math.min(1.0, hsl.l * 1.02)  // Very slightly brighter
      );
    } else {
      // Ambient particles have monochromatic color scheme (same hue, different saturation/lightness)
      const hsl = {} as THREE.HSL;
      resultColor.getHSL(hsl);
      resultColor.setHSL(
        hsl.h,  // Same hue
        hsl.s * 0.7,  // Much less saturation for ambient feel
        Math.min(1.0, hsl.l * 0.85)  // Dimmer for ambient feel
      );
    }
    
    // Enhanced emotion-based color adjustments using color psychology principles
    if (emotionalState === "alert") {
      // Alert: Increase red component and reduce others for attention-grabbing appearance
      // Red is associated with alarm, danger, urgency
      const hsl = {} as THREE.HSL;
      resultColor.getHSL(hsl);
      // Shift toward red (0.95-0.0 in hue space)
      const targetHue = hsl.h > 0.5 ? 0.95 : 0.0;
      resultColor.setHSL(
        hsl.h * 0.7 + targetHue * 0.3, // Shift 30% toward red
        Math.min(1.0, hsl.s * 1.3),    // More saturation for alert
        Math.min(1.0, hsl.l * 1.15)    // Brighter for alert
      );
    } else if (emotionalState === "happy") {
      // Happy: Warm, vibrant colors with golden/yellow tones
      // Yellow-green to yellow-orange spectrum is associated with positivity
      const hsl = {} as THREE.HSL;
      resultColor.getHSL(hsl);
      // Shift toward yellow-green to yellow-orange (0.12-0.18 in hue space)
      const targetHue = 0.15; // Yellow-range
      resultColor.setHSL(
        hsl.h * 0.8 + targetHue * 0.2, // Shift 20% toward yellow range
        Math.min(1.0, hsl.s * 1.15),   // More saturated for happy
        Math.min(1.0, hsl.l * 1.1)     // Brighter for happy
      );
    } else if (emotionalState === "thinking") {
      // Thinking: Cooler, calmer blue-purple spectrum
      // Blue-violet is associated with intelligence, concentration
      const hsl = {} as THREE.HSL;
      resultColor.getHSL(hsl);
      // Shift toward blue-violet (0.6-0.75 in hue space)
      const targetHue = 0.65; // Blue-violet range
      resultColor.setHSL(
        hsl.h * 0.7 + targetHue * 0.3, // Shift 30% toward blue-violet
        Math.min(1.0, hsl.s * 0.9),    // Less saturated for calm thinking
        hsl.l                          // Maintain original lightness
      );
    } else if (emotionalState === "sad") {
      // Sad: Muted, cooler blue spectrum
      // Blue is associated with sadness, calmness, melancholy
      const hsl = {} as THREE.HSL;
      resultColor.getHSL(hsl);
      // Shift toward blue (0.55-0.65 in hue space)
      const targetHue = 0.6; // Blue range
      resultColor.setHSL(
        hsl.h * 0.6 + targetHue * 0.4, // Shift 40% toward blue
        Math.max(0.0, hsl.s * 0.7),    // Significantly desaturated for sad
        Math.max(0.0, hsl.l * 0.85)    // Darker for sad
      );
    } else if (emotionalState === "confused") {
      // Confused: Discordant, unexpected color shifts
      // Unusual color combinations suggest confusion, uncertainty
      const hsl = {} as THREE.HSL;
      resultColor.getHSL(hsl);
      // Apply unusual hue shift based on particle index for unpredictable result
      const randomShift = (Math.sin(hsl.h * 10) * 0.2 + 0.2) % 1.0;
      resultColor.setHSL(
        (hsl.h + randomShift) % 1.0,   // Unpredictable hue shift
        hsl.s * (0.8 + Math.sin(hsl.h * 5) * 0.2), // Variable saturation
        hsl.l * (0.9 + Math.cos(hsl.h * 5) * 0.1)  // Variable lightness
      );
      // Add a slightly higher blue component for confused state
      resultColor.b = Math.min(1.0, resultColor.b * 1.1);
    }
    
    return resultColor;
  }, [color, type, emotionalState]);
  
  // Define particle geometry based on type
  const particleGeometryType = useMemo(() => {
    if (type === 'energy') {
      return isHighActivity ? 'sphere' : 'octahedron';
    } else if (type === 'orbit') {
      return 'sphere';
    } else if (type === 'data') {
      // Use a stable check that will be consistent between server and client
      // We'll use a property of the meshRef to create a deterministic choice
      return isClient && meshRef.current ? 
        // On client with available ref, we can use random
        Math.random() > 0.5 ? 'box' : 'tetrahedron' :
        // During SSR or before mount, use this pattern to ensure consistency
        'box';
    } else {
      return 'sphere';
    }
  }, [type, isHighActivity]);
  
  return (
    <mesh ref={meshRef} position={position}>
      {/* Dynamic geometry based on particle type */}
      {particleGeometryType === 'sphere' && <sphereGeometry args={[size, 8, 8]} />}
      {particleGeometryType === 'box' && <boxGeometry args={[size, size, size]} />}
      {particleGeometryType === 'octahedron' && <octahedronGeometry args={[size, 0]} />}
      {particleGeometryType === 'tetrahedron' && <tetrahedronGeometry args={[size, 0]} />}
      
      {/* High-fidelity PBR material with physically accurate lighting properties */}
      <meshPhysicalMaterial 
        color={particleColor}
        emissive={particleColor}
        emissiveIntensity={
          (() => {
            // Physically-accurate emission intensity using photometric principles
            const baseIntensity = 
              emotionalState === "alert" ? 2.8 :    // Emergency-level intensity - mimics warning beacon
              emotionalState === "happy" ? 2.0 :    // Vibrant but comfortable intensity - warm glow
              emotionalState === "thinking" ? 1.4 : // Moderate for focused state - deliberate illumination
              emotionalState === "sad" ? 0.65 :     // Low for subdued emotional state - dimmed expression
              emotionalState === "confused" ? 1.7 + Math.sin(globalTimeRef.current.value * 1.2) * 0.5 : // Erratic intensity for confusion
              1.3; // default - calibrated for optimal visibility
            
            // Particle type modifiers based on real-world light emission phenomena
            switch(type) {
              case 'energy': return baseIntensity * 1.6; // Plasma-like high-energy emission (5800K)
              case 'orbit': return baseIntensity * 1.25; // Moderately high emission (4500K equivalent)
              case 'data': return baseIntensity * 0.9;  // Controlled emission for data clarity (3500K)
              case 'ambient': return baseIntensity * 0.7; // Soft environmental lighting (2700K equivalent)
              default: return baseIntensity;
            }
          })()
        }
        transparent={true}
        opacity={
          (() => {
            // Advanced opacity modulation based on emotional state and physics principles
            let baseOpacity = opacity * (isHighActivity ? 0.95 : 1.0);
            
            // Complex opacity modulation simulating quantum-like uncertainty
            if (emotionalState === "alert") {
              // Alert particles have slight opacity pulsing for urgency
              return baseOpacity * (0.9 + Math.sin(globalTimeRef.current.value * 1.8) * 0.1);
            } else if (emotionalState === "happy") {
              // Happy particles have pleasant, stable transparency
              return baseOpacity * 0.95;
            } else if (emotionalState === "thinking") {
              // Thinking particles have consistent, structured transparency
              return baseOpacity * 0.9;
            } else if (emotionalState === "confused") {
              // Confused particles have chaotic transparency variations
              return baseOpacity * (0.8 + Math.sin(globalTimeRef.current.value * 4.2) * 0.2);
            } else if (emotionalState === "sad") {
              // Sad particles are more consistently transparent
              return baseOpacity * 0.85;
            }
            
            return baseOpacity;
          })()
        }
        toneMapped={false} // Disable tone mapping for more accurate HDR-like rendering
        
        // Advanced metalness with emotion and particle type influences
        metalness={
          (() => {
            // Base metalness by particle type - calibrated using Fresnel equations principles
            const baseMetal = 
              type === 'energy' ? 0.95 :   // Energy particles are highly metallic/conductive
              type === 'orbit' ? 0.8 :     // Orbit particles are moderately metallic
              type === 'data' ? 0.6 :      // Data particles have medium metalness
              type === 'ambient' ? 0.35 :  // Ambient particles have low metalness
              0.65;                        // Default - moderately metallic
            
            // Complex emotional influence with nuanced material science modeling
            if (emotionalState === "alert") {
              // Alert particles are more metallic for reflective intensity
              return Math.min(1.0, baseMetal * 1.3);
            } else if (emotionalState === "happy") {
              // Happy particles are more metallic for vibrant reflections
              return Math.min(1.0, baseMetal * 1.15);
            } else if (emotionalState === "thinking") {
              // Thinking particles have a precise metalness
              return baseMetal * 1.05;
            } else if (emotionalState === "sad") {
              // Sad particles are less metallic for a duller appearance
              return baseMetal * 0.7;
            } else if (emotionalState === "confused") {
              // Confused particles have variable, unpredictable metalness
              return baseMetal * (0.85 + Math.sin(globalTimeRef.current.value * 1.2) * 0.3);
            }
            
            return baseMetal;
          })()
        }
        
        // Advanced roughness with physically-based material properties
        roughness={
          (() => {
            // Base roughness by particle type - calibrated to simulate particular physical surfaces
            const baseRough = 
              type === 'energy' ? 0.05 :   // Energy particles are extremely smooth (like polished metal)
              type === 'orbit' ? 0.15 :    // Orbit particles are quite smooth (like clean glass)
              type === 'data' ? 0.25 :     // Data particles have medium smoothness (like plastic)
              type === 'ambient' ? 0.4 :   // Ambient particles are rougher (like frosted glass)
              0.2;                         // Default - relatively smooth
            
            // Advanced emotional influence with microfacet BRDF modeling principles
            if (emotionalState === "alert") {
              // Alert particles are smoother for sharper reflections
              return Math.max(0.02, baseRough * 0.6);
            } else if (emotionalState === "happy") {
              // Happy particles are moderately smooth for pleasant reflections
              return Math.max(0.05, baseRough * 0.8);
            } else if (emotionalState === "thinking") {
              // Thinking particles have precise roughness
              return baseRough * 0.95;
            } else if (emotionalState === "confused") {
              // Confused particles have variable roughness
              return Math.min(0.95, baseRough * (1.4 + Math.sin(globalTimeRef.current.value * 1.8) * 0.4));
            } else if (emotionalState === "sad") {
              // Sad particles are rougher for diffused reflection
              return Math.min(0.95, baseRough * 1.6);
            }
            
            return baseRough;
          })()
        }
        
        // Enhanced transmission for physically-based optical path modeling
        transmission={
          (() => {
            // Base transmission calibrated by particle type for accurate light scattering
            const baseTrans = 
              type === 'energy' ? 0.65 :    // Energy particles have high transmission (plasma-like)
              type === 'orbit' ? 0.5 :      // Orbit particles have medium-high transmission
              type === 'data' ? 0.35 :      // Data particles have medium transmission
              type === 'ambient' ? 0.25 :   // Ambient particles have low transmission
              0.4;                          // Default - moderate light transmission
            
            // Physically-based emotional influence on light transmission properties
            if (emotionalState === "alert") {
              // Alert particles have variable transmission for dynamic appearance
              return Math.min(0.85, baseTrans * (1.1 + Math.sin(globalTimeRef.current.value * 1.2) * 0.2));
            } else if (emotionalState === "happy") {
              // Happy particles have higher transmission for a glowing effect
              return Math.min(0.85, baseTrans * 1.35);
            } else if (emotionalState === "thinking") {
              // Thinking particles have precise transmission
              return baseTrans * 1.15;
            } else if (emotionalState === "confused") {
              // Confused particles have erratic transmission
              return baseTrans * (0.9 + Math.sin(globalTimeRef.current.value * 2.4) * 0.35);
            } else if (emotionalState === "sad") {
              // Sad particles have lower transmission for a subdued appearance
              return baseTrans * 0.65;
            }
            
            return baseTrans;
          })()
        }
        
        // Add physically-based reflectivity for realistic specular highlights
        reflectivity={
          (() => {
            // Base reflectivity calibrated by particle type with accurate Fresnel effects
            const baseReflect = 
              type === 'energy' ? 1.0 :     // Energy particles are highly reflective (like superheated plasma)
              type === 'orbit' ? 0.85 :     // Orbit particles are quite reflective (like polished metal)
              type === 'data' ? 0.7 :       // Data particles have moderate reflection (like semi-polished surfaces)
              type === 'ambient' ? 0.5 :    // Ambient particles have subtle reflection (like matte materials)
              0.75;                         // Default - balanced reflection
            
            // Emotional influence with physically accurate lighting models
            if (emotionalState === "alert") {
              // Alert particles have high reflectivity for attention-grabbing highlights
              return Math.min(1.0, baseReflect * 1.2);
            } else if (emotionalState === "happy") {
              // Happy particles have warm, pleasant reflectivity
              return Math.min(1.0, baseReflect * 1.1);
            } else if (emotionalState === "thinking") {
              // Thinking particles have precise, controlled reflectivity
              return baseReflect * 0.95;
            } else if (emotionalState === "confused") {
              // Confused particles have variable reflectivity
              return baseReflect * (0.9 + Math.sin(globalTimeRef.current.value * 1.8) * 0.25);
            } else if (emotionalState === "sad") {
              // Sad particles have reduced reflectivity for a subdued appearance
              return baseReflect * 0.75;
            }
            
            return baseReflect;
          })()
        }
        
        // Advanced physically-based refractive index (IOR) for accurate light bending
        ior={
          (() => {
            // Base IOR (Index of Refraction) by particle type - using real-world material values
            // IOR determines how much light bends when entering/exiting a material
            // Higher values = more dramatic bending of light (rainbow effects, caustics)
            // Real-world values for reference:
            // - Air: 1.0
            // - Water: 1.33
            // - Ice: 1.31-1.36
            // - Glass: 1.45-1.9
            // - Crystal: 1.5-2.0
            // - Diamond: 2.42
            // - Advanced materials: 1.38-2.9
            
            const baseIor = 
              type === 'energy' ? 2.32 :   // Energy particles - advanced crystalline structure (extreme bend)
                                           // Similar to rare gemstones and advanced optical materials
              
              type === 'orbit' ? 2.05 :    // Orbit particles - diamond-like properties (very high bend)
                                           // Similar to high-refractive crystals used in precision optics
              
              type === 'data' ? 1.65 :     // Data particles - high-quality glass-like (medium-high bend)
                                           // Similar to crown glass or high-end optical glass
              
              type === 'ambient' ? 1.42 :  // Ambient particles - like advanced plastics or optical gels
                                           // Similar to polycarbonate or specialized optical polymers
              
              1.75;                        // Default - balanced advanced optical material
            
            // Complex emotional influence on refractive properties with precise physical calibration
            if (emotionalState === "alert") {
              // Alert particles have heightened refraction for increased optical activity
              // This creates more dramatic light splitting and focusing effects
              // Simulates increased energy states with enhanced optical properties
              return Math.min(2.9, baseIor * 1.08);
            } else if (emotionalState === "happy") {
              // Happy particles have moderately enhanced refraction for pleasing optical effects
              // Creates optimally balanced light scattering and focusing
              // Simulates harmonious energy distribution with balanced optical properties
              return Math.min(2.8, baseIor * 1.05);
            } else if (emotionalState === "thinking") {
              // Thinking particles have precisely controlled refraction
              // Creates focused, directional light paths with minimal scattering
              // Simulates concentrated energy states with aligned optical properties
              return baseIor * 1.02;
            } else if (emotionalState === "sad") {
              // Sad particles have reduced refraction for subdued optical activity
              // Creates softer, less dramatic light interaction
              // Simulates decreased energy states with diminished optical properties
              return Math.max(1.2, baseIor * 0.92);
            } else if (emotionalState === "confused") {
              // Confused particles have variable refraction that shifts over time
              // Creates unpredictable light paths that change with observation
              // Simulates chaotic energy states with fluctuating optical properties
              return baseIor * (0.97 + Math.sin(globalTimeRef.current.value * 0.6) * 0.08);
            }
            
            return baseIor;
          })()
        }
        
        // Enhanced environment map intensity for proper PBR reflections
        envMapIntensity={
          (() => {
            // Base environment reflection intensity by particle type
            const baseEnvIntensity = 
              type === 'energy' ? 1.2 :    // Energy particles strongly reflect environment
              type === 'orbit' ? 1.0 :     // Orbit particles moderately reflect environment
              type === 'data' ? 0.8 :      // Data particles have controlled environment reflections
              type === 'ambient' ? 0.6 :   // Ambient particles have subtle environment reflections
              0.9;                         // Default - balanced environment reflections
            
            // Advanced emotional influence
            if (emotionalState === "alert") {
              return baseEnvIntensity * 1.3;    // Enhanced for alert - high energy state
            } else if (emotionalState === "happy") {
              return baseEnvIntensity * 1.15;   // Enhanced for happy - vibrant appearance
            } else if (emotionalState === "thinking") {
              return baseEnvIntensity * 1.0;    // Neutral for thinking - focused energy
            } else if (emotionalState === "sad") {
              return baseEnvIntensity * 0.7;    // Reduced for sad - subdued appearance
            } else if (emotionalState === "confused") {
              return baseEnvIntensity * (0.85 + Math.sin(globalTimeRef.current.value * 1.2) * 0.2); // Variable for confused
            }
            
            return baseEnvIntensity;
          })()
        }
        
        // Enhanced clearcoat layer - simulates thin layer of varnish or liquid
        clearcoat={
          (() => {
            // Base clearcoat level for wet/polished appearance
            const baseClear = 
              type === 'energy' ? 0.95 :   // Energy particles have high glossiness
              type === 'orbit' ? 0.75 :    // Orbit particles are quite glossy
              type === 'data' ? 0.55 :     // Data particles have medium glossiness
              type === 'ambient' ? 0.3 :   // Ambient particles have subtle glossiness
              0.6;                         // Default - moderate clearcoat
            
            // Advanced emotional influence with material science principles
            if (emotionalState === "alert") {
              // Alert particles have high clearcoat for intense reflections
              return Math.min(1.0, baseClear * 1.3);
            } else if (emotionalState === "happy") {
              // Happy particles have high clearcoat for pleasing shine
              return Math.min(1.0, baseClear * 1.2);
            } else if (emotionalState === "thinking") {
              // Thinking particles have moderate clearcoat
              return baseClear * 1.1;
            } else if (emotionalState === "confused") {
              // Confused particles have variable clearcoat
              return baseClear * (0.9 + Math.sin(globalTimeRef.current.value * 1.8) * 0.3);
            } else if (emotionalState === "sad") {
              // Sad particles have lower clearcoat for subdued appearance
              return baseClear * 0.7;
            }
            
            return baseClear;
          })()
        }
        
        // Enhanced clearcoat roughness - controls microsurface of the clearcoat layer
        clearcoatRoughness={
          (() => {
            // Base clearcoat roughness with surface physics principles
            // Base clearcoat roughness calibrated with advanced microsurface physics principles
            // Lower values (0.0-0.1) create mirror-like reflections with sharp highlights
            // Mid values (0.1-0.3) create soft but defined specular reflections
            // Higher values (0.3-1.0) create diffused, matte-like reflections
            const baseClearRough = 
              type === 'energy' ? 0.03 :   // Energy particles have nearly perfect mirror-like clearcoat (polished chrome)
              type === 'orbit' ? 0.08 :    // Orbit particles have very smooth clearcoat (polished glass)
              type === 'data' ? 0.18 :     // Data particles have medium clearcoat smoothness (semi-gloss finish)
              type === 'ambient' ? 0.28 :  // Ambient particles have rougher clearcoat (satin finish)
              0.12;                        // Default - relatively smooth clearcoat (glossy)
            
            // Advanced emotional influence on clearcoat microsurface with accurate light scattering models
            if (emotionalState === "alert") {
              // Alert particles have smoother clearcoat for sharp, attention-grabbing highlights
              // The 0.02 minimum ensures accurate rendering without artifacts from values too close to zero
              return Math.max(0.02, baseClearRough * 0.75);
            } else if (emotionalState === "happy") {
              // Happy particles have pleasing, defined reflections
              return Math.max(0.04, baseClearRough * 0.85);
            } else if (emotionalState === "thinking") {
              // Thinking particles have precise, controlled reflections
              return baseClearRough * 0.95;
            } else if (emotionalState === "confused") {
              // Confused particles have variable, unpredictable light behavior
              // The sine function creates a natural oscillation in reflection clarity
              return baseClearRough * (1.0 + Math.sin(globalTimeRef.current.value * 0.9) * 0.6);
            } else if (emotionalState === "sad") {
              // Sad particles have rougher clearcoat for softer, more diffused reflections
              // The upper limit prevents completely dull appearances
              return Math.min(0.7, baseClearRough * 1.8);
            }
            
            return baseClearRough;
          })()
        }
        
        // Advanced physically-based sheen - controls fabric-like reflections at grazing angles
        sheen={
          (() => {
            // Base sheen intensity - controls fabric-like reflections at glancing angles
            // Higher values create more pronounced velvet-like or silk-like reflections at edges
            // Based on real-world fabric reflection properties:
            // 0.0 = No fabric-like behavior
            // 0.1-0.3 = Subtle microfiber-like reflections (light cotton, fine linen)
            // 0.3-0.5 = Moderate fabric reflections (silk, satin)
            // 0.5-0.8 = Strong fabric reflections (velvet, suede)
            // 0.8-1.0 = Intense fabric reflections (crushed velvet, specialized optical fibers)
            
            const baseSheen = 
              type === 'energy' ? 0.15 :   // Energy particles have minimal fabric-like quality (subtle microfiber)
              type === 'orbit' ? 0.25 :    // Orbit particles have slight silk-like character
              type === 'data' ? 0.4 :      // Data particles have moderate satin-like quality
              type === 'ambient' ? 0.6 :   // Ambient particles have significant velvet-like quality
              0.3;                         // Default - subtle fabric-like edges
            
            // Emotional modulation of fabric-like microstructure using advanced BRDF principles
            if (emotionalState === "alert") {
              // Alert particles have minimal fabric-like reflection to preserve mirror sharpness
              // This maximizes directional reflection and minimizes light scattering
              // Similar to performance fabrics designed for minimal light diffusion
              return baseSheen * 0.7;
            } else if (emotionalState === "happy") {
              // Happy particles have enhanced fabric-like luster for pleasing edge highlights
              // This creates appealing anisotropic reflections that vary with viewing angle
              // Similar to premium decorative fabrics designed for visual appeal
              return baseSheen * 1.3;
            } else if (emotionalState === "thinking") {
              // Thinking particles have precisely controlled fabric-like properties
              // This creates consistent, predictable grazing angle reflections
              // Similar to technical fabrics with engineered reflective properties
              return baseSheen * 0.95;
            } else if (emotionalState === "confused") {
              // Confused particles have variable fabric-like characteristics that shift over time
              // This creates unpredictable edge highlights that change with viewing angle
              // Similar to fabrics with mixed fibers or variable weave patterns
              // Using stable animation without unpredictable values
              // Use a hardcoded seed for consistent animation
              const seedValue = 42; 
              const timeOffset = seedValue * 0.1;
              return baseSheen * (1.0 + Math.sin((globalTimeRef.current.value + timeOffset) * 1.2) * 0.5);
            } else if (emotionalState === "sad") {
              // Sad particles have enhanced fabric-like softness for a more subdued appearance
              // This creates softer, more absorptive edges with subtle diffusion
              // Similar to soft, muted fabrics that absorb more light than they reflect
              return baseSheen * 1.4;
            }
            
            return baseSheen;
          })()
        }
        
        // Advanced sheen roughness - controls the microsurface characteristics of the sheen layer
        sheenRoughness={
          (() => {
            // Base roughness for the fabric-like microstructure
            // Controls how sharp or diffused the velvet-like reflections appear
            // 0 = sharp defined fabric reflections, 1 = very diffused fabric reflections
            // Based on real-world fabric microsurface measurements:
            // 0.0-0.2 = Very fine, aligned fibers (satin, silk charmeuse)
            // 0.2-0.4 = Fine, semi-aligned fibers (quality cotton, light wool)
            // 0.4-0.6 = Medium fiber structure (standard fabrics)
            // 0.6-0.8 = Coarser fiber structure (heavier fabrics, light suede)
            // 0.8-1.0 = Random fiber alignment (heavy velvet, felt, suede)
            
            const baseSheenRough = 
              type === 'energy' ? 0.2 :    // Energy particles have fine, aligned fiber structure
              type === 'orbit' ? 0.35 :    // Orbit particles have semi-aligned fiber structure
              type === 'data' ? 0.5 :      // Data particles have moderate fabric structure
              type === 'ambient' ? 0.7 :   // Ambient particles have coarser fabric structure
              0.4;                         // Default - balanced fabric-like microsurface
            
            // Emotional influence on fabric microsurface structure with advanced textile physics
            if (emotionalState === "alert") {
              // Alert particles have more organized, aligned fiber structure
              // This creates more directional, controlled fabric reflections
              // Similar to high-performance technical fabrics with aligned fiber structure
              return Math.max(0.1, baseSheenRough * 0.7);
            } else if (emotionalState === "happy") {
              // Happy particles have optimally balanced fiber structure for appealing reflections
              // This creates visually pleasing grazing angle highlights
              // Similar to premium decorative fabrics with carefully engineered appearance
              return baseSheenRough * 0.9;
            } else if (emotionalState === "thinking") {
              // Thinking particles have precisely calibrated fiber alignment
              // This creates methodical, predictable fabric-like reflections
              // Similar to precisely manufactured technical textiles
              return baseSheenRough;
            } else if (emotionalState === "confused") {
              // Confused particles have variable, inconsistent fiber alignment
              // This creates unpredictable fabric-like reflections that change with viewing angle
              // Similar to fabrics with random or chaotic fiber orientation
              return baseSheenRough * (1.0 + Math.cos(globalTimeRef.current.value * 1.8) * 0.3);
            } else if (emotionalState === "sad") {
              // Sad particles have more random, diffused fiber structure
              // This creates softer, less defined fabric reflections
              // Similar to felt, velvet or other light-absorbing fabrics
              return Math.min(1.0, baseSheenRough * 1.3);
            }
            
            return baseSheenRough;
          })()
        }
        
        // Add advanced physically-based iridescence (thin-film interference effect like soap bubbles or oil on water)
        iridescence={
          (() => {
            // Iridescence calibrated by particle type using accurate thin-film interference physics
            // Higher values create stronger interference patterns, producing vibrant color shifts
            const baseIridescence = 
              type === 'energy' ? 0.75 :   // Energy particles have intense soap-bubble-like iridescence
              type === 'orbit' ? 0.45 :    // Orbit particles have strong CD/DVD-like iridescence
              type === 'data' ? 0.25 :     // Data particles have moderate mother-of-pearl-like iridescence
              type === 'ambient' ? 0.15 :  // Ambient particles have subtle beetle-shell-like iridescence
              0.35;                        // Default - balanced iridescence
            
            // Advanced emotional modulation of thin-film interference effects
            if (emotionalState === "happy") {
              // Happy particles have enhanced iridescence for visually pleasing rainbow effects
              // Increased color shifts represent joyful energy states
              return Math.min(0.9, baseIridescence * 1.4);
            } else if (emotionalState === "alert") {
              // Alert particles have dynamic iridescence that shifts with time
              // This creates attention-grabbing visual effects during alerts
              return baseIridescence * (1.1 + Math.sin(globalTimeRef.current.value * 0.6) * 0.2);
            } else if (emotionalState === "thinking") {
              // Thinking particles have a precise, controlled iridescence
              // This creates a more focused, less distracting visual effect
              return baseIridescence * 0.9;
            } else if (emotionalState === "confused") {
              // Confused particles have unpredictable iridescence patterns
              // Creates visual uncertainty that matches the emotional state
              return baseIridescence * (0.8 + Math.sin(globalTimeRef.current.value * 1.8) * 0.4);
            } else if (emotionalState === "sad") {
              // Sad particles have significantly reduced iridescence
              // This creates a more muted, subdued appearance
              return baseIridescence * 0.5;
            }
            
            return baseIridescence;
          })()
        }
        
        // Advanced iridescence IOR - precisely controls the thin-film interference pattern
        iridescenceIOR={
          (() => {
            // Base value - higher values create thinner, more tightly packed color bands
            // Uses real-world material physical properties for realism:
            // - Soap bubble: ~1.3
            // - Oil film: ~1.4-1.5
            // - Butterfly wings: ~1.5-1.8
            // - Beetle shells: ~1.6-2.0
            
            const baseIOR = 
              type === 'energy' ? 1.9 :    // Energy particles have beetle-like iridescence (tighter bands)
              type === 'orbit' ? 1.7 :     // Orbit particles have butterfly-like iridescence
              type === 'data' ? 1.5 :      // Data particles have oil-film-like iridescence
              type === 'ambient' ? 1.3 :   // Ambient particles have soap-bubble-like iridescence
              1.6;                         // Default - balanced iridescence pattern
              
            // Emotional influence on iridescence pattern density
            if (emotionalState === "alert") {
              // Alert particles have sharper, more defined bands for visual urgency
              return Math.min(2.2, baseIOR * 1.15);
            } else if (emotionalState === "happy") {
              // Happy particles have enhanced soap-bubble-like patterns
              return baseIOR * 1.05;
            } else if (emotionalState === "sad") {
              // Sad particles have slightly more diffused bands
              return Math.max(1.2, baseIOR * 0.9);
            }
              
            return baseIOR;
          })()
        }
        
        // Physical iridescence thickness - controls the spectral interference pattern (color bands)
        // Values represent nanometers of thin-film physical thickness
        iridescenceThicknessRange={
          (() => {
            // Each particle type has a calibrated range for realistic thin-film effects
            // Lower min = deeper colors, Higher max = more color variation
            if (type === 'energy') {
              return [160, 500];     // Energy particles have wide spectrum (full rainbow)
            } else if (type === 'orbit') {
              return [140, 450];     // Orbit particles have wide-mid spectrum 
            } else if (type === 'data') {
              return [120, 380];     // Data particles have mid spectrum
            } else if (type === 'ambient') {
              return [100, 320];     // Ambient particles have narrower spectrum
            }
            
            // Default range produces a balanced color distribution
            return [130, 400];
          })()
        }
        
        // Advanced physically-based light attenuation - controls subsurface scattering and light absorption
        attenuationDistance={
          (() => {
            // Physical distance light travels through material before being attenuated by 63%
            // Based on real-world optical density measurements from materials science:
            // - Diamond: ~20-30 units (extremely low attenuation)
            // - Clear glass: ~10-15 units (low attenuation)
            // - Colored glass: ~5-8 units (medium attenuation)
            // - Jade/thick plastics: ~3-5 units (high attenuation)
            // - Wax/marble: ~1-2 units (very high attenuation)
            const baseAtten = 
              type === 'energy' ? 12.0 :   // Energy particles have diamond-like light penetration
              type === 'orbit' ? 9.0 :     // Orbit particles have clear glass-like light penetration
              type === 'data' ? 6.5 :      // Data particles have colored glass-like light penetration
              type === 'ambient' ? 4.5 :   // Ambient particles have jade-like light penetration
              7.5;                         // Default - balanced light attenuation
              
            // Complex emotional influence on light absorption using advanced optical principles
            if (emotionalState === "alert") {
              // Alert particles have enhanced light penetration for increased visibility
              // This creates a more "glowing" appearance during alert states
              return baseAtten * 1.15;
            } else if (emotionalState === "happy") {
              // Happy particles have increased light penetration for a more vibrant, luminous appearance
              // This simulates increased energy states with enhanced transmission
              return baseAtten * 1.25;
            } else if (emotionalState === "thinking") {
              // Thinking particles have precisely controlled light penetration
              // This creates a more focused, controlled glow
              return baseAtten * 1.05;
            } else if (emotionalState === "confused") {
              // Confused particles have variable light absorption
              // This creates unpredictable translucency that shifts over time
              return baseAtten * (0.9 + Math.sin(globalTimeRef.current.value * 0.6) * 0.2);
            } else if (emotionalState === "sad") {
              // Sad particles absorb more light for a more muted, subdued appearance
              // This simulates decreased energy states with reduced light transmission
              return baseAtten * 0.65;
            }
            
            return baseAtten;
          })()
        }
        
        // Advanced attenuationColor - controls the color of absorbed/scattered light
        attenuationColor={
          (() => {
            // The color that light shifts toward as it passes through the material
            // Creates depth-dependent coloration based on particle type and emotional state
            // This is based on real-world selective spectral absorption in materials
            
            // Base colors calibrated by particle type for physically accurate light absorption
            if (type === 'energy') {
              // Energy particles have blue-white absorption (hot plasma-like)
              return new THREE.Color(0.8, 0.9, 1.0).multiplyScalar(
                emotionalState === "alert" ? 1.2 :
                emotionalState === "happy" ? 1.1 :
                emotionalState === "sad" ? 0.8 : 1.0
              );
            } else if (type === 'orbit') {
              // Orbit particles have cyan-blue absorption (quantum field-like)
              return new THREE.Color(0.7, 0.85, 0.95).multiplyScalar(
                emotionalState === "alert" ? 1.15 :
                emotionalState === "happy" ? 1.05 :
                emotionalState === "sad" ? 0.75 : 1.0
              );
            } else if (type === 'data') {
              // Data particles have green-blue absorption (digital-like)
              return new THREE.Color(0.6, 0.8, 0.9).multiplyScalar(
                emotionalState === "alert" ? 1.1 :
                emotionalState === "happy" ? 1.0 :
                emotionalState === "sad" ? 0.7 : 1.0
              );
            } else if (type === 'ambient') {
              // Ambient particles have soft blue absorption (atmospheric-like)
              return new THREE.Color(0.7, 0.8, 0.85).multiplyScalar(
                emotionalState === "alert" ? 1.05 :
                emotionalState === "happy" ? 0.95 :
                emotionalState === "sad" ? 0.65 : 1.0
              );
            }
            
            // Default - balanced blue-tinted light attenuation
            return new THREE.Color(0.7, 0.85, 0.9).multiplyScalar(
              emotionalState === "alert" ? 1.1 :
              emotionalState === "happy" ? 1.0 :
              emotionalState === "sad" ? 0.7 : 1.0
            );
          })()
        }
        
        // Advanced physically-based thickness - controls volumetric light behavior
        thickness={
          (() => {
            // Effective thickness simulates physical depth of material for accurate refraction/absorption
            // Based on materials science principles of optical depth:
            // - Optical depth is the physical distance light travels within a material
            // - Higher values create more apparent volume, internal scattering, and depth-dependent color
            // - Simulates optical pathlength for accurate light behavior in transparent/translucent materials
            
            const baseThickness = 
              type === 'energy' ? 3.5 :    // Energy particles appear highly volumetric (like thick glass)
              type === 'orbit' ? 2.5 :     // Orbit particles have significant volume (like crystal)
              type === 'data' ? 1.5 :      // Data particles have moderate volume (like thin glass)
              type === 'ambient' ? 0.8 :   // Ambient particles have subtle volume (like vapor)
              2.0;                         // Default - balanced optical thickness
            
            // Emotional modulation of apparent volume using physical optics principles
            if (emotionalState === "alert") {
              // Alert particles have enhanced volume for increased visibility
              // This creates a more substantial, attention-grabbing appearance
              return baseThickness * 1.2;
            } else if (emotionalState === "happy") {
              // Happy particles have increased optical depth for a fuller, more vibrant appearance
              // This simulates increased energy states with enhanced volume
              return baseThickness * 1.15;
            } else if (emotionalState === "thinking") {
              // Thinking particles have precisely controlled volume
              // This creates a more focused, consistent appearance
              return baseThickness * 1.05;
            } else if (emotionalState === "confused") {
              // Confused particles have variable optical depth
              // This creates unpredictable volumetric effects that shift over time
              return baseThickness * (0.95 + Math.sin(globalTimeRef.current.value * 0.6) * 0.15);
            } else if (emotionalState === "sad") {
              // Sad particles have reduced apparent volume for a more delicate, subdued appearance
              // This simulates decreased energy states with reduced physical presence
              return baseThickness * 0.85;
            }
              
            return baseThickness;
          })()
        }
      />
    </mesh>
  );
};

// Define interface for HologramProjection props
interface HologramProjectionProps {
  text: string;
  color: THREE.Color | string | number;
  emotionalState?: EmotionalState;
}

// Hologram projection component
// Enhanced hologram projection with emotion-responsive effects
const HologramProjection: React.FC<HologramProjectionProps> = ({ 
  text, 
  color,
  emotionalState = "neutral"
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  // Time updates are now centralized in the RobotTimeKeeper component
  // This prevents multiple conflicting updates to the global time reference

  // Enhanced animation with spring-mass-damper system
  useFrame(() => {
    if (!groupRef.current) return;
    
    // Use global time reference for consistent animations across components
    const t = globalTimeRef.current.value;
    
    // Set animation parameters based on emotional state
    const frequency = 
      emotionalState === "alert" ? 3.0 :
      emotionalState === "happy" ? 2.5 :
      emotionalState === "thinking" ? 1.5 :
      emotionalState === "confused" ? (2.0 + Math.sin(t * 0.3) * 1.0) : // Variable for confused
      emotionalState === "sad" ? 1.0 :
      2.0; // default
      
    const amplitude = 
      emotionalState === "alert" ? 0.015 :
      emotionalState === "happy" ? 0.012 :
      emotionalState === "thinking" ? 0.008 :
      emotionalState === "confused" ? 0.014 :
      emotionalState === "sad" ? 0.006 :
      0.01; // default
      
    const flickerSpeed = 
      emotionalState === "alert" ? 8.0 :
      emotionalState === "confused" ? 6.0 + Math.sin(t) * 3.0 : // Erratic for confused
      emotionalState === "sad" ? 3.0 :
      5.0; // default
      
    const flickerIntensity = 
      emotionalState === "alert" ? 0.3 :
      emotionalState === "confused" ? 0.25 :
      emotionalState === "sad" ? 0.15 :
      0.2; // default
      
    // Apply spring-mass-damper floating animation
    const dampingFactor = 
      emotionalState === "alert" ? 0.3 :
      emotionalState === "happy" ? 0.4 :
      emotionalState === "sad" ? 0.8 :
      emotionalState === "confused" ? (0.5 + Math.sin(t * 0.3) * 0.2) : // Variable for confused
      0.5; // default
      
    // Create damped spring motion effect
    const displacement = Math.sin(t * frequency) * Math.exp(-dampingFactor * (t % 5));
    groupRef.current.position.y = displacement * amplitude;
    
    // Add subtle rotation based on emotional state
    groupRef.current.rotation.z = Math.sin(t * frequency * 0.5) * 0.02;
    
    // Apply horizontal micro-movements for certain emotional states
    if (emotionalState === "confused" || emotionalState === "alert") {
      groupRef.current.position.x = Math.sin(t * frequency * 1.2) * (amplitude * 0.5);
    }
    
    // Apply material opacity changes if material is available
    if (materialRef.current) {
      materialRef.current.opacity = 0.7 + Math.sin(t * flickerSpeed) * flickerIntensity;
    }
  });
  
  // Calculate hologram beam properties based on emotional state
  const beamProps = useMemo(() => {
    // Base beam geometry
    const baseRadius = [0.01, 0.05]; // [top, bottom]
    const baseHeight = 0.4;
    
    // Modify based on emotional state
    let radius = [...baseRadius];
    let height = baseHeight;
    let opacity = 0.3;
    let beamColor = safeColor(color).clone();
    
    if (emotionalState === "alert") {
      radius[1] *= 1.2; // Wider bottom
      height *= 1.1;    // Taller
      opacity = 0.4;    // More visible
      // Add reddish tint
      beamColor.r = Math.min(1.0, beamColor.r * 1.2);
    } else if (emotionalState === "happy") {
      radius[1] *= 1.1; // Slightly wider
      height *= 1.05;   // Slightly taller
      opacity = 0.35;   // Slightly more visible
      // Add greenish tint
      beamColor.g = Math.min(1.0, beamColor.g * 1.1);
    } else if (emotionalState === "thinking") {
      radius[0] *= 0.9; // Narrower top
      radius[1] *= 1.1; // Wider bottom
      opacity = 0.25;   // Subtler
      // Add bluish tint
      beamColor.b = Math.min(1.0, beamColor.b * 1.1);
    } else if (emotionalState === "confused") {
      radius[0] *= 1.1; // Wider top
      radius[1] *= 0.9; // Narrower bottom (inverted)
      height *= 0.95;   // Shorter
      opacity = 0.35;   // More visible
      // Add purplish tint
      beamColor.r = Math.min(1.0, beamColor.r * 1.05);
      beamColor.b = Math.min(1.0, beamColor.b * 1.1);
    } else if (emotionalState === "sad") {
      radius[0] *= 0.9; // Narrower top
      radius[1] *= 0.9; // Narrower bottom
      height *= 0.9;    // Shorter
      opacity = 0.2;    // Subtler
      // Add bluish tint
      beamColor.r = Math.max(0.0, beamColor.r * 0.9);
      beamColor.g = Math.max(0.0, beamColor.g * 0.9);
      beamColor.b = Math.min(1.0, beamColor.b * 1.1);
    }
    
    return {
      radius,
      height,
      opacity,
      color: beamColor
    };
  }, [color, emotionalState]);
  
  // Generate CSS class names for hologram based on emotional state using CSS modules
  const hologramClasses = useMemo(() => {
    let baseClasses = "w-32 h-32 rounded bg-opacity-20 flex items-center justify-center p-2 text-center font-mono text-xs border border-opacity-30 transform";
    
    // Add core effect class from the CSS module
    baseClasses += ` ${styles['hologram-effect']}`;
    
    // Add emotional state classes from the CSS module
    if (emotionalState === "alert") {
      baseClasses += ` ${styles['hologram-alert']}`;
      return `${baseClasses} bg-red-500 text-red-300 border-red-400`;
    } else if (emotionalState === "happy") {
      baseClasses += ` ${styles['hologram-happy']}`;
      return `${baseClasses} bg-green-500 text-green-300 border-green-400`;
    } else if (emotionalState === "thinking") {
      baseClasses += ` ${styles['hologram-thinking']}`;
      return `${baseClasses} bg-blue-600 text-blue-300 border-blue-500`;
    } else if (emotionalState === "confused") {
      baseClasses += ` ${styles['hologram-confused']}`;
      return `${baseClasses} bg-purple-500 text-purple-300 border-purple-400`;
    } else if (emotionalState === "sad") {
      baseClasses += ` ${styles['hologram-sad']}`;
      return `${baseClasses} bg-indigo-500 text-indigo-300 border-indigo-400`;
    } else {
      // Default - neutral
      baseClasses += ` ${styles['hologram-neutral']}`;
      return `${baseClasses} bg-blue-500 text-blue-300 border-blue-400`;
    }
  }, [emotionalState]);
  
  return (
    <group ref={groupRef} position={[0.7, 0.5, 0]} rotation={[0, -Math.PI / 4, 0]}>
      {/* Enhanced hologram beam with emotional variations */}
      <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry 
          args={[
            beamProps.radius[0], 
            beamProps.radius[1], 
            beamProps.height, 
            8, 1, true
          ]} 
        />
        <meshBasicMaterial 
          ref={materialRef}
          color={beamProps.color} 
          transparent 
          opacity={beamProps.opacity} 
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Enhanced hologram content with emotion-responsive styling */}
      <Html
        position={[0.4, 0, 0]}
        className="select-none pointer-events-none"
        transform
        occlude
        distanceFactor={
          emotionalState === "alert" ? 0.45 :  // Closer/more prominent
          emotionalState === "sad" ? 0.55 :    // Further/less prominent
          0.5                                  // Default
        }
      >
        <div className={hologramClasses}>
          {/* Apply character-by-character animation effects based on emotional state */}
          {text.split('').map((char, index) => {
            // Character animation class based on emotional state
            let charClass = '';
            if (emotionalState === "alert") {
              charClass = styles.alertChar;
            } else if (emotionalState === "happy") {
              charClass = styles.happyChar;
            } else if (emotionalState === "thinking") {
              charClass = styles.thinkingChar;
            } else if (emotionalState === "sad") {
              charClass = styles.sadChar;
            } else if (emotionalState === "confused") {
              charClass = styles.confusedChar;
            } else {
              charClass = styles.flutterChar;
            }
            
            return (
              <span 
                key={index} 
                className={charClass}
                style={{ '--char-index': index } as React.CSSProperties}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </div>
      </Html>
    </group>
  );
};

// Create a more robust component with client-side only rendering
// This approach prevents hydration mismatches by using ClientOnly and dynamic imports

// The main renderer component with proper client-side handling
const ClientSideRenderer: React.FC<ClientSideRendererProps> = (props) => {
  // Provide a simple placeholder during SSR
  const ssrFallback = (
    <div style={{ 
      width: props.dimensions.width, 
      height: props.dimensions.height,
      backgroundColor: '#1a1a2e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#4e7ac7',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <div>Loading 3D Robot</div>
    </div>
  );
  
  // Use the ClientOnly wrapper to prevent hydration mismatches
  // With a small delay to ensure DOM is fully ready
  return (
    <ClientOnly fallback={ssrFallback} delayMs={50}>
      <DynamicClientRenderer {...props} />
    </ClientOnly>
  );
};

// Dynamic import of the renderer component
const DynamicClientRenderer = dynamic(
  () => Promise.resolve(ClientSideRendererComponent), 
  { ssr: false }
);

// Export the main component with proper client-side only rendering
// This prevents hydration mismatches by ensuring the component only renders on the client
const AstroBotMascot3D = dynamic(
  () => Promise.resolve(AstroBotMascot3DBase),
  { ssr: false }
);

export default AstroBotMascot3D;