import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, NoShowReportStatus } from "@/lib/firestore";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { decrementReputationForNoShow, resolveNoShowDispute, getPendingNoShowReports } from "@/lib/reputation-service";
import { sendPushNotification } from "@/lib/push-notification";

/**
 * GET /api/reputation/no-show-reports
 * - Customers: Get no-show reports they filed
 * - Workers: Get no-show reports filed against them
 * - Query params: ?status=PENDING&limit=10
 */
export async function GET(req: NextRequest) {
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

    // Get user
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (userQuery.empty)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userDoc = userQuery.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() as { role?: string; [key: string]: any } };

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);

    const noShowReportsRef = adminDb.collection(COLLECTIONS.NO_SHOW_REPORTS);
    let query = noShowReportsRef as any;

    if (user.role === 'CUSTOMER') {
      // Customers see reports they filed
      query = query.where('customerId', '==', user.id);
    } else if (user.role === 'WORKER') {
      // Workers see reports filed against them
      query = query.where('workerId', '==', user.id);
    } else {
      return NextResponse.json({ error: "Invalid user role" }, { status: 403 });
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('createdAt', 'desc').limit(limit);
    const reports = await query.get();

    const reportsData = reports.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      resolvedAt: doc.data().resolvedAt?.toDate?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    }));

    return NextResponse.json({
      success: true,
      reports: reportsData,
      count: reportsData.length,
    });
  } catch (error) {
    console.error('Error fetching no-show reports:', error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reputation/no-show-reports
 * Create a new no-show report (Customer action)
 * 
 * Body:
 * {
 *   jobId: string,
 *   reason: string,
 *   evidence?: string (URL to photo/screenshot)
 * }
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
    const { jobId, reason, evidence } = body;

    if (!jobId || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: jobId, reason" },
        { status: 400 }
      );
    }

    // Get user
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (userQuery.empty)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userDoc = userQuery.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() as { role?: string; [key: string]: any } };

    // Only customers can file no-show reports
    if (user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: "Only customers can file no-show reports" },
        { status: 403 }
      );
    }

    // Get job
    const jobsRef = adminDb.collection(COLLECTIONS.JOBS);
    const jobDoc = await jobsRef.doc(jobId).get();
    if (!jobDoc.exists) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const job = jobDoc.data() as { customerId?: string; workerId?: string; status?: string; [key: string]: any };

    // Verify user is the customer of this job
    if (job.customerId !== user.id) {
      return NextResponse.json(
        { error: "You can only report no-show for your own jobs" },
        { status: 403 }
      );
    }

    // Check if job is completed (no-show only applies to incomplete jobs)
    if (job.status === 'COMPLETED') {
      return NextResponse.json(
        { error: "Cannot report no-show for completed jobs" },
        { status: 400 }
      );
    }

    // Check if report already exists
    const existingReportQuery = await adminDb
      .collection(COLLECTIONS.NO_SHOW_REPORTS)
      .where('jobId', '==', jobId)
      .limit(1)
      .get();

    if (!existingReportQuery.empty) {
      return NextResponse.json(
        { error: "No-show report already exists for this job" },
        { status: 400 }
      );
    }

    // Create no-show report
    const noShowReportsRef = adminDb.collection(COLLECTIONS.NO_SHOW_REPORTS);
    const reportData = {
      jobId,
      customerId: user.id,
      workerId: job.workerId,
      status: NoShowReportStatus.PENDING,
      reason,
      evidence: evidence || null,
      workerReply: null,
      resolution: null,
      createdAt: FieldValue.serverTimestamp() as any,
      resolvedAt: null,
      updatedAt: FieldValue.serverTimestamp() as any,
    };

    const reportRef = await noShowReportsRef.add(reportData);
    const reportId = reportRef.id;

    // Notify worker about the no-show report
    if (job.workerId) {
      try {
        await sendPushNotification({
          userId: job.workerId,
          title: '⚠️ No-Show Report Filed',
          message: `A customer filed a no-show report for one of your jobs. Reason: ${reason.substring(0, 50)}...`,
          type: 'NO_SHOW_REPORTED',
          actionUrl: '/worker/disputes',
        });
      } catch (error) {
        console.error('Failed to notify worker:', error);
      }
    }

    return NextResponse.json({
      success: true,
      reportId,
      report: {
        id: reportId,
        ...reportData,
      },
      message: "No-show report filed successfully. Worker has been notified.",
    });
  } catch (error) {
    console.error('Error creating no-show report:', error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reputation/no-show-reports/[reportId]
 * Worker disputes or resolves a no-show report
 * 
 * Body:
 * {
 *   action: 'DISPUTE' | 'ACCEPT_PENALTY',
 *   workerReply?: string
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
    const url = new URL(req.url);
    const reportId = url.pathname.split('/').pop();

    const body = await req.json();
    const { action, workerReply } = body;

    if (!reportId || !action || !['DISPUTE', 'ACCEPT_PENALTY'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request: reportId and valid action required" },
        { status: 400 }
      );
    }

    // Get user
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (userQuery.empty)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userDoc = userQuery.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() as { role?: string; [key: string]: any } };

    // Get report
    const noShowReportsRef = adminDb.collection(COLLECTIONS.NO_SHOW_REPORTS);
    const reportDoc = await noShowReportsRef.doc(reportId).get();
    if (!reportDoc.exists) {
      return NextResponse.json(
        { error: "No-show report not found" },
        { status: 404 }
      );
    }

    const report = reportDoc.data() as { workerId?: string; status?: string; [key: string]: any };

    // Verify user is the worker
    if (report.workerId !== user.id) {
      return NextResponse.json(
        { error: "Only the reported worker can dispute this report" },
        { status: 403 }
      );
    }

    // Can only reply to PENDING reports
    if (report.status !== NoShowReportStatus.PENDING) {
      return NextResponse.json(
        { error: `Cannot modify ${report.status} reports` },
        { status: 400 }
      );
    }

    if (action === 'DISPUTE') {
      // Update report status to DISPUTED
      await reportDoc.ref.update({
        status: NoShowReportStatus.DISPUTED,
        workerReply: workerReply || null,
        updatedAt: FieldValue.serverTimestamp() as any,
      });

      // Notify customer about the dispute
      if (report.customerId) {
        try {
          await sendPushNotification({
            userId: report.customerId,
            title: '💬 Worker Disputed No-Show Report',
            message: 'The worker has disputed your no-show report. Admin review in progress.',
            type: 'DISPUTE_FILED',
            actionUrl: '/customer/disputes',
          });
        } catch (error) {
          console.error('Failed to notify customer:', error);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Dispute submitted successfully. Admin will review your case.",
      });
    }

    if (action === 'ACCEPT_PENALTY') {
      // Worker accepts the no-show penalty
      // Decrement reputation
      await decrementReputationForNoShow(
        report.workerId,
        report.jobId,
        `No-show accepted by worker`
      );

      // Update report status to APPROVED
      await reportDoc.ref.update({
        status: NoShowReportStatus.APPROVED,
        resolution: 'Worker accepted penalty',
        resolvedAt: FieldValue.serverTimestamp() as any,
        updatedAt: FieldValue.serverTimestamp() as any,
      });

      // Notify customer
      if (report.customerId) {
        try {
          await sendPushNotification({
            userId: report.customerId,
            title: '✅ No-Show Report Resolved',
            message: 'Worker has accepted the no-show penalty. Reputation updated accordingly.',
            type: 'REPORT_RESOLVED',
            actionUrl: '/customer/disputes',
          });
        } catch (error) {
          console.error('Failed to notify customer:', error);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Penalty accepted. Your reputation has been updated.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error('Error updating no-show report:', error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
