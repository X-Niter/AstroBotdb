"use client";

import { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ClientOnly - A component that ensures its children are only rendered on the client side
 * Prevents hydration mismatches by not rendering anything during SSR
 * 
 * @param children - The components to render client-side
 * @param fallback - Optional fallback UI to show before hydration
 */
const ClientOnly = ({ children, fallback = null }: ClientOnlyProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // If we're still in SSR or not yet mounted on the client, show the fallback
  if (!isMounted) {
    return fallback !== null ? <>{fallback}</> : null;
  }

  // On the client, after hydration, render the children
  return <>{children}</>;
};

export default ClientOnly;