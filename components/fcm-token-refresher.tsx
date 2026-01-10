'use client';

import { useEffect } from 'react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { requestNotificationPermission } from '@/lib/fcm';

/**
 * Silent FCM Token Refresher
 * Automatically refreshes FCM token when user logs in
 * Helps ensure push notifications work by keeping tokens fresh
 */
export function FCMTokenRefresher() {
  const { userProfile } = useUserProfile();

  useEffect(() => {
    if (!userProfile?.id) return;
    
    // Check if notifications are supported and permission is granted
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // Refresh token silently in background
    const refreshToken = async () => {
      try {
        const token = await requestNotificationPermission();
        
        if (token) {
          // Save refreshed token to Firestore using the correct user ID
          await fetch('/api/fcm/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userProfile.id, // Use database user ID, not Firebase UID
              fcmToken: token
            })
          });
        }
      } catch (error) {
        // Silent fail - don't log errors to avoid console spam
      }
    };

    // Refresh token on mount
    refreshToken();

    // Optional: Refresh token periodically (every 7 days worth of milliseconds)
    const REFRESH_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days
    const interval = setInterval(refreshToken, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [userProfile?.id]);

  // This component doesn't render anything
  return null;
}
