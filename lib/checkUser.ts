import { adminAuth, adminDb } from "./firebase-admin";
import { cookies } from "next/headers";
import { COLLECTIONS, UserRole } from "./firestore";
import { serializeFirestoreData } from "./firestore-serialization";

export const checkUser = async () => {
  try {
    // Get the session token from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
      return null;
    }

    // Verify the Firebase session cookie
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const firebaseUid = decodedToken.uid;

    // Get user from Firestore
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();

    if (userQuery.empty) {
      // User doesn't exist in database yet - create from Firebase Auth user
      const firebaseUser = await adminAuth.getUser(firebaseUid);
      
      const newUserId = adminDb.collection('temp').doc().id; // Generate unique ID
      
      const newUser = {
        email: firebaseUser.email || `no-email-${firebaseUid}@placeholder.local`,
        phone: firebaseUser.phoneNumber || `no-phone-${firebaseUid}`,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        role: UserRole.UNASSIGNED,
        createdAt: new Date(),
        updatedAt: new Date(),
        firebaseUid: firebaseUid,
      };

      console.log('Creating new user in Firestore:', { userId: newUserId, firebaseUid, email: newUser.email });

      // Save to Firestore with explicit document ID
      await usersRef.doc(newUserId).set(newUser);
      
      console.log('✅ User created successfully in Firestore');
      
      // Return user with ID - serialize dates
      return serializeFirestoreData({ 
        id: newUserId, 
        ...newUser, 
        workerProfile: null, 
        customerProfile: null 
      });
    }

    // Return existing user with profiles
    const userDoc = userQuery.docs[0];
    const userData: { id: string; role?: string; [key: string]: any } = { id: userDoc.id, ...userDoc.data() };
    
    // Fetch worker profile if user is a worker
    let workerProfile = null;
    if (userData.role === 'WORKER') {
      const workerQuery = await adminDb.collection(COLLECTIONS.WORKER_PROFILES)
        .where('userId', '==', userDoc.id)
        .limit(1)
        .get();
      if (!workerQuery.empty) {
        workerProfile = { id: workerQuery.docs[0].id, ...workerQuery.docs[0].data() };
      }
    }
    
    // Fetch customer profile if user is a customer
    let customerProfile = null;
    if (userData.role === 'CUSTOMER') {
      const customerQuery = await adminDb.collection(COLLECTIONS.CUSTOMER_PROFILES)
        .where('userId', '==', userDoc.id)
        .limit(1)
        .get();
      if (!customerQuery.empty) {
        customerProfile = { id: customerQuery.docs[0].id, ...customerQuery.docs[0].data() };
      }
    }
    
    // Serialize all Firestore Timestamps before returning
    return serializeFirestoreData({ ...userData, workerProfile, customerProfile });
  } catch (error) {
    console.error("Error in checkUser:", error);
    return null;
  }
};
