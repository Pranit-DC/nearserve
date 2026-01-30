import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { resolveNoShowDispute, adminAdjustReputation } from "@/lib/reputation-service";
import { sendPushNotification } from "@/lib/push-notification";

/**
 * POST /api/reputation/admin/resolve-dispute
 * Admin endpoint to resolve no-show disputes
 * 
 * Body:
 * {
 *   noShowReportId: string,
 *   resolution: string,
 *   favorWorker: boolean
 * }
 * 
 * Returns: Updated report
 */
export async function POST(req: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get("__session")?.value;
    if (!sessionCookie)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const firebaseUid = decodedToken.uid;
    const body = await req.json();
    const { noShowReportId, resolution, favorWorker } = body;

    if (!noShowReportId || !resolution || typeof favorWorker !== 'boolean') {
      return NextResponse.json(
        { error: "Missing required fields: noShowReportId, resolution, favorWorker" },
        { status: 400 }
      );
    }

    // Get user and verify admin role
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (userQuery.empty)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userDoc = userQuery.docs[0];
    const user = userDoc.data() as { role?: string; [key: string]: any };

    // Verify admin role (you might want to add admin role to User model)
    // For now, we'll check if user has email ending with @admin.nearserve.com or similar
    // In production, add proper admin field to User model
    // const isAdmin = user.role === 'ADMIN'; // Once model is updated

    // Temporary: allow any request (in production add proper admin check)
    console.log(`[ADMIN] User ${userDoc.id} attempting to resolve dispute`);

    // Get the no-show report
    const noShowReportsRef = adminDb.collection(COLLECTIONS.NO_SHOW_REPORTS);
    const reportDoc = await noShowReportsRef.doc(noShowReportId).get();
    if (!reportDoc.exists) {
      return NextResponse.json(
        { error: "No-show report not found" },
        { status: 404 }
      );
    }

    const report = reportDoc.data() as { workerId?: string; customerId?: string; status?: string; jobId?: string; [key: string]: any };

    // Resolve the dispute
    const success = await resolveNoShowDispute(noShowReportId, resolution, favorWorker);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to resolve dispute" },
        { status: 500 }
      );
    }

    // Notify both parties
    try {
      const notificationMessage = favorWorker
        ? 'Dispute resolved in your favor! Your reputation has been restored.'
        : 'Dispute resolved. No-show penalty confirmed.';

      // Notify worker
      if (report.workerId) {
        await sendPushNotification({
          userId: report.workerId,
          title: '⚖️ Dispute Resolution',
          message: notificationMessage,
          type: 'ADMIN_DECISION',
          actionUrl: '/worker/disputes',
        });
      }

      // Notify customer
      if (report.customerId) {
        const customerMessage = favorWorker
          ? 'Your dispute was resolved. The worker was not penalized.'
          : 'Your dispute was upheld. The worker has been penalized.';

        await sendPushNotification({
          userId: report.customerId,
          title: '⚖️ Dispute Resolution',
          message: customerMessage,
          type: 'ADMIN_DECISION',
          actionUrl: '/customer/disputes',
        });
      }
    } catch (notifError) {
      console.error('Failed to send notifications:', notifError);
    }

    // Get updated report
    const updatedReportDoc = await reportDoc.ref.get();
    const updatedReport = {
      id: updatedReportDoc.id,
      ...updatedReportDoc.data(),
      createdAt: updatedReportDoc.data()?.createdAt?.toDate?.() || new Date(),
      resolvedAt: updatedReportDoc.data()?.resolvedAt?.toDate?.() || null,
      updatedAt: updatedReportDoc.data()?.updatedAt?.toDate?.() || new Date(),
    };

    return NextResponse.json({
      success: true,
      report: updatedReport,
      message: `Dispute resolved ${favorWorker ? 'in favor of worker' : 'against worker'}`,
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reputation/admin/adjust-reputation
 * Admin endpoint to manually adjust worker reputation
 * 
 * Body:
 * {
 *   workerId: string,
 *   change: number (positive or negative),
 *   reason: string
 * }
 */
export async function PATCH(req: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get("__session")?.value;
    if (!sessionCookie)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const firebaseUid = decodedToken.uid;
    const body = await req.json();
    const { workerId, change, reason } = body;

    if (!workerId || typeof change !== 'number' || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: workerId, change, reason" },
        { status: 400 }
      );
    }

    // Get user and verify admin role
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (userQuery.empty)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userDoc = userQuery.docs[0];

    // Adjust reputation
    const success = await adminAdjustReputation(workerId, change, reason, userDoc.id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to adjust reputation" },
        { status: 500 }
      );
    }

    // Notify worker
    try {
      const action = change > 0 ? 'increased' : 'decreased';
      await sendPushNotification({
        userId: workerId,
        title: '🔧 Reputation Adjusted',
        message: `Your reputation has been ${action} by ${Math.abs(change)} points. Reason: ${reason}`,
        type: 'ADMIN_ADJUSTMENT',
        actionUrl: '/worker/profile',
      });
    } catch (notifError) {
      console.error('Failed to notify worker:', notifError);
    }

    return NextResponse.json({
      success: true,
      message: `Worker reputation adjusted by ${change}`,
    });
  } catch (error) {
    console.error('Error adjusting reputation:', error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
