import { NextRequest, NextResponse } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { protectCustomerApi } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await protectCustomerApi(request);
    if (response) return response;

    const customer = user;

    // Get all jobs for this customer
    const jobsRef = adminDb.collection(COLLECTIONS.JOBS);
    const jobsQuery = await jobsRef
      .where("customerId", "==", customer.id)
      .get();

    // Count active bookings (PENDING, ACCEPTED, IN_PROGRESS)
    const activeStatuses = ["PENDING", "ACCEPTED", "IN_PROGRESS"];
    const activeBookings = jobsQuery.docs.filter((doc) =>
      activeStatuses.includes(doc.data().status)
    ).length;

    // Count completed jobs
    const completedJobs = jobsQuery.docs.filter(
      (doc) => doc.data().status === "COMPLETED"
    ).length;

    // Get all reviews given by this customer
    const reviewsRef = adminDb.collection(COLLECTIONS.REVIEWS);
    const reviewsQuery = await reviewsRef
      .where("customerId", "==", customer.id)
      .get();

    // Calculate average rating
    let avgRating = 0;
    if (!reviewsQuery.empty) {
      const totalRating = reviewsQuery.docs.reduce(
        (sum, doc) => sum + (doc.data().rating || 0),
        0
      );
      avgRating = totalRating / reviewsQuery.docs.length;
    }

    return NextResponse.json({
      activeBookings,
      completedJobs,
      avgRating,
    });
  } catch (error) {
    console.error("Error fetching customer dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
