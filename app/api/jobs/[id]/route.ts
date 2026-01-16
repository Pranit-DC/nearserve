import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, JobLog, Transaction, TransactionType } from "@/lib/firestore";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import {
  createRazorpayOrder,
  verifyPaymentSignature,
} from "@/lib/razorpay-service";
import { 
  notifyCustomerJobAcceptedInApp, 
  notifyCustomerJobStarted, 
  notifyCustomerJobCompleted,
  notifyWorkerPaymentReceived 
} from '@/lib/notification-service';
import { sendPushNotification } from '@/lib/push-notification';
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session cookie
    const sessionCookie = (await cookies()).get("__session")?.value;
    if (!sessionCookie)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify session
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const firebaseUid = decodedToken.uid;

    const body = await _req.json();
    const { action } = body || {};

    // Valid actions: ACCEPT, START, WORKER_COMPLETE, COMPLETE, CANCEL
    if (!["ACCEPT", "START", "WORKER_COMPLETE", "COMPLETE", "CANCEL"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get user
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (userQuery.empty)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userDoc = userQuery.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() as { role?: string; [key: string]: any } };

    // Get job
    const resolvedParams = await params;
    const jobsRef = adminDb.collection(COLLECTIONS.JOBS);
    const jobDoc = await jobsRef.doc(resolvedParams.id).get();
    if (!jobDoc.exists)
      return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const job = { id: jobDoc.id, ...jobDoc.data() as { customerId?: string; workerId?: string; status?: string; description?: string; date?: any; workerMarkedComplete?: boolean; charge?: number; razorpayOrderId?: string; [key: string]: any } };

    // Fetch customer and worker info
    const customerDoc = job.customerId ? await usersRef.doc(job.customerId).get() : null;
    const workerDoc = job.workerId ? await usersRef.doc(job.workerId).get() : null;

    const jobWithRelations = {
      ...job,
      customer: customerDoc?.exists ? customerDoc.data() : null,
      worker: workerDoc?.exists ? workerDoc.data() : null,
    };

    // ===========================
    // ACTION: ACCEPT (Worker only)
    // Transition: PENDING → ACCEPTED
    // ===========================
    if (action === "ACCEPT") {
      // Authorization: Only assigned worker can accept
      if (user.role !== "WORKER" || job.workerId !== user.id) {
        return NextResponse.json(
          { error: "Only the assigned worker can accept this job" },
          { status: 403 }
        );
      }

      // State validation: Must be PENDING
      if (job.status !== "PENDING") {
        return NextResponse.json(
          { error: "Only pending jobs can be accepted" },
          { status: 400 }
        );
      }

      // Update job status
      await jobDoc.ref.update({ 
        status: "ACCEPTED",
        updatedAt: FieldValue.serverTimestamp()
      });

      // Log state transition
      const jobLogsRef = adminDb.collection(COLLECTIONS.JOB_LOGS);
      await jobLogsRef.add({
        jobId: job.id,
        fromStatus: "PENDING",
        toStatus: "ACCEPTED",
        action: "WORKER_ACCEPTED",
        performedBy: user.id,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Send notification to customer
      try {
        console.log(`[NOTIFICATION] Worker accepted job, notifying customer ${job.customerId}`);
        
        // Create in-app notification
        await notifyCustomerJobAcceptedInApp(job.customerId || "", {
          workerName: workerDoc?.data()?.name || 'Worker',
          serviceName: job.description || "",
          date: job.date?.toDate?.()?.toLocaleDateString() || 'Soon',
          jobId: job.id,
        });
        console.log(`[Notification] ✅ In-app notification created for customer ${job.customerId}`);
        
        // Send push notification
        const pushResult = await sendPushNotification({
          userId: job.customerId || "",
          title: '✅ Job Accepted',
          message: `${workerDoc?.data()?.name || 'Worker'} has accepted your ${job.description} request`,
          type: 'JOB_ACCEPTED',
          actionUrl: `/customer/bookings`,
        });
        
        if (pushResult.pushSent) {
          console.log(`[Push] ✅ Push notification sent to customer ${job.customerId}`);
        } else {
          console.log(`[Push] ℹ️ Customer ${job.customerId} has no FCM token or push failed`);
        }
      } catch (notifError) {
        console.error('[Notification] ❌ Failed:', notifError);
      }

      const updated = { ...job, status: "ACCEPTED" };
      return NextResponse.json({ success: true, job: updated });
    }

    // ===========================
    // ACTION: START (Worker only)
    // Transition: ACCEPTED → IN_PROGRESS
    // Requires: Photo proof + GPS coordinates
    // ===========================
    if (action === "START") {
      // Authorization: Only assigned worker can start
      if (user.role !== "WORKER" || job.workerId !== user.id) {
        return NextResponse.json(
          { error: "Only the assigned worker can start this job" },
          { status: 403 }
        );
      }

      // State validation: Must be ACCEPTED
      if (job.status !== "ACCEPTED") {
        return NextResponse.json(
          { error: "Only accepted jobs can be started" },
          { status: 400 }
        );
      }

      // Proof validation: Photo + GPS required
      const { startProofPhoto, startProofGpsLat, startProofGpsLng } = body;

      if (!startProofPhoto || !startProofGpsLat || !startProofGpsLng) {
        return NextResponse.json(
          {
            error: "Proof of work required",
            message: "Photo and GPS location are mandatory to start work",
          },
          { status: 400 }
        );
      }

      // Validate GPS coordinates
      if (
        typeof startProofGpsLat !== "number" ||
        typeof startProofGpsLng !== "number" ||
        startProofGpsLat < -90 ||
        startProofGpsLat > 90 ||
        startProofGpsLng < -180 ||
        startProofGpsLng > 180
      ) {
        return NextResponse.json(
          { error: "Invalid GPS coordinates" },
          { status: 400 }
        );
      }

      // Update job with proof and transition to IN_PROGRESS
      await jobDoc.ref.update({
        status: "IN_PROGRESS",
        startProofPhoto,
        startProofGpsLat,
        startProofGpsLng,
        startedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Log state transition
      const jobLogsRef = adminDb.collection(COLLECTIONS.JOB_LOGS);
      await jobLogsRef.add({
        jobId: job.id,
        fromStatus: "ACCEPTED",
        toStatus: "IN_PROGRESS",
        action: "WORK_STARTED",
        performedBy: user.id,
        metadata: {
          startProofPhoto,
          gpsLocation: { lat: startProofGpsLat, lng: startProofGpsLng },
        },
        createdAt: FieldValue.serverTimestamp(),
      });

      // Create in-app notification for customer
      try {
        await notifyCustomerJobStarted(job.customerId || "", {
          workerName: workerDoc?.data()?.name || 'Worker',
          serviceName: job.description || "",
          jobId: job.id,
        });
        console.log(`[Notification] Created in-app notification for customer ${job.customerId} - job started`);
        
        // Send push notification
        await sendPushNotification({
          userId: job.customerId || "",
          title: '🚀 Job Started',
          message: `${workerDoc?.data()?.name || 'Worker'} has started working on your ${job.description}`,
          type: 'JOB_STARTED',
          actionUrl: `/customer/bookings`,
        });
      } catch (notifError) {
        console.error('Failed to create in-app notification:', notifError);
      }

      const updated = { 
        ...job, 
        status: "IN_PROGRESS",
        startProofPhoto,
        startProofGpsLat,
        startProofGpsLng,
        startedAt: new Date()
      };
      return NextResponse.json({ success: true, job: updated });
    }

    // ===========================
    // ACTION: WORKER_COMPLETE (Worker only)
    // Worker marks their work as done, notifies customer
    // Status stays IN_PROGRESS until customer confirms and pays
    // ===========================
    if (action === "WORKER_COMPLETE") {
      // Authorization: Only worker can mark their work complete
      if (user.role !== "WORKER" || job.workerId !== user.id) {
        return NextResponse.json(
          { error: "Only the assigned worker can mark work as complete" },
          { status: 403 }
        );
      }

      // State validation: Must be IN_PROGRESS
      if (job.status !== "IN_PROGRESS") {
        return NextResponse.json(
          { error: "Job must be in progress to mark as complete" },
          { status: 400 }
        );
      }

      // Check if already marked as worker complete
      if (job.workerMarkedComplete) {
        return NextResponse.json(
          { error: "You have already marked this job as complete" },
          { status: 400 }
        );
      }

      // Update job with worker completion flag
      await jobDoc.ref.update({
        workerMarkedComplete: true,
        workerMarkedCompleteAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Log worker completion
      const jobLogsRef = adminDb.collection(COLLECTIONS.JOB_LOGS);
      await jobLogsRef.add({
        jobId: job.id,
        fromStatus: "IN_PROGRESS",
        toStatus: "IN_PROGRESS", // Status doesn't change yet
        action: "WORKER_MARKED_COMPLETE",
        performedBy: user.id,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Notify customer that worker has completed the work
      try {
        await notifyCustomerJobCompleted(job.customerId || "", {
          workerName: workerDoc?.data()?.name || 'Worker',
          serviceName: job.description || "",
          jobId: job.id,
        });
        console.log(`[Notification] Created in-app notification for customer ${job.customerId} - worker completed work`);
        
        // Send push notification to customer
        await sendPushNotification({
          userId: job.customerId || "",
          title: '✅ Work Completed',
          message: `${workerDoc?.data()?.name || 'Worker'} has completed your ${job.description}. Please confirm and pay ₹${job.charge}`,
          type: 'JOB_COMPLETED',
          actionUrl: `/customer/bookings`,
        });
      } catch (notifError) {
        console.error('Failed to create completion notification:', notifError);
      }

      const updated = { 
        ...job, 
        workerMarkedComplete: true,
        workerMarkedCompleteAt: new Date()
      };
      return NextResponse.json({ 
        success: true, 
        job: updated,
        message: "Work marked as complete. Customer has been notified to confirm and pay."
      });
    }

    // ===========================
    // ACTION: COMPLETE (Customer only)
    // Transition: IN_PROGRESS → Create Razorpay order
    // Returns: Razorpay order details for payment modal
    // ===========================
    if (action === "COMPLETE") {
      // Authorization: Only customer can mark complete
      if (user.role !== "CUSTOMER" || job.customerId !== user.id) {
        return NextResponse.json(
          { error: "Only the customer can complete this job" },
          { status: 403 }
        );
      }

      // State validation: Must be IN_PROGRESS
      if (job.status !== "IN_PROGRESS") {
        return NextResponse.json(
          { error: "Only in-progress jobs can be completed" },
          { status: 400 }
        );
      }

      // Check if Razorpay order already exists
      if (job.razorpayOrderId) {
        // Allow retry with existing order - don't block
        return NextResponse.json({
          success: true,
          requiresPayment: true,
          razorpayOrder: {
            orderId: job.razorpayOrderId,
            amount: (job.charge || 0) * 100, // Convert to paise
            currency: "INR",
            keyId: process.env.RAZORPAY_KEY_ID,
          },
          job: job,
          message: "Resuming previous payment attempt",
        });
      }

      // Create Razorpay order
      const razorpayOrder = await createRazorpayOrder(
        job.id,
        job.charge || 0,
        jobWithRelations.customer?.email,
        jobWithRelations.customer?.phone
      );

      // Update job with Razorpay order details
      await jobDoc.ref.update({
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: "PROCESSING",
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Log payment initiation
      const jobLogsRef = adminDb.collection(COLLECTIONS.JOB_LOGS);
      await jobLogsRef.add({
        jobId: job.id,
        fromStatus: "IN_PROGRESS",
        toStatus: "IN_PROGRESS", // Status doesn't change yet
        action: "PAYMENT_INITIATED",
        performedBy: user.id,
        metadata: {
          razorpayOrderId: razorpayOrder.id,
          amount: job.charge,
        },
        createdAt: FieldValue.serverTimestamp(),
      });

      // Note: Customer notification is NOT sent here because:
      // - If worker marked complete first (WORKER_COMPLETE action), customer was already notified
      // - This action is triggered BY the customer clicking "Complete & Pay", so they don't need notification

      // Return Razorpay order for frontend payment modal
      return NextResponse.json({
        success: true,
        requiresPayment: true,
        razorpayOrder: {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
        },
        job: { ...job, razorpayOrderId: razorpayOrder.id, paymentStatus: "PROCESSING" },
      });
    }

    // ===========================
    // ACTION: CANCEL (Customer or Worker)
    // Transition: PENDING/ACCEPTED → CANCELLED
    // Blocked: Cannot cancel if IN_PROGRESS
    // ===========================
    if (action === "CANCEL") {
      // Authorization: Customer or worker can cancel
      const isAuthorized =
        (user.role === "CUSTOMER" && job.customerId === user.id) ||
        (user.role === "WORKER" && job.workerId === user.id);

      if (!isAuthorized) {
        return NextResponse.json(
          { error: "You are not authorized to cancel this job" },
          { status: 403 }
        );
      }

      // State validation: Cannot cancel IN_PROGRESS jobs (anti-fraud)
      if (job.status === "IN_PROGRESS") {
        return NextResponse.json(
          {
            error: "Cannot cancel in-progress jobs",
            message:
              "Work has already started. Please complete the job and make payment.",
          },
          { status: 400 }
        );
      }

      // State validation: Can only cancel PENDING or ACCEPTED
      if (job.status !== "PENDING" && job.status !== "ACCEPTED") {
        return NextResponse.json(
          { error: "Job cannot be cancelled at this stage" },
          { status: 400 }
        );
      }

      const { reason } = body;

      // Update job status
      await jobDoc.ref.update({ 
        status: "CANCELLED",
        updatedAt: FieldValue.serverTimestamp()
      });

      // Log cancellation
      const jobLogsRef = adminDb.collection(COLLECTIONS.JOB_LOGS);
      await jobLogsRef.add({
        jobId: job.id,
        fromStatus: job.status,
        toStatus: "CANCELLED",
        action: "JOB_CANCELLED",
        performedBy: user.id,
        metadata: {
          cancelledBy: user.role,
          reason: reason || "No reason provided",
        },
        createdAt: FieldValue.serverTimestamp(),
      });

      const updated = { ...job, status: "CANCELLED" };
      return NextResponse.json({ success: true, job: updated });
    }

    return NextResponse.json({ error: "Unhandled action" }, { status: 400 });
  } catch (err) {
    console.error("PATCH /api/jobs/[id] error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ===========================
// POST: Payment Verification
// Called after customer completes Razorpay payment
// ===========================
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session cookie
    const sessionCookie = (await cookies()).get("__session")?.value;
    if (!sessionCookie)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify session
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const firebaseUid = decodedToken.uid;

    const body = await _req.json();
    const { razorpayPaymentId, razorpaySignature } = body;

    if (!razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: "Missing payment verification data" },
        { status: 400 }
      );
    }

    // Get user
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (userQuery.empty)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userDoc = userQuery.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() as { role?: string; [key: string]: any } };

    // Get job
    const resolvedParams = await params;
    const jobsRef = adminDb.collection(COLLECTIONS.JOBS);
    const jobDoc = await jobsRef.doc(resolvedParams.id).get();
    if (!jobDoc.exists)
      return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const job = { id: jobDoc.id, ...jobDoc.data() as { customerId?: string; status?: string; razorpayOrderId?: string; charge?: number; amount?: number; type?: import("@/lib/firestore").TransactionType; [key: string]: any } };

    // Authorization: Only customer can verify payment
    if (user.role !== "CUSTOMER" || job.customerId !== user.id) {
      return NextResponse.json(
        { error: "Only the customer can verify payment" },
        { status: 403 }
      );
    }

    // Validate job state
    if (job.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Job must be in-progress for payment" },
        { status: 400 }
      );
    }

    if (!job.razorpayOrderId) {
      return NextResponse.json(
        { error: "No payment order found" },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const isValid = verifyPaymentSignature(
      job.razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Update job: Mark as COMPLETED with payment details
    await jobDoc.ref.update({
      status: "COMPLETED",
      paymentStatus: "SUCCESS",
      razorpayPaymentId,
      razorpaySignature,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Create transaction record
    const transactionsRef = adminDb.collection(COLLECTIONS.TRANSACTIONS);
    const transactionData: Partial<Transaction> = {
      userId: job.customerId,
      jobId: job.id,
      amount: job.charge,
      type: TransactionType.PAYMENT,
      createdAt: FieldValue.serverTimestamp() as any,
      updatedAt: FieldValue.serverTimestamp() as any,
    };
    await transactionsRef.add(transactionData);

    // Log job completion
    const jobLogsRef = adminDb.collection(COLLECTIONS.JOB_LOGS);
    await jobLogsRef.add({
      jobId: job.id,
      fromStatus: "IN_PROGRESS",
      toStatus: "COMPLETED",
      action: "PAYMENT_VERIFIED_JOB_COMPLETED",
      performedBy: user.id,
      metadata: {
        razorpayPaymentId,
        amount: job.charge,
        platformFee: job.platformFee,
        workerEarnings: job.workerEarnings,
      },
      createdAt: FieldValue.serverTimestamp(),
    });

    // Create in-app notification for worker about payment
    try {
      const customerDoc = await usersRef.doc(job.customerId).get();
      await notifyWorkerPaymentReceived(job.workerId, {
        customerName: customerDoc?.data()?.name || 'Customer',
        amount: job.workerEarnings,
        serviceName: job.description,
        jobId: job.id,
      });
      console.log(`[Notification] Created in-app notification for worker ${job.workerId} - payment received`);
      
      // Send push notification
      await sendPushNotification({
        userId: job.workerId,
        title: '💰 Payment Received',
        message: `You received ₹${job.workerEarnings} from ${customerDoc?.data()?.name || 'customer'} for ${job.description}`,
        type: 'PAYMENT_RECEIVED',
        actionUrl: `/worker/earnings`,
      });
    } catch (notifError) {
      console.error('Failed to create payment notification:', notifError);
    }

    const updated = {
      ...job,
      status: "COMPLETED",
      paymentStatus: "SUCCESS",
      razorpayPaymentId,
      razorpaySignature,
      completedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      job: updated,
      message: "Payment verified and job completed successfully",
    });
  } catch (err) {
    console.error("POST /api/jobs/[id] payment verification error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
