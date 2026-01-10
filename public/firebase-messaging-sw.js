/**
 * Firebase Cloud Messaging Service Worker
 * 
 * Purpose: Handle push notifications when the app is in the background
 * 
 * Features:
 * - Receives push notifications from FCM
 * - Displays notifications with custom title, body, icon
 * - Handles notification clicks to open/focus app
 * - Manages notification actions (buttons)
 */

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase with your config
// Note: This uses public API key which is safe to expose
firebase.initializeApp({
  apiKey: "AIzaSyCh2kbRiL7-Fzel32QHxUpWHdG9i1yPXXk",
  authDomain: "nearserve-pho.firebaseapp.com",
  projectId: "nearserve-pho",
  storageBucket: "nearserve-pho.firebasestorage.app",
  messagingSenderId: "1037787338890",
  appId: "1:1037787338890:web:b2a9aa672d242fa745f573",
  measurementId: "G-9K54D22T53"
});

const messaging = firebase.messaging();

/**
 * Background Message Handler
 * Triggered when a push notification is received while the app is in the background
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] 📬 Background message received:', payload);
  
  // Extract notification data from both possible locations
  const notificationTitle = payload.notification?.title || 
                            payload.data?.title || 
                            'NearServe Update';
  
  const notificationBody = payload.notification?.body || 
                          payload.data?.message || 
                          payload.data?.body || 
                          'You have a new notification';
  
  const notificationIcon = payload.notification?.icon || 
                          payload.data?.icon || 
                          '/logo.png';
  
  const notificationOptions = {
    body: notificationBody,
    icon: notificationIcon,
    badge: '/logo.png',
    tag: payload.data?.type || 'general-notification',
    data: {
      ...payload.data,
      click_action: payload.data?.actionUrl || 
                   payload.data?.click_action || 
                   payload.fcmOptions?.link || 
                   '/',
      timestamp: Date.now()
    },
    requireInteraction: false, // Auto-dismiss after a few seconds
    vibrate: [200, 100, 200], // Vibration pattern
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/logo.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  console.log('[SW] 🔔 Showing notification:', notificationTitle, notificationOptions);
  return self.registration.showNotification(notificationTitle, notificationOptions);
});


/**
 * Notification Click Handler
 * Triggered when user clicks on a notification
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🖱️ Notification clicked:', event.action);
  
  event.notification.close();
  
  // Handle notification action buttons
  if (event.action === 'dismiss') {
    console.log('[SW] ❌ Notification dismissed');
    return;
  }
  
  // Get the URL to open
  const urlToOpen = event.notification.data?.click_action || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      console.log('[SW] 🔍 Found', clientList.length, 'open windows');
      
      // Check if there's already a window with the app open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          console.log('[SW] ✨ Focusing existing window');
          return client.focus().then(client => {
            // Navigate to the URL if it's different
            if (urlToOpen !== '/' && client.navigate) {
              return client.navigate(urlToOpen);
            }
            return client;
          });
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        const fullUrl = self.location.origin + urlToOpen;
        console.log('[SW] 🪟 Opening new window:', fullUrl);
        return clients.openWindow(fullUrl);
      }
    })
  );
});

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('[SW] 📦 Service worker installing...');
  self.skipWaiting();
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] ✅ Service worker activated');
  event.waitUntil(clients.claim());
});

console.log('[SW] 🚀 Firebase Messaging Service Worker loaded');

