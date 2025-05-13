'use client';

import React from 'react';
import Image from 'next/image';
import { EmotionalState, ParticleDisplay } from "../utils/types";

interface SimpleRobotProps {
  emotionalState?: EmotionalState;
  showParticles?: ParticleDisplay;
  animation?: string;
  hologramText?: string | null;
  onComplete?: () => void;
}

// A simple 2D robot component that displays reliably
const SimpleRobot: React.FC<SimpleRobotProps> = ({
  emotionalState = "neutral",
  showParticles = "none",
  animation = "idle",
  hologramText = null,
  onComplete
}) => {
  // Call onComplete when mounting to ensure animation sequences still work
  React.useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [animation, onComplete]);

  // Select the appropriate robot image based on emotional state
  const getRobotImageSrc = () => {
    switch (emotionalState) {
      case 'happy':
        return '/robot-happy.svg';
      case 'thinking':
        return '/robot-thinking.svg';
      case 'alert':
        return '/robot-alert.svg';
      case 'sad':
        return '/robot-sad.svg';
      case 'confused':
        return '/robot-confused.svg';
      default:
        return '/robot-neutral.svg';
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[1000] flex items-center justify-center">
      <div className="relative w-[300px] h-[400px] flex flex-col items-center justify-center">
        {/* Create a simple robot using CSS */}
        <div className="relative flex flex-col items-center">
          {/* Robot head */}
          <div 
            className={`w-24 h-24 rounded-full bg-white border-4 ${
              emotionalState === 'happy' ? 'border-blue-400' : 
              emotionalState === 'alert' ? 'border-red-400' :
              emotionalState === 'thinking' ? 'border-purple-400' :
              emotionalState === 'sad' ? 'border-blue-300' :
              emotionalState === 'confused' ? 'border-pink-400' :
              'border-blue-500'
            } flex items-center justify-center relative mb-2`}
          >
            {/* Robot eyes */}
            <div className="flex space-x-4">
              <div className={`w-4 h-4 rounded-full ${
                emotionalState === 'happy' ? 'bg-blue-400' : 
                emotionalState === 'alert' ? 'bg-red-400' :
                emotionalState === 'thinking' ? 'bg-purple-400' :
                emotionalState === 'sad' ? 'bg-blue-300' :
                emotionalState === 'confused' ? 'bg-pink-400' :
                'bg-blue-500'
              }`}></div>
              <div className={`w-4 h-4 rounded-full ${
                emotionalState === 'happy' ? 'bg-blue-400' : 
                emotionalState === 'alert' ? 'bg-red-400' :
                emotionalState === 'thinking' ? 'bg-purple-400' :
                emotionalState === 'sad' ? 'bg-blue-300' :
                emotionalState === 'confused' ? 'bg-pink-400' :
                'bg-blue-500'
              }`}></div>
            </div>
            
            {/* Antenna */}
            <div className="absolute -top-6 w-1 h-6 bg-gray-800">
              <div className={`w-2 h-2 rounded-full ${
                emotionalState === 'happy' ? 'bg-blue-400' : 
                emotionalState === 'alert' ? 'bg-red-400' :
                emotionalState === 'thinking' ? 'bg-purple-400' :
                emotionalState === 'sad' ? 'bg-blue-300' :
                emotionalState === 'confused' ? 'bg-pink-400' :
                'bg-blue-500'
              } absolute -top-1 left-1/2 transform -translate-x-1/2`}></div>
            </div>
          </div>
          
          {/* Robot body */}
          <div className="w-20 h-32 bg-white border-4 border-gray-300 rounded-lg flex flex-col items-center justify-center">
            {/* Central chest light */}
            <div className={`w-6 h-6 rounded-full ${
              emotionalState === 'happy' ? 'bg-blue-400' : 
              emotionalState === 'alert' ? 'bg-red-400' :
              emotionalState === 'thinking' ? 'bg-purple-400' :
              emotionalState === 'sad' ? 'bg-blue-300' :
              emotionalState === 'confused' ? 'bg-pink-400' :
              'bg-blue-500'
            } mb-4`}></div>
            
            {/* Control panels */}
            <div className="w-12 h-4 bg-gray-200 mb-2 rounded"></div>
            <div className="w-12 h-4 bg-gray-200 rounded"></div>
          </div>
          
          {/* Arms */}
          <div className="absolute top-32 left-0 w-8 h-24 flex flex-col items-center">
            <div className="w-4 h-20 bg-gray-300 rounded-full"></div>
            <div className="w-6 h-6 bg-white border-2 border-gray-400 rounded-lg mt-1"></div>
          </div>
          
          <div className="absolute top-32 right-0 w-8 h-24 flex flex-col items-center">
            <div className="w-4 h-20 bg-gray-300 rounded-full"></div>
            <div className="w-6 h-6 bg-white border-2 border-gray-400 rounded-lg mt-1"></div>
          </div>
        </div>
        
        {/* Hologram text */}
        {hologramText && (
          <div className={`mt-4 px-4 py-2 rounded ${
            emotionalState === 'happy' ? 'bg-blue-400 bg-opacity-20' : 
            emotionalState === 'alert' ? 'bg-red-400 bg-opacity-20' :
            emotionalState === 'thinking' ? 'bg-purple-400 bg-opacity-20' :
            emotionalState === 'sad' ? 'bg-blue-300 bg-opacity-20' :
            emotionalState === 'confused' ? 'bg-pink-400 bg-opacity-20' :
            'bg-blue-500 bg-opacity-20'
          } text-white font-mono text-center`}>
            {hologramText}
          </div>
        )}
        
        {/* Particles */}
        {showParticles !== 'none' && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i}
                className={`absolute w-2 h-2 rounded-full ${
                  emotionalState === 'happy' ? 'bg-blue-400' : 
                  emotionalState === 'alert' ? 'bg-red-400' :
                  emotionalState === 'thinking' ? 'bg-purple-400' :
                  emotionalState === 'sad' ? 'bg-blue-300' :
                  emotionalState === 'confused' ? 'bg-pink-400' :
                  'bg-blue-500'
                } opacity-50`}
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `float ${2 + Math.random() * 4}s linear infinite`
                }}
              ></div>
            ))}
          </div>
        )}
      </div>
      
      {/* Animation keyframes for floating particles */}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.7;
          }
          100% {
            transform: translateY(-100px) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SimpleRobot;