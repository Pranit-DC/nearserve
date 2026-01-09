import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getApps } from 'firebase/app';
import app from './firebase-client';

// VAPID key from Firebase Console
// Get this from: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = 'BDPvgu8CPLAajELN-5fNOXh2knClUn_qqCFmVJayfnVUM81y8pEyrFt7UMvZYtbX1etUUzf6ZPx4Uvd0fo9DxoU';

/**
 * Check if FCM is properly configured
 */
const isFCMAvailable = () => {
  return VAPID_KEY && VAPID_KEY.length > 80 && !VAPID_KEY.includes('YOUR_');
};

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async () => {
  try {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported');
      return null;
    }

    // Check if running in browser
    if (typeof window === 'undefined') {
      return null;
    }

    // Check if FCM is configured
    if (!isFCMAvailable()) {
      console.error('❌ FCM not configured: Invalid or missing VAPID key');
      console.log('📝 Follow instructions in GET_VAPID_KEY.md to get your VAPID key');
      return null;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        
        // Ensure the service worker is active
        if (registration.active) {
          console.log('✅ Service worker is active and ready');
        } else {
          console.log('⏳ Waiting for service worker to activate...');
          await new Promise((resolve) => {
            if (registration.installing) {
              registration.installing.addEventListener('statechange', (e) => {
                if ((e.target as ServiceWorker).state === 'activated') {
                  resolve(undefined);
                }
              });
            } else if (registration.waiting) {
              registration.waiting.addEventListener('statechange', (e) => {
                if ((e.target as ServiceWorker).state === 'activated') {
                  resolve(undefined);
                }
              });
            }
          });
        }
        
        const messaging = getMessaging(app);
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });
        
        if (token) {
          console.log('✅ FCM Token received:', token.substring(0, 20) + '...');
          return token;
        } else {
          return null;
        }
      } catch (fcmError: any) {
        // Silently return null - errors are expected when permission not granted
        return null;
      }
    } else {
      // Permission denied or default - silently return null
      return null;
    }
    
    return null;
  } catch (error: any) {
    // Silently return null on any error
    return null;
  }
};

/**
 * Listen for foreground messages
 */
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return;
    }
    
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      resolve(payload);
    });
  });
