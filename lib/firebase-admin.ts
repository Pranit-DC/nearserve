// Firebase Admin SDK Configuration
// This is used on the server-side (API routes, server components)

import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin (singleton pattern)
const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Option 1: Use service account JSON (recommended for production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT
      ) as ServiceAccount;

      return initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (error) {
      console.error('Error parsing service account JSON:', error);
      throw new Error('Invalid Firebase service account configuration');
    }
  }

  // Option 2: Use individual credentials (simpler for development)
  if (
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ) {
    return initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  throw new Error(
    'Firebase Admin credentials not configured. Please set FIREBASE_SERVICE_ACCOUNT or (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY) in your environment variables.'
  );
};

// Initialize app
const adminApp = initializeFirebaseAdmin();

// Export Firebase Admin services
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);

// Collection names - centralized for consistency
export const COLLECTIONS = {
  USERS: 'users',
  WORKER_PROFILES: 'worker_profiles',
  CUSTOMER_PROFILES: 'customer_profiles',
  PREVIOUS_WORKS: 'previous_works',
  JOBS: 'jobs',
  JOB_APPLICATIONS: 'job_applications',
  JOB_POSTINGS: 'job_postings',
  JOB_LOGS: 'job_logs',
  REVIEWS: 'reviews',
  TRANSACTIONS: 'transactions',
  TRANSLATION_CACHE: 'translation_cache',
} as const;

export default adminApp;
