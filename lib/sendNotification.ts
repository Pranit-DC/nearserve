import admin from 'firebase-admin';
import './firebase-admin'; // Import to ensure initialization

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  click_action?: string;
  data?: Record<string, string>;
}

/**
 * Send push notification to a single device
 */
export async function sendPushNotification(
  token: string,
  payload: NotificationPayload
) {
  try {
    console.log('[FCM] Attempting to send notification...');
    console.log('[FCM] Token (first 50 chars):', token.substring(0, 50));
    console.log('[FCM] Payload:', JSON.stringify(payload, null, 2));
    
    // Check if Firebase Admin is initialized
    if (admin.apps.length === 0) {
      console.error('[FCM] Firebase Admin is not initialized!');
      return { success: false, error: 'Firebase Admin not initialized' };
    }
    
    console.log('[FCM] Firebase Admin apps:', admin.apps.length);
    
    const message: admin.messaging.Message = {
      notification: {
        title: payload.title,
        body: payload.body,
        // imageUrl must be a full URL, not a relative path
        ...(payload.icon && payload.icon.startsWith('http') ? { imageUrl: payload.icon } : {}),
      },
      data: payload.data || {},
      token,
      webpush: payload.click_action ? {
        fcmOptions: {
          link: payload.click_action,
        },
      } : undefined,
    };

    console.log('[FCM] Sending message via Firebase Admin SDK...');
    const response = await admin.messaging().send(message);
    console.log('[FCM] ✅ Successfully sent message:', response);
    return { success: true, response };
  } catch (error) {
    console.error('[FCM] ❌ Error sending message:', error);
    console.error('[FCM] Error details:', JSON.stringify(error, null, 2));
    
    // Return more detailed error info
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      errorCode: (error as any)?.code,
      errorDetails: (error as any)?.details
    };
  }
}

/**
 * Send push notification to multiple devices
 */
export async function sendMulticastNotification(
  tokens: string[],
  payload: NotificationPayload
) {
  try {
    if (tokens.length === 0) {
      return { success: false, error: 'No tokens provided' };
    }

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.icon,
      },
      data: payload.data || {},
      tokens,
      webpush: payload.click_action ? {
        fcmOptions: {
          link: payload.click_action,
        },
      } : undefined,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`${response.successCount} messages sent successfully`);
    
    if (response.failureCount > 0) {
      console.error('Failed to send to some tokens:', response.responses);
    }
    
    return { 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses 
    };
  } catch (error) {
    console.error('Error sending multicast message:', error);
    return { success: false, error };
  }
}

/**
 * Send notification when a new job is created
 */
export async function notifyWorkerNewJob(
  workerToken: string,
  jobDetails: {
    title: string;
    location: string;
    budget?: number;
    customerName: string;
  }
) {
  return sendPushNotification(workerToken, {
    title: '🎯 New Job Available!',
    body: `${jobDetails.title} in ${jobDetails.location}${jobDetails.budget ? ` - ₹${jobDetails.budget}` : ''}`,
    click_action: `${process.env.NEXT_PUBLIC_APP_URL}/worker/jobs`,
    data: {
      type: 'new_job',
      title: jobDetails.title,
      location: jobDetails.location,
    },
  });
}

/**
 * Send notification when a worker is booked
 */
export async function notifyWorkerBooked(
  workerToken: string,
  bookingDetails: {
    customerName: string;
    serviceName: string;
    date: string;
    time?: string;
    location: string;
  }
) {
  return sendPushNotification(workerToken, {
    title: '✅ You have been booked!',
    body: `${bookingDetails.customerName} booked you for ${bookingDetails.serviceName}${bookingDetails.time ? ` at ${bookingDetails.time}` : ''}`,
    click_action: `${process.env.NEXT_PUBLIC_APP_URL}/worker/bookings`,
    data: {
      type: 'booking',
      customerName: bookingDetails.customerName,
      serviceName: bookingDetails.serviceName,
      date: bookingDetails.date,
    },
  });
}

/**
 * Send notification to customer when worker accepts the job
 */
export async function notifyCustomerJobAccepted(
  customerToken: string,
  jobDetails: {
    workerName: string;
    serviceName: string;
    date: string;
  }
) {
  return sendPushNotification(customerToken, {
    title: '🎉 Job Accepted!',
    body: `${jobDetails.workerName} has accepted your job request for ${jobDetails.serviceName}`,
    click_action: `${process.env.NEXT_PUBLIC_APP_URL}/customer/bookings`,
    data: {
      type: 'job_accepted',
      workerName: jobDetails.workerName,
      serviceName: jobDetails.serviceName,
      date: jobDetails.date,
    },
  });
}
