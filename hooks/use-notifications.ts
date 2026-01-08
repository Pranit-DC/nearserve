'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  jobId?: string;
  read: boolean;
  createdAt: any;
  updatedAt: any;
  metadata?: Record<string, any>;
}

interface UseNotificationsOptions {
  userId: string | null;
  enabled?: boolean;
  maxNotifications?: number;
}

/**
 * Real-time hook for notifications
 * Listens to Firestore and updates automatically when notifications change
 */
export function useNotifications({ userId, enabled = true, maxNotifications = 50 }: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false);
      return;
    }

    console.log(`[Notifications] Setting up listener for user ${userId}`);
    setLoading(true);
    setError(null);

    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(maxNotifications)
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notificationsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Notification[];

          const unread = notificationsData.filter(n => !n.read).length;

          console.log(`[Notifications] Received ${notificationsData.length} notifications (${unread} unread)`);
          
          setNotifications(notificationsData);
          setUnreadCount(unread);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('[Notifications] Listener error:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      // Cleanup listener on unmount
      return () => {
        console.log('[Notifications] Cleaning up listener');
        unsubscribe();
      };
    } catch (err: any) {
      console.error('[Notifications] Setup error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [userId, enabled, maxNotifications]);

  return { notifications, unreadCount, loading, error };
}
