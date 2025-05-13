"use client";

import * as THREE from 'three';

/**
 * Enhanced stable pseudo-random function to avoid hydration mismatches
 * This provides deterministic values for server-side rendering
 * 
 * @param seed - Numeric seed for deterministic randomness
 * @returns A value between 0 and 1
 */
export const stableRandom = (seed = 0): number => {
  // Convert seed to number if it's not already
  const numericSeed = typeof seed === 'number' ? seed : String(seed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // More robust deterministic random function based on linear congruential generator
  return ((numericSeed * 9301 + 49297) % 233280) / 233280;
};

// Safe detection of client-side environment
export const isClient = typeof window !== 'undefined';

/**
 * Improved safe random function that's completely stable during hydration
 * Only uses Math.random when safe on the client side
 * 
 * @param seed - Optional seed for deterministic generation
 * @returns A random number between 0 and 1
 */
export const safeRandom = (seed = 0): number => {
  // During initial rendering or SSR, always use stable implementation
  if (!isClient) {
    return stableRandom(seed);
  }
  
  // Use a hydration-safe approach that's consistent across server and client
  const hydratePhase = typeof document === 'undefined' || document.readyState !== 'complete';
  return hydratePhase ? stableRandom(seed) : Math.random();
};

/**
 * Enhanced utility function to safely create a THREE.Color with improved error handling
 * This ensures consistent color handling across SSR and client rendering
 * 
 * @param color - Any value that could represent a color (string, number, object)
 * @param fallback - Optional fallback color if the provided color is invalid
 * @returns A valid THREE.Color instance
 */
export const safeColor = (color: any, fallback = '#5e81ac'): THREE.Color => {
  // Empty or null check
  if (color === null || color === undefined) {
    return new THREE.Color(fallback);
  }
  
  // If it's already a valid THREE.Color instance
  if (color && 
      typeof color === 'object' && 
      'isColor' in color && 
      color.isColor === true &&
      typeof color.r === 'number' &&
      typeof color.g === 'number' &&
      typeof color.b === 'number') {
    return color;
  }
  
  // Handle string hex values
  if (typeof color === 'string') {
    try {
      // Ensure proper hex format for consistent cross-platform rendering
      if (color.startsWith('#') && (color.length === 4 || color.length === 7)) {
        return new THREE.Color(color);
      }
      
      // Add # prefix if missing from hex values
      if (/^[0-9A-Fa-f]{6}$/.test(color)) {
        return new THREE.Color('#' + color);
      }
      
      // Try parsing as is
      return new THREE.Color(color);
    } catch (e) {
      console.warn(`Invalid color string: "${color}", using fallback`, e);
      return new THREE.Color(fallback);
    }
  }
  
  // Handle numeric values
  if (typeof color === 'number') {
    try {
      return new THREE.Color(color);
    } catch (e) {
      console.warn(`Invalid numeric color: ${color}, using fallback`, e);
      return new THREE.Color(fallback);
    }
  }
  
  // Try generic conversion as last resort
  try {
    return new THREE.Color(color);
  } catch (e) {
    console.warn('Unrecognized color format, using fallback:', e);
    return new THREE.Color(fallback);
  }
};

/**
 * Safe THREE.Color modifier that handles errors and preserves the original color
 * 
 * @param color - The base color to modify
 * @param modifier - A function that takes a color and returns a modified color
 * @returns The modified color, or the original if modification fails
 */
export const safeColorModify = (
  color: THREE.Color | any, 
  modifier: (color: THREE.Color) => THREE.Color
): THREE.Color => {
  const baseColor = safeColor(color);
  try {
    return modifier(baseColor.clone());
  } catch (e) {
    console.warn('Error modifying color, returning original:', e);
    return baseColor;
  }
};

/**
 * Creates a color instance that gracefully handles animation and rendering
 * This is particularly useful for emotional state transitions
 * 
 * @param baseColor - The starting color
 * @param options - Configuration options for the color instance
 * @returns A stable, animation-friendly color instance
 */
export const createAnimatableColor = (
  baseColor: THREE.Color | string | number,
  options = { intensity: 1.0, saturation: 1.0 }
): { color: THREE.Color; update: (time: number) => void } => {
  const color = safeColor(baseColor);
  const originalHSL = { h: 0, s: 0, l: 0 };
  color.getHSL(originalHSL);
  
  return {
    color,
    update: (time: number) => {
      // Generate a stable time-based modifier
      const pulseFactor = Math.sin(time * 2) * 0.1 * options.intensity;
      
      // Apply to color safely
      color.setHSL(
        originalHSL.h,
        originalHSL.s * options.saturation,
        Math.max(0.1, Math.min(0.9, originalHSL.l + pulseFactor))
      );
    }
  };
};

/**
 * Creates a safe, effect-friendly glow color based on an input color
 * 
 * @param baseColor - The color to create a glow from
 * @param intensity - How bright/intense the glow should be (0-2)
 * @returns A modified color suitable for glow effects
 */
export const createGlowColor = (baseColor: THREE.Color | string | number, intensity = 1.0): THREE.Color => {
  return safeColorModify(baseColor, (color) => {
    // Extract HSL components for better control
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    
    // Increase luminance and slightly reduce saturation for better glow
    color.setHSL(
      hsl.h,
      Math.max(0.5, hsl.s * 0.8), 
      Math.min(1.0, hsl.l * intensity * 1.5)
    );
    
    return color;
  });
};