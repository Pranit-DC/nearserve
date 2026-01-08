import { NextRequest, NextResponse } from 'next/server';
import { markNotificationAsRead } from '@/lib/notification-service';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    // Get session cookie
    const sessionCookie = (await cookies()).get('__session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session
    try {
      await adminAuth.verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await req.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const result = await markNotificationAsRead(notificationId);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to mark notification as read' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in mark-read API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
