/**
 * Firebase Cloud Messaging Client Service (FREE TIER)
 * 
 * Features:
 * - Browser notification permission
 * - FCM token generation with VAPID
 * - Token storage in Firestore
 * - Foreground notification handling
 * - Realtime Firestore listener for content updates
 * 
 * Free tier compatible - no Cloud Functions required
 */

'use client';

import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { collection, addDoc, query, where, getDocs, serverTimestamp, onSnapshot, Timestamp } from 'firebase/firestore';
import app from './firebase-client';
import { db } from './firebase-client';

// VAPID key from Firebase Console (with fallback)
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BDPvgu8CPLAajELN-5fNOXh2knClUn_qqCFmVJayfnVUM81y8pEyrFt7UMvZYtbX1etUUzf6ZPx4Uvd0fo9DxoU';

// Firestore collections
const TOKENS_COLLECTION = 'refresh_data_tokens';
const CONTENT_COLLECTION = 'refresh_data';

/**
 * Check if push notifications are supported
 */
export async function isPushNotificationSupported(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    const supported = await isSupported();
    return supported && 'Notification' in window && 'serviceWorker' in navigator;
  } catch (error) {
    console.error('❌ [FCM] Browser support check failed:', error);
    return false;
  }
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<{
  granted: boolean;
  status: NotificationPermission;
  message?: string;
}> {
  try {
    console.log('📢 [FCM] Requesting notification permission...');
    
    if (!('Notification' in window)) {
      console.error('❌ [FCM] Notifications not supported');
      return {
        granted: false,
        status: 'denied',
        message: 'Notifications not supported in this browser'
      };
    }

    // Check current permission
    const currentPermission = Notification.permission;
    console.log(`🔔 [FCM] Current permission: ${currentPermission}`);
    
    if (currentPermission === 'denied') {
      return {
        granted: false,
        status: 'denied',
        message: 'Notifications are blocked. Please enable them in browser settings.'
      };
    }
    
    if (currentPermission === 'granted') {
      return {
        granted: true,
        status: 'granted',
        message: 'Permission already granted'
      };
    }

    // Request permission
    const permission = await Notification.requestPermission();
    console.log(`🔔 [FCM] Permission result: ${permission}`);
    
    if (permission === 'denied') {
      return {
        granted: false,
        status: 'denied',
        message: 'You denied notification permission. Please enable it in browser settings.'
      };
    }
    
    return {
      granted: permission === 'granted',
      status: permission,
      message: permission === 'granted' ? 'Permission granted!' : 'Permission request dismissed'
    };
  } catch (error: any) {
    console.error('❌ [FCM] Permission request failed:', error);
    return {
      granted: false,
      status: 'denied',
      message: `Error: ${error.message}`
    };
  }
}

/**
 * Register service worker
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    if (!('serviceWorker' in navigator)) {
      console.error('❌ [FCM] Service workers not supported');
      return null;
    }

    console.log('🔧 [FCM] Registering service worker...');
    
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      type: 'classic'
    });

    console.log('✅ [FCM] Service worker registered');
    await navigator.serviceWorker.ready;
    
    return registration;
  } catch (error) {
    console.error('❌ [FCM] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Generate FCM token for this device
 */
export async function generateFCMToken(): Promise<string | null> {
  try {
    console.log('🔑 [FCM] Generating token...');

    if (!VAPID_KEY) {
      console.error('❌ [FCM] VAPID key not configured');
      console.error('Environment check:', {
        VAPID_KEY: typeof VAPID_KEY,
        value: VAPID_KEY,
        processEnv: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });
      return null;
    }
    
    console.log('✅ [FCM] VAPID key found, length:', VAPID_KEY.length);

    const supported = await isPushNotificationSupported();
    if (!supported) {
      console.error('❌ [FCM] Browser not supported');
      return null;
    }

    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('❌ [FCM] Service worker registration failed');
      return null;
    }

    // Get messaging instance
    const messaging = getMessaging(app);

    // Generate token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.error('❌ [FCM] Token generation failed');
      return null;
    }

    console.log('✅ [FCM] Token generated:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('❌ [FCM] Token generation error:', error);
    return null;
  }
}

/**
 * Store FCM token in Firestore
 */
