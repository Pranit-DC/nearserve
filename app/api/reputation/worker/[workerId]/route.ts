import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";
import { cookies } from "next/headers";
import { getWorkerReputationInfo, canWorkerBeBooked } from "@/lib/reputation-service";

/**
 * GET /api/reputation/worker/[workerId]
 * Get detailed reputation information for a worker (public - no auth required)
 * 
 * Returns:
 * {
 *   workerId,
 *   reputation,
 *   completedJobs,
 *   category,
 *   canBeBooked,
 *   bookingRestrictionReason,
 *   reputationHistory,
 *   lastUpdated
 * }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workerId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { workerId } = resolvedParams;

    if (!workerId) {
      return NextResponse.json(
        { error: "Worker ID is required" },
        { status: 400 }
      );
    }

    // Get reputation info
    const reputationInfo = await getWorkerReputationInfo(workerId);

    if (!reputationInfo) {
      return NextResponse.json(
        { error: "Worker not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ...reputationInfo,
    });
  } catch (error) {
    console.error('Error fetching worker reputation:', error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
