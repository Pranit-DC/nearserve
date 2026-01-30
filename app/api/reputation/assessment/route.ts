import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";
import { cookies } from "next/headers";

/**
 * POST /api/reputation/assessment
 * Customer submits worker attendance assessment
 * - Came on time: +1 reputation point
 * - Came late: 0 reputation points
 * - Didn't come: -1 reputation point
 */
export async function POST(req: NextRequest) {
  try {
    const sessionCookie = (await cookies()).get("__session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const firebaseUid = decodedToken.uid;

    // Get customer
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const customerQuery = await usersRef
      .where("firebaseUid", "==", firebaseUid)
      .limit(1)
      .get();

    if (customerQuery.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const customerDoc = customerQuery.docs[0];
    const customerId = customerDoc.id;

    // Parse request body
    const { jobId, assessmentType } = await req.json();

    if (!jobId || !assessmentType) {
      return NextResponse.json(
        { error: "jobId and assessmentType are required" },
        { status: 400 }
      );
    }

    if (!["ON_TIME", "LATE", "NO_SHOW"].includes(assessmentType)) {
      return NextResponse.json(
        { error: "Invalid assessmentType. Must be ON_TIME, LATE, or NO_SHOW" },
        { status: 400 }
      );
    }

    // Get job
    const jobsRef = adminDb.collection(COLLECTIONS.JOBS);
    const jobDoc = await jobsRef.doc(jobId).get();

    if (!jobDoc.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = jobDoc.data();

    // Verify this job belongs to the customer
    if (job?.customerId !== customerId) {
      return NextResponse.json(
        { error: "You can only assess jobs you booked" },
        { status: 403 }
      );
    }

    // Check if job is completed
    if (job?.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "You can only assess completed jobs" },
        { status: 400 }
      );
    }

    // Check if already assessed
    if (job?.reputationAssessed) {
      return NextResponse.json(
        { error: "This job has already been assessed" },
        { status: 400 }
      );
    }

    // Get worker
    const workerId = job?.workerId;
    if (!workerId) {
      return NextResponse.json(
        { error: "Job has no assigned worker" },
        { status: 400 }
      );
    }

    // Calculate reputation points
    let reputationChange = 0;
    let description = "";

    switch (assessmentType) {
      case "ON_TIME":
        reputationChange = 1;
        description = "Worker came on time";
        break;
      case "LATE":
        reputationChange = 0;
        description = "Worker came late";
        break;
      case "NO_SHOW":
        reputationChange = -1;
        description = "Worker didn't show up";
        break;
    }

    // Update job with assessment
    await jobsRef.doc(jobId).update({
      reputationAssessed: true,
      reputationAssessmentType: assessmentType,
      reputationAssessmentAt: new Date(),
    });

    // Update worker reputation if there's a change
    if (reputationChange !== 0) {
      // Use the internal update function
      const workerProfilesRef = adminDb.collection(COLLECTIONS.WORKER_PROFILES);
      const workerDoc = await workerProfilesRef.doc(workerId).get();

      if (workerDoc.exists) {
        const currentReputation = workerDoc.data()?.reputation || 0;
        const newReputation = Math.max(
          -50,
          Math.min(100, currentReputation + reputationChange)
        );

        // Update reputation in worker profile
        await workerProfilesRef.doc(workerId).update({
          reputation: newReputation,
        });

        // Log the reputation change
        const reputationLogsRef = adminDb.collection(COLLECTIONS.REPUTATION_LOGS);
        await reputationLogsRef.add({
          workerId,
          customerId,
          jobId,
          change: reputationChange,
          reason: "ATTENDANCE_ASSESSMENT",
          description,
          assessmentType,
          previousReputation: currentReputation,
          newReputation,
          createdAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reputation ${reputationChange > 0 ? "increased" : reputationChange < 0 ? "decreased" : "unchanged"}`,
      assessmentType,
      reputationChange,
      description,
    });
  } catch (error) {
    console.error("Error submitting reputation assessment:", error);
    return NextResponse.json(
      { error: "Failed to submit reputation assessment" },
      { status: 500 }
    );
  }
}
