import { NextRequest, NextResponse } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { protectWorkerApi } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await protectWorkerApi(request);
    if (response) return response;

    const worker = user;

    // Get all jobs for this worker
    const jobsRef = adminDb.collection(COLLECTIONS.JOBS);
    const jobsQuery = await jobsRef.where("workerId", "==", worker.id).get();

    // Count active jobs (ACCEPTED and IN_PROGRESS)
    const activeStatuses = ["ACCEPTED", "IN_PROGRESS"];
    const activeJobs = jobsQuery.docs.filter((doc) =>
      activeStatuses.includes(doc.data().status)
    ).length;

    // Count completed jobs
    const completedJobs = jobsQuery.docs.filter(
      (doc) => doc.data().status === "COMPLETED"
    ).length;

    // Count pending jobs (job requests waiting for acceptance)
    const pendingJobs = jobsQuery.docs.filter(
      (doc) => doc.data().status === "PENDING"
    ).length;

    // Calculate total earnings from completed jobs
    const totalEarnings = jobsQuery.docs
      .filter((doc) => doc.data().status === "COMPLETED")
      .reduce((sum, doc) => sum + (doc.data().charge || 0), 0);

    return NextResponse.json({
      activeJobs,
      completedJobs,
      totalEarnings,
      pendingJobs,
    });
  } catch (error) {
    console.error("Error fetching worker dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
