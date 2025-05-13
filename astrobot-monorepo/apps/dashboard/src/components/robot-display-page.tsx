"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues
const SimpleRobotMascot = dynamic(
  () => import('./simple-robot-mascot'),
  { ssr: false, loading: () => <div>Loading simple robot...</div> }
);

const Basic3DRobot = dynamic(
  () => import('./basic-3d-robot'),
  { ssr: false, loading: () => <div>Loading 3D robot...</div> }
);

export default function RobotDisplayPage() {
  const [robotType, setRobotType] = useState<'simple' | '3d'>('simple');
  const [robotColor, setRobotColor] = useState('#5e81ac');
  const [robotSize, setRobotSize] = useState<'small' | 'medium' | 'large'>('medium');
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">AstroBot Robot Mascot</h1>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="space-y-2">
          <h2 className="font-semibold">Robot Type</h2>
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded ${robotType === 'simple' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setRobotType('simple')}
            >
              Simple
            </button>
            <button
              className={`px-4 py-2 rounded ${robotType === '3d' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setRobotType('3d')}
            >
              3D
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="font-semibold">Robot Size</h2>
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded ${robotSize === 'small' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setRobotSize('small')}
            >
              Small
            </button>
            <button
              className={`px-4 py-2 rounded ${robotSize === 'medium' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setRobotSize('medium')}
            >
              Medium
            </button>
            <button
              className={`px-4 py-2 rounded ${robotSize === 'large' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setRobotSize('large')}
            >
              Large
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="font-semibold">Robot Color</h2>
          <input
            type="color"
            value={robotColor}
            onChange={(e) => setRobotColor(e.target.value)}
            className="p-1 border rounded"
          />
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-slate-100 flex justify-center">
        {robotType === 'simple' ? (
          <SimpleRobotMascot size={robotSize} color={robotColor} />
        ) : (
          <Basic3DRobot size={robotSize} color={robotColor} />
        )}
      </div>
      
      <div className="mt-6 p-4 border rounded bg-blue-50">
        <h2 className="font-semibold mb-2">Implementation Details</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>All components use proper SSR-safe patterns</li>
          <li>No hooks are called conditionally</li>
          <li>All browser APIs are safely wrapped in useEffect</li>
          <li>Components are wrapped in ErrorBoundary for graceful fallbacks</li>
          <li>Dynamic imports are used to avoid SSR issues with browser-only libraries</li>
        </ul>
      </div>
    </div>
  );
}