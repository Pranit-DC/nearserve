import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, Job, JobLog } from "@/lib/firestore";
import { protectCustomerApi } from "@/lib/api-auth";
import { calculateFees } from "@/lib/razorpay-service";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await protectCustomerApi(req);
    if (response) return response;

    const customer = user;

    const body = await req.json();
    const { workerId, description, details, datetime, location, charge } =
      body || {};

    if (
      !workerId ||
      !description ||
      !datetime ||
      !location ||
      typeof charge !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (charge <= 0) {
      return NextResponse.json(
        { error: "Charge must be greater than 0" },
        { status: 400 }
      );
    }

    const dt = new Date(datetime);
    if (isNaN(dt.getTime())) {
      return NextResponse.json({ error: "Invalid datetime" }, { status: 400 });
    }

    // Split into date and time DateTime values
    const date = new Date(dt);
    date.setHours(0, 0, 0, 0);
    const time = dt; // store the exact requested time as DateTime

    // Validate worker exists and is role WORKER
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const workerDoc = await usersRef.doc(workerId).get();

    if (!workerDoc.exists) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const workerData = workerDoc.data();
    if (workerData?.role !== "WORKER") {
      return NextResponse.json(
        {
          error: "Invalid worker",
          details: `User exists but has role '${workerData?.role}' instead of 'WORKER'`,
        },
        { status: 400 }
      );
    }

    // Calculate platform fees and worker earnings
    const { platformFee, workerEarnings } = calculateFees(charge);

    // Create job with payment tracking fields
    const jobsRef = adminDb.collection(COLLECTIONS.JOBS);
    const jobData: Partial<Job> = {
      customerId: customer.id,
      workerId: workerId,
      description,
      details: details || null,
      date: date,
      time: time,
      location,
      charge,
      status: "PENDING",
      platformFee,
      workerEarnings,
      paymentStatus: "PENDING",
      createdAt: FieldValue.serverTimestamp() as any,
      updatedAt: FieldValue.serverTimestamp() as any,
    };

    const jobRef = await jobsRef.add(jobData);
    const jobId = jobRef.id;

    // Create audit log for job creation
    const jobLogsRef = adminDb.collection(COLLECTIONS.JOB_LOGS);
    const logData: Partial<JobLog> = {
      jobId,
      fromStatus: null,
      toStatus: "PENDING",
      action: "JOB_CREATED",
      performedBy: customer.id,
      metadata: {
        charge,
        platformFee,
        workerEarnings,
        location,
      },
      createdAt: FieldValue.serverTimestamp() as any,
    };

    await jobLogsRef.add(logData);

    return NextResponse.json({ 
      success: true, 
      job: { id: jobId, ...jobData }
    });
  } catch (err) {
    console.error("POST /api/jobs error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
