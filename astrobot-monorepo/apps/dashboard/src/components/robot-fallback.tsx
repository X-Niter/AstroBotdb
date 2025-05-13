"use client";

import React from 'react';

// Import the standardized types
import { EmotionalState, ComponentSize } from '../utils/types';

/**
 * RobotFallback - A visually appealing fallback component displayed when 3D rendering fails
 * 
 * This component provides a degraded but still visually consistent representation
 * of the robot mascot when the 3D version cannot be rendered due to errors or
 * performance issues.
 */
interface RobotFallbackProps {
  error?: Error | null;
  message?: string;
  size?: ComponentSize;
  emotionalState?: EmotionalState;
  retry?: () => void;
}

const RobotFallback: React.FC<RobotFallbackProps> = ({
  error,
  message = "Could not render the 3D robot",
  size = 'default',
  emotionalState = 'neutral',
  retry
}) => {
  // Determine container dimensions based on size
  const dimensions = {
    small: 'w-28 h-28',
    default: 'w-48 h-48',
    large: 'w-64 h-64',
    xlarge: 'w-96 h-96'
  }[size];

  // Pick appropriate emotion icon
  const emotionEmoji = {
    neutral: '😐',
    happy: '😊',
    thinking: '🤔',
    alert: '⚠️',
    sad: '😔',
    confused: '😵'
  }[emotionalState];

  // Set color based on emotional state
  const emotionColor = {
    neutral: 'bg-blue-500',
    happy: 'bg-green-500',
    thinking: 'bg-purple-500',
    alert: 'bg-amber-500',
    sad: 'bg-blue-600',
    confused: 'bg-red-500'
  }[emotionalState];

  // Simplified robot SVG representation
  const robotSvg = (
    <svg 
      viewBox="0 0 120 120" 
      className="w-full h-full"
      style={{ filter: 'drop-shadow(0 0 10px rgba(0, 100, 255, 0.5))' }}
    >
      {/* Robot head */}
      <rect 
        x="35" y="20" width="50" height="40" rx="5"
        className="fill-gray-800 stroke-2 stroke-blue-400" 
      />
      
      {/* Eyes */}
      <circle 
        cx="50" cy="40" r="6" 
        className={`${emotionalState === 'sad' ? 'fill-blue-300' : 'fill-blue-400'}`}
      />
      <circle 
        cx="70" cy="40" r="6" 
        className={`${emotionalState === 'sad' ? 'fill-blue-300' : 'fill-blue-400'}`}
      />
      
      {/* Antenna */}
      <rect 
        x="55" y="10" width="10" height="10"
        className="fill-gray-700" 
      />
      <circle 
        cx="60" cy="10" r="5" 
        className={emotionColor}
        opacity="0.8"
      >
        <animate 
          attributeName="opacity" 
          values="0.7;1;0.7" 
          dur="1.5s" 
          repeatCount="indefinite"
        />
      </circle>
      
      {/* Body */}
      <rect 
        x="40" y="60" width="40" height="30" rx="3"
        className="fill-gray-800 stroke-2 stroke-blue-400" 
      />
      
      {/* Arms */}
      <rect 
        x="25" y="65" width="15" height="8" rx="2"
        className="fill-gray-700" 
      />
      <rect 
        x="80" y="65" width="15" height="8" rx="2"
        className="fill-gray-700" 
      />
      
      {/* Legs */}
      <rect 
        x="45" y="90" width="10" height="15" rx="2"
        className="fill-gray-700" 
      />
      <rect 
        x="65" y="90" width="10" height="15" rx="2"
        className="fill-gray-700" 
      />
      
      {/* Mouth/Status indicator */}
      <rect 
        x="45" y="50" width="30" height="5" rx="2"
        className={emotionColor}
      >
        {emotionalState === 'thinking' && (
          <animate 
            attributeName="width" 
            values="30;15;30" 
            dur="1.5s" 
            repeatCount="indefinite"
          />
        )}
      </rect>
    </svg>
  );

  return (
    <div className={`flex flex-col items-center justify-center ${dimensions} p-2 rounded-lg bg-gray-900 bg-opacity-50 backdrop-blur-sm`}>
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Robot representation */}
        {robotSvg}
        
        {/* Emotion indicator */}
        <div className="absolute top-2 right-2 text-xl" aria-hidden="true">
          {emotionEmoji}
        </div>
      </div>
      
      {/* Error message */}
      {message && (
        <div className="mt-2 text-center text-xs text-gray-300">
          <p>{message}</p>
          {error && (
            <details className="mt-1 text-left text-xs">
              <summary className="cursor-pointer text-gray-400">Error details</summary>
              <p className="mt-1 bg-gray-800 p-1 rounded max-h-24 overflow-auto">
                {error.toString()}
              </p>
            </details>
          )}
        </div>
      )}
      
      {/* Retry button */}
      {retry && (
        <button 
          onClick={retry}
          className="mt-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
        >
          Retry 3D Rendering
        </button>
      )}
    </div>
  );
};

export default RobotFallback;