import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore';
import { protectApiRoute } from '@/lib/api-auth';

/**
 * Debug endpoint to check notification configuration for a user
 * GET /api/debug/notification-status
 */
export async function GET(req: NextRequest) {
  try {
    const { user, response } = await protectApiRoute(req);
    if (response) return response;

    const userId = user.id;
    const debugInfo: any = {
      userId,
      userRole: user.role,
      timestamp: new Date().toISOString(),
      fcmTokenLocations: {
        users: null,
        worker_profiles: null,
        customer_profiles: null,
        refresh_data_tokens: null,
      },
      notifications: {
        total: 0,
        unread: 0,
        recent: [],
      },
    };

    // 1. Check FCM token in users collection
    try {
      const userDoc = await adminDb
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        debugInfo.fcmTokenLocations.users = {
          hasToken: !!userData?.fcmToken,
          tokenPreview: userData?.fcmToken 
            ? userData.fcmToken.substring(0, 20) + '...' 
            : null,
          notificationsEnabled: userData?.notificationsEnabled || false,
          fcmTokenUpdatedAt: userData?.fcmTokenUpdatedAt?.toDate?.()?.toISOString() || null,
        };
      }
    } catch (e) {
      debugInfo.fcmTokenLocations.users = { error: (e as Error).message };
    }

    // 2. Check FCM token in worker_profiles
    try {
      const workerQuery = await adminDb
        .collection(COLLECTIONS.WORKER_PROFILES)
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (!workerQuery.empty) {
        const workerData = workerQuery.docs[0].data();
        debugInfo.fcmTokenLocations.worker_profiles = {
          profileId: workerQuery.docs[0].id,
          hasToken: !!workerData?.fcmToken,
          tokenPreview: workerData?.fcmToken 
            ? workerData.fcmToken.substring(0, 20) + '...' 
            : null,
        };
      } else {
        debugInfo.fcmTokenLocations.worker_profiles = { exists: false };
      }
    } catch (e) {
      debugInfo.fcmTokenLocations.worker_profiles = { error: (e as Error).message };
    }

    // 3. Check FCM token in customer_profiles
    try {
      const customerQuery = await adminDb
        .collection(COLLECTIONS.CUSTOMER_PROFILES)
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (!customerQuery.empty) {
        const customerData = customerQuery.docs[0].data();
        debugInfo.fcmTokenLocations.customer_profiles = {
          profileId: customerQuery.docs[0].id,
          hasToken: !!customerData?.fcmToken,
          tokenPreview: customerData?.fcmToken 
            ? customerData.fcmToken.substring(0, 20) + '...' 
            : null,
        };
      } else {
        debugInfo.fcmTokenLocations.customer_profiles = { exists: false };
      }
    } catch (e) {
      debugInfo.fcmTokenLocations.customer_profiles = { error: (e as Error).message };
    }

    // 4. Check refresh_data_tokens for any tokens from this user
    try {
      const tokenQuery = await adminDb
        .collection('refresh_data_tokens')
        .where('userId', '==', userId)
        .limit(5)
        .get();
      
      debugInfo.fcmTokenLocations.refresh_data_tokens = {
        count: tokenQuery.size,
        tokens: tokenQuery.docs.map(doc => ({
          id: doc.id,
          tokenPreview: doc.data().token?.substring(0, 20) + '...',
          createdAt: doc.data().created_at?.toDate?.()?.toISOString(),
        })),
      };
    } catch (e) {
      debugInfo.fcmTokenLocations.refresh_data_tokens = { error: (e as Error).message };
    }

    // 5. Get recent notifications
    try {
      const notificationsQuery = await adminDb
        .collection(COLLECTIONS.NOTIFICATIONS)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
      
      debugInfo.notifications.total = notificationsQuery.size;
      debugInfo.notifications.recent = notificationsQuery.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        type: doc.data().type,
        read: doc.data().read,
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      }));
      
      debugInfo.notifications.unread = notificationsQuery.docs.filter(
        doc => !doc.data().read
      ).length;
    } catch (e) {
      debugInfo.notifications = { error: (e as Error).message };
    }

    // 6. Determine effective FCM token
    const effectiveToken = 
      debugInfo.fcmTokenLocations.users?.hasToken ? 'users' :
      debugInfo.fcmTokenLocations.worker_profiles?.hasToken ? 'worker_profiles' :
      debugInfo.fcmTokenLocations.customer_profiles?.hasToken ? 'customer_profiles' :
      null;
    
    debugInfo.effectiveTokenSource = effectiveToken;
    debugInfo.canReceivePush = !!effectiveToken;

    // 7. Provide recommendations
    debugInfo.recommendations = [];
    if (!effectiveToken) {
      debugInfo.recommendations.push('No FCM token found. Enable notifications in the app.');
    }
    if (debugInfo.fcmTokenLocations.users?.hasToken && 
        debugInfo.fcmTokenLocations.worker_profiles?.hasToken &&
        debugInfo.fcmTokenLocations.users?.tokenPreview !== debugInfo.fcmTokenLocations.worker_profiles?.tokenPreview) {
      debugInfo.recommendations.push('Token mismatch between users and worker_profiles collections.');
    }

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    console.error('[Debug] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
