'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  targetId: string;
}

/**
 * Portal component that renders children into a specified DOM node
 * This is ideal for rendering elements that should break out of their parent's layout
 */
export function Portal({ children, targetId }: PortalProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Make sure we're in the browser and the target element exists
  if (!mounted || typeof document === 'undefined') return null;
  
  const targetElement = document.getElementById(targetId);
  if (!targetElement) return null;

  return createPortal(children, targetElement);
}