/**
 * FCM Send Notification API Route
 * 
 * Uses Firebase Admin SDK (FCM HTTP v1 API) to send push notifications
 * No Cloud Functions or billing account required
 * 
 * Endpoint: POST /api/fcm/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase-admin';

interface NotificationPayload {
  to?: string;           // Single device token
  tokens?: string[];     // Multiple device tokens
  notification: {
    title: string;
    body: string;
    icon?: string;
  };
  data?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, tokens, notification, data } = body as NotificationPayload;

    // Validate required fields
    if (!notification?.title || !notification?.body) {
      return NextResponse.json(
        { error: 'Missing required fields: notification.title and notification.body' },
        { status: 400 }
      );
    }

    if (!to && (!tokens || tokens.length === 0)) {
      return NextResponse.json(
        { error: 'Missing required field: to (single token) or tokens (array)' },
        { status: 400 }
      );
    }

    console.log('📤 [FCM API] Sending notification:', {
      title: notification.title,
      body: notification.body,
      recipients: to ? 1 : tokens?.length || 0
    });

    const icon = notification.icon || '/logo.png';

    // Prepare message data (must be string values)
    const messageData = data ? Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, String(value)])
    ) : undefined;

    // Send to single token
    if (to) {
      const message = {
        token: to,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: messageData,
        webpush: {
          notification: {
            icon,
            badge: '/logo.png',
            tag: 'fcm-notification',
            requireInteraction: false,
          },
          fcmOptions: {
            link: data?.actionUrl || '/',
          },
        },
      };

      const response = await adminMessaging.send(message);
      console.log('✅ [FCM API] Message sent successfully:', response);

      return NextResponse.json({
        success: true,
        messageId: response,
        successCount: 1,
        failureCount: 0,
      });
    }

    // Send to multiple tokens
    if (tokens && tokens.length > 0) {
      const messages = tokens.map(token => ({
        token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: messageData,
        webpush: {
          notification: {
            icon,
            badge: '/logo.png',
            tag: 'fcm-notification',
            requireInteraction: false,
          },
          fcmOptions: {
            link: data?.actionUrl || '/',
          },
        },
      }));

      const response = await adminMessaging.sendEach(messages);
      console.log('✅ [FCM API] Batch messages sent:', {
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      return NextResponse.json({
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        results: response.responses.map((r, i) => ({
          token: tokens[i],
          success: r.success,
          messageId: r.messageId,
          error: r.error?.message,
        })),
      });
    }

    return NextResponse.json(
      { error: 'No valid recipients' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ [FCM API] Error sending notification:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
