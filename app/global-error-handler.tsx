'use client';

import { useEffect } from 'react';

export function GlobalErrorHandler() {
  useEffect(() => {
    // Aggressive error suppression - must run ASAP
    const suppressError = (errorString: string) => {
      const suppressPatterns = [
        'Hydration failed',
        'There was an error while hydrating',
        'Text content does not match',
        'removeChild',
        'Minified React error',
        'Expected server HTML',
        'did not match',
        'Warning: Prop',
        'Warning: Extra attributes',
        'Warning: Expected server',
        'NotFoundError',
        'node to be removed is not a child',
      ];
      
      return suppressPatterns.some(pattern => 
        errorString.toLowerCase().includes(pattern.toLowerCase())
      );
    };

    // Patch console.error
    const originalError = console.error;
    console.error = function(...args: any[]) {
      const errorString = args.join(' ');
      if (suppressError(errorString)) return;
      originalError.apply(console, args);
    };

    // Patch console.warn
    const originalWarn = console.warn;
    console.warn = function(...args: any[]) {
      const warnString = args.join(' ');
      if (suppressError(warnString)) return;
      originalWarn.apply(console, args);
    };

    // Patch window.onerror - most aggressive
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      const msgString = String(message);
      const errorMsg = error ? String(error) : '';
      
      if (suppressError(msgString) || suppressError(errorMsg)) {
        console.log('[Suppressed] Hydration error prevented');
        return true; // Prevent default error handling
      }
      
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Patch unhandled promise rejections
    const originalUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = function(event) {
      const reason = event.reason ? String(event.reason) : '';
      const message = event.reason?.message ? String(event.reason.message) : '';
      
      if (suppressError(reason) || suppressError(message)) {
        console.log('[Suppressed] Hydration promise rejection prevented');
        event.preventDefault();
        return;
      }
      
      if (originalUnhandledRejection) {
        originalUnhandledRejection.call(window, event);
      }
    };

    // Additional: Catch errors during event listener setup
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      const wrappedListener = typeof listener === 'function' 
        ? function(this: any, evt: Event) {
            try {
              return listener.call(this, evt);
            } catch (error: any) {
              if (suppressError(String(error))) {
                console.log('[Suppressed] Event listener error prevented');
                return;
              }
              throw error;
            }
          }
        : listener;
      
      return originalAddEventListener.call(this, type, wrappedListener, options);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.onerror = originalOnError;
      window.onunhandledrejection = originalUnhandledRejection;
      EventTarget.prototype.addEventListener = originalAddEventListener;
    };
  }, []);

  return null;
}
