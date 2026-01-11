import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

export async function PUT(req: NextRequest) {
  try {
    // Get session cookie
    const sessionCookie = (await cookies()).get("__session")?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify session
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const firebaseUid = decodedToken.uid;

    const body = await req.json();
    const {
      bio,
      skilledIn,
      qualification,
      yearsExperience,
      hourlyRate,
      minimumFee,
      address,
      city,
      state,
      postalCode,
      country,
      profilePic,
    } = body;

    // Validate required fields
    if (!skilledIn || skilledIn.length === 0) {
      return NextResponse.json(
        { error: "At least one skill is required" },
        { status: 400 }
      );
    }

    if (hourlyRate !== undefined && hourlyRate < 0) {
      return NextResponse.json(
        { error: "Hourly rate cannot be negative" },
        { status: 400 }
      );
    }

    if (minimumFee !== undefined && minimumFee < 0) {
      return NextResponse.json(
        { error: "Minimum fee cannot be negative" },
        { status: 400 }
      );
    }

    // Find the user
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();

    if (userQuery.empty) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userQuery.docs[0].id;

    // Find the worker profile
    const workerProfilesRef = adminDb.collection(COLLECTIONS.WORKER_PROFILES);
    const profileQuery = await workerProfilesRef.where('userId', '==', userId).limit(1).get();

    if (profileQuery.empty) {
      return NextResponse.json(
        { error: "Worker profile not found" },
        { status: 404 }
      );
    }

    const profileDoc = profileQuery.docs[0];

    // Update the worker profile
    await profileDoc.ref.update({
      bio: bio || null,
      skilledIn,
      qualification: qualification || null,
      yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      minimumFee: minimumFee ? parseFloat(minimumFee) : null,
      address: address || null,
      city: city || null,
      state: state || null,
      postalCode: postalCode || null,
      country: country || null,
      profilePic: profilePic || null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Fetch updated profile with previous works
    const updatedProfileData = (await profileDoc.ref.get()).data();
    const previousWorksRef = adminDb.collection(COLLECTIONS.PREVIOUS_WORKS);
    const worksQuery = await previousWorksRef.where('workerId', '==', profileDoc.id).get();
    const previousWorks = worksQuery.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate?.() ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      });

    // Fetch user data
    const userData = userQuery.docs[0].data();

    return NextResponse.json({
      success: true,
      profile: {
        id: profileDoc.id,
        ...updatedProfileData,
        previousWorks,
        user: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone || null,
        },
      },
    });
  } catch (error) {
    console.error("Error updating worker profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
