import { adminDb } from './firebase-admin';
import { COLLECTIONS } from './firestore';
import { FieldValue } from 'firebase-admin/firestore';

export type NotificationType = 
  | 'JOB_CREATED'
  | 'JOB_ACCEPTED'
  | 'JOB_STARTED'
  | 'JOB_COMPLETED'
  | 'JOB_CANCELLED'
  | 'PAYMENT_RECEIVED'
  | 'REVIEW_RECEIVED';

export interface NotificationData {
  userId: string; // This should be the firebaseUid from Firebase Auth
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  jobId?: string;
  read?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Create a notification in Firestore
 * This notification will be displayed in the in-app notification center
 */
export async function createNotification(data: NotificationData) {
  try {
    const notificationsRef = adminDb.collection(COLLECTIONS.NOTIFICATIONS);
    
    const notification = {
      ...data,
      read: data.read ?? false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await notificationsRef.add(notification);
    
    console.log(`[Notification] Created notification ${docRef.id} for user ${data.userId}`);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('[Notification] Error creating notification:', error);
    return { success: false, error };
  }
}

/**
 * Create a notification for worker when they get booked
 */
export async function notifyWorkerJobCreated(workerId: string, jobData: {
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  jobId: string;
}) {
  // Get firebaseUid from user document
  const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(workerId).get();
  const firebaseUid = userDoc.data()?.firebaseUid;
  
  if (!firebaseUid) {
    console.error(`[Notification] No firebaseUid found for worker ${workerId}`);
    return { success: false, error: 'User not found' };
  }
  
  return createNotification({
    userId: firebaseUid,
    type: 'JOB_CREATED',
    title: '🎉 New Job Request!',
    message: `${jobData.customerName} booked you for "${jobData.serviceName}" on ${jobData.date} at ${jobData.time}`,
    actionUrl: `/worker/job`,
    jobId: jobData.jobId,
    metadata: jobData,
  });
}

/**
 * Create a notification for customer when worker accepts job
 */
export async function notifyCustomerJobAcceptedInApp(customerId: string, jobData: {
  workerName: string;
  serviceName: string;
  date: string;
  jobId: string;
}) {
  // Get firebaseUid from user document
  const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(customerId).get();
  const firebaseUid = userDoc.data()?.firebaseUid;
  
  if (!firebaseUid) {
    console.error(`[Notification] No firebaseUid found for customer ${customerId}`);
    return { success: false, error: 'User not found' };
  }
  
  return createNotification({
    userId: firebaseUid,
    type: 'JOB_ACCEPTED',
    title: '✅ Job Accepted!',
    message: `${jobData.workerName} accepted your booking for "${jobData.serviceName}"`,
    actionUrl: `/customer/bookings`,
    jobId: jobData.jobId,
    metadata: jobData,
  });
}

/**
 * Create a notification for customer when worker starts job
 */
export async function notifyCustomerJobStarted(customerId: string, jobData: {
  workerName: string;
  serviceName: string;
  jobId: string;
}) {
  // Get firebaseUid from user document
  const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(customerId).get();
  const firebaseUid = userDoc.data()?.firebaseUid;
  
  if (!firebaseUid) {
    console.error(`[Notification] No firebaseUid found for customer ${customerId}`);
    return { success: false, error: 'User not found' };
  }
  
  return createNotification({
    userId: firebaseUid,
    type: 'JOB_STARTED',
    title: '🚀 Work Started!',
    message: `${jobData.workerName} has started working on "${jobData.serviceName}"`,
    actionUrl: `/customer/bookings`,
    jobId: jobData.jobId,
    metadata: jobData,
  });
}

/**
 * Create a notification for customer when worker completes job
 */
export async function notifyCustomerJobCompleted(customerId: string, jobData: {
  workerName: string;
  serviceName: string;
  jobId: string;
}) {
  // Get firebaseUid from user document
  const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(customerId).get();
  const firebaseUid = userDoc.data()?.firebaseUid;
  
  if (!firebaseUid) {
    console.error(`[Notification] No firebaseUid found for customer ${customerId}`);
    return { success: false, error: 'User not found' };
  }
  
  return createNotification({
    userId: firebaseUid,
    type: 'JOB_COMPLETED',
    title: '✨ Job Completed!',
    message: `${jobData.workerName} has completed "${jobData.serviceName}". Please make payment.`,
    actionUrl: `/customer/bookings`,
    jobId: jobData.jobId,
    metadata: jobData,
  });
}

/**
 * Create a notification for worker when they receive payment
 */
export async function notifyWorkerPaymentReceived(workerId: string, jobData: {
  customerName: string;
  amount: number;
  serviceName: string;
  jobId: string;
}) {
  // Get firebaseUid from user document
  const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(workerId).get();
  const firebaseUid = userDoc.data()?.firebaseUid;
  
  if (!firebaseUid) {
    console.error(`[Notification] No firebaseUid found for worker ${workerId}`);
    return { success: false, error: 'User not found' };
  }
  
  return createNotification({
    userId: firebaseUid,
    type: 'PAYMENT_RECEIVED',
    title: '💰 Payment Received!',
    message: `Received ₹${jobData.amount} from ${jobData.customerName} for "${jobData.serviceName}"`,
    actionUrl: `/worker/earnings`,
    jobId: jobData.jobId,
    metadata: jobData,
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const notificationRef = adminDb.collection(COLLECTIONS.NOTIFICATIONS).doc(notificationId);
    await notificationRef.update({
      read: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('[Notification] Error marking as read:', error);
    return { success: false, error };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const notificationsRef = adminDb.collection(COLLECTIONS.NOTIFICATIONS);
    const unreadQuery = await notificationsRef
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    const batch = adminDb.batch();
    unreadQuery.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    console.log(`[Notification] Marked ${unreadQuery.size} notifications as read for user ${userId}`);
    return { success: true, count: unreadQuery.size };
  } catch (error) {
    console.error('[Notification] Error marking all as read:', error);
    return { success: false, error };
  }
}
