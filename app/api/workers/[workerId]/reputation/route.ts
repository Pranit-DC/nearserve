/**
 * Worker Reputation API
 * GET: Get worker reputation score, category, and history
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";
import {
  getWorkerReputationInfo,
  categorizeWorker,
  canWorkerBeBooked,
} from "@/lib/reputation-service";

/**
 * GET /api/workers/:workerId/reputation
 * Returns: Reputation score, category, history, and booking eligibility
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workerId: string }> }
) {
  try {
    const { workerId } = await params;

    if (!workerId) {
      return NextResponse.json(
        { error: "Worker ID required" },
        { status: 400 }
      );
    }

    // Get worker profile
    const workerProfilesRef = adminDb.collection(COLLECTIONS.WORKER_PROFILES);
    const profileQuery = await workerProfilesRef
      .where("userId", "==", workerId)
      .limit(1)
      .get();

    if (profileQuery.empty) {
      return NextResponse.json(
        { error: "Worker not found" },
        { status: 404 }
      );
    }

    const workerProfile = profileQuery.docs[0].data() as {
      reputation?: number;
      [key: string]: any;
    };

    const reputation = workerProfile?.reputation || 0;

    // Get worker reputation info
    const reputationInfo = await getWorkerReputationInfo(workerId);

    // Get booking eligibility
    const bookingEligibility = await canWorkerBeBooked(workerId);

    // Get categorization
    const completedJobs = reputationInfo?.completedJobs || 0;
    const category = categorizeWorker(reputation, completedJobs);

    // Get reputation history from reputationInfo
    const history = reputationInfo?.reputationHistory || [];

    return NextResponse.json({
      success: true,
      workerId,
      reputation: {
        score: reputation,
        category: category.category,
        description: category.description,
        isBookable: bookingEligibility.allowed,
        bookingRestrictionReason: bookingEligibility.reason || null,
      },
      stats: {
        completedJobs: completedJobs,
        totalNoShows: (history as any[]).filter((log: any) => log.reason === "NO_SHOW").length,
        successRate:
          completedJobs > 0
            ? (
                ((completedJobs -
                  (history as any[]).filter((log: any) => log.reason === "NO_SHOW").length) /
                  completedJobs) *
                100
              ).toFixed(1)
            : "N/A",
      },
      history: (history as any[]).map((log: any) => ({
        id: log.id,
        change: log.change,
        reason: log.reason,
        description: log.description,
        createdAt: log.createdAt?.toDate?.() || new Date(),
      })),
    });
  } catch (err) {
    console.error("GET /api/workers/:workerId/reputation error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
