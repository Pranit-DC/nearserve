import { adminDb, COLLECTIONS } from '@/lib/firebase-admin';
import { ReputationReason, NoShowReportStatus } from '@/lib/firestore';
import { FieldValue } from 'firebase-admin/firestore';

export interface ReputationUpdate {
  workerId: string;
  change: number;
  reason: ReputationReason;
  jobId?: string;
  description?: string;
  createdBy?: string;
  metadata?: any;
}

export interface WorkerCategory {
  category: 'TOP_RATED' | 'RELIABLE' | 'NEEDS_IMPROVEMENT' | 'NEW';
  score: number;
  completedJobs: number;
  description: string;
}

// Constants for reputation thresholds
export const REPUTATION_THRESHOLDS = {
  TOP_RATED: 20,
  RELIABLE: 5,
  NEEDS_IMPROVEMENT: 0,
  BOOKING_RESTRICTION: -5,
} as const;

export const REPUTATION_LIMITS = {
  MAX: 100,
  MIN: -50,
} as const;

/**
 * Get current reputation score for a worker
 */
export async function getWorkerReputation(workerId: string): Promise<number> {
  try {
    const workerProfilesRef = adminDb.collection(COLLECTIONS.WORKER_PROFILES);
    const workerDoc = await workerProfilesRef.doc(workerId).get();

    if (!workerDoc.exists) {
      return 0;
    }

    return workerDoc.data()?.reputation || 0;
  } catch (error) {
    console.error('Error fetching worker reputation:', error);
    return 0;
  }
}

/**
 * Increment reputation when job is completed
 */
export async function incrementReputation(
  workerId: string,
  jobId: string,
  description?: string,
): Promise<boolean> {
  try {
    return await updateReputationScore(workerId, 1, ReputationReason.JOB_COMPLETED, jobId, description);
  } catch (error) {
    console.error('Error incrementing reputation:', error);
    return false;
  }
}

/**
 * Decrement reputation for no-show
 */
export async function decrementReputationForNoShow(
  workerId: string,
  jobId: string,
  description?: string,
): Promise<boolean> {
  try {
    return await updateReputationScore(
      workerId,
      -1,
      ReputationReason.NO_SHOW,
      jobId,
      description,
    );
  } catch (error) {
    console.error('Error decrementing reputation for no-show:', error);
    return false;
  }
}

/**
 * Internal function to update reputation score
 */
async function updateReputationScore(
  workerId: string,
  change: number,
  reason: ReputationReason,
  jobId?: string,
  description?: string,
): Promise<boolean> {
  try {
    const batch = adminDb.batch();

    // Update worker reputation
    const workerProfilesRef = adminDb.collection(COLLECTIONS.WORKER_PROFILES);
    const workerDoc = workerProfilesRef.doc(workerId);

    const currentReputation = await getWorkerReputation(workerId);
    let newReputation = currentReputation + change;

    // Enforce reputation limits
    newReputation = Math.max(REPUTATION_LIMITS.MIN, Math.min(REPUTATION_LIMITS.MAX, newReputation));

    batch.update(workerDoc, {
      reputation: newReputation,
      updatedAt: FieldValue.serverTimestamp() as any,
    });

    // Log reputation change
    const reputationLogsRef = adminDb.collection(COLLECTIONS.REPUTATION_LOGS);
    const logData = {
      workerId,
      jobId: jobId || null,
      change,
      reason,
      description: description || null,
      createdBy: null, // System change
      createdAt: FieldValue.serverTimestamp() as any,
      metadata: {
        previousReputation: currentReputation,
        newReputation,
        timestamp: new Date().toISOString(),
      },
    };

    batch.set(reputationLogsRef.doc(), logData);

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error updating reputation score:', error);
    return false;
  }
}

/**
 * Categorize worker based on reputation
 */
export function categorizeWorker(reputation: number, completedJobs: number): WorkerCategory {
  if (completedJobs === 0) {
    return {
      category: 'NEW',
      score: reputation,
      completedJobs,
      description: 'New worker - building reputation',
    };
  }

  if (reputation >= REPUTATION_THRESHOLDS.TOP_RATED) {
    return {
      category: 'TOP_RATED',
      score: reputation,
      completedJobs,
      description: 'Excellent worker with outstanding service record',
    };
  }

  if (reputation >= REPUTATION_THRESHOLDS.RELIABLE) {
    return {
      category: 'RELIABLE',
      score: reputation,
      completedJobs,
      description: 'Reliable worker - consistently good performance',
    };
  }

  if (reputation >= REPUTATION_THRESHOLDS.NEEDS_IMPROVEMENT) {
    return {
      category: 'NEEDS_IMPROVEMENT',
      score: reputation,
      completedJobs,
      description: 'Worker is building experience',
    };
  }

  return {
    category: 'NEEDS_IMPROVEMENT',
    score: reputation,
    completedJobs,
    description: 'Worker needs to improve service quality',
  };
}

