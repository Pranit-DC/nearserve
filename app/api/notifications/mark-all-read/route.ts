import { NextRequest, NextResponse } from 'next/server';
import { markAllNotificationsAsRead } from '@/lib/notification-service';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore';

export async function POST(req: NextRequest) {
  try {
    // Get session cookie
    const sessionCookie = (await cookies()).get('__session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const firebaseUid = decodedToken.uid;

    // Look up the database user document ID from Firebase UID
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
    
    if (userQuery.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = userQuery.docs[0].id;

    // Use database user document ID (notifications are stored with userProfile.id)
    const result = await markAllNotificationsAsRead(userId);

    if (result.success) {
      return NextResponse.json({ success: true, count: result.count });
    } else {
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in mark-all-read API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
