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
    const sessionToken = request.cookies.get('__session')?.value;
    
    if (!authHeader && !sessionToken) {
      console.debug('[Auth] No auth header or session cookie found');
      return null;
    }

    let firebaseUid: string | null = null;

    if (sessionToken) {
      try {
        // Verify session cookie
        const decodedToken = await adminAuth.verifySessionCookie(sessionToken);
        firebaseUid = decodedToken.uid;
        console.debug('[Auth] Session cookie verified for UID:', firebaseUid);
      } catch (error) {
        console.warn('[Auth] Session cookie verification failed:', (error as any).message);
        // Fall through to try Bearer token if session fails
      }
    }

    if (!firebaseUid && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Extract and verify Bearer token
        const token = authHeader.substring(7);
        const decodedToken = await adminAuth.verifyIdToken(token);
        firebaseUid = decodedToken.uid;
        console.debug('[Auth] Bearer token verified for UID:', firebaseUid);
      } catch (error) {
        console.warn('[Auth] Bearer token verification failed:', (error as any).message);
        return null;
      }
    }

    if (!firebaseUid) {
      console.debug('[Auth] No valid authentication token found');
      return null;
    }

    // Get user from Firestore
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
    
    if (userQuery.empty) {
      console.warn('[Auth] User not found in Firestore for UID:', firebaseUid);
      return null;
    }
    
    const userDoc = userQuery.docs[0];
    const userData = { id: userDoc.id, ...userDoc.data() } as any;
    console.debug('[Auth] User authenticated:', userData.id, 'Role:', userData.role);
    return userData;
  } catch (error) {
    console.error("[Auth] Error getting current user from request:", error);
    return null;
  }
}

export async function protectApiRoute(
  request: NextRequest,
  requiredRole?: UserRole
): Promise<{ user: any; response?: NextResponse }> {
  try {
    const user: { id: string; role?: string; [key: string]: any } | null = await getCurrentUserFromRequest(request);

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
