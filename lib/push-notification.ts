import { adminDb } from './firebase-admin';
import { COLLECTIONS } from './firestore';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Send push notification to a user (FCM only)
 * NOTE: This function ONLY sends FCM push notification.
 * In-app notifications are created separately by notification-service.ts
 * to avoid duplicate notifications.
 */
export async function sendPushNotification({
  userId,
  title,
  message,
  type,
  actionUrl,
}: {
  userId: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
}): Promise<{ success: boolean; pushSent: boolean; error?: string }> {
  try {
    // Send push notification if user has FCM token
    let pushNotificationSent = false;
    try {
      let fcmToken: string | null = null;

      // First, try to get token from users collection
      const userDoc = await adminDb
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .get();

      const userData = userDoc.data();
      fcmToken = userData?.fcmToken || null;

      // If no token found in users, check worker_profiles
      if (!fcmToken) {
        const workerProfileQuery = await adminDb
          .collection(COLLECTIONS.WORKER_PROFILES)
          .where('userId', '==', userId)
          .limit(1)
          .get();
        
        if (!workerProfileQuery.empty) {
          const workerData = workerProfileQuery.docs[0].data();
          fcmToken = workerData?.fcmToken || null;
        }
      }

      // If still no token, check customer_profiles
      if (!fcmToken) {
        const customerProfileQuery = await adminDb
          .collection(COLLECTIONS.CUSTOMER_PROFILES)
          .where('userId', '==', userId)
          .limit(1)
          .get();
        
        if (!customerProfileQuery.empty) {
          const customerData = customerProfileQuery.docs[0].data();
          fcmToken = customerData?.fcmToken || null;
        }
      }

      if (fcmToken) {
        // Send push notification via Firebase Admin SDK
        const admin = await import('firebase-admin');
        
        console.log(`[Push] 📤 Sending to user ${userId}: ${title}`);
        
        try {
          const messagePayload = {
            token: fcmToken,
            notification: {
              title,
              body: message,
            },
            data: {
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
          
          const result = await admin.messaging().send(messagePayload);
          console.log(`[Push] ✅ Sent successfully! Message ID: ${result}`);
          pushNotificationSent = true;
        } catch (fcmError: any) {
          console.log(`[Push] ⚠️ Failed:`, fcmError.code, fcmError.message);
          
          // If token is invalid, remove it from all profile collections
          if (fcmError.code === 'messaging/registration-token-not-registered' || 
              fcmError.code === 'messaging/invalid-registration-token') {
            console.log(`[Push] 🧹 Removing invalid FCM token for user ${userId}`);
            
            // Clear from users collection
            try {
              await adminDb.collection(COLLECTIONS.USERS).doc(userId).update({
                fcmToken: null,
                fcmTokenUpdatedAt: null,
                notificationsEnabled: false,
              });
            } catch (e) { /* ignore if user doc doesn't exist */ }
            
            // Clear from worker_profiles
            try {
              const workerQuery = await adminDb
                .collection(COLLECTIONS.WORKER_PROFILES)
                .where('userId', '==', userId)
                .limit(1)
                .get();
              if (!workerQuery.empty) {
                await workerQuery.docs[0].ref.update({ fcmToken: null });
              }
            } catch (e) { /* ignore */ }
            
            // Clear from customer_profiles
            try {
              const customerQuery = await adminDb
                .collection(COLLECTIONS.CUSTOMER_PROFILES)
                .where('userId', '==', userId)
                .limit(1)
                .get();
              if (!customerQuery.empty) {
                await customerQuery.docs[0].ref.update({ fcmToken: null });
              }
            } catch (e) { /* ignore */ }
          }
        }
      } else {
        console.log(`[Push] ℹ️ User ${userId} has no FCM token`);
      }
    } catch (pushError: any) {
      console.log('[Push] ⚠️ Error:', pushError.message);
    }

    return {
      success: true,
      pushSent: pushNotificationSent,
    };
  } catch (error: any) {
    console.error('[Push] Error:', error);
    return {
      success: false,
      pushSent: false,
      error: error.message,
    };
  }
}
