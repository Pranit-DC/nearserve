import { NextRequest, NextResponse } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { protectWorkerApi } from "@/lib/api-auth";
import { serializeFirestoreData } from "@/lib/firestore-serialization";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await protectWorkerApi(request);
    if (response) return response;

    const worker = user;

    console.log("Worker ID:", worker?.id);
    console.log("Worker data:", JSON.stringify(worker, null, 2));

    console.log("Worker ID:", worker?.id);
    console.log("Worker data:", JSON.stringify(worker, null, 2));

    // Get all reviews for this worker
    const reviewsRef = adminDb.collection(COLLECTIONS.REVIEWS);
    let reviewsQuery;

    try {
      console.log("Fetching reviews for worker:", worker.id);
      // Try with orderBy first
      reviewsQuery = await reviewsRef
        .where("workerId", "==", worker.id)
        .orderBy("createdAt", "desc")
        .get();
      console.log(
        "Reviews fetched with orderBy, count:",
        reviewsQuery.docs.length
      );
    } catch (indexError: any) {
      // If index is missing, fetch without ordering
      console.warn(
        "Firestore index missing for reviews query, fetching without order:",
        indexError.message
      );
      reviewsQuery = await reviewsRef.where("workerId", "==", worker.id).get();
      console.log(
        "Reviews fetched without orderBy, count:",
        reviewsQuery.docs.length
      );
    }

    console.log("Processing reviews...");
    // Get customer details for each review
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const jobsRef = adminDb.collection(COLLECTIONS.JOBS);

    const reviews = await Promise.all(
      reviewsQuery.docs.map(async (reviewDoc) => {
        try {
          const reviewData = reviewDoc.data();
          console.log(`Processing review ${reviewDoc.id}:`, reviewData);

          // Fetch customer name
          let customerName = "Unknown Customer";
          if (reviewData.customerId) {
            const customerDoc = await usersRef.doc(reviewData.customerId).get();
            customerName = customerDoc.data()?.name || "Unknown Customer";
          }

          // Fetch job details
          let jobDescription = null;
          if (reviewData.jobId) {
            const jobDoc = await jobsRef.doc(reviewData.jobId).get();
            jobDescription = jobDoc.data()?.description || null;
          }

          return serializeFirestoreData({
            id: reviewDoc.id,
            rating: reviewData.rating,
            comment: reviewData.comment,
            createdAt: reviewData.createdAt,
            customerName,
            jobDescription,
          });
        } catch (err) {
          console.error(`Error processing review ${reviewDoc.id}:`, err);
          throw err;
        }
      })
    );

    console.log("Reviews processed successfully:", reviews.length);

    // Sort reviews by createdAt descending (in case we couldn't order in Firestore)
    reviews.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;

    return NextResponse.json({
      reviews,
      avgRating,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Error fetching worker reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
