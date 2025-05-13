"use client";

import React, { useRef, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';

// Import global time reference from the centralized timekeeper
import { globalTimeRef } from './robot-timekeeper';
import { EmotionalState } from '../utils/types';

// Enhanced animator props with emotion support
interface RobotAnimatorProps {
  isPaused?: boolean;
  timeScale?: number;
  emotionalState?: EmotionalState;
  intensity?: number; // 0-1 value to control emotional intensity
  transitionSpeed?: number; // Control how quickly emotions blend (seconds)
  onUpdate?: (elapsedTime: number, emotionData: EmotionAnimationData) => void;
}

// Comprehensive emotion animation data for fine-tuned control
export interface EmotionAnimationData {
  // Core animation parameters
  baseFrequency: number;       // Base oscillation frequency
  amplitudeMultiplier: number; // Overall animation amplitude
  energyLevel: number;         // Overall energy/activity level (0-1)
  
  // Micro-movement parameters
  microMovements: {
    frequency: number;         // Frequency of small detail movements
    amplitude: number;         // Intensity of micro movements
    complexity: number;        // Complexity of the movement pattern (0-1)
    jitter: number;            // Random jitter amount (0-1)
  };
  
  // Dynamic response parameters
  dynamicResponse: {
    reactivity: number;        // How quickly the robot reacts (0-1)
    overshoot: number;         // Tendency to overshoot movements (0-1)
    recovery: number;          // Recovery speed from movements (0-1)
    damping: number;           // Movement damping factor
  };
  
  // Asymmetry parameters
  asymmetry: {
    lateral: number;           // Left-right asymmetry (-1 to 1)
    vertical: number;          // Top-bottom asymmetry (-1 to 1)
    temporal: number;          // Timing asymmetry (0-1)
  };
  
  // Physics-based behavior
  physics: {
    gravity: number;           // Simulated gravity effect
    momentum: number;          // Momentum preservation (0-1)
    elasticity: number;        // Springiness of movements (0-1)
    resistance: number;        // Movement resistance/friction
  };
  
  // Current emotion blending data
  blending: {
    current: EmotionalState;   // Current dominant emotion
    previous: EmotionalState;  // Previous emotion being blended from
    progress: number;          // Blend progress (0-1)
    isTransitioning: boolean;  // Whether currently in transition
  };
}

// Comprehensive emotion configuration database with precise parameters for each emotional state
const EMOTION_ANIMATION_PROFILES: Record<EmotionalState, Omit<EmotionAnimationData, 'blending'>> = {
  // ALERT: Rapid, responsive, vigilant movements with high reactivity and energy
  "alert": {
    baseFrequency: 3.8,
    amplitudeMultiplier: 1.3,
    energyLevel: 0.9,
    
    microMovements: {
      frequency: 12.0,      // Very fast micro-movements
      amplitude: 0.8,       // Strong micro-expressions
      complexity: 0.7,      // Moderately complex patterns
      jitter: 0.6           // Noticeable jitter for urgency
    },
    
    dynamicResponse: {
      reactivity: 0.95,     // Extremely responsive
      overshoot: 0.7,       // Moderate overshoot for quickness
      recovery: 0.85,       // Fast recovery
      damping: 0.3          // Low damping for responsive movements
    },
    
    asymmetry: {
      lateral: 0.3,         // Slight right-side focus
      vertical: 0.2,        // Slight upward attention
      temporal: 0.6         // Moderate timing asymmetry
    },
    
    physics: {
      gravity: 0.2,         // Minimal gravity effect
      momentum: 0.6,        // Moderate momentum
      elasticity: 0.85,     // High elasticity for quick responses
      resistance: 0.3       // Low resistance for fast movements
    }
  },
  
  // HAPPY: Smooth, bouncy, expansive movements with harmonic patterns
  "happy": {
    baseFrequency: 2.5,
    amplitudeMultiplier: 1.2,
    energyLevel: 0.75,
    
    microMovements: {
      frequency: 5.0,       // Moderate, pleasant frequency
      amplitude: 0.7,       // Noticeable micro-expressions
      complexity: 0.6,      // Moderately complex patterns
      jitter: 0.2           // Low jitter for smoothness
    },
    
    dynamicResponse: {
      reactivity: 0.7,      // Responsive but not twitchy
      overshoot: 0.6,       // Moderate overshoot for bounciness
      recovery: 0.65,       // Medium-fast recovery
      damping: 0.4          // Medium damping for controlled bounciness
    },
    
    asymmetry: {
      lateral: 0.0,         // Balanced left-right
      vertical: 0.4,        // Upward bias for optimism
      temporal: 0.3         // Low timing asymmetry
    },
    
    physics: {
      gravity: 0.3,         // Low gravity effect
      momentum: 0.7,        // Moderate-high momentum
      elasticity: 0.8,      // High elasticity for bouncy feel
      resistance: 0.4       // Low-medium resistance
    }
  },
  
  // THINKING: Precise, measured, structured movements with deliberate patterns
  "thinking": {
    baseFrequency: 1.75,
    amplitudeMultiplier: 0.85,
    energyLevel: 0.6,
    
    microMovements: {
      frequency: 3.5,       // Slower, deliberate frequency
      amplitude: 0.4,       // Subtle micro-expressions
      complexity: 0.9,      // Highly complex patterns
      jitter: 0.15          // Minimal jitter for precision
    },
    
    dynamicResponse: {
      reactivity: 0.5,      // Moderate reactivity
      overshoot: 0.2,       // Minimal overshoot for precision
      recovery: 0.6,        // Medium recovery
      damping: 0.7          // High damping for controlled movements
    },
    
    asymmetry: {
      lateral: 0.4,         // Right-side bias (analytical)
      vertical: -0.1,       // Slight downward focus
      temporal: 0.2         // Low timing asymmetry
    },
    
    physics: {
      gravity: 0.4,         // Medium gravity effect
      momentum: 0.5,        // Balanced momentum
      elasticity: 0.4,      // Low elasticity for deliberate movements
      resistance: 0.6       // Medium-high resistance
    }
  },
  
  // CONFUSED: Erratic, inconsistent, unpredictable movements with variable patterns
  "confused": {
    baseFrequency: 2.2,
    amplitudeMultiplier: 1.0,
    energyLevel: 0.65,
    
    microMovements: {
      frequency: 4.0,       // Medium frequency base
      amplitude: 0.6,       // Noticeable micro-expressions
      complexity: 0.8,      // High complexity for unpredictability
      jitter: 0.8           // High jitter for confusion
    },
    
    dynamicResponse: {
      reactivity: 0.6,      // Medium-high reactivity
      overshoot: 0.8,       // High overshoot for erratic movements
      recovery: 0.5,        // Medium recovery
      damping: 0.3          // Low damping for unpredictability
    },
    
    asymmetry: {
      lateral: -0.2,        // Shifting left-right bias
      vertical: -0.3,       // Downward focus
      temporal: 0.9         // High timing asymmetry
    },
    
    physics: {
      gravity: 0.5,         // Medium gravity effect
      momentum: 0.4,        // Lower momentum for direction changes
      elasticity: 0.6,      // Medium elasticity
      resistance: 0.5       // Medium resistance
    }
  },
  
  // SAD: Slow, heavy, downward-trending movements with subdued energy
  "sad": {
    baseFrequency: 1.2,
    amplitudeMultiplier: 0.7,
    energyLevel: 0.35,
    
    microMovements: {
      frequency: 2.0,       // Slow frequency
      amplitude: 0.3,       // Subtle micro-expressions
      complexity: 0.4,      // Low complexity
      jitter: 0.1           // Minimal jitter
    },
    
    dynamicResponse: {
      reactivity: 0.4,      // Low reactivity
      overshoot: 0.3,       // Low overshoot
      recovery: 0.3,        // Slow recovery
      damping: 0.8          // High damping for sluggish movement
    },
    
    asymmetry: {
      lateral: -0.3,        // Left side bias (emotional)
      vertical: -0.5,       // Strong downward bias
      temporal: 0.4         // Medium timing asymmetry
    },
    
    physics: {
      gravity: 0.8,         // Strong gravity effect
      momentum: 0.8,        // High momentum
      elasticity: 0.2,      // Low elasticity
      resistance: 0.8       // High resistance/friction
    }
  },
  
  // NEUTRAL: Balanced, consistent, harmonized movements with moderate variation
  "neutral": {
    baseFrequency: 2.0,
    amplitudeMultiplier: 1.0,
    energyLevel: 0.5,
    
    microMovements: {
      frequency: 3.0,       // Balanced frequency
      amplitude: 0.5,       // Moderate micro-expressions
      complexity: 0.5,      // Medium complexity
      jitter: 0.3           // Low-medium jitter
    },
    
    dynamicResponse: {
      reactivity: 0.6,      // Medium reactivity
      overshoot: 0.4,       // Low-medium overshoot
      recovery: 0.5,        // Medium recovery
      damping: 0.5          // Medium damping
    },
    
    asymmetry: {
      lateral: 0.0,         // Balanced left-right
      vertical: 0.0,        // Balanced vertical
      temporal: 0.3         // Low timing asymmetry
    },
    
    physics: {
      gravity: 0.5,         // Medium gravity effect
      momentum: 0.6,        // Medium momentum
      elasticity: 0.5,      // Medium elasticity
      resistance: 0.5       // Medium resistance
    }
  }
};

/**
 * Enhanced RobotAnimator - A dedicated component for handling animation timing with emotion-responsive behaviors
 * This separates animation logic from rendering to avoid hook-related issues
 */
const RobotAnimator: React.FC<RobotAnimatorProps> = ({
  isPaused = false,
  timeScale = 1.0,
  emotionalState = "neutral",
  intensity = 1.0,
  transitionSpeed = 0.5,
  onUpdate
}) => {
  // Use a local ref to track the last frame time
  const lastFrameTime = useRef(0);
  
  // Track previous emotional state for blending
  const prevEmotionalStateRef = useRef<EmotionalState>(emotionalState);
  
  // Track transition progress
  const transitionProgressRef = useRef(1.0); // 1.0 means no transition/complete
  
  // Current emotion data ref to avoid recreation each frame
  const emotionDataRef = useRef<EmotionAnimationData>({
    ...EMOTION_ANIMATION_PROFILES[emotionalState],
    blending: {
      current: emotionalState,
      previous: emotionalState,
      progress: 1.0,
      isTransitioning: false
    }
  });
  
  // Handle emotional state changes
  useEffect(() => {
    if (emotionalState !== prevEmotionalStateRef.current) {
      // Start new transition
      transitionProgressRef.current = 0.0;
      
      // Update blending data
      emotionDataRef.current.blending = {
        current: emotionalState,
        previous: prevEmotionalStateRef.current,
        progress: 0.0,
        isTransitioning: true
      };
      
      // Store new emotional state as previous for next change
      prevEmotionalStateRef.current = emotionalState;
    }
  }, [emotionalState]);
  
  // Update animation time in the frame loop with emotion blending
  useFrame((_, delta) => {
    if (isPaused) return;
    
    // Scale delta time by timeScale for speed control
    const scaledDelta = delta * timeScale;
    
    // Update global time reference for all components to use
    globalTimeRef.current.value += scaledDelta;
    
    // Calculate elapsed time since last frame
    const elapsedTime = globalTimeRef.current.value - lastFrameTime.current;
    lastFrameTime.current = globalTimeRef.current.value;
    
    // Handle emotion blending during transitions
    if (emotionDataRef.current.blending.isTransitioning) {
      // Update transition progress
      transitionProgressRef.current += scaledDelta / transitionSpeed;
      
      // Clamp and update progress
      if (transitionProgressRef.current >= 1.0) {
        transitionProgressRef.current = 1.0;
        emotionDataRef.current.blending.isTransitioning = false;
      }
      
      // Update blend progress in emotion data
      emotionDataRef.current.blending.progress = transitionProgressRef.current;
      
      // Get the two emotion profiles to blend
      const prevProfile = EMOTION_ANIMATION_PROFILES[emotionDataRef.current.blending.previous];
      const currProfile = EMOTION_ANIMATION_PROFILES[emotionDataRef.current.blending.current];
      
      // Apply smooth blend using MathUtils.smoothstep for easing
      const ease = MathUtils.smoothstep(transitionProgressRef.current, 0, 1);
      
      // Blend all animation parameters
      // Base parameters
      emotionDataRef.current.baseFrequency = MathUtils.lerp(
        prevProfile.baseFrequency, 
        currProfile.baseFrequency, 
        ease
      );
      
      emotionDataRef.current.amplitudeMultiplier = MathUtils.lerp(
        prevProfile.amplitudeMultiplier, 
        currProfile.amplitudeMultiplier, 
        ease
      );
      
      emotionDataRef.current.energyLevel = MathUtils.lerp(
        prevProfile.energyLevel, 
        currProfile.energyLevel, 
        ease
      );
      
      // Micro movements
      emotionDataRef.current.microMovements = {
        frequency: MathUtils.lerp(
          prevProfile.microMovements.frequency,
          currProfile.microMovements.frequency,
          ease
        ),
        amplitude: MathUtils.lerp(
          prevProfile.microMovements.amplitude,
          currProfile.microMovements.amplitude,
          ease
        ),
        complexity: MathUtils.lerp(
          prevProfile.microMovements.complexity,
          currProfile.microMovements.complexity,
          ease
        ),
        jitter: MathUtils.lerp(
          prevProfile.microMovements.jitter,
          currProfile.microMovements.jitter,
          ease
        )
      };
      
      // Dynamic response
      emotionDataRef.current.dynamicResponse = {
        reactivity: MathUtils.lerp(
          prevProfile.dynamicResponse.reactivity,
          currProfile.dynamicResponse.reactivity,
          ease
        ),
        overshoot: MathUtils.lerp(
          prevProfile.dynamicResponse.overshoot,
          currProfile.dynamicResponse.overshoot,
          ease
        ),
        recovery: MathUtils.lerp(
          prevProfile.dynamicResponse.recovery,
          currProfile.dynamicResponse.recovery,
          ease
        ),
        damping: MathUtils.lerp(
          prevProfile.dynamicResponse.damping,
          currProfile.dynamicResponse.damping,
          ease
        )
      };
      
      // Asymmetry
      emotionDataRef.current.asymmetry = {
        lateral: MathUtils.lerp(
          prevProfile.asymmetry.lateral,
          currProfile.asymmetry.lateral,
          ease
        ),
        vertical: MathUtils.lerp(
          prevProfile.asymmetry.vertical,
          currProfile.asymmetry.vertical,
          ease
        ),
        temporal: MathUtils.lerp(
          prevProfile.asymmetry.temporal,
          currProfile.asymmetry.temporal,
          ease
        )
      };
      
      // Physics
      emotionDataRef.current.physics = {
        gravity: MathUtils.lerp(
          prevProfile.physics.gravity,
          currProfile.physics.gravity,
          ease
        ),
        momentum: MathUtils.lerp(
          prevProfile.physics.momentum,
          currProfile.physics.momentum,
          ease
        ),
        elasticity: MathUtils.lerp(
          prevProfile.physics.elasticity,
          currProfile.physics.elasticity,
          ease
        ),
        resistance: MathUtils.lerp(
          prevProfile.physics.resistance,
          currProfile.physics.resistance,
          ease
        )
      };
    }
    
    // Apply intensity scaling to the emotion data
    const scaledEmotionData = {
      ...emotionDataRef.current,
      
      // Scale parameters affected by intensity
      amplitudeMultiplier: emotionDataRef.current.amplitudeMultiplier * intensity,
      energyLevel: emotionDataRef.current.energyLevel * intensity,
      
      microMovements: {
        ...emotionDataRef.current.microMovements,
        amplitude: emotionDataRef.current.microMovements.amplitude * intensity
      },
      
      dynamicResponse: {
        ...emotionDataRef.current.dynamicResponse,
        overshoot: emotionDataRef.current.dynamicResponse.overshoot * intensity
      }
    };
    
    // Call update callback if provided with the complete emotion data
    if (onUpdate) {
      onUpdate(elapsedTime, scaledEmotionData);
    }
  });
  
  // This is a utility component that doesn't render anything
  return null;
};

export default RobotAnimator;