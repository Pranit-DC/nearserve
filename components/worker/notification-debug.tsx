'use client';

import { useState } from 'react';
import { useUserProfile } from '@/hooks/use-user-profile';

export function NotificationDebug() {
  const { userProfile } = useUserProfile();
  const [logs, setLogs] = useState<string[]>([]);
  const [fcmToken, setFcmToken] = useState<string>('');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const checkPermission = () => {
    if ('Notification' in window) {
      addLog(`✅ Notification API supported`);
      addLog(`Permission: ${Notification.permission}`);
    } else {
      addLog(`❌ Notification API not supported`);
    }
  };

  const checkServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      addLog(`✅ Service Worker supported`);
      const registrations = await navigator.serviceWorker.getRegistrations();
      addLog(`Found ${registrations.length} service workers`);
      registrations.forEach((reg, i) => {
        addLog(`SW ${i + 1}: ${reg.active?.scriptURL || 'inactive'}`);
      });
    } else {
      addLog(`❌ Service Worker not supported`);
    }
  };

  const requestPermission = async () => {
    try {
      addLog(`🔔 Requesting notification permission...`);
      const permission = await Notification.requestPermission();
      addLog(`Permission result: ${permission}`);
      
      if (permission === 'granted') {
        addLog(`✅ Permission granted! Registering service worker...`);
        
        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        addLog(`✅ Service worker registered`);
        
        // Try to get FCM token
        const { getMessaging, getToken } = await import('firebase/messaging');
        const app = (await import('@/lib/firebase-client')).default;
        
        const messaging = getMessaging(app);
        const token = await getToken(messaging, {
          vapidKey: 'BAL5WnQvwQkt-h9UKBl3EhSWPwhnC_8Mo92_jPwozpkiN7WyaPKJl7h2-Qv-e2hNqKCBDgkNFUU_WZiv_0s-aGg',
          serviceWorkerRegistration: registration,
        });
        
        if (token) {
          addLog(`✅ FCM Token received!`);
          addLog(`Token (first 50 chars): ${token.substring(0, 50)}...`);
          setFcmToken(token);
          
          // Save token to backend
          if (userProfile?.id) {
            const response = await fetch('/api/worker/update-fcm-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fcmToken: token }),
            });
            
            if (response.ok) {
              addLog(`✅ Token saved to database`);
            } else {
              const error = await response.json();
              addLog(`❌ Failed to save token: ${error.error}`);
            }
          }
        } else {
          addLog(`❌ No FCM token received`);
        }
      } else {
        addLog(`❌ Permission denied`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Full error:', error);
    }
  };

  const checkFirebaseConfig = () => {
    addLog(`Checking Firebase config...`);
    addLog(`API Key: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}`);
    addLog(`Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ Missing'}`);
    addLog(`Messaging Sender ID: ${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing'}`);
    addLog(`App ID: ${process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing'}`);
  };

  const sendTestNotification = async () => {
    if (!userProfile?.id) {
      addLog(`❌ Not logged in`);
      return;
    }

    try {
      addLog(`📤 Sending test notification...`);
      const response = await fetch('/api/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: userProfile.id,
          title: 'Test Notification',
          body: 'This is a test notification from debug panel!',
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        addLog(`✅ Notification sent successfully!`);
      } else {
        addLog(`❌ Failed to send: ${result.error || result.message}`);
        if (result.hint) addLog(`💡 Hint: ${result.hint}`);
      }
    } catch (error) {
      addLog(`❌ Error sending: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl p-4 max-h-[600px] overflow-auto z-50">
      <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">
        🔧 Notification Debug Panel
      </h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={checkPermission}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          1. Check Permission
        </button>
        
        <button
          onClick={checkServiceWorker}
          className="w-full px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
        >
          2. Check Service Worker
        </button>
        
        <button
          onClick={checkFirebaseConfig}
          className="w-full px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
        >
          3. Check Firebase Config
        </button>
        
        <button
          onClick={requestPermission}
          className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          4. Request Permission & Get Token
        </button>
        
        <button
          onClick={sendTestNotification}
          className="w-full px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
        >
          5. Send Test Notification
        </button>
        
        <button
          onClick={clearLogs}
          className="w-full px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
        >
          Clear Logs
        </button>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 text-xs font-mono max-h-64 overflow-auto">
        {logs.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">
            Click buttons above to start debugging...
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="text-gray-800 dark:text-gray-200 mb-1">
              {log}
            </div>
          ))
        )}
      </div>

      {fcmToken && (
        <div className="mt-3 p-2 bg-green-50 dark:bg-green-900 rounded text-xs">
          <div className="font-bold text-green-800 dark:text-green-200 mb-1">FCM Token:</div>
          <div className="text-green-700 dark:text-green-300 break-all">{fcmToken}</div>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        User ID: {userProfile?.id || 'Not logged in'}
      </div>
    </div>
  );
}
