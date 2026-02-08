/**
 * Broadcast Notification API (FCM HTTP v1)
 * 
 * Sends push notifications to all registered devices
 * Uses Firebase Admin SDK with OAuth2 authentication
 * 
 * POST /api/notifications/broadcast-v1
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('⚠️ [Broadcast v1] Firebase credentials not fully configured');
    } else {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
  } catch (error) {
    console.error('❌ [Broadcast v1] Firebase Admin init failed:', error);
  }
}

interface BroadcastPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
}

/**
 * Broadcast notification to all users
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as BroadcastPayload;
    const { title, body, icon, data } = payload;

    // Validate input
    if (!title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: title and body' },
        { status: 400 }
      );
    }

    console.log('📢 [Broadcast v1] Broadcasting:', { title, body });

    // Get all FCM tokens from Firestore
    const db = getFirestore();
    const tokensSnapshot = await db.collection('refresh_data_tokens').get();

    if (tokensSnapshot.empty) {
      console.log('⚠️ [Broadcast v1] No tokens found');
      return NextResponse.json({
        success: true,
        message: 'No recipients found',
        sent: 0,
      });
    }

    const tokens = tokensSnapshot.docs
      .map(doc => doc.data().token)
      .filter(token => token && typeof token === 'string');

    console.log(`📤 [Broadcast v1] Found ${tokens.length} tokens`);

    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No valid tokens found',
        sent: 0,
      });
    }

    // Send notification via FCM v1 API
    const origin = request.nextUrl.origin;
    const fcmResponse = await fetch(`${origin}/api/fcm/send-v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokens,
        title,
        body,
        icon: icon || '/icon-192x192.png',
        data: data || {
          type: 'broadcast',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    const result = await fcmResponse.json();

    if (!fcmResponse.ok) {
      console.error('❌ [Broadcast v1] Send failed:', result);
      return NextResponse.json(
        { error: 'Failed to send notifications', details: result },
        { status: 500 }
      );
    }

    console.log('✅ [Broadcast v1] Sent successfully:', result);

    return NextResponse.json({
      success: true,
      sent: result.sent || 0,
      failed: result.failed || 0,
      total: tokens.length,
    });

  } catch (error: any) {
    console.error('❌ [Broadcast v1] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get broadcast API info
 */
export async function GET() {
  return NextResponse.json({
    service: 'FCM Broadcast API (HTTP v1)',
    status: 'ready',
    usage: {
      method: 'POST',
      body: {
        title: 'Notification title',
        body: 'Notification message',
        icon: '/icon.png (optional)',
        data: { key: 'value (optional)' }
      }
    }
  });
}
