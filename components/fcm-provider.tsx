'use client';

/**
 * FCM Notification Manager Component
 * 
 * Purpose: Initialize and manage Firebase Cloud Messaging
 * Usage: Add once to your app layout or main component
 */

import React, { useEffect, useState } from 'react';
import { initializeFCM, getNotificationPermission } from '@/lib/fcm-service';

interface FCMProviderProps {
  userId?: string;
  children?: React.ReactNode;
}

export function FCMProvider({ userId, children }: FCMProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Initialize FCM on component mount
    const init = async () => {
      console.log('🔔 [FCM Provider] Initializing...');

      // Check current permission
      const currentPermission = getNotificationPermission();
      setPermission(currentPermission);

      if (currentPermission === 'denied') {
        console.log('🚫 [FCM Provider] Notifications denied by user');
        setInitialized(true);
        return;
      }

      // Initialize FCM
      const result = await initializeFCM(userId);

      if (result.success && result.token) {
        console.log('✅ [FCM Provider] Initialized successfully');
        setToken(result.token);
        setPermission('granted');
      } else {
        console.warn('⚠️ [FCM Provider] Initialization failed:', result.error);
      }

      setInitialized(true);
    };

    init();
  }, [userId]);

  // Don't render anything (this is just a provider for initialization)
  return children ? <>{children}</> : null;
}

/**
 * Notification Bell Component
 * Shows notification permission status and allows user to enable
 */
export function NotificationBell() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const result = await initializeFCM();
      if (result.success) {
        setPermission('granted');
        alert('Notifications enabled successfully! 🔔');
      } else {
        alert('Failed to enable notifications: ' + result.error);
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      alert('Error enabling notifications');
    } finally {
      setLoading(false);
    }
  };

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <svg
          className="w-5 h-5 text-red-500"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        <span>Notifications blocked</span>
      </div>
    );
  }

  if (permission === 'granted') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <svg
          className="w-5 h-5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span>Notifications enabled</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleEnableNotifications}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {loading ? 'Enabling...' : 'Enable Notifications'}
    </button>
  );
}

export default FCMProvider;
