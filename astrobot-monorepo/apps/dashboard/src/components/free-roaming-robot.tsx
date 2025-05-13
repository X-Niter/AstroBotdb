'use client';

import { useState, useEffect } from 'react';
import { Portal } from '../utils/portal';
import AstroBotMascot3D, { ANIMATION_SEQUENCES } from './astro-bot-mascot-3d-simplified';
import SafeRobot3D from './safe-robot-3d';
import RealisticRobotModel from './realistic-robot-model';
import { EmotionalState, ParticleDisplay } from '../utils/types';

interface Position {
  x: number;
  y: number;
}

interface FreeRoamingRobotProps {
  initialPosition?: Position;
  size?: 'small' | 'default' | 'large' | 'xlarge';
  defaultAnimation?: string;
  autoMove?: boolean;
  moveInterval?: number; // Time in ms between movements
  homePosition?: Position; // The position the robot will return to
  stayNearHome?: boolean; // Whether the robot should stay near its home
  maxDistance?: number; // Max distance from home if stayNearHome is true
  emotionalState?: EmotionalState; // Robot's emotional state
  showParticles?: ParticleDisplay; // Particle effects
  hologramText?: string | null; // Text to display as hologram
  useFuturisticModel?: boolean; // Whether to use the safe futuristic model
  useRealisticModel?: boolean; // Whether to use the super realistic robot model
}

/**
 * FreeRoamingRobot - A component that renders the AstroBot mascot
 * with complete freedom to move anywhere on the screen.
 * 
 * This component uses portals to break out of the normal document flow,
 * allowing the robot to appear as if it's a separate entity from the website.
 */
