import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getApps } from 'firebase/app';
import app from './firebase-client';

// VAPID key from Firebase Console
const VAPID_KEY = 'BAL5WnQvwQkt-h9UKBl3EhSWPwhnC_8Mo92_jPwozpkiN7WyaPKJl7h2-Qv-e2hNqKCBDgkNFUU_WZiv_0s-aGg';

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

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      // Ensure the service worker is active
      if (registration.active) {
        console.log('Service worker is active and ready');
      } else {
        console.log('Waiting for service worker to activate...');
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
      
      console.log('FCM Token:', token);
      return token;
    } else {
      console.warn('Notification permission denied');
    }
    
    return null;
  } catch (error) {
    console.error('Error getting notification permission:', error);
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
