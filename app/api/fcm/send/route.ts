/**
 * FCM Send Notification API Route (FREE - No Admin SDK)
 * 
 * Uses FCM HTTP v1 API directly to send push notifications
 * No Cloud Functions or billing account required
 * 
 * Endpoint: POST /api/fcm/send
 */

import { NextRequest, NextResponse } from 'next/server';

// FCM HTTP v1 API endpoint
const FCM_API_URL = 'https://fcm.googleapis.com/fcm/send';

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

    // Get FCM Server Key from environment
    const serverKey = process.env.FCM_SERVER_KEY;
    if (!serverKey) {
      console.error('❌ [FCM API] FCM_SERVER_KEY not configured in environment');
      return NextResponse.json(
        { error: 'FCM Server Key not configured' },
        { status: 500 }
      );
    }

    console.log('📤 [FCM API] Sending notification:', {
      title: notification.title,
      body: notification.body,
      recipients: to ? 1 : tokens?.length || 0
    });

    // Prepare notification payload for FCM HTTP API
    const fcmPayload = {
      notification: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icon-192x192.png',
      },
      data: data || {},
      // Send to single token or multiple tokens
      ...(to ? { to } : { registration_ids: tokens })
    };

    // Send to FCM HTTP API
    const response = await fetch(FCM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${serverKey}`,
      },
      body: JSON.stringify(fcmPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ [FCM API] Failed to send notification:', result);
      return NextResponse.json(
        { error: 'Failed to send notification', details: result },
        { status: response.status }
      );
    }

    console.log('✅ [FCM API] Notification sent successfully:', result);

    return NextResponse.json({
      success: true,
      messageId: result.multicast_id || result.message_id,
      results: result.results || [],
      successCount: result.success || 1,
      failureCount: result.failure || 0,
    });

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