/**
 * Check if worker can be booked based on reputation
 */
export async function canWorkerBeBooked(workerId: string): Promise<{
  allowed: boolean;
  reason?: string;
  reputation: number;
}> {
  try {
    const reputation = await getWorkerReputation(workerId);

    if (reputation < REPUTATION_THRESHOLDS.BOOKING_RESTRICTION) {
      return {
        allowed: false,
        reason: `Worker reputation is too low (${reputation}). Minimum required: ${REPUTATION_THRESHOLDS.BOOKING_RESTRICTION}. Please contact support for options.`,
        reputation,
      };
    }

    return {
      allowed: true,
      reputation,
    };
  } catch (error) {
    console.error('Error checking booking eligibility:', error);
    return {
      allowed: true, // Allow booking on error - fail open
      reputation: 0,
    };
  }
}

/**
 * Get detailed reputation info for a worker
 */
export async function getWorkerReputationInfo(workerId: string) {
  try {
    const workerProfilesRef = adminDb.collection(COLLECTIONS.WORKER_PROFILES);
    const workerDoc = await workerProfilesRef.doc(workerId).get();

    if (!workerDoc.exists) {
      return null;
    }

    const workerData = workerDoc.data();
    const reputation = workerData?.reputation || 0;

    // Count completed jobs
    const jobsRef = adminDb.collection(COLLECTIONS.JOBS);
    const completedJobsQuery = await jobsRef
      .where('workerId', '==', workerId)
      .where('status', '==', 'COMPLETED')
      .get();

    const completedJobs = completedJobsQuery.size;

    // Get reputation logs
    const reputationLogsRef = adminDb.collection(COLLECTIONS.REPUTATION_LOGS);
    const logsQuery = await reputationLogsRef
      .where('workerId', '==', workerId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const reputationHistory = logsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));

    const category = categorizeWorker(reputation, completedJobs);
    const canBook = await canWorkerBeBooked(workerId);

    return {
      workerId,
      reputation,
      completedJobs,
      category,
      canBeBooked: canBook.allowed,
      bookingRestrictionReason: canBook.reason,
      reputationHistory,
      lastUpdated: workerData?.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting worker reputation info:', error);
    return null;
  }
}

/**
 * Admin function to manually adjust reputation
 */
export async function adminAdjustReputation(
  workerId: string,
  change: number,
  reason: string,
  adminId: string,
): Promise<boolean> {
  try {
    return await updateReputationScore(
      workerId,
      change,
      ReputationReason.ADMIN_OVERRIDE,
      undefined,
      reason,
    );
  } catch (error) {
    console.error('Error adjusting reputation by admin:', error);
    return false;
  }
}

/**
 * Resolve a no-show dispute in favor of the worker (restore reputation)
 */
export async function resolveNoShowDispute(
  noShowReportId: string,
  resolution: string,
  favorWorker: boolean,
): Promise<boolean> {
  try {
    const batch = adminDb.batch();

    // Get the no-show report
    const noShowReportsRef = adminDb.collection(COLLECTIONS.NO_SHOW_REPORTS);
    const reportDoc = await noShowReportsRef.doc(noShowReportId).get();

    if (!reportDoc.exists) {
      console.error('No-show report not found');
      return false;
    }

    const reportData = reportDoc.data() as any;
    const { workerId, jobId } = reportData as { workerId: string; jobId: string };

    // Update report status
    batch.update(reportDoc.ref, {
      status: favorWorker ? NoShowReportStatus.REJECTED : NoShowReportStatus.APPROVED,
      resolution,
      resolvedAt: FieldValue.serverTimestamp() as any,
      updatedAt: FieldValue.serverTimestamp() as any,
    });

    // If dispute is resolved in favor of worker, restore reputation
    if (favorWorker) {
      const workerProfilesRef = adminDb.collection(COLLECTIONS.WORKER_PROFILES);
      const workerDoc = workerProfilesRef.doc(workerId);

      const currentReputation = await getWorkerReputation(workerId);
      const newReputation = Math.min(REPUTATION_LIMITS.MAX, currentReputation + 1);

      batch.update(workerDoc, {
        reputation: newReputation,
        updatedAt: FieldValue.serverTimestamp() as any,
      });

      // Log the reputation restoration
      const reputationLogsRef = adminDb.collection(COLLECTIONS.REPUTATION_LOGS);
      const logData = {
        workerId,
        jobId,
        change: 1,
        reason: ReputationReason.DISPUTE_RESOLVED_FAVOR_WORKER,
        description: `No-show dispute resolved in favor of worker: ${resolution}`,
        createdBy: 'SYSTEM',
        createdAt: FieldValue.serverTimestamp() as any,
        metadata: {
          previousReputation: currentReputation,
          newReputation,
          noShowReportId,
          timestamp: new Date().toISOString(),
        },
      };

      batch.set(reputationLogsRef.doc(), logData);
    }

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error resolving no-show dispute:', error);
    return false;
  }
}

