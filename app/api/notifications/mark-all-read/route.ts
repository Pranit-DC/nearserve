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

    // Use firebaseUid directly (notifications are stored with firebaseUid now)
    const result = await markAllNotificationsAsRead(firebaseUid);

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
