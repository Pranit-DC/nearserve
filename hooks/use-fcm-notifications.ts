'use client';

/**
 * React Hook for Firebase Cloud Messaging
 * 
 * Provides complete FCM functionality:
 * - Permission management
 * - Token generation and storage
 * - Topic subscription
 * - Foreground notification handling
 */

import { useEffect, useState, useCallback } from 'react';
import {
  isPushNotificationSupported,
  requestNotificationPermission,
  generateFCMToken,
  storeFCMToken,
  subscribeToTopic,
  setupForegroundNotifications,
  getNotificationPermission,
  initializeFCM
} from '@/lib/fcm-service';

export interface FCMNotification {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, any>;
}

export interface UseFCMReturn {
  // State
  isSupported: boolean;
  permission: NotificationPermission;
  token: string | null;
  subscribed: boolean;
  loading: boolean;
  error: string | null;
  lastNotification: FCMNotification | null;

  // Actions
  requestPermission: () => Promise<boolean>;
  initialize: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function useFCMNotifications(userId?: string): UseFCMReturn {
  const [isSupported] = useState(isPushNotificationSupported());
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<FCMNotification | null>(null);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const granted = await requestNotificationPermission();
      setPermission(granted ? 'granted' : 'denied');
      return granted;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Permission request failed';
      setError(errorMsg);
      console.error('❌ [useFCM] Permission error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize FCM (permission + token + subscription)
  const initialize = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications not supported in this browser');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔔 [useFCM] Initializing...');
      const result = await initializeFCM(userId);

      if (result.success && result.token) {
        setToken(result.token);
        setSubscribed(true);
        setPermission('granted');
        console.log('✅ [useFCM] Initialized successfully');
      } else {
        setError(result.error || 'Initialization failed');
        console.error('❌ [useFCM] Initialization failed:', result.error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Initialization failed';
      setError(errorMsg);
      console.error('❌ [useFCM] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [isSupported, userId]);

  // Unsubscribe from topic
  const unsubscribe = useCallback(async () => {
    if (!token) {
      console.warn('⚠️ [useFCM] No token to unsubscribe');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/fcm/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, topic: 'updates' })
      });

      if (response.ok) {
        setSubscribed(false);
        console.log('✅ [useFCM] Unsubscribed successfully');
      } else {
        throw new Error('Unsubscribe failed');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unsubscribe failed';
      setError(errorMsg);
      console.error('❌ [useFCM] Unsubscribe error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Setup foreground notification listener
  useEffect(() => {
    if (!isSupported || permission !== 'granted') {
      return;
    }

    console.log('👂 [useFCM] Setting up foreground listener');
    const unsubscribeListener = setupForegroundNotifications((notification) => {
      console.log('🔔 [useFCM] Received notification:', notification);
      setLastNotification(notification);
    });

    return () => {
      console.log('🔕 [useFCM] Cleaning up foreground listener');
      unsubscribeListener();
    };
  }, [isSupported, permission]);

  // Initialize permission state on mount
  useEffect(() => {
    if (isSupported) {
      setPermission(getNotificationPermission());
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    token,
    subscribed,
    loading,
    error,
    lastNotification,
    requestPermission,
    initialize,
    unsubscribe
  };
}

export default useFCMNotifications;
