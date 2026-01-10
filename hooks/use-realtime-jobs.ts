'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, QueryConstraint, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

interface UseRealtimeJobsOptions {
  userId: string | null; // This is the database user document ID (userProfile.id)
  role: 'worker' | 'customer';
  enabled?: boolean;
}

interface Job {
  id: string;
  description: string;
  details: string | null;
  date: any;
  time: any;
  location: string;
  charge: number;
  platformFee?: number | null;
  workerEarnings?: number | null;
  status: string;
  customerId?: string;
  workerId?: string;
  customer?: any;
  worker?: any;
  review?: any;
  [key: string]: any;
}

/**
 * Real-time Firestore listener for jobs
 * Automatically updates when database changes
 * NOTE: userId should be the database user document ID (userProfile.id), not Firebase UID
 */
export function useRealtimeJobs({ userId, role, enabled = true }: UseRealtimeJobsOptions) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set up the real-time listener with the user document ID
  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false);
      return;
    }

    console.log(`[Realtime] Setting up listener for ${role} with user ID: ${userId}`);
    setLoading(true);
    setError(null);

    try {
      // Build query based on role using user document ID
      const jobsRef = collection(db, 'jobs');
      const constraints: QueryConstraint[] = [
        role === 'worker' 
          ? where('workerId', '==', userId)
          : where('customerId', '==', userId),
        orderBy('createdAt', 'desc')
      ];

      const q = query(jobsRef, ...constraints);

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          console.log(`[Realtime] Received ${snapshot.docs.length} jobs for ${role}`);
          
          // Fetch related data (worker/customer names and reviews)
          const reviewsRef = collection(db, 'reviews');
          const usersRef = collection(db, 'users');
          
          const jobsData = await Promise.all(snapshot.docs.map(async (doc) => {
            const jobData = doc.data();
            let relatedUser = null;
            let review = null;
            
            // Fetch worker name (for customer) or customer name (for worker)
            try {
              if (role === 'customer' && jobData.workerId) {
                const workerQuery = query(usersRef, where('__name__', '==', jobData.workerId), limit(1));
                const workerSnap = await getDocs(workerQuery);
                if (!workerSnap.empty) {
                  relatedUser = { name: workerSnap.docs[0].data().name || null };
                }
              } else if (role === 'worker' && jobData.customerId) {
                const customerQuery = query(usersRef, where('__name__', '==', jobData.customerId), limit(1));
                const customerSnap = await getDocs(customerQuery);
                if (!customerSnap.empty) {
                  relatedUser = { name: customerSnap.docs[0].data().name || null };
                }
              }
              
              // Fetch review
              const reviewQuery = query(reviewsRef, where('jobId', '==', doc.id), limit(1));
              const reviewSnap = await getDocs(reviewQuery);
              if (!reviewSnap.empty) {
                const reviewData = reviewSnap.docs[0].data();
                review = {
                  id: reviewSnap.docs[0].id,
                  rating: reviewData.rating,
                  comment: reviewData.comment || null
                };
              }
            } catch (err) {
              console.error(`[Realtime] Error fetching related data for job ${doc.id}:`, err);
            }
            
            return {
              id: doc.id,
              ...jobData,
              ...(role === 'customer' ? { worker: relatedUser } : { customer: relatedUser }),
              review
            };
          })) as Job[];

          setJobs(jobsData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('[Realtime] Listener error:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      // Cleanup listener on unmount
      return () => {
        console.log(`[Realtime] Cleaning up listener for ${role}`);
        unsubscribe();
      };
    } catch (err: any) {
      console.error('[Realtime] Setup error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [userId, role, enabled]);

  return { jobs, loading, error };
}
