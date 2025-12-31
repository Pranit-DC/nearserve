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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const firebaseUid = decodedToken.uid;

    // Get the user from database
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();

    if (userQuery.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    if (userData.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Only customers can update customer profile" },
        { status: 403 }
      );
    }

    // Find customer profile
    const customerProfilesRef = adminDb.collection(COLLECTIONS.CUSTOMER_PROFILES);
    const profileQuery = await customerProfilesRef.where('userId', '==', userId).limit(1).get();

    if (profileQuery.empty) {
      return NextResponse.json(
        { error: "Customer profile not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { address, city, state, postalCode, country } = body;

    // Validate required fields
    if (!address || !city || !state || !postalCode || !country) {
      return NextResponse.json(
        { error: "All address fields are required" },
        { status: 400 }
      );
    }

    // Validate field lengths
    if (address.length < 3) {
      return NextResponse.json(
        { error: "Address must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (city.length < 2) {
      return NextResponse.json(
        { error: "City must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (state.length < 2) {
      return NextResponse.json(
        { error: "State must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (postalCode.length < 4) {
      return NextResponse.json(
        { error: "Postal code must be at least 4 characters" },
        { status: 400 }
      );
    }

    // Update the customer profile
    const profileDoc = profileQuery.docs[0];
    await profileDoc.ref.update({
      address,
      city,
      state,
      postalCode,
      country,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updatedProfileData = (await profileDoc.ref.get()).data();

    return NextResponse.json({
      success: true,
      profile: {
        id: profileDoc.id,
        ...updatedProfileData,
      },
    });
  } catch (error) {
    console.error("Error updating customer profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
