"use client";

import React from 'react';
import Image from 'next/image';

// Interface for component props
interface AnimatedDroid2DProps {
  width?: number;
  height?: number;
  className?: string;
}

const AnimatedDroid2D: React.FC<AnimatedDroid2DProps> = ({ 
  width = 300, 
  height = 500,
  className = '' 
}) => {
  return (
    <div className={`relative flex justify-center items-center mx-auto ${className}`}>
      {/* Glow effects - positioned to match the robot's cyan highlights */}
      <div className="absolute w-[160px] h-[160px] rounded-full bg-[rgba(0,255,255,0.15)] blur-xl top-[25%] left-[60%] scale-[0.4] animate-pulse"></div>
      <div className="absolute w-[160px] h-[160px] rounded-full bg-[rgba(0,255,255,0.15)] blur-xl top-[42%] left-[60%] scale-[0.5] animate-pulse opacity-70"></div>
      <div className="absolute w-[160px] h-[160px] rounded-full bg-[rgba(0,255,255,0.15)] blur-xl top-[60%] left-[55%] scale-[0.3] animate-pulse opacity-80"></div>
      <div className="absolute w-[160px] h-[160px] rounded-full bg-[rgba(0,255,255,0.15)] blur-xl top-[85%] left-[53%] scale-[0.2] animate-pulse opacity-75"></div>
      
      {/* Robot image with subtle floating animation */}
      <div className="animate-[float_4s_ease-in-out_infinite] relative z-10">
        <Image
          src="/astrobot-droid.png"
          alt="AstroBot AI Assistant"
          width={width}
          height={height}
          priority
          className="relative z-10"
        />
      </div>
    </div>
  );
};

export default AnimatedDroid2D;