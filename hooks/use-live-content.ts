'use client';

/**
 * Custom React Hook: useFirestoreLiveContent
 * 
 * Purpose: Real-time Firestore listener for dynamic content updates
 * Collection: refresh_data
 * Fields: title, message
 * 
 * Features:
 * - Persistent WebSocket connection via Firestore
 * - Automatic reconnection on network changes
 * - Zero page reloads - updates in-place
 * - Optimized for Firebase free tier
 * - Production-ready error handling
 */

import { useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  type DocumentData 
} from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

// TypeScript interface for live content data
export interface LiveContentItem {
  id: string;
  title: string;
  message: string;
  timestamp?: any;
  [key: string]: any; // Allow additional fields
}

interface UseLiveContentReturn {
  content: LiveContentItem[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
}

/**
 * Hook for real-time content updates from Firestore
 * @param maxItems - Maximum number of items to fetch (default: 10)
 * @param enabled - Enable/disable the listener (default: true)
 */
export function useFirestoreLiveContent(
  maxItems: number = 10,
  enabled: boolean = true
): UseLiveContentReturn {
  const [content, setContent] = useState<LiveContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // Exit early if listener is disabled
    if (!enabled) {
      console.log('🔕 [LiveContent] Listener disabled');
      setLoading(false);
      return;
    }

    console.log('🔌 [LiveContent] Initializing real-time listener...');
    console.log(`📊 [LiveContent] Collection: refresh_data | Max items: ${maxItems}`);

    // Reset states
    setLoading(true);
    setError(null);

    try {
      // Reference to the Firestore collection
      const contentRef = collection(db, 'refresh_data');
      
      // Build query with ordering and limit for optimization
      const contentQuery = query(
        contentRef,
        orderBy('timestamp', 'desc'), // Most recent first
        limit(maxItems) // Limit to reduce read costs
      );

      // Set up real-time listener using onSnapshot
      const unsubscribe = onSnapshot(
        contentQuery,
        
        // Success callback - fires on initial load and every change
        (snapshot) => {
          console.log('✅ [LiveContent] Snapshot received');
          console.log(`📦 [LiveContent] Documents count: ${snapshot.docs.length}`);
          
          // Mark as connected
          setIsConnected(true);
          setLoading(false);
          setError(null);

          // Transform Firestore documents to our data structure
          const items: LiveContentItem[] = snapshot.docs.map((doc) => {
            const data = doc.data() as DocumentData;
            
            return {
              id: doc.id,
              title: data.title || 'Untitled',
              message: data.message || '',
              timestamp: data.timestamp,
              ...data // Include any additional fields
            };
          });

          console.log('🔄 [LiveContent] Content updated:', items.length, 'items');
          
          // Log the actual content for debugging
          items.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.title}: ${item.message}`);
          });

          // Update state - this triggers React re-render
          setContent(items);
        },
        
        // Error callback
        (err) => {
          console.error('❌ [LiveContent] Firestore error:', err);
          console.error('🔍 [LiveContent] Error code:', err.code);
          console.error('🔍 [LiveContent] Error message:', err.message);
          
          setError(err.message || 'Failed to fetch live content');
          setLoading(false);
          setIsConnected(false);
        }
      );

      console.log('👂 [LiveContent] Listener attached successfully');
      console.log('🌐 [LiveContent] WebSocket connection established');

      // Cleanup function - unsubscribe when component unmounts
      return () => {
        console.log('🔌 [LiveContent] Unsubscribing from listener');
        unsubscribe();
        setIsConnected(false);
      };
      
    } catch (err: any) {
      console.error('💥 [LiveContent] Setup error:', err);
      setError(err.message || 'Failed to initialize listener');
      setLoading(false);
      setIsConnected(false);
    }
  }, [maxItems, enabled]);

  return {
    content,
    loading,
    error,
    isConnected
  };
}

// Export a simpler version with default settings
export function useLiveContent() {
  return useFirestoreLiveContent(10, true);
}
