import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS, WorkerProfile } from '@/lib/firestore';
import { sendPushNotification } from '@/lib/sendNotification';

/**
 * Test endpoint to send push notifications
 * Usage: POST /api/test-notification
 * Body: { workerId: string, title: string, body: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { workerId, title, body } = await req.json();

    if (!workerId || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: workerId, title, body' },
        { status: 400 }
      );
    }

    // Get worker profile to find FCM token
    const workerProfilesRef = adminDb.collection(COLLECTIONS.WORKER_PROFILES);
    
    // First, try to find by userId
    let workerProfileQuery = await workerProfilesRef
      .where('userId', '==', workerId)
      .limit(1)
      .get();

    // If not found, try to get all profiles and find one with fcmToken
    if (workerProfileQuery.empty) {
      console.log(`No worker profile found with userId: ${workerId}`);
      console.log('Checking all worker profiles with FCM tokens...');
      
      workerProfileQuery = await workerProfilesRef
        .where('fcmToken', '!=', null)
        .limit(10)
        .get();
      
      if (workerProfileQuery.empty) {
        return NextResponse.json(
          { 
            error: 'No worker profiles found with notifications enabled',
            hint: 'Make sure you have enabled notifications and the FCM token was saved',
            debug: {
              searchedUserId: workerId,
              totalProfilesWithTokens: 0
            }
          },
          { status: 404 }
        );
      }
      
      // Use the first one with a token for testing
      console.log(`Found ${workerProfileQuery.docs.length} profiles with FCM tokens`);
      console.log('Using the first one for testing...');
    }

    const workerProfile = workerProfileQuery.docs[0].data() as WorkerProfile;

    if (!workerProfile.fcmToken) {
      return NextResponse.json(
        { 
          error: 'Worker has not enabled notifications',
          hint: 'Ask the worker to enable notifications in their dashboard'
        },
        { status: 400 }
      );
    }

    // Send notification
    const result = await sendPushNotification(workerProfile.fcmToken, {
      title,
      body,
      click_action: `${process.env.NEXT_PUBLIC_APP_URL}/worker/dashboard`,
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully',
        workerId,
        result,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send notification',
          details: result.error,
          errorCode: result.errorCode,
          errorDetails: result.errorDetails,
          hint: 'Check server console logs for more details'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in test-notification:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check if a worker has notifications enabled
 * Usage: GET /api/test-notification?workerId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workerId = searchParams.get('workerId');

    if (!workerId) {
      return NextResponse.json(
        { error: 'Missing workerId parameter' },
        { status: 400 }
      );
    }

    // Get worker profile
    const workerProfilesRef = adminDb.collection(COLLECTIONS.WORKER_PROFILES);
    const workerProfileQuery = await workerProfilesRef
      .where('userId', '==', workerId)
      .limit(1)
      .get();

    if (workerProfileQuery.empty) {
      return NextResponse.json(
        { 
          found: false,
          message: 'Worker profile not found' 
        },
        { status: 404 }
      );
    }

    const workerProfile = workerProfileQuery.docs[0].data() as WorkerProfile;
    const hasToken = !!workerProfile.fcmToken;

    return NextResponse.json({
      found: true,
      workerId,
      notificationsEnabled: hasToken,
      fcmTokenPresent: hasToken,
      message: hasToken 
        ? 'Worker has notifications enabled' 
        : 'Worker has not enabled notifications yet',
    });
  } catch (error) {
    console.error('Error checking notification status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
