'use client';

/**
 * Firebase Cloud Messaging (FCM) Service
 * 
 * Purpose: Handle push notifications in the browser
 * Features:
 * - Request notification permission
 * - Generate and store FCM tokens
 * - Subscribe to topics
 * - Handle foreground notifications
 * - Store tokens in Firestore
 */

import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import app from './firebase-client';
import { db } from './firebase-client';

// VAPID key for web push (get from Firebase Console → Project Settings → Cloud Messaging)
// Replace with your actual VAPID key
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY_HERE';

// Firestore collection for FCM tokens
const TOKENS_COLLECTION = 'refresh_data_tokens';

// Topic for broadcast notifications
const UPDATES_TOPIC = 'updates';

/**
 * Check if push notifications are supported in the browser
 */
export async function isPushNotificationSupported(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    const supported = await isSupported();
    return supported && 'Notification' in window && 'serviceWorker' in navigator;
  } catch (error) {
    console.error('❌ [FCM] Error checking support:', error);
    return false;
  }
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  try {
    console.log('📢 [FCM] Requesting notification permission...');
    
    if (!('Notification' in window)) {
      console.error('❌ [FCM] This browser does not support notifications');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log(`🔔 [FCM] Permission status: ${permission}`);
    
    return permission;
  } catch (error) {
    console.error('❌ [FCM] Error requesting permission:', error);
    return 'denied';
  }
}

/**
 * Register service worker for background notifications
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
    });

    console.log('✅ [FCM] Service worker registered:', registration.scope);
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('✅ [FCM] Service worker ready');
    
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
    // Check support
    const supported = await isPushNotificationSupported();
    if (!supported) {
      console.error('❌ [FCM] Push notifications not supported');
      return null;
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('⚠️ [FCM] Notification permission not granted');
      return null;
    }

    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('❌ [FCM] Failed to register service worker');
      return null;
    }

    // Get messaging instance
    console.log('🔑 [FCM] Getting FCM token...');
    const messaging = getMessaging(app);

    // Generate token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('✅ [FCM] Token generated:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.error('❌ [FCM] No token received');
      return null;
    }
  } catch (error: any) {
    console.error('❌ [FCM] Error generating token:', error);
    if (error.code === 'messaging/permission-blocked') {
      console.error('🚫 [FCM] Notification permission blocked by user');
    }
    return null;
  }
}

/**
 * Check if token already exists in Firestore
 */
async function tokenExists(token: string): Promise<boolean> {
  try {
    const tokensRef = collection(db, TOKENS_COLLECTION);
    const q = query(tokensRef, where('token', '==', token));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('❌ [FCM] Error checking token existence:', error);
    return false;
  }
}

/**
 * Store FCM token in Firestore
 */
export async function storeFCMToken(token: string, userId?: string): Promise<boolean> {
  try {
    console.log('💾 [FCM] Storing token in Firestore...');

    // Check if token already exists
    const exists = await tokenExists(token);
    if (exists) {
      console.log('ℹ️ [FCM] Token already stored');
      return true;
    }

    // Store token
    const tokensRef = collection(db, TOKENS_COLLECTION);
    await addDoc(tokensRef, {
      token,
      userId: userId || null,
      created_at: serverTimestamp(),
      user_agent: navigator.userAgent,
      platform: navigator.platform,
    });

    console.log('✅ [FCM] Token stored successfully');
    return true;
  } catch (error) {
    console.error('❌ [FCM] Error storing token:', error);
    return false;
  }
}

/**
 * Subscribe user to a topic (via backend API)
 * Note: Topic subscription requires Firebase Admin SDK, so we call an API endpoint
 */
export async function subscribeToTopic(token: string, topic: string = UPDATES_TOPIC): Promise<boolean> {
  try {
    console.log(`📬 [FCM] Subscribing to topic: ${topic}...`);

    const response = await fetch('/api/fcm/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, topic }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Subscription failed');
    }

    const data = await response.json();
    console.log(`✅ [FCM] Subscribed to topic: ${topic}`);
    return data.success;
  } catch (error) {
    console.error('❌ [FCM] Error subscribing to topic:', error);
    return false;
  }
}

/**
 * Setup foreground message listener
 * This handles notifications when the app is in the foreground (active tab)
 */
export function setupForegroundNotifications(
  onNotificationReceived?: (payload: any) => void
): () => void {
  try {
    console.log('👂 [FCM] Setting up foreground notification listener...');

    const messaging = getMessaging(app);

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📨 [FCM] Foreground message received:', payload);

      // Extract notification data
      const { notification, data } = payload;
      const title = notification?.title || 'NearServe';
      const body = notification?.body || 'You have a new notification';
      const icon = notification?.icon || '/icon-192x192.png';

      // Show browser notification (even in foreground)
      if ('Notification' in window && Notification.permission === 'granted') {
        const notificationInstance = new Notification(title, {
          body,
          icon,
          badge: '/icon-192x192.png',
          tag: data?.type || 'foreground',
          data,
        });

        // Handle notification click
        notificationInstance.onclick = (event) => {
          event.preventDefault();
          window.focus();
          notificationInstance.close();
          
          // Navigate if click_action is provided
          if (data?.click_action) {
            window.location.href = data.click_action;
          }
        };

        console.log('🔔 [FCM] Foreground notification shown');
      }

      // Call custom handler if provided
      if (onNotificationReceived) {
        onNotificationReceived(payload);
      }
    });

    console.log('✅ [FCM] Foreground listener setup complete');
    return unsubscribe;
  } catch (error) {
    console.error('❌ [FCM] Error setting up foreground notifications:', error);
    return () => {};
  }
}

/**
 * Initialize FCM - Complete setup flow (FREE TIER VERSION)
 * Call this once when your app loads
 * 
 * No Cloud Functions or topic subscription required
 * Works on Firebase Spark (free) plan
 */
export async function initializeFCM(userId?: string): Promise<{
  success: boolean;
  token: string | null;
  error?: string;
}> {
  try {
    console.log('🚀 [FCM] Initializing Firebase Cloud Messaging (FREE TIER)...');

    // Check if supported
    const supported = await isPushNotificationSupported();
    if (!supported) {
      return {
        success: false,
        token: null,
        error: 'Push notifications not supported in this browser',
      };
    }

    // Generate token
    const token = await generateFCMToken();
    if (!token) {
      return {
        success: false,
        token: null,
        error: 'Failed to generate FCM token',
      };
    }

    // Store token in Firestore
    const stored = await storeFCMToken(token, userId);
    if (!stored) {
      console.warn('⚠️ [FCM] Failed to store token, but continuing...');
    }

    // Setup foreground listener
    setupForegroundNotifications();

    console.log('✅ [FCM] Initialization complete! Token stored in Firestore.');
    console.log('📝 [FCM] To send notifications, use /api/notifications/broadcast');
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
 * Check current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}
