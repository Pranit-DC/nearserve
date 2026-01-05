import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "./firebase-admin";
import { COLLECTIONS } from "./firestore";

export type UserRole = "CUSTOMER" | "WORKER";

/**
 * Get current user from Firebase Auth token in request
 */
async function getCurrentUserFromRequest(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Try to get from cookie
      const sessionToken = request.cookies.get('__session')?.value;
      
      if (!sessionToken) {
        return null;
      }
      
      // Verify session cookie
      const decodedToken = await adminAuth.verifySessionCookie(sessionToken);
      const firebaseUid = decodedToken.uid;
      
      // Get user from Firestore
      const usersRef = adminDb.collection(COLLECTIONS.USERS);
      const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
      
      if (userQuery.empty) {
        return null;
      }
      
      const userDoc = userQuery.docs[0];
      return { id: userDoc.id, ...userDoc.data() };
    }
    
    // Extract token from Authorization header
    const token = authHeader.substring(7);
    
    // Verify the Firebase ID token (Bearer tokens are ID tokens, not session cookies)
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;
    
    // Get user from Firestore
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
    
    if (userQuery.empty) {
      return null;
    }
    
    const userDoc = userQuery.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error("Error getting current user from request:", error);
    return null;
  }
}

export async function protectApiRoute(
  request: NextRequest,
  requiredRole?: UserRole
): Promise<{ user: any; response?: NextResponse }> {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return {
        user: null,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    // If a specific role is required, check it
    if (requiredRole && user.role !== requiredRole) {
      return {
        user: null,
        response: NextResponse.json(
          {
            error: `Access denied. ${requiredRole} role required.`,
            userRole: user.role,
          },
          { status: 403 }
        ),
      };
    }

    return { user };
  } catch (error) {
    console.error("API route protection error:", error);
    return {
      user: null,
      response: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      ),
    };
  }
}

export async function protectWorkerApi(request: NextRequest) {
  return protectApiRoute(request, "WORKER");
}

export async function protectCustomerApi(request: NextRequest) {
  return protectApiRoute(request, "CUSTOMER");
}
