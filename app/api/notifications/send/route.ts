import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Server-side notification sending endpoint
 * No client-side FCM needed - all handled on server
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, title, message, type, actionUrl } = await request.json();

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, message' },
        { status: 400 }
      );
    }

    // Create in-app notification in Firestore
    const notificationData = {
      userId,
      title,
      message,
      type: type || 'GENERAL',
      actionUrl: actionUrl || null,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const notificationRef = await adminDb
      .collection(COLLECTIONS.NOTIFICATIONS)
      .add(notificationData);

    // Optional: Send push notification if user has FCM token
    let pushNotificationSent = false;
    try {
      const userDoc = await adminDb
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .get();

      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;

      if (fcmToken) {
        // Send push notification via Firebase Admin SDK
        const admin = await import('firebase-admin');
        
        console.log(`[Notification] 📤 Attempting to send push to token: ${fcmToken.substring(0, 20)}...`);
        
        try {
          const messagePayload = {
            token: fcmToken,
            notification: {
              title,
              body: message,
            },
            data: {
              notificationId: notificationRef.id,
              type: type || 'GENERAL',
              actionUrl: actionUrl || '',
              title: title,
              message: message,
            },
            webpush: {
              notification: {
                title,
                body: message,
                icon: '/logo.png',
                badge: '/logo.png',
              },
              fcmOptions: {
                link: actionUrl || '/',
              },
            },
          };
          
          console.log('[Notification] 📨 Sending payload:', JSON.stringify(messagePayload, null, 2));
          
          const result = await admin.messaging().send(messagePayload);
          console.log(`[Notification] ✅ Push sent successfully! Message ID: ${result}`);
          pushNotificationSent = true;
        } catch (fcmError: any) {
          console.log(`[Notification] ⚠️ Push failed:`, fcmError.code, fcmError.message);
          
          // If token is invalid, remove it from user profile
          if (fcmError.code === 'messaging/registration-token-not-registered' || 
              fcmError.code === 'messaging/invalid-registration-token') {
            console.log(`[Notification] 🧹 Removing invalid FCM token for user ${userId}`);
            await adminDb.collection(COLLECTIONS.USERS).doc(userId).update({
              fcmToken: null,
              fcmTokenUpdatedAt: null,
              notificationsEnabled: false,
            });
          }
        }
      } else {
        console.log(`[Notification] ℹ️ User ${userId} has no FCM token`);
      }
    } catch (pushError: any) {
      // Don't fail if push fails - in-app notification still created
      console.log('[Notification] ⚠️ Push notification error:', pushError.message);
    }

    return NextResponse.json({
      success: true,
      notificationId: notificationRef.id,
      message: 'Notification sent successfully',
      pushNotificationSent,
    });
  } catch (error: any) {
    console.error('[Notification] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification', details: error.message },
      { status: 500 }
    );
  }
}
