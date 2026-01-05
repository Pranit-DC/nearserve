import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    // Get session cookie
    const sessionCookie = (await cookies()).get("__session")?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // Verify session
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    } catch {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // Check if user exists in database
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', decodedToken.uid).limit(1).get();
    
    if (userQuery.empty) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    const userData = userQuery.docs[0].data();

    // If user has no role or is unassigned, redirect to onboarding
    if (!userData.role || userData.role === "UNASSIGNED") {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // Redirect to appropriate dashboard based on role
    const dashboardPath =
      userData.role === "WORKER" ? "/worker/dashboard" : "/customer/dashboard";
    
    return NextResponse.redirect(new URL(dashboardPath, req.url));
  } catch (error) {
    console.error("Error in auth callback:", error);
    // Fallback to home page on error
    return NextResponse.redirect(new URL("/", req.url));
  }
}
