'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { requestNotificationPermission, onMessageListener } from '@/lib/fcm';
import { Bell, BellOff, X } from 'lucide-react';
import { toast } from 'sonner';

export function CustomerNotificationPermission() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Show prompt if permission is default (not asked yet)
      if (Notification.permission === 'default') {
        // Delay showing the prompt for better UX
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
    if (permission === 'granted') {
      // Listen for foreground messages
      onMessageListener()
        .then((payload: any) => {
          console.log('Received foreground message:', payload);
          
          // Show toast notification
          toast.info(payload.notification?.title || 'New notification', {
            description: payload.notification?.body,
            duration: 5000,
          });
        })
        .catch((err) => console.error('Failed to receive message:', err));
    }
  }, [permission]);

  const handleEnableNotifications = async () => {
    try {
      const token = await requestNotificationPermission();
      
      if (token) {
        setPermission('granted');
        setShowPrompt(false);
        
        // Save FCM token to customer profile
        if (user?.uid) {
          await fetch('/api/customer/update-fcm-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fcmToken: token }),
          });
          
          toast.success('Notifications enabled! You\'ll receive updates on your bookings.');
        }
      } else {
        setPermission('denied');
        setShowPrompt(false);
        toast.error('Notification permission denied. Enable it in browser settings.');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
    }
  };

  if (!isSupported) {
    return null;
  }

  // Don't show any indicator when notifications are granted
  if (permission === 'granted') {
    return null;
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm">
        <BellOff className="w-4 h-4 text-red-600 dark:text-red-400" />
        <span className="text-red-700 dark:text-red-300">Notifications blocked</span>
      </div>
    );
  }

  // Prompt to enable notifications
  if (showPrompt) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Enable Notifications
              </h3>
            </div>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Get instant alerts when workers accept your job requests or when there are updates on your bookings.
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleEnableNotifications}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Enable
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
