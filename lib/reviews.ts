import { adminDb, COLLECTIONS } from "@/lib/firebase-admin";

/**
 * Calculate the average rating for a worker based on all their reviews
 * @param workerId The ID of the worker
 * @returns Object with avgRating and totalReviews
 */
export async function getWorkerRating(workerId: string): Promise<{
  avgRating: number;
  totalReviews: number;
}> {
  try {
    const reviewsRef = adminDb.collection(COLLECTIONS.REVIEWS);
    const reviewsQuery = await reviewsRef
      .where("workerId", "==", workerId)
      .get();

    if (reviewsQuery.empty) {
      return {
        avgRating: 0,
        totalReviews: 0,
      };
    }

    const totalRating = reviewsQuery.docs.reduce((sum, doc) => {
      return sum + (doc.data().rating || 0);
    }, 0);

    const avgRating = totalRating / reviewsQuery.docs.length;

    return {
      avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
      totalReviews: reviewsQuery.docs.length,
    };
  } catch (error) {
    console.error("Error fetching worker rating:", error);
    return {
      avgRating: 0,
      totalReviews: 0,
    };
  }
}

/**
 * Fetch all reviews for a worker with customer details
 * @param workerId The ID of the worker
 * @returns Array of reviews with customer names
 */
export async function getWorkerReviews(workerId: string) {
  try {
    const reviewsRef = adminDb.collection(COLLECTIONS.REVIEWS);
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const jobsRef = adminDb.collection(COLLECTIONS.JOBS);

    const reviewsQuery = await reviewsRef
      .where("workerId", "==", workerId)
      .get();

    if (reviewsQuery.empty) {
      return [];
    }

    const reviews = await Promise.all(
      reviewsQuery.docs.map(async (reviewDoc) => {
        const reviewData = reviewDoc.data();

        // Fetch customer name
        let customerName = "Unknown Customer";
        if (reviewData.customerId) {
          const customerDoc = await usersRef.doc(reviewData.customerId).get();
          customerName = customerDoc.data()?.name || "Unknown Customer";
        }

        // Fetch job description
        let jobDescription = null;
        if (reviewData.jobId) {
          const jobDoc = await jobsRef.doc(reviewData.jobId).get();
          jobDescription = jobDoc.data()?.description || null;
        }

        return {
          id: reviewDoc.id,
          rating: reviewData.rating,
          comment: reviewData.comment,
          createdAt: reviewData.createdAt,
          customerName,
          jobDescription,
        };
      })
    );

    // Sort by createdAt descending
    reviews.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return reviews;
  } catch (error) {
    console.error("Error fetching worker reviews:", error);
    return [];
  }
}
