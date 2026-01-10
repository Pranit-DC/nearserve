'use client';

import { useEffect, useState } from 'react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { requestNotificationPermission } from '@/lib/fcm';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Component to handle push notification permission and FCM token registration
 * This runs client-side only and saves the FCM token to Firestore
 * If permission is already granted, automatically registers FCM token
 */
export function PushNotificationSetup() {
  const { userProfile } = useUserProfile();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [tokenRegistered, setTokenRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check permission and auto-register if already granted
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);
      
      // Auto-register FCM token if permission is already granted
      // Only attempt once to avoid repeated errors
      if (currentPermission === 'granted' && userProfile?.id && !tokenRegistered && !error && !loading) {
        autoRegisterToken();
      }
    }
  }, [userProfile?.id]);

  const autoRegisterToken = async () => {
    if (!userProfile?.id || tokenRegistered || error || loading) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Registering/refreshing FCM token...');
      const token = await requestNotificationPermission();
      
      if (token) {
        console.log('✅ Got FCM token, saving to Firestore...');
        const response = await fetch('/api/fcm/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userProfile.id,
            fcmToken: token
          })
        });

        const data = await response.json();
        
        if (data.success) {
          setTokenRegistered(true);
          console.log('✅ FCM token registered - push notifications enabled!');
          toast.success('Push notifications enabled!', { duration: 2000 });
        } else {
          setError('Failed to save FCM token');
          console.error('❌ Failed to save FCM token:', data.message);
        }
      } else {
        // Token is null - FCM not available (likely VAPID key issue)
        setError('FCM not configured');
        console.log('⚠️ Push notifications unavailable - update VAPID key in lib/fcm.ts');
      }
    } catch (error: any) {
      // Silently handle error to avoid console spam
      setError('FCM not configured');
      console.log('⚠️ Push notifications unavailable - check GET_VAPID_KEY.md for setup instructions');
    } finally {
      setLoading(false);
    }
  };

  const enablePushNotifications = async () => {
    if (!userProfile?.id) return;
    
    setError(null);
    try {
      const token = await requestNotificationPermission();
      
      if (token) {
        // Save FCM token to Firestore
        const response = await fetch('/api/fcm/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userProfile.id,
            fcmToken: token
          })
        });

        const data = await response.json();
        
        if (data.success) {
          setPermission('granted');
          setTokenRegistered(true);
          toast.success('Push notifications enabled! 🔔');
        } else {
          setError('Failed to save notification token');
          toast.error('Failed to save notification token');
        }
      } else {
        const errorMsg = 'FCM not available - check console for details';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('Push notification error:', error);
      const errorMsg = error.message || 'Unknown error occurred';
      setError(errorMsg);
      toast.error('Error: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if user is not logged in
  if (!userProfile) return null;

  // Already granted - show loading state while auto-registering
  if (permission === 'granted') {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Registering push notifications...</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <Check className="w-4 h-4" />
        <span>Push notifications enabled</span>
      </div>
    );
  }

  // Denied
  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="w-4 h-4" />
        <span>Push notifications blocked in browser settings</span>
      </div>
    );
  }

  // Show error if FCM configuration failed
  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
          <BellOff className="w-4 h-4" />
          <span>Push notifications unavailable</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {error.includes('VAPID') || error.includes('authentication') 
            ? '⚠️ VAPID key needs to be updated in lib/fcm.ts (see GET_VAPID_KEY.md)'
            : error}
        </p>
        <p className="text-xs text-muted-foreground">
          ✅ In-app notifications still work!
        </p>
      </div>
    );
  }

  // Default - show enable button
  return (
    <Button
      onClick={enablePushNotifications}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Bell className="w-4 h-4" />
      {loading ? 'Enabling...' : 'Enable Push Notifications'}
    </Button>
  );
}
