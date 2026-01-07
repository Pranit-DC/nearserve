import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore';
import { protectWorkerApi } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await protectWorkerApi(req);
    if (response) return response;

    const { fcmToken } = await req.json();

    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json(
        { error: 'Invalid FCM token' },
        { status: 400 }
      );
    }

    // Find worker profile by userId
    const workerProfilesRef = adminDb.collection(COLLECTIONS.WORKER_PROFILES);
    const workerProfileQuery = await workerProfilesRef
      .where('userId', '==', user.id)
      .limit(1)
      .get();

    if (workerProfileQuery.empty) {
      return NextResponse.json(
        { error: 'Worker profile not found' },
        { status: 404 }
      );
    }

    const workerProfileDoc = workerProfileQuery.docs[0];
    
    // Update FCM token
    await workerProfileDoc.ref.update({
      fcmToken,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'FCM token updated successfully',
    });
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
