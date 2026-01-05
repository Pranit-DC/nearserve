import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";
import { cookies } from "next/headers";

export async function GET() {
  try {
    console.log("🔍 Check-profile API called");
    
    const sessionCookie = (await cookies()).get("__session")?.value;

    if (!sessionCookie) {
      console.log("❌ No session cookie found, redirecting to sign-in");
      return NextResponse.json({ redirectUrl: "/sign-in" });
    }

    // Verify the session token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    } catch {
      console.log("❌ Invalid session cookie, redirecting to sign-in");
      return NextResponse.json({ redirectUrl: "/sign-in" });
    }

    console.log("Firebase user:", decodedToken.uid);

    // Check if user exists in database
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', decodedToken.uid).limit(1).get();
    
    if (userQuery.empty) {
      console.log("✅ No user found in database, redirecting to onboarding");
      return NextResponse.json({ redirectUrl: "/onboarding" });
    }

    const userData = userQuery.docs[0].data();
    console.log("Database user:", userData);

    // If user has no role or is unassigned, redirect to onboarding
    if (!userData.role || userData.role === "UNASSIGNED") {
      console.log("✅ No role found, redirecting to onboarding");
      return NextResponse.json({ redirectUrl: "/onboarding" });
    }

    // Redirect to appropriate dashboard based on role
    const dashboardPath =
      userData.role === "WORKER" ? "/worker/dashboard" : "/customer/dashboard";
    
    console.log(`✅ User has role: ${userData.role}, redirecting to ${dashboardPath}`);
    return NextResponse.json({ redirectUrl: dashboardPath });
  } catch (error) {
    console.error("❌ Error checking user profile:", error);
    return NextResponse.json({ redirectUrl: "/" });
  }
}
