import { useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  interval?: number; // milliseconds
  enabled?: boolean;
}

/**
 * Hook to automatically refresh data in the background
 * @param callback Function to execute on each refresh
 * @param options Configuration options
 */
export function useAutoRefresh(
  callback: () => void | Promise<void>,
  options: UseAutoRefreshOptions = {}
) {
  const { interval = 30000, enabled = true } = options; // Default 30 seconds
  const savedCallback = useRef(callback);
  const failureCount = useRef(0);
  const maxFailures = 3;

  // Update ref when callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = async () => {
      try {
        console.log(`[Auto-refresh] Refreshing data at ${new Date().toLocaleTimeString()}`);
        await savedCallback.current();
        failureCount.current = 0; // Reset on success
      } catch (error) {
        failureCount.current += 1;
        console.error(`[Auto-refresh] Error (${failureCount.current}/${maxFailures}):`, error);
        
        // If too many failures, stop auto-refresh to prevent spam
        if (failureCount.current >= maxFailures) {
          console.warn('[Auto-refresh] Too many failures, pausing auto-refresh. Reload the page to resume.');
          return; // This will prevent further attempts in this interval cycle
        }
      }
    };

    // Don't run immediately on mount - let the component's useEffect handle first load
    // This prevents double-loading on mount
    
    // Set up interval for subsequent refreshes
    const id = setInterval(tick, interval);

    // Clean up
    return () => clearInterval(id);
  }, [interval, enabled]);
}
