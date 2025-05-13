"use client";

import React, { useEffect, useState } from 'react';

interface UniversalClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delayMs?: number;
}

/**
 * UniversalClientOnly - Enhanced client-only component with better hydration handling
 * 
 * This component addresses several common SSR/hydration issues:
 * 1. Prevents hydration mismatches by not rendering during SSR
 * 2. Optionally delays client-side rendering to ensure DOM is fully available
 * 3. Provides fallback content during server-side rendering
 * 4. Works consistently across Next.js and other React frameworks
 */
const UniversalClientOnly: React.FC<UniversalClientOnlyProps> = ({
  children, 
  fallback = null, 
  delayMs = 0
}) => {
  // Track mounting state to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Simple mounting without delay
    if (!delayMs) {
      setIsMounted(true);
      return;
    }
    
    // Delayed mounting to ensure DOM is fully ready
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, delayMs);
    
    // Clean up timer if component unmounts
    return () => clearTimeout(timer);
  }, [delayMs]);
  
  // During SSR and initial hydration, render the fallback
  if (!isMounted) {
    return <>{fallback}</>;
  }
  
  // Once mounted on client, render the actual content
  return <>{children}</>;
};

export default UniversalClientOnly;