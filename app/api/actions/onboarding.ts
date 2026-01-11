"use server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, generateId, WorkerProfile, CustomerProfile, PreviousWork } from "@/lib/firestore";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { serializeFirestoreData } from "@/lib/firestore-serialization";

export type WorkerFormData = {
  phone: string;
  skilledIn: string[];
  qualification?: string;
  certificates?: string[];
  aadharNumber: string;
  yearsExperience?: number;
  hourlyRate: number;
  minimumFee: number;
  profilePic?: string;
  bio?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  availableAreas: string[];
};

export type CustomerFormData = {
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

export async function setUserRole(
  formData: FormData
): Promise<{ success: boolean; redirect?: string; error?: string }> {
  // Get session cookie
  const sessionCookie = (await cookies()).get("__session")?.value;
  if (!sessionCookie) throw new Error("Unauthorized");

  // Verify session
  let decodedToken;
  try {
    decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
  } catch {
    throw new Error("Unauthorized");
  }

  const firebaseUid = decodedToken.uid;

  // Get user record
  const usersRef = adminDb.collection(COLLECTIONS.USERS);
  const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
  
  if (userQuery.empty) {
    console.error('❌ User not found in database for firebaseUid:', firebaseUid);
    throw new Error("User not found in database");
  }
  
  const userDoc = userQuery.docs[0];
  const userId = userDoc.id;

  console.log("✅ Processing form data for user:", { firebaseUid, userId, role: userDoc.data().role });

  const roleRaw = formData.get("role");
  const role = typeof roleRaw === "string" ? roleRaw.toUpperCase() : "";
  if (!role || !["WORKER", "CUSTOMER"].includes(role)) {
    throw new Error("Invalid role selection");
  }

  try {
    if (role === "CUSTOMER") {
      const phone = formData.get("phone")?.toString();
      const address = formData.get("address")?.toString();
      const city = formData.get("city")?.toString();
      const state = formData.get("state")?.toString();
      const country = formData.get("country")?.toString();
      const postalCode = formData.get("postalCode")?.toString();

      if (!phone || !address || !city || !state || !country || !postalCode) {
        throw new Error("Missing required fields for customer");
      }

      // Update user role and phone
      await userDoc.ref.update({ 
        role: "CUSTOMER",
        phone: phone,
      });
      console.log('✅ Updated user role to CUSTOMER with phone:', phone);

      // Create or update customer profile
      const customerProfilesRef = adminDb.collection(COLLECTIONS.CUSTOMER_PROFILES);
      const existingProfileQuery = await customerProfilesRef.where('userId', '==', userId).limit(1).get();
      
      const customerData: Partial<CustomerProfile> = {
        userId,
        address,
        city,
        state,
        country,
        postalCode,
        updatedAt: FieldValue.serverTimestamp() as any,
      };

      if (existingProfileQuery.empty) {
        // Create new profile
        const newProfileRef = await customerProfilesRef.add({
          ...customerData,
          createdAt: FieldValue.serverTimestamp(),
        });
        console.log('✅ Created customer profile:', newProfileRef.id);
      } else {
        // Update existing profile
        await existingProfileQuery.docs[0].ref.update(customerData);
        console.log('✅ Updated existing customer profile:', existingProfileQuery.docs[0].id);
      }

      revalidatePath("/");
      return { success: true, redirect: "/onboarding/finish" };
    }

    if (role === "WORKER") {
      console.log("Processing WORKER role");

      const phone = formData.get("phone")?.toString();
      const skilledInRaw = formData.get("skilledIn")?.toString();
      console.log("phone:", phone);
      console.log("skilledInRaw:", skilledInRaw);

      let skilledIn: string[] = [];
      try {
        skilledIn = skilledInRaw
          ? JSON.parse(skilledInRaw)
              .map((s: string) => s?.toLowerCase().trim())
              .filter(Boolean)
          : [];
      } catch (e) {
        console.error("Error parsing skilledIn:", e);
        throw new Error("Invalid skilledIn data format");
      }

      const qualification = formData.get("qualification")?.toString() || null;
      const certificatesRaw = formData.get("certificates")?.toString();
      console.log("certificatesRaw:", certificatesRaw);

      let certificates: string[] = [];
      try {
        certificates = certificatesRaw ? JSON.parse(certificatesRaw) : [];
      } catch (e) {
        console.error("Error parsing certificates:", e);
        throw new Error("Invalid certificates data format");
      }
      const aadharNumber = formData.get("aadharNumber")?.toString();
      const yearsExperience = formData.get("yearsExperience")
        ? parseInt(formData.get("yearsExperience")!.toString(), 10)
        : null;
      const hourlyRate = formData.get("hourlyRate")
        ? parseFloat(formData.get("hourlyRate")!.toString())
        : null;
      const minimumFee = formData.get("minimumFee")
        ? parseFloat(formData.get("minimumFee")!.toString())
        : null;
      const profilePic = formData.get("profilePic")?.toString() || null;
      const bio = formData.get("bio")?.toString() || null;
      const address = formData.get("address")?.toString();
      const city = formData.get("city")?.toString();
      const state = formData.get("state")?.toString();
      const country = formData.get("country")?.toString();
      const postalCode = formData.get("postalCode")?.toString();
      const availableAreasRaw = formData.get("availableAreas")?.toString();
      console.log("availableAreasRaw:", availableAreasRaw);

      let availableAreas: string[] = [];
      try {
        availableAreas = availableAreasRaw
          ? JSON.parse(availableAreasRaw)
              .map((s: string) => s?.trim())
              .filter(Boolean)
          : [];
      } catch (e) {
        console.error("Error parsing availableAreas:", e);
        throw new Error("Invalid availableAreas data format");
      }

      const previousWorksRaw = formData.get("previousWorks")?.toString();
      console.log("previousWorksRaw:", previousWorksRaw);

      let previousWorks: Array<{
        id: string;
        title: string;
        description: string;
        imageUrl: string;
      }> = [];
      try {
        previousWorks = previousWorksRaw ? JSON.parse(previousWorksRaw) : [];
      } catch (e) {
        console.error("Error parsing previousWorks:", e);
        // previousWorks is optional, so don't throw error
        previousWorks = [];
      }

      if (
        !phone ||
        !skilledIn.length ||
        !aadharNumber ||
        !hourlyRate ||
        !minimumFee ||
        !address ||
        !city ||
        !state ||
        !country ||
        !postalCode
      ) {
        throw new Error("Missing required fields for worker");
      }

      // Check if aadharNumber is already used by another user
      // Note: We query for all matching aadhar numbers and filter in-memory to avoid needing a composite index
      const workerProfilesRef = adminDb.collection(COLLECTIONS.WORKER_PROFILES);
      const existingAadharQuery = await workerProfilesRef
        .where('aadharNumber', '==', aadharNumber)
        .get();
      
      // Filter out the current user's profile
      const otherUserWithAadhar = existingAadharQuery.docs.find(
        doc => doc.data().userId !== userId
      );
      
      if (otherUserWithAadhar) {
        return {
          success: false,
          error: "Aadhar number already exists for another worker.",
        };
      }

      // Parse optional latitude/longitude from the form (strings -> numbers)
      const latRaw = formData.get("latitude")?.toString();
      const lngRaw = formData.get("longitude")?.toString();
      const latitude = latRaw ? parseFloat(latRaw) : undefined;
      const longitude = lngRaw ? parseFloat(lngRaw) : undefined;

      // Build profile payload and include lat/lng when present
      const profileData: Partial<WorkerProfile> = {
        userId,
        skilledIn,
        qualification: qualification || null,
        certificates,
        aadharNumber,
        yearsExperience: yearsExperience || null,
        hourlyRate,
        minimumFee,
        profilePic: profilePic || null,
        bio: bio || null,
        address,
        city,
        state,
        country,
        postalCode,
        availableAreas,
        ...(typeof latitude === "number" && !Number.isNaN(latitude)
          ? { latitude }
          : {}),
        ...(typeof longitude === "number" && !Number.isNaN(longitude)
          ? { longitude }
          : {}),
        updatedAt: FieldValue.serverTimestamp() as any,
      };

      // Update user role and phone
      await userDoc.ref.update({ 
        role: "WORKER",
        phone: phone,
      });
      console.log('✅ Updated user role to WORKER with phone:', phone);

      // Create or update worker profile
      const existingWorkerQuery = await workerProfilesRef.where('userId', '==', userId).limit(1).get();
      
      let workerProfileId: string;
      if (existingWorkerQuery.empty) {
        // Create new profile
        const newProfileRef = await workerProfilesRef.add({
          ...profileData,
          createdAt: FieldValue.serverTimestamp(),
        });
        workerProfileId = newProfileRef.id;
        console.log('✅ Created worker profile:', workerProfileId);
      } else {
        // Update existing profile
        workerProfileId = existingWorkerQuery.docs[0].id;
        await existingWorkerQuery.docs[0].ref.update(profileData);
        console.log('✅ Updated existing worker profile:', workerProfileId);
      }

      // Handle previous works if any
      if (previousWorks.length > 0) {
        console.log(`📝 Processing ${previousWorks.length} previous works`);
        const previousWorksRef = adminDb.collection(COLLECTIONS.PREVIOUS_WORKS);
        
        // Delete existing previous works for this worker
        const existingWorksQuery = await previousWorksRef.where('workerId', '==', workerProfileId).get();
        if (!existingWorksQuery.empty) {
          const batch = adminDb.batch();
          existingWorksQuery.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log(`🗑️ Deleted ${existingWorksQuery.size} existing previous works`);
        }

        // Create new previous works
        const worksBatch = adminDb.batch();
        previousWorks.forEach((work: {
          id: string;
          title: string;
          description: string;
          imageUrl: string;
        }) => {
          const workRef = previousWorksRef.doc();
          worksBatch.set(workRef, {
            workerId: workerProfileId,
            title: work.title,
            description: work.description || null,
            images: [work.imageUrl].filter(Boolean),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        });
        await worksBatch.commit();
        console.log(`✅ Created ${previousWorks.length} previous works`);
      }

      revalidatePath("/");
      return { success: true, redirect: "/onboarding/finish" };
    }

    return { success: false, error: "Unhandled role" };
  } catch (error: unknown) {
    console.error("Failed to set user role:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update user profile";
    return { success: false, error: message };
  }
}

/**
 * Get current user + profile info
 */
export async function getCurrentUser() {
  // Get session cookie
  const sessionCookie = (await cookies()).get("__session")?.value;
  if (!sessionCookie) return null;

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const firebaseUid = decodedToken.uid;

    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const userQuery = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
    
    if (userQuery.empty) return null;

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Fetch worker profile if exists
    let workerProfile = null;
    let previousWorks = null;
    if (userData.role === 'WORKER') {
      const workerProfilesRef = adminDb.collection(COLLECTIONS.WORKER_PROFILES);
      const workerQuery = await workerProfilesRef.where('userId', '==', userId).limit(1).get();
      
      if (!workerQuery.empty) {
        const workerDoc = workerQuery.docs[0];
        workerProfile = { id: workerDoc.id, ...workerDoc.data() };
        
        // Fetch previous works
        const previousWorksRef = adminDb.collection(COLLECTIONS.PREVIOUS_WORKS);
        const worksQuery = await previousWorksRef.where('workerId', '==', workerDoc.id).get();
        previousWorks = worksQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    }

    // Fetch customer profile if exists
    let customerProfile = null;
    if (userData.role === 'CUSTOMER') {
      const customerProfilesRef = adminDb.collection(COLLECTIONS.CUSTOMER_PROFILES);
      const customerQuery = await customerProfilesRef.where('userId', '==', userId).limit(1).get();
      
      if (!customerQuery.empty) {
        const customerDoc = customerQuery.docs[0];
        customerProfile = { id: customerDoc.id, ...customerDoc.data() };
      }
    }

    // Serialize all Firestore Timestamps before returning
    return serializeFirestoreData({
      id: userId,
      ...userData,
      workerProfile: workerProfile ? {
        ...workerProfile,
        previousWorks: previousWorks || []
      } : null,
      customerProfile,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}
