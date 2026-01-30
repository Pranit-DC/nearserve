/**
 * No-Show Report API
 * POST: Customer reports a worker for no-show
 * PATCH: Worker disputes or provides evidence
 * GET: Admin views pending reports
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, NoShowReportStatus, UserRole } from "@/lib/firestore";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST: Customer reports a worker for no-show
 * Required: jobId, evidence (optional photo URL), reason
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const jobId = (await params).id;

    // Get user
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (userQuery.empty)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userDoc = userQuery.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() as { role?: string; [key: string]: any } };

    // Authorization: Only customer can report no-show
    if (user.role !== UserRole.CUSTOMER) {
      return NextResponse.json(
        { error: "Only customers can report no-shows" },
        { status: 403 }
      );
    }

    // Get job
    const jobsRef = adminDb.collection(COLLECTIONS.JOBS);
    const jobDoc = await jobsRef.doc(jobId).get();
    if (!jobDoc.exists)
      return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const job = jobDoc.data() as {
      customerId?: string;
      workerId?: string;
      status?: string;
      description?: string;
      [key: string]: any;
    };

    // Authorization: Only the job customer can report no-show
    if (job.customerId !== user.id) {
      return NextResponse.json(
        { error: "You can only report no-show for your own jobs" },
        { status: 403 }
      );
    }

    // Validation: Cannot report if job is not completed or cancelled
    // (Workers should not be penalized for jobs they never accepted or were cancelled by customer)
    if (job.status === "PENDING" || job.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "Cannot report no-show for pending or accepted jobs" },
        { status: 400 }
      );
    }

    // Check if report already exists for this job
    const noShowReportsRef = adminDb.collection(COLLECTIONS.NO_SHOW_REPORTS);
    const existingReport = await noShowReportsRef.where('jobId', '==', jobId).get();

    if (!existingReport.empty) {
      return NextResponse.json(
        { error: "A no-show report already exists for this job" },
        { status: 400 }
      );
    }

    const body = await _req.json();
    const { evidence, reason } = body;

    // Create no-show report
    const reportData = {
      jobId,
      customerId: user.id,
      workerId: job.workerId,
      status: NoShowReportStatus.PENDING,
      evidence: evidence || null, // Photo URL or evidence file path
      reason: reason || null,
      workerReply: null,
      resolution: null,
      createdAt: FieldValue.serverTimestamp() as any,
      resolvedAt: null,
      updatedAt: FieldValue.serverTimestamp() as any,
    };

    const reportRef = await noShowReportsRef.add(reportData);

    return NextResponse.json({
      success: true,
      report: {
        id: reportRef.id,
        ...reportData,
      },
      message: "No-show report submitted. Our team will review it shortly.",
    });
  } catch (err) {
    console.error("POST /api/jobs/[id]/report-no-show error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Worker provides evidence or disputes the no-show report
 * Required: reportId, workerReply (dispute message)
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const jobId = (await params).id;

    // Get user
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (userQuery.empty)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userDoc = userQuery.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() as { role?: string; [key: string]: any } };

    // Authorization: Only worker can dispute
    if (user.role !== UserRole.WORKER) {
      return NextResponse.json(
        { error: "Only workers can dispute no-show reports" },
        { status: 403 }
      );
    }

    // Find the report for this job
    const noShowReportsRef = adminDb.collection(COLLECTIONS.NO_SHOW_REPORTS);
    const reportQuery = await noShowReportsRef.where('jobId', '==', jobId).get();

    if (reportQuery.empty) {
      return NextResponse.json(
        { error: "No no-show report found for this job" },
        { status: 404 }
      );
    }

    const reportDoc = reportQuery.docs[0];
    const report = reportDoc.data() as {
      workerId?: string;
      status?: string;
      [key: string]: any;
    };

    // Authorization: Only the reported worker can dispute
    if (report.workerId !== user.id) {
      return NextResponse.json(
        { error: "You can only dispute reports made against you" },
        { status: 403 }
      );
    }

    // Validation: Cannot dispute if already resolved
    if (report.status !== NoShowReportStatus.PENDING && report.status !== NoShowReportStatus.UNDER_REVIEW) {
      return NextResponse.json(
        { error: "Cannot dispute an already resolved report" },
        { status: 400 }
      );
    }

    const body = await _req.json();
    const { workerReply, evidence } = body;

    if (!workerReply) {
      return NextResponse.json(
        { error: "Please provide a reply/explanation" },
        { status: 400 }
      );
    }

    // Update report with worker's response
    await reportDoc.ref.update({
      status: NoShowReportStatus.DISPUTED,
      workerReply,
      evidence: evidence || report.evidence, // Allow worker to provide additional evidence
      updatedAt: FieldValue.serverTimestamp() as any,
    });

    return NextResponse.json({
      success: true,
      report: {
        id: reportDoc.id,
        ...report,
        status: NoShowReportStatus.DISPUTED,
        workerReply,
      },
      message: "Your dispute has been submitted. An admin will review it shortly.",
    });
  } catch (err) {
    console.error("PATCH /api/jobs/[id]/report-no-show error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * GET: Admin views pending no-show reports
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const jobId = (await params).id;

    // Get user
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (userQuery.empty)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userDoc = userQuery.docs[0];
    const user = userDoc.data() as { role?: string; [key: string]: any };

    // Authorization: Only admin can view reports (extend as needed)
    // For now, only customer/worker can view their own reports
    const noShowReportsRef = adminDb.collection(COLLECTIONS.NO_SHOW_REPORTS);
    const reportQuery = await noShowReportsRef.where('jobId', '==', jobId).get();

    if (reportQuery.empty) {
      return NextResponse.json({
        success: true,
        reports: [],
      });
    }

    const report = reportQuery.docs[0].data();

    // Authorization: Only customer/worker involved in the report can view it
    if (user.id !== report.customerId && user.id !== report.workerId) {
      return NextResponse.json(
        { error: "You don't have access to this report" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      report: {
        id: reportQuery.docs[0].id,
        ...report,
      },
    });
  } catch (err) {
    console.error("GET /api/jobs/[id]/report-no-show error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