export default function FreeRoamingRobot({
  initialPosition = { x: 100, y: 100 },
  size = 'default',
  defaultAnimation = ANIMATION_SEQUENCES.IDLE,
  autoMove = false,
  moveInterval = 10000, // 10 seconds between movements by default
  homePosition = { x: 100, y: 100 },
  stayNearHome = true,
  maxDistance = 300, // Max 300px from home position
  emotionalState = 'neutral',
  showParticles = 'temporary',
  hologramText = null,
  useFuturisticModel = false,
  useRealisticModel = true, // Default to the realistic model
}: FreeRoamingRobotProps) {
  // State for robot's position
  const [position, setPosition] = useState<Position>(initialPosition);
  // State for robot's animation
  const [animation, setAnimation] = useState<string>(defaultAnimation);
  // State for window dimensions
  const [windowSize, setWindowSize] = useState<{width: number, height: number} | null>(null);
  
  // Initialize window size and handle window resizing
  useEffect(() => {
    // Safety check for browser environment
    if (typeof window === 'undefined') return;
    
    // Update window dimensions
    const updateWindowDimensions = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      // When window resizes, ensure robot stays within safe boundaries
      adjustRobotPosition();
    };
    
    // Initialize window size
    updateWindowDimensions();
    
    // Add event listener for resize
    window.addEventListener('resize', updateWindowDimensions);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateWindowDimensions);
  }, [position, size]);
  
  // Adjust robot position to ensure it stays within viewport bounds
  const adjustRobotPosition = () => {
    if (typeof window === 'undefined') return;
    
    // Get dimensions based on robot size
    const robotWidth = size === 'small' ? 60 : size === 'default' ? 120 : size === 'large' ? 180 : 240;
    const robotHeight = size === 'small' ? 110 : size === 'default' ? 220 : size === 'large' ? 320 : 440;
    
    // Add substantial safety padding to prevent clipping
    const safetyPaddingHorizontal = Math.max(200, window.innerWidth * 0.2); // At least 200px or 20% of viewport width
    const safetyPaddingVertical = Math.max(200, window.innerHeight * 0.2); // At least 200px or 20% of viewport height
    
    // Final padding combines robot size plus safety margin
    const horizontalPadding = robotWidth + safetyPaddingHorizontal;
    const verticalPadding = robotHeight + safetyPaddingVertical;
    
    // Apply boundary constraints
    const newX = Math.max(horizontalPadding, Math.min(window.innerWidth - horizontalPadding, position.x));
    const newY = Math.max(verticalPadding, Math.min(window.innerHeight - verticalPadding, position.y));
    
    // Only update position if it changed
    if (newX !== position.x || newY !== position.y) {
      setPosition({ x: newX, y: newY });
    }
  };
  
  // Handle automatic movement
  useEffect(() => {
    if (!autoMove) return;
    
    const moveRobot = () => {
      // First change animation to walking
      setAnimation(ANIMATION_SEQUENCES.WALK);
      
      // Wait a bit then calculate new position
      setTimeout(() => {
        const newPosition = calculateNewPosition();
        setPosition(newPosition);
        
        // After reaching new position, return to idle
        setTimeout(() => {
          setAnimation(ANIMATION_SEQUENCES.IDLE);
        }, 1000);
      }, 500);
    };
    
    // Calculate a new random position, respecting constraints with safe margins
    const calculateNewPosition = (): Position => {
      // Get dimensions based on robot size to create proper padding
      const robotWidth = size === 'small' ? 60 : size === 'default' ? 120 : size === 'large' ? 180 : 240;
      const robotHeight = size === 'small' ? 110 : size === 'default' ? 220 : size === 'large' ? 320 : 440;
      
      // Add substantial padding to ensure robot is never clipped
      // Using a percentage of viewport dimensions for better scaling
      const safetyPaddingHorizontal = Math.max(200, window.innerWidth * 0.2); // At least 200px or 20% of viewport width
      const safetyPaddingVertical = Math.max(200, window.innerHeight * 0.2); // At least 200px or 20% of viewport height
      
      // Final padding combines robot size plus safety margin
      const horizontalPadding = robotWidth + safetyPaddingHorizontal;
      const verticalPadding = robotHeight + safetyPaddingVertical;
      
      let newX, newY;
      
      if (stayNearHome) {
        // Random position within maxDistance of home
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * maxDistance;
        newX = homePosition.x + Math.cos(angle) * distance;
        newY = homePosition.y + Math.sin(angle) * distance;
      } else {
        // Random position anywhere on screen
        newX = Math.random() * (window.innerWidth - horizontalPadding * 2) + horizontalPadding;
        newY = Math.random() * (window.innerHeight - verticalPadding * 2) + verticalPadding;
        return { x: newX, y: newY };
      }
      
      // Apply protective boundary constraints regardless of calculation method
      // Ensure robot never gets clipped - apply safety margin to all edges
      newX = Math.max(horizontalPadding, Math.min(window.innerWidth - horizontalPadding, newX));
      newY = Math.max(verticalPadding, Math.min(window.innerHeight - verticalPadding, newY));
      
      return { x: newX, y: newY };
    };
    
    // Set up movement interval
    const intervalId = setInterval(moveRobot, moveInterval);
    return () => clearInterval(intervalId);
  }, [autoMove, moveInterval, homePosition, stayNearHome, maxDistance]);
  
  // Handle robot interaction
  const handleInteraction = (type: string) => {
    if (type === 'hover_start') {
      setAnimation(ANIMATION_SEQUENCES.WAVE);
    } else if (type === 'hover_end') {
      setTimeout(() => {
        setAnimation(ANIMATION_SEQUENCES.IDLE);
      }, 2000);
    }
  };
  
  return (
    <Portal targetId="robot-layer">
      <div 
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          transition: 'left 1s ease-in-out, top 1s ease-in-out',
          pointerEvents: 'auto', // Enable interaction with the robot
          zIndex: 999,
        }}
      >
        {useRealisticModel ? (
          <div style={{ width: size === 'small' ? '250px' : size === 'default' ? '350px' : size === 'large' ? '450px' : '600px', 
                         height: size === 'small' ? '400px' : size === 'default' ? '600px' : size === 'large' ? '800px' : '1000px' }}>
            <RealisticRobotModel
              animation={animation}
              emotionalState={emotionalState}
              showParticles={showParticles}
              hologramText={hologramText}
              interactive={true}
              highQuality={true}
              onComplete={() => {
                if (animation !== ANIMATION_SEQUENCES.IDLE) {
                  setTimeout(() => setAnimation(ANIMATION_SEQUENCES.IDLE), 500);
                }
              }}
            />
          </div>
        ) : useFuturisticModel ? (
          <div style={{ width: size === 'small' ? '180px' : size === 'default' ? '280px' : size === 'large' ? '380px' : '500px', 
                         height: size === 'small' ? '320px' : size === 'default' ? '500px' : size === 'large' ? '680px' : '800px' }}>
            <SafeRobot3D
              currentSequence={animation}
              emotionalState={emotionalState}
              showParticles={showParticles}
              hologramText={hologramText}
              animate={true}
              interactive={true}
              highQuality={true}
              onComplete={() => {
                if (animation !== ANIMATION_SEQUENCES.IDLE) {
                  setTimeout(() => setAnimation(ANIMATION_SEQUENCES.IDLE), 500);
                }
              }}
            />
          </div>
        ) : (
          <AstroBotMascot3D 
            size={size}
            animate={true}
            animationSequence={animation}
            onInteraction={handleInteraction}
            highQuality={true}
            showParticles={showParticles}
          />
        )}
      </div>
    </Portal>
  );
}