import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, Review } from "@/lib/firestore";
import { protectCustomerApi } from "@/lib/api-auth";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await protectCustomerApi(req);
    if (response) return response;

    const customer = user;

    const body = await req.json();
    const { jobId, rating, comment } = body || {};
    if (!jobId || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating (1-5) required" },
        { status: 400 }
      );
    }

    // Find the job
    const jobsRef = adminDb.collection(COLLECTIONS.JOBS);
    const jobDoc = await jobsRef.doc(jobId).get();
    
    if (!jobDoc.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = jobDoc.data();
    if (job?.customerId !== customer.id)
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job?.status !== "COMPLETED")
      return NextResponse.json({ error: "Job not completed" }, { status: 400 });
    if (!job?.workerId)
      return NextResponse.json(
        { error: "Job missing worker" },
        { status: 400 }
      );

    // Check if review already exists
    const reviewsRef = adminDb.collection(COLLECTIONS.REVIEWS);
    const existingReviewQuery = await reviewsRef.where('jobId', '==', jobId).limit(1).get();
    if (!existingReviewQuery.empty) {
      return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
    }

    // Create review
    const reviewData: Partial<Review> = {
      jobId,
      customerId: customer.id,
      workerId: job.workerId,
      rating,
      comment: comment || null,
      createdAt: FieldValue.serverTimestamp() as any,
      updatedAt: FieldValue.serverTimestamp() as any,
    };

    const reviewRef = await reviewsRef.add(reviewData);
    
    return NextResponse.json({ 
      success: true, 
      review: { id: reviewRef.id, rating, comment, createdAt: new Date() }
    });
  } catch (e) {
    console.error("POST /api/reviews error", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
