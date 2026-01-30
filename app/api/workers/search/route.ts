/**
 * Search/Filter Workers by Reputation
 * GET /api/workers/search
 * Supports filtering by: reputation, category, location, skills
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, UserRole } from "@/lib/firestore";
import {
  categorizeWorker,
  canWorkerBeBooked,
  REPUTATION_THRESHOLDS,
} from "@/lib/reputation-service";

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);

    // Query parameters
    const city = searchParams.get("city");
    const skills = searchParams.get("skills")?.split(",") || [];
    const sortBy = searchParams.get("sortBy") || "reputation"; // reputation, rating, availability
    const order = searchParams.get("order") || "desc"; // asc, desc
    const minReputation = searchParams.get("minReputation");
    const category = searchParams.get("category"); // TOP_RATED, RELIABLE, etc.
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const hideIneligible = searchParams.get("hideIneligible") === "true";

    // Build query
    let query: FirebaseFirestore.Query = adminDb
      .collection(COLLECTIONS.WORKER_PROFILES)
      .orderBy("reputation", order === "desc" ? "desc" : "asc")
      .offset(offset)
      .limit(limit);

    // Apply filters
    if (city) {
      query = query.where("city", "==", city);
    }

    if (minReputation) {
      const minRep = parseInt(minReputation);
      query = query.where("reputation", ">=", minRep);
    }

    // Get all workers (will filter category in-app since Firestore doesn't support OR queries)
    const snapshot = await query.get();

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        workers: [],
        count: 0,
      });
    }

    // Process workers
    const workersData: any[] = [];

    for (const doc of snapshot.docs) {
      const workerProfile = doc.data() as {
        userId?: string;
        reputation?: number;
        [key: string]: any;
      };

      const reputation = workerProfile?.reputation || 0;
      const userId = workerProfile?.userId;

      if (!userId) continue;

      // Get worker user details
      const userDoc = await adminDb
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .get();

      if (!userDoc.exists) continue;

      const userData = userDoc.data() as { name?: string; email?: string; [key: string]: any };

      // Get booking eligibility
      const bookingEligibility = await canWorkerBeBooked(userId || "");

      // Filter by category if specified
      const completedJobs = 0; // TODO: Fetch actual completed jobs count
      const workerCategory = categorizeWorker(reputation, completedJobs);

      if (category && workerCategory.category !== category) {
        continue; // Skip if doesn't match requested category
      }

      // Hide ineligible workers if requested
      if (hideIneligible && !bookingEligibility.allowed) {
        continue;
      }

      // Filter by skills if specified
      if (skills.length > 0) {
        const workerSkills = (workerProfile?.skilledIn || []) as string[];
        const hasMatchingSkill = skills.some((skill) =>
          workerSkills.some(
            (ws) => ws.toLowerCase().includes(skill.toLowerCase()) ||
                    skill.toLowerCase().includes(ws.toLowerCase())
          )
        );

        if (!hasMatchingSkill) {
          continue;
        }
      }

      // Get category display text
      const categoryMap: Record<string, string> = {
        TOP_RATED: "Top Rated Worker",
        RELIABLE: "Reliable Worker",
        NEEDS_IMPROVEMENT: "Needs Improvement",
        NEW: "New Worker"
      };
      const categoryDisplay = categoryMap[workerCategory.category] || workerCategory.category;

      workersData.push({
        id: userId,
        name: userData?.name || "Worker",
        profile: {
          bio: workerProfile?.bio,
          profilePic: workerProfile?.profilePic,
          city: workerProfile?.city,
          yearsExperience: workerProfile?.yearsExperience,
          skilledIn: workerProfile?.skilledIn,
          hourlyRate: workerProfile?.hourlyRate,
          minimumFee: workerProfile?.minimumFee,
        },
        reputation: {
          score: reputation,
          category: workerCategory.category,
          categoryDisplay,
          description: workerCategory.description,
          isBookable: bookingEligibility.allowed,
          bookingRestrictionReason: bookingEligibility.reason || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      workers: workersData,
      count: workersData.length,
      filters: {
        city,
        skills,
        minReputation,
        category,
        sortBy,
        order,
      },
    });
  } catch (err) {
    console.error("GET /api/workers/search error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
