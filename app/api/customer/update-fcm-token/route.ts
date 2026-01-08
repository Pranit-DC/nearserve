import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore';
import { protectCustomerApi } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await protectCustomerApi(req);
    if (response) return response;

    const { fcmToken } = await req.json();

    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json(
        { error: 'Invalid FCM token' },
        { status: 400 }
      );
    }

    // Find customer profile by userId
    const customerProfilesRef = adminDb.collection(COLLECTIONS.CUSTOMER_PROFILES);
    const customerProfileQuery = await customerProfilesRef
      .where('userId', '==', user.id)
      .limit(1)
      .get();

    if (customerProfileQuery.empty) {
      return NextResponse.json(
        { error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    const customerProfileDoc = customerProfileQuery.docs[0];
    
    // Update FCM token
    await customerProfileDoc.ref.update({
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