/**
 * Get pending no-show reports
 */
export async function getPendingNoShowReports(workerId?: string) {
  try {
    let query = adminDb.collection(COLLECTIONS.NO_SHOW_REPORTS)
      .where('status', '==', NoShowReportStatus.PENDING)
      .orderBy('createdAt', 'desc');

    if (workerId) {
      query = query.where('workerId', '==', workerId);
    }

    const reports = await query.limit(50).get();

    return reports.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      resolvedAt: doc.data().resolvedAt?.toDate() || null,
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error('Error getting pending no-show reports:', error);
    return [];
  }
}

/**
 * Calculate worker reputation percentage (for UI display)
 */
export function getReputationPercentage(reputation: number): number {
  // Map reputation range to 0-100 percentage
  // Reputation range: -50 to 100, so range is 150 points
  const normalizedReputation = reputation - REPUTATION_LIMITS.MIN; // 0-150
  const percentage = (normalizedReputation / (REPUTATION_LIMITS.MAX - REPUTATION_LIMITS.MIN)) * 100;
  return Math.max(0, Math.min(100, percentage));
}

/**
 * Get badge emoji for worker category
 */
export function getReputationBadgeEmoji(category: WorkerCategory['category']): string {
  const badges = {
    TOP_RATED: '⭐',
    RELIABLE: '✓',
    NEEDS_IMPROVEMENT: '⚠️',
    NEW: '🆕',
  };
  return badges[category];
}
/**
 * Customer assesses worker's punctuality after job completion
 * ON_TIME: +1 point
 * LATE: 0 points (neutral)
 * NO_SHOW: -1 point
 */
export async function assessWorkerByCustomer(
  jobId: string,
  workerId: string,
  assessmentType: 'ON_TIME' | 'LATE' | 'NO_SHOW',
  customerId?: string,
): Promise<{ success: boolean; error?: string; newReputation?: number }> {
  try {
    // Determine reputation change based on assessment
    let reputationChange = 0;
    let reason: ReputationReason;

    switch (assessmentType) {
      case 'ON_TIME':
        reputationChange = 1;
        reason = ReputationReason.CUSTOMER_RATED_ON_TIME;
        break;
      case 'LATE':
        reputationChange = 0;
        reason = ReputationReason.CUSTOMER_RATED_LATE;
        break;
      case 'NO_SHOW':
        reputationChange = -1;
        reason = ReputationReason.CUSTOMER_RATED_NO_SHOW;
        break;
      default:
        return { success: false, error: 'Invalid assessment type' };
    }

    // Update job to mark reputation as assessed
    const jobRef = adminDb.collection(COLLECTIONS.JOBS).doc(jobId);
    await jobRef.update({
      reputationAssessed: true,
      reputationAssessmentType: assessmentType,
      reputationAssessmentAt: new Date(),
    });

    // Update worker reputation only if there's a change (ON_TIME and LATE both don't add/subtract)
    if (reputationChange !== 0) {
      await updateReputationScore(
        workerId,
        reputationChange,
        reason,
        jobId,
        `Customer assessment: ${assessmentType}`,
      );
    }

    // Get updated reputation
    const newReputation = await getWorkerReputation(workerId);
    return { success: true, newReputation };
  } catch (error: any) {
    console.error('Error assessing worker reputation:', error);
    return { success: false, error: error.message };
  }
}