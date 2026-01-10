import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore';
import { protectWorkerApi } from '@/lib/api-auth';
import { sendPushNotification } from '@/lib/push-notification';
import { createNotification } from '@/lib/notification-service';

/**
 * Test endpoint to send a push notification to the current worker
 * POST /api/debug/test-worker-push
 */
export async function POST(req: NextRequest) {
  try {
    const { user, response } = await protectWorkerApi(req);
    if (response) return response;

    const userId = user.id;
    const testTitle = '🔔 Test Notification';
    const testMessage = `This is a test push notification sent at ${new Date().toLocaleTimeString()}`;

    console.log(`[Debug] Testing push notification for worker ${userId}`);

    // Step 1: Check where FCM token is stored
    const tokenLocations: any = {};
    
    // Check users collection
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(userId).get();
    tokenLocations.users = userDoc.exists ? userDoc.data()?.fcmToken || null : null;

    // Check worker_profiles
    const workerQuery = await adminDb
      .collection(COLLECTIONS.WORKER_PROFILES)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    tokenLocations.worker_profiles = !workerQuery.empty 
      ? workerQuery.docs[0].data()?.fcmToken || null 
      : null;

    console.log('[Debug] Token locations:', {
      users: tokenLocations.users ? 'present' : 'missing',
      worker_profiles: tokenLocations.worker_profiles ? 'present' : 'missing',
    });

    // Step 2: Create in-app notification
    const inAppResult = await createNotification({
      userId,
      type: 'JOB_CREATED', // Using a real type for testing
      title: testTitle,
      message: testMessage,
      actionUrl: '/worker/dashboard',
    });
    console.log('[Debug] In-app notification result:', inAppResult);

    // Step 3: Send push notification
    const pushResult = await sendPushNotification({
      userId,
      title: testTitle,
      message: testMessage,
      type: 'JOB_CREATED',
      actionUrl: '/worker/dashboard',
    });
    console.log('[Debug] Push notification result:', pushResult);

    return NextResponse.json({
      success: true,
      message: 'Test notification sent',
      details: {
        userId,
        tokenLocations: {
          users: tokenLocations.users ? `${tokenLocations.users.substring(0, 20)}...` : null,
          worker_profiles: tokenLocations.worker_profiles ? `${tokenLocations.worker_profiles.substring(0, 20)}...` : null,
        },
        inAppNotification: inAppResult,
        pushNotification: pushResult,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Debug] Test push error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
