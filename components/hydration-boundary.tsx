'use client';

import { useEffect, useState } from 'react';

/**
 * HydrationBoundary - Prevents hydration errors by ensuring client-only rendering
 * Use this to wrap components that have hydration issues
 */
export function HydrationBoundary({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Return nothing on server-side and during initial hydration
  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}

/**
 * ClientOnly - Alternative approach that shows loading state
 */
export function ClientOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Suppress specific hydration warnings in development
 * Call this in your root layout or _app
 */
export function suppressHydrationWarning() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const originalError = console.error;
    console.error = (...args) => {
      const errorString = args.join(' ');
      
      // Suppress common hydration warnings
      if (
        errorString.includes('Hydration failed') ||
        errorString.includes('There was an error while hydrating') ||
        errorString.includes('Text content does not match') ||
        errorString.includes('removeChild')
      ) {
        return;
      }
      
      originalError.apply(console, args);
    };
  }
}
