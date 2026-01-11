import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const sessionCookie = (await cookies()).get("__session")?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized: No session" },
        { status: 401 }
      );
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    const firebaseUid = decodedClaims.uid;

    // Parse request body
    const { title, description, images, location } = await req.json();

    if (!title || !images || images.length === 0) {
      return NextResponse.json(
        { error: "Title and at least one image are required" },
        { status: 400 }
      );
    }

    // Find the user by firebaseUid
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef
      .where("firebaseUid", "==", firebaseUid)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userQuery.docs[0].id;

    // Get worker profile to verify user is a worker
    const workerProfilesRef = adminDb.collection(COLLECTIONS.WORKER_PROFILES);
    const profileQuery = await workerProfilesRef
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (profileQuery.empty) {
      return NextResponse.json(
        { error: "Worker profile not found" },
        { status: 404 }
      );
    }

    const profileDoc = profileQuery.docs[0];

    // Create new portfolio item in previous_works collection
    const previousWorksRef = adminDb.collection(COLLECTIONS.PREVIOUS_WORKS);
    const newWorkRef = await previousWorksRef.add({
      workerId: profileDoc.id,
      userId: userId,
      title: title || null,
      description: description || null,
      images: images || [],
      location: location || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Get the created document
    const newWorkDoc = await newWorkRef.get();
    const newWorkData = newWorkDoc.data();

    return NextResponse.json({
      success: true,
      work: {
        id: newWorkDoc.id,
        ...newWorkData,
      },
    });
  } catch (error) {
    console.error("Error adding portfolio item:", error);
    return NextResponse.json(
      { error: "Failed to add portfolio item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Verify authentication
    const sessionCookie = (await cookies()).get("__session")?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized: No session" },
        { status: 401 }
      );
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    const firebaseUid = decodedClaims.uid;

    // Get work ID from query params
    const url = new URL(req.url);
    const workId = url.searchParams.get("id");

    if (!workId) {
      return NextResponse.json(
        { error: "Work ID is required" },
        { status: 400 }
      );
    }

    // Find the user by firebaseUid
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef
      .where("firebaseUid", "==", firebaseUid)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userQuery.docs[0].id;

    // Get worker profile to verify ownership
    const workerProfilesRef = adminDb.collection(COLLECTIONS.WORKER_PROFILES);
    const profileQuery = await workerProfilesRef
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (profileQuery.empty) {
      return NextResponse.json(
        { error: "Worker profile not found" },
        { status: 404 }
      );
    }

    const workerProfileId = profileQuery.docs[0].id;

    // Get the work document
    const workDoc = await adminDb
      .collection(COLLECTIONS.PREVIOUS_WORKS)
      .doc(workId)
      .get();

    if (!workDoc.exists) {
      return NextResponse.json(
        { error: "Portfolio item not found" },
        { status: 404 }
      );
    }

    const workData = workDoc.data();

    // Verify ownership - check both userId and workerId for backward compatibility
    const isOwner = workData?.userId === userId || workData?.workerId === workerProfileId;
    
    if (!isOwner) {
      return NextResponse.json(
        { error: "Unauthorized: You can only delete your own work" },
        { status: 403 }
      );
    }

    // Delete the document
    await workDoc.ref.delete();

    return NextResponse.json({
      success: true,
      message: "Portfolio item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting portfolio item:", error);
    return NextResponse.json(
      { error: "Failed to delete portfolio item" },
      { status: 500 }
    );
  }
}
