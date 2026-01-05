import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";
import { protectWorkerApi } from "@/lib/api-auth";
import { serializeFirestoreData } from "@/lib/firestore-serialization";

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await protectWorkerApi(request);
    if (response) return response;

    const worker = user;
    
    // Get jobs for this worker
    const jobsRef = adminDb.collection(COLLECTIONS.JOBS);
    const jobsQuery = await jobsRef
      .where('workerId', '==', worker.id)
      .limit(50)
      .get();

    // Get customer names and reviews for each job
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const reviewsRef = adminDb.collection(COLLECTIONS.REVIEWS);
    
    const jobs = await Promise.all(jobsQuery.docs.map(async (jobDoc) => {
      const jobData = serializeFirestoreData(jobDoc.data());
      
      // Fetch customer name
      let customerName = null;
      if (jobData.customerId) {
        const customerDoc = await usersRef.doc(jobData.customerId).get();
        customerName = customerDoc.data()?.name || null;
      }

      // Fetch review
      const reviewQuery = await reviewsRef.where('jobId', '==', jobDoc.id).limit(1).get();
      const review = reviewQuery.empty ? null : serializeFirestoreData({
        rating: reviewQuery.docs[0].data().rating,
        comment: reviewQuery.docs[0].data().comment
      });

      return {
        id: jobDoc.id,
        ...jobData,
        customer: { name: customerName },
        review
      };
    }));

    // Sort by createdAt descending in-memory to avoid composite index
    const sortedJobs = jobs.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({ jobs: sortedJobs });
  } catch (err) {
    console.error("GET /api/worker/jobs error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