export async function storeFCMToken(token: string, userId?: string): Promise<boolean> {
  try {
    console.log('💾 [FCM] Storing token in Firestore...');

    // Check if token already exists
    const tokensRef = collection(db, TOKENS_COLLECTION);
    const q = query(tokensRef, where('token', '==', token));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      console.log('ℹ️ [FCM] Token already exists');
      return true;
    }

    // Create new token document
    await addDoc(tokensRef, {
      token,
      userId: userId || null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    console.log('✅ [FCM] Token stored successfully');
    return true;
  } catch (error) {
    console.error('❌ [FCM] Token storage failed:', error);
    return false;
  }
}

/**
 * Setup foreground notification listener
 * Displays notifications when app is in foreground
 */
export function setupForegroundNotifications(
  onNotificationReceived?: (payload: any) => void
): () => void {
  try {
    console.log('👂 [FCM] Setting up foreground listener...');

    const messaging = getMessaging(app);

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📨 [FCM] Foreground message received:', payload);

      const { notification, data } = payload;
      const title = notification?.title || 'NearServe';
      const body = notification?.body || 'You have a new notification';
      const icon = notification?.icon || '/logo.png';

      // Display browser notification (even in foreground)
      if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification(title, {
          body,
          icon,
          badge: '/logo.png',
          tag: data?.type || 'foreground',
          data,
          requireInteraction: false,
        });

        // Auto-dismiss after 5 seconds
        setTimeout(() => notif.close(), 5000);

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      }

      // Call custom callback if provided
      if (onNotificationReceived) {
        onNotificationReceived({
          title,
          body,
          icon,
          data,
        });
      }
    });

    console.log('✅ [FCM] Foreground listener active');
    return unsubscribe;
  } catch (error) {
    console.error('❌ [FCM] Foreground listener setup failed:', error);
    return () => {};
  }
}

/**
 * Setup realtime listener for refresh_data collection
 * Updates UI without page reload
 */
export function setupRealtimeContentListener(
  elementId: string = 'liveContent',
  onContentUpdate?: (content: any) => void
): () => void {
  try {
    console.log('📡 [FCM] Setting up realtime content listener...');

    const contentRef = collection(db, CONTENT_COLLECTION);
    
    const unsubscribe = onSnapshot(contentRef, (snapshot) => {
      console.log('🔄 [FCM] Content updated, received:', snapshot.size, 'documents');

      const updates: any[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        updates.push({
          id: doc.id,
          title: data.title || 'Update',
          message: data.message || '',
          timestamp: data.created_at || data.timestamp,
          ...data
        });
      });

      // Sort by timestamp (newest first)
      updates.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(0);
        const timeB = b.timestamp?.toDate?.() || new Date(0);
        return timeB.getTime() - timeA.getTime();
      });

      console.log('📦 [FCM] Processed updates:', updates);

      // Update DOM if element exists
      const element = document.getElementById(elementId);
      if (element) {
        element.innerHTML = updates.map(item => `
          <div class="update-item" style="padding: 12px; margin: 8px 0; border-left: 3px solid #4F46E5; background: #F9FAFB; border-radius: 4px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1F2937;">${item.title}</h3>
            <p style="margin: 0 0 8px 0; color: #4B5563;">${item.message}</p>
            <small style="color: #9CA3AF;">
              ${item.timestamp?.toDate?.().toLocaleString() || 'Just now'}
            </small>
          </div>
        `).join('');
      }

      // Call custom callback if provided
      if (onContentUpdate) {
        onContentUpdate(updates);
      }
    }, (error) => {
      console.error('❌ [FCM] Realtime listener error:', error);
    });

    console.log('✅ [FCM] Realtime listener active');
    return unsubscribe;
  } catch (error) {
    console.error('❌ [FCM] Realtime listener setup failed:', error);
    return () => {};
  }
}

/**
 * Complete FCM initialization
 * Call this once when your app loads
 */
export async function initializeFCM(userId?: string): Promise<{
  success: boolean;
  token: string | null;
  error?: string;
}> {
  try {
    console.log('🚀 [FCM] Initializing...');

    // Check support
    const supported = await isPushNotificationSupported();
    if (!supported) {
      return {
        success: false,
        token: null,
        error: 'Browser not supported',
      };
    }

    // Request permission
    const permissionResult = await requestNotificationPermission();
    if (!permissionResult.granted) {
      return {
        success: false,
        token: null,
        error: permissionResult.message || 'Permission denied',
      };
    }

    // Generate token
    const token = await generateFCMToken();
    if (!token) {
      return {
        success: false,
        token: null,
        error: 'Token generation failed',
      };
    }

    // Store token
    const stored = await storeFCMToken(token, userId);
    if (!stored) {
      console.warn('⚠️ [FCM] Token storage failed, but continuing...');
    }

    // Setup foreground listener
    setupForegroundNotifications();

    // Setup realtime content listener
    setupRealtimeContentListener();

    console.log('✅ [FCM] Initialization complete!');
    return {
      success: true,
      token,
    };
  } catch (error: any) {
    console.error('❌ [FCM] Initialization failed:', error);
    return {
      success: false,
      token: null,
      error: error.message,
    };
  }
}

/**
 * Get current notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export default {
  isPushNotificationSupported,
  requestNotificationPermission,
  generateFCMToken,
  storeFCMToken,
  setupForegroundNotifications,
  setupRealtimeContentListener,
  initializeFCM,
  getNotificationPermission,
};
