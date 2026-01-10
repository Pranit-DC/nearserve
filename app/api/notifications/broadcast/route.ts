/**
 * Send Notification to All Subscribed Users
 * 
 * This API route sends push notifications to all tokens stored in Firestore
 * No Cloud Functions or billing required - runs on Vercel free tier
 * 
 * Endpoint: POST /api/notifications/broadcast
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, icon } = body;

    // Validate input
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: title and message' },
        { status: 400 }
      );
    }

    console.log('📢 [Broadcast] Broadcasting notification to all users:', { title, message });

    // Get all FCM tokens from Firestore
    const tokensSnapshot = await adminDb.collection('refresh_data_tokens').get();
    
    if (tokensSnapshot.empty) {
      console.log('⚠️ [Broadcast] No tokens found in database');
      return NextResponse.json({
        success: true,
        message: 'No recipients found',
        sent: 0
      });
    }

    const tokens = tokensSnapshot.docs.map((doc: any) => doc.data().token).filter(Boolean);
    console.log(`📤 [Broadcast] Found ${tokens.length} tokens`);

    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No valid tokens found',
        sent: 0
      });
    }

    // Send notification via FCM v1 API route (uses Firebase Admin SDK)
    const fcmResponse = await fetch(`${request.nextUrl.origin}/api/fcm/send-v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokens,
        title,
        body: message,
        icon: icon || '/logo.png',
        data: {
          type: 'broadcast',
          timestamp: new Date().toISOString()
        }
      }),
    });

    const result = await fcmResponse.json();

    if (!fcmResponse.ok) {
      console.error('❌ [Broadcast] Failed to send notifications:', result);
      return NextResponse.json(
        { error: 'Failed to send notifications', details: result },
        { status: 500 }
      );
    }

    console.log('✅ [Broadcast] Notifications sent successfully:', result);

    return NextResponse.json({
      success: true,
      sent: result.successCount || 0,
      failed: result.failureCount || 0,
      total: tokens.length,
      details: result
    });

  } catch (error) {
    console.error('❌ [Broadcast] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
