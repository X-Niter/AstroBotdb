"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function AstroMascotPage() {
  const [showImageWarning, setShowImageWarning] = useState(true);

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#0a0a1a] p-8">
      <h1 className="text-4xl font-bold text-white mb-6">Astro Mascot Playground</h1>
      
      <p className="text-xl text-blue-100 max-w-2xl text-center mb-10">
        This is a dedicated page for our mascot development, separated from the main application to prevent any issues.
      </p>
      
      {showImageWarning && (
        <div className="bg-yellow-800/30 border border-yellow-600/50 p-4 rounded-lg mb-8 max-w-2xl">
          <h3 className="text-yellow-300 font-semibold text-lg mb-2">Placeholder Image</h3>
          <p className="text-yellow-100">
            The current robot image is a placeholder. We're generating concept art to use as the basis for our animated mascot.
            Once you provide the new concept art, we'll implement it here.
          </p>
          <button 
            className="mt-3 px-3 py-1 bg-yellow-700/50 hover:bg-yellow-700/70 text-yellow-100 rounded-md text-sm"
            onClick={() => setShowImageWarning(false)}
          >
            Dismiss
          </button>
        </div>
      )}
      
      <div className="relative bg-slate-900/50 p-8 rounded-xl shadow-xl mb-10 flex flex-col items-center">
        <div className="mb-8 text-center">
          <h2 className="text-2xl text-cyan-300 font-semibold mb-2">AstroBot Mascot</h2>
          <p className="text-cyan-100">Simple 2D implementation with subtle animation effects</p>
        </div>
        
        <div className="relative flex justify-center items-center mx-auto">
          {/* Glow effects positioned to match the robot's cyan highlights */}
          <div className="absolute w-[160px] h-[160px] rounded-full bg-[rgba(0,255,255,0.15)] blur-xl top-[25%] left-[60%] scale-[0.4] animate-pulse"></div>
          <div className="absolute w-[160px] h-[160px] rounded-full bg-[rgba(0,255,255,0.15)] blur-xl top-[42%] left-[60%] scale-[0.5] animate-pulse opacity-70"></div>
          <div className="absolute w-[160px] h-[160px] rounded-full bg-[rgba(0,255,255,0.15)] blur-xl top-[60%] left-[55%] scale-[0.3] animate-pulse opacity-80"></div>
          <div className="absolute w-[160px] h-[160px] rounded-full bg-[rgba(0,255,255,0.15)] blur-xl top-[85%] left-[53%] scale-[0.2] animate-pulse opacity-75"></div>
          
          {/* Robot image with subtle floating animation */}
          <div className="animate-[bounce_4s_ease-in-out_infinite] relative z-10">
            <Image
              src="/astrobot-droid.png"
              alt="AstroBot AI Assistant"
              width={300}
              height={500}
              style={{ width: 'auto', height: 'auto' }} 
              priority
              className="relative z-10"
            />
          </div>
        </div>
        
        <div className="mt-8 space-y-4 w-full max-w-md">
          <div className="text-sm text-gray-300">
            <p className="mb-2">Ready to integrate your new concept art when available.</p>
            <p>The mascot is isolated on this page to protect the rest of the application.</p>
          </div>
        </div>
      </div>
      
      <Link 
        href="/"
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-md hover:from-blue-700 hover:to-indigo-800 transition-all"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}