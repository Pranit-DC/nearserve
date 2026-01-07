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

  // Update ref when callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = async () => {
      try {
        await savedCallback.current();
      } catch (error) {
        console.error('Auto-refresh error:', error);
      }
    };

    // Set up interval
    const id = setInterval(tick, interval);

    // Clean up
    return () => clearInterval(id);
  }, [interval, enabled]);
}
