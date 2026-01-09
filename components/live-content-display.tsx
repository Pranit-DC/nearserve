'use client';

/**
 * LiveContentDisplay Component
 * 
 * Purpose: Display real-time content from Firestore without page reloads
 * Data Source: Firestore collection 'refresh_data'
 * Update Method: WebSocket-based real-time listener
 * 
 * Features:
 * - Instant updates when Firestore data changes
 * - Smooth transitions without flicker
 * - Loading and error states
 * - Connection status indicator
 * - Responsive design
 * - Production-ready with proper error handling
 */

import React from 'react';
import { useLiveContent } from '@/hooks/use-live-content';
import { motion, AnimatePresence } from 'motion/react';

interface LiveContentDisplayProps {
  className?: string;
  showConnectionStatus?: boolean;
  maxItems?: number;
}

/**
 * Main component for displaying live Firestore content
 */
export function LiveContentDisplay({ 
  className = '',
  showConnectionStatus = true,
  maxItems = 10
}: LiveContentDisplayProps) {
  // Use the custom hook to get real-time data
  const { content, loading, error, isConnected } = useLiveContent();

  return (
    <div id="liveContent" className={`live-content-container ${className}`}>
      {/* Connection Status Indicator */}
      {showConnectionStatus && (
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
            animate={{
              scale: isConnected ? [1, 1.2, 1] : 1,
              opacity: isConnected ? [1, 0.5, 1] : 0.5,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-center py-12"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">
              Connecting to live content...
            </p>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-500 mt-0.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                Connection Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Content Display */}
      {!loading && !error && content.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 px-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20"
        >
          <svg
            className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-muted-foreground">
            No content available yet
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Add data to the 'refresh_data' collection in Firestore
          </p>
        </motion.div>
      )}

      {/* Live Content Items with Smooth Animations */}
      {!loading && !error && content.length > 0 && (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {content.slice(0, maxItems).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: [0.4, 0, 0.2, 1]
                }}
                layout
                className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Title */}
                <motion.h2
                  className="text-xl font-semibold text-foreground mb-2"
                  layout="position"
                >
                  {item.title}
                </motion.h2>

                {/* Message */}
                <motion.p
                  className="text-muted-foreground leading-relaxed"
                  layout="position"
                >
                  {item.message}
                </motion.p>

                {/* Timestamp (if available) */}
                {item.timestamp && (
                  <motion.div
                    className="mt-3 pt-3 border-t border-border"
                    layout="position"
                  >
                    <p className="text-xs text-muted-foreground/70">
                      Updated: {formatTimestamp(item.timestamp)}
                    </p>
                  </motion.div>
                )}

                {/* Real-time Update Indicator */}
                <motion.div
                  className="absolute top-2 right-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Live
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-xs font-mono text-muted-foreground">
            🔍 Debug Info: {content.length} items | 
            {isConnected ? ' ✅ Connected' : ' ❌ Disconnected'} | 
            {loading ? ' ⏳ Loading' : ' ✓ Ready'}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Format Firestore timestamp for display
 */
function formatTimestamp(timestamp: any): string {
  try {
    if (!timestamp) return 'Unknown';
    
    // Handle Firestore Timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString();
    }
    
    // Handle Date object
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    }
    
    // Handle timestamp in milliseconds
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toLocaleString();
    }
    
    return 'Unknown';
  } catch (err) {
    console.error('Error formatting timestamp:', err);
    return 'Unknown';
  }
}

/**
 * Lightweight version without animations (for better performance)
 */
export function LiveContentDisplaySimple({ 
  className = '',
  maxItems = 10
}: LiveContentDisplayProps) {
  const { content, loading, error, isConnected } = useLiveContent();

  return (
    <div id="liveContent" className={`live-content-container ${className}`}>
      {loading && <div>Loading live content...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      {!loading && !error && content.length === 0 && (
        <div>No content available</div>
      )}
      {!loading && !error && content.length > 0 && (
        <div className="space-y-4">
          {content.slice(0, maxItems).map((item) => (
            <div key={item.id} className="border rounded p-4">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="text-gray-600">{item.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LiveContentDisplay;
