import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";
import { protectCustomerApi } from "@/lib/api-auth";
import { assessWorkerByCustomer } from "@/lib/reputation-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await protectCustomerApi(request);
    if (response) return response;

    const { id: jobId } = await params;
    const { assessmentType } = await request.json();

    // Validate assessment type
    if (!['ON_TIME', 'LATE', 'NO_SHOW'].includes(assessmentType)) {
      return NextResponse.json(
        { error: 'Invalid assessment type. Must be one of: ON_TIME, LATE, NO_SHOW' },
        { status: 400 }
      );
    }

    // Get job to verify it belongs to this customer and is completed
    const jobRef = adminDb.collection(COLLECTIONS.JOBS).doc(jobId);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const jobData = jobDoc.data();

    // Verify customer owns this job
    if (jobData?.customerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - job does not belong to this customer' },
        { status: 403 }
      );
    }

    // Verify job is completed
    if (jobData?.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Job must be completed before assessing reputation' },
        { status: 400 }
      );
    }

    // Verify reputation hasn't already been assessed
    if (jobData?.reputationAssessed) {
      return NextResponse.json(
        { error: 'Reputation has already been assessed for this job' },
        { status: 400 }
      );
    }

    if (!jobData?.workerId) {
      return NextResponse.json(
        { error: 'Job does not have an assigned worker' },
        { status: 400 }
      );
    }

    // Assess worker reputation
    const result = await assessWorkerByCustomer(
      jobId,
      jobData.workerId,
      assessmentType as 'ON_TIME' | 'LATE' | 'NO_SHOW',
      user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to assess reputation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Worker reputation assessed: ${assessmentType}`,
      assessmentType,
      newReputation: result.newReputation,
    });
  } catch (error) {
    console.error(`POST /api/jobs/[id]/assess-reputation:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
