import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";
import { protectCustomerApi } from "@/lib/api-auth";
import { serializeFirestoreData } from "@/lib/firestore-serialization";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await protectCustomerApi(request);
    if (response) {
      console.warn('[Customer Jobs API] Auth failed:', response.status);
      return response;
    }

    const customer = user;

    // Get jobs for this customer
    const jobsRef = adminDb.collection(COLLECTIONS.JOBS);
    const jobsQuery = await jobsRef
      .where('customerId', '==', customer.id)
      .limit(100)
      .get();

    // Get worker names and reviews for each job
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const reviewsRef = adminDb.collection(COLLECTIONS.REVIEWS);
    
    const jobs = await Promise.all(jobsQuery.docs.map(async (jobDoc) => {
      const jobData = serializeFirestoreData(jobDoc.data());
      
      // Fetch worker name
      let workerName = null;
      if (jobData.workerId) {
        const workerDoc = await usersRef.doc(jobData.workerId).get();
        workerName = workerDoc.data()?.name || null;
      }

      // Fetch review
      const reviewQuery = await reviewsRef.where('jobId', '==', jobDoc.id).limit(1).get();
      const review = reviewQuery.empty ? null : serializeFirestoreData({
        id: reviewQuery.docs[0].id,
        rating: reviewQuery.docs[0].data().rating,
        comment: reviewQuery.docs[0].data().comment,
        createdAt: reviewQuery.docs[0].data().createdAt
      });

      return {
        id: jobDoc.id,
        ...jobData,
        worker: { name: workerName },
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
  } catch (e) {
    console.error("GET /api/customer/jobs", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
