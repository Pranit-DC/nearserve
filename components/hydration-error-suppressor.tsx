'use client';

import { useEffect } from 'react';

export function HydrationErrorSuppressor() {
  useEffect(() => {
    // Suppress hydration warnings in development
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error;
      const originalWarn = console.warn;

      console.error = (...args: any[]) => {
        const errorString = args.join(' ');
        
        // Suppress known hydration errors
        if (
          errorString.includes('Hydration failed') ||
          errorString.includes('There was an error while hydrating') ||
          errorString.includes('Text content does not match') ||
          errorString.includes('removeChild') ||
          errorString.includes('Minified React error') ||
          errorString.includes('Warning: Expected server HTML') ||
          errorString.includes('Warning: Text content did not match')
        ) {
          return;
        }
        
        originalError.apply(console, args);
      };

      console.warn = (...args: any[]) => {
        const warnString = args.join(' ');
        
        if (
          warnString.includes('Prop') ||
          warnString.includes('did not match')
        ) {
          return;
        }
        
        originalWarn.apply(console, args);
      };

      return () => {
        console.error = originalError;
        console.warn = originalWarn;
      };
    }
  }, []);

  return null;
}
