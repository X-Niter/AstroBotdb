'use client';

import { useEffect } from 'react';
import * as THREE from 'three';

// This component creates and caches procedural normal maps when texture loading fails
// This solves the issue of non-existent textures by providing algorithmic alternatives
export function createProceduralNormalMap(
  type: 'subtle' | 'carbon_fiber' | 'metallic',
  size: number = 512
): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      
      // Default normal map pointing straight out (128, 128, 255)
      data[i] = 128;     // R channel (X vector)
      data[i + 1] = 128; // G channel (Y vector) 
      data[i + 2] = 255; // B channel (Z vector always points out)
      data[i + 3] = 255; // Alpha (fully opaque)
      
      if (type === 'subtle') {
        // Create subtle beveled edges with slight noise
        if (x % 32 === 0 || y % 32 === 0) {
          // Create edge bevel effect
          data[i] = 128 + Math.floor(Math.sin(x * 0.2) * 20);
          data[i + 1] = 128 + Math.floor(Math.cos(y * 0.2) * 20);
        }
        
        // Add subtle noise
        const noise = Math.random() * 10 - 5;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      }
      
      if (type === 'carbon_fiber') {
        // Create carbon fiber pattern with directional fibers
        const pattern = Math.sin(x * 0.2) * Math.cos(y * 0.2) * 20;
        
        // Carbon fiber has a woven pattern
        if ((x + y) % 8 < 4) {
          data[i] = 128 + pattern;
          data[i + 1] = 128 - pattern;
        } else {
          data[i] = 128 - pattern;
          data[i + 1] = 128 + pattern;
        }
        
        // Add more pronounced bumps at intersections
        if ((x % 16 < 2) && (y % 16 < 2)) {
          data[i + 2] = 200; // Less bump out at intersections
        }
      }
      
      if (type === 'metallic') {
        // Create metallic scratches and brushed metal effect
        const angle = Math.atan2(y - size/2, x - size/2);
        const dist = Math.sqrt((x - size/2) ** 2 + (y - size/2) ** 2) / (size/2);
        
        // Concentric scratches
        const scratch = Math.sin(dist * 50) * 15;
        // Radial brushing
        const brush = Math.sin(angle * 20) * 10;
        
        data[i] = 128 + scratch + brush;
        data[i + 1] = 128 - scratch - brush;
      }
    }
  }
  
  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
    THREE.UVMapping
  );
  
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  
  return texture;
}

// Store generated textures to reuse
const proceduralTextures: {[key: string]: THREE.DataTexture} = {};

export const useProceduralNormalMaps = () => {
  useEffect(() => {
    // Pre-generate and cache the textures we'll need
    if (!proceduralTextures['subtle']) {
      proceduralTextures['subtle'] = createProceduralNormalMap('subtle');
    }
    
    if (!proceduralTextures['carbon_fiber']) {
      proceduralTextures['carbon_fiber'] = createProceduralNormalMap('carbon_fiber');
    }
    
    if (!proceduralTextures['metallic']) {
      proceduralTextures['metallic'] = createProceduralNormalMap('metallic');
    }
  }, []);
  
  return proceduralTextures;
};

export default useProceduralNormalMaps;