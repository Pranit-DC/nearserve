/**
 * API Route: FCM Token Management
 * 
 * Purpose: Save FCM token to user profile and optionally subscribe to topics
 * Endpoint: POST /api/fcm/subscribe
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging, adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST - Save FCM token to user profile
 * Body: { userId: string, fcmToken: string, topic?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, fcmToken, topic } = await request.json();

    // Validate input
    if (!userId || !fcmToken) {
      return NextResponse.json(
        { success: false, message: 'Missing userId or fcmToken' },
        { status: 400 }
      );
    }

    console.log(`📬 [API] Saving FCM token for user: ${userId}`);

    // Save FCM token to user's Firestore document
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);
    await userRef.set({
      fcmToken,
      fcmTokenUpdatedAt: FieldValue.serverTimestamp(),
      notificationsEnabled: true,
    }, { merge: true });

    console.log(`✅ [API] FCM token saved to users collection`);

    // Also update worker profile if exists
    try {
      const workerProfileQuery = await adminDb
        .collection(COLLECTIONS.WORKER_PROFILES)
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (!workerProfileQuery.empty) {
        await workerProfileQuery.docs[0].ref.update({
          fcmToken,
          updatedAt: FieldValue.serverTimestamp(),
        });
        console.log(`✅ [API] FCM token saved to worker_profiles collection`);
      }
    } catch (e) { /* ignore - worker profile may not exist */ }

    // Also update customer profile if exists
    try {
      const customerProfileQuery = await adminDb
        .collection(COLLECTIONS.CUSTOMER_PROFILES)
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (!customerProfileQuery.empty) {
        await customerProfileQuery.docs[0].ref.update({
          fcmToken,
          updatedAt: FieldValue.serverTimestamp(),
        });
        console.log(`✅ [API] FCM token saved to customer_profiles collection`);
      }
    } catch (e) { /* ignore - customer profile may not exist */ }

    // Optionally subscribe to topic
    if (topic) {
      try {
        const response = await adminMessaging.subscribeToTopic([fcmToken], topic);
        console.log(`✅ [API] Subscribed to topic: ${topic}`, response);
      } catch (topicError) {
        console.warn('⚠️ [API] Topic subscription failed, but token saved:', topicError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'FCM token saved successfully. Push notifications enabled!',
    });
  } catch (error: any) {
    console.error('❌ [API] Error saving FCM token:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Unsubscribe token from a topic
 * Body: { token: string, topic: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { token, topic } = await request.json();

    if (!token || !topic) {
      return NextResponse.json(
        { success: false, message: 'Missing token or topic' },
        { status: 400 }
      );
    }

    console.log(`📭 [API] Unsubscribing token from topic: ${topic}`);

    const response = await adminMessaging.unsubscribeFromTopic([token], topic);

    if (response.failureCount > 0) {
      const errorInfo = response.errors?.[0];
      console.error('❌ [API] Unsubscribe failed:', errorInfo);
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorInfo?.error?.message || 'Unsubscribe failed',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully unsubscribed from topic: ${topic}`,
      successCount: response.successCount,
    });
  } catch (error: any) {
    console.error('❌ [API] Error unsubscribing from topic:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
