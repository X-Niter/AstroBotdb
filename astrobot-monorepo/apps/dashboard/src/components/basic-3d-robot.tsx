"use client";

import React, { useRef, useEffect } from 'react';

type BasicRobotProps = {
  size?: 'small' | 'medium' | 'large';
  color?: string;
};

// A very simple 3D robot component that uses Three.js directly without any complex hooks
export default function Basic3DRobot({ size = 'medium', color = '#5e81ac' }: BasicRobotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Determine size based on prop
  const dimensions = {
    small: { width: 200, height: 200 },
    medium: { width: 300, height: 300 },
    large: { width: 400, height: 400 }
  }[size];
  
  // Set up Three.js scene
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let animationFrameId: number;
    let cleanupFunction: (() => void) | null = null;
    
    // Load Three.js dynamically to avoid SSR issues
    import('three').then((THREE) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);
      
      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75, 
        dimensions.width / dimensions.height, 
        0.1, 
        1000
      );
      camera.position.z = 3;
      
      // Create renderer
      const renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true 
      });
      renderer.setSize(dimensions.width, dimensions.height);
      
      // Create a basic cube for the robot head
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const cubeMaterial = new THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 30,
      });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      scene.add(cube);
      
      // Add lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);
      
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(1, 1, 1);
      scene.add(light);
      
      // Animation loop
      function animate() {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        
        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(animate);
      }
      
      animate();
      
      // Cleanup function to cancel animation and dispose resources
      cleanupFunction = () => {
        cancelAnimationFrame(animationFrameId);
        renderer.dispose();
        cubeGeometry.dispose();
        cubeMaterial.dispose();
      };
    }).catch(error => {
      console.error("Error loading Three.js:", error);
    });
    
    // Return cleanup function
    return () => {
      if (cleanupFunction) cleanupFunction();
    };
  }, [dimensions.width, dimensions.height, color]);
  
  return (
    <div className="flex items-center justify-center" style={{ width: dimensions.width, height: dimensions.height }}>
      <canvas 
        ref={canvasRef} 
        width={dimensions.width} 
        height={dimensions.height}
        style={{ display: 'block' }}
      />
    </div>
  );
}