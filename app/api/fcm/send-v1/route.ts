/**
 * Firebase Cloud Messaging Backend Service (FCM HTTP v1 API)
 * 
 * Uses modern FCM HTTP v1 API with OAuth2 authentication
 * Requires Firebase Admin SDK service account credentials
 * 
 * FREE TIER COMPATIBLE - No Cloud Functions needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    // Service account credentials from environment
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    initializeApp({
      credential: cert(serviceAccount as any),
    });

    console.log('✅ [FCM Backend] Firebase Admin initialized');
  } catch (error) {
    console.error('❌ [FCM Backend] Firebase Admin initialization failed:', error);
  }
}

interface NotificationPayload {
  to?: string;           // Single device token
  tokens?: string[];     // Multiple device tokens
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
}

/**
 * Send push notification using FCM HTTP v1 API
 * 
 * POST /api/fcm/send-v1
 * 
 * Body:
 * {
 *   "to": "device_token",  // OR "tokens": ["token1", "token2"]
 *   "title": "Notification Title",
 *   "body": "Notification message",
 *   "icon": "/icon.png",  // optional
 *   "data": { "key": "value" }  // optional
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as NotificationPayload;
    const { to, tokens, title, body: messageBody, icon, data } = body;

    // Validate input
    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: title and body' },
        { status: 400 }
      );
    }

    if (!to && (!tokens || tokens.length === 0)) {
      return NextResponse.json(
        { error: 'Missing required field: to or tokens' },
        { status: 400 }
      );
    }

    console.log('📤 [FCM v1] Sending notification:', { title, body: messageBody });

    const messaging = getMessaging();

    // Prepare notification message
    const notification = {
      title,
      body: messageBody,
      ...(icon && { imageUrl: icon }),
    };

    const messageData = data ? Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, String(value)])
    ) : undefined;

    // Send to single token
    if (to) {
      const message = {
        token: to,
        notification,
        data: messageData,
        webpush: {
          notification: {
            icon: icon || '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'fcm-notification',
            requireInteraction: false,
          },
          fcmOptions: {
            link: '/',
          },
        },
      };

      const response = await messaging.send(message);
      console.log('✅ [FCM v1] Message sent successfully:', response);

      return NextResponse.json({
        success: true,
        messageId: response,
        sent: 1,
        failed: 0,
      });
    }

    // Send to multiple tokens
    if (tokens && tokens.length > 0) {
      const messages = tokens.map(token => ({
        token,
        notification,
        data: messageData,
        webpush: {
          notification: {
            icon: icon || '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'fcm-notification',
            requireInteraction: false,
          },
          fcmOptions: {
            link: '/',
          },
        },
      }));

      const response = await messaging.sendEach(messages);
      console.log('✅ [FCM v1] Batch messages sent:', {
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      return NextResponse.json({
        success: true,
        sent: response.successCount,
        failed: response.failureCount,
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

  } catch (error: any) {
    console.error('❌ [FCM v1] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send notification', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Test endpoint to verify FCM v1 API is working
 * 
 * GET /api/fcm/send-v1
 */
export async function GET() {
  return NextResponse.json({
    service: 'Firebase Cloud Messaging HTTP v1 API',
    status: 'ready',
    endpoints: {
      POST: {
        description: 'Send push notification',
        body: {
          to: 'device_token (single)',
          tokens: ['token1', 'token2'],
          title: 'Notification title',
          body: 'Notification message',
          icon: '/icon.png (optional)',
          data: { key: 'value (optional)' }
        }
      }
    },
    docs: 'https://firebase.google.com/docs/cloud-messaging/send-message'
  });
}
