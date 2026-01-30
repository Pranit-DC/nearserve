/**
 * Admin No-Show Report Resolution API
 * POST: Admin approves or rejects a no-show report
 * GET: Admin views all pending no-show reports
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, NoShowReportStatus, UserRole } from "@/lib/firestore";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { decrementReputationForNoShow } from "@/lib/reputation-service";

/**
 * GET: Admin views all pending no-show reports
 */
export async function GET(_req: NextRequest) {
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

    // Get user and verify admin status
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (userQuery.empty)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userData = userQuery.docs[0].data();

    // TODO: Implement admin role check in User model
    // For now, we'll allow this endpoint but it should be restricted to admins only
    // if (userData.role !== 'ADMIN') {
    //   return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    // }

    // Get query parameters
    const { searchParams } = new URL(_req.url);
    const status = searchParams.get("status") || NoShowReportStatus.PENDING;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    // Fetch reports
    const noShowReportsRef = adminDb.collection(COLLECTIONS.NO_SHOW_REPORTS);
    const reportsQuery = await noShowReportsRef
      .where("status", "==", status)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const reports = reportsQuery.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      resolvedAt: doc.data().resolvedAt?.toDate?.() || null,
    }));

    return NextResponse.json({
      success: true,
      count: reports.length,
      status,
      reports,
    });
  } catch (err) {
    console.error("GET /api/admin/no-show-reports error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST: Admin approves or rejects a no-show report
 * Body: { reportId, approved: boolean, resolution: string }
 */
export async function POST(_req: NextRequest) {
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

    // Get user and verify admin status
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (userQuery.empty)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const adminUser = { id: userQuery.docs[0].id, ...userQuery.docs[0].data() };

    // TODO: Implement admin role check
    // if (adminUser.role !== 'ADMIN') {
    //   return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    // }

    const body = await _req.json();
    const { reportId, approved, resolution } = body;

    if (!reportId || approved === undefined || !resolution) {
      return NextResponse.json(
        { error: "Missing required fields: reportId, approved, resolution" },
        { status: 400 }
      );
    }

    // Get the report
    const noShowReportsRef = adminDb.collection(COLLECTIONS.NO_SHOW_REPORTS);
    const reportDoc = await noShowReportsRef.doc(reportId).get();

    if (!reportDoc.exists) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const report = reportDoc.data() as {
      workerId?: string;
      jobId?: string;
      status?: string;
      [key: string]: any;
    };

    // Validation: Can only resolve pending or disputed reports
    if (report.status !== NoShowReportStatus.PENDING && report.status !== NoShowReportStatus.DISPUTED) {
      return NextResponse.json(
        { error: "Report has already been resolved" },
        { status: 400 }
      );
    }

    // Update report status
    const finalStatus = approved ? NoShowReportStatus.APPROVED : NoShowReportStatus.REJECTED;

    await reportDoc.ref.update({
      status: finalStatus,
      resolution,
      resolvedAt: FieldValue.serverTimestamp() as any,
      updatedAt: FieldValue.serverTimestamp() as any,
    });

    // If approved, decrement worker reputation
    if (approved && report.workerId && report.jobId) {
      try {
        const result = await decrementReputationForNoShow(
          report.workerId,
          report.jobId,
          `No-show report approved: ${resolution}`
        );

        if (result) {
          console.log(`Worker ${report.workerId} reputation decreased for approved no-show`);
        } else {
          console.warn("Failed to decrement reputation for worker");
        }
      } catch (repError) {
        console.error("Error decrementing reputation:", repError);
      }
    }

    return NextResponse.json({
      success: true,
      report: {
        id: reportDoc.id,
        ...report,
        status: finalStatus,
        resolution,
        resolvedAt: new Date(),
      },
      message: approved
        ? "No-show report approved. Worker reputation has been decreased."
        : "No-show report rejected. Worker reputation unchanged.",
    });
  } catch (err) {
    console.error("POST /api/admin/no-show-reports error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
