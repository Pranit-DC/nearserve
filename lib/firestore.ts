// Firestore Database Collections and Schema
// This file maps the Prisma schema to Firestore collections

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type WhereFilterOp,
  type DocumentData,
  type QueryConstraint,
  Timestamp,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase-client';
import { adminDb } from './firebase-admin';

// Collection names (mapped from Prisma schema)
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
  NOTIFICATIONS: 'notifications',
} as const;

// Enums (from Prisma schema)
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  WORKER = 'WORKER',
  UNASSIGNED = 'UNASSIGNED',
}

export enum JobStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  PAYOUT = 'PAYOUT',
  REFUND = 'REFUND',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  TEMPORARY = 'TEMPORARY',
}

export enum JobApplicationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum JobPostingStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  FILLED = 'FILLED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// Type definitions (mapped from Prisma models)
export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  firebaseUid: string; // Replaces clerkUserId
}

export interface WorkerProfile {
  id: string;
  userId: string;
  skilledIn: string[];
  qualification: string | null;
  certificates: string[];
  aadharNumber: string;
  yearsExperience: number | null;
  profilePic: string | null;
  bio: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  availableAreas: string[];
  latitude: number | null;
  longitude: number | null;
  hourlyRate: number | null;
  minimumFee: number | null;
  fcmToken: string | null; // Firebase Cloud Messaging token for push notifications
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  fcmToken: string | null; // Firebase Cloud Messaging token for push notifications
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PreviousWork {
  id: string;
  workerId: string;
  title: string | null;
  description: string | null;
  images: string[];
  location: string | null;
  createdAt: Timestamp;
}

export interface Job {
  id: string;
  description: string;
  details: string | null;
  date: Timestamp;
  time: Timestamp;
  location: string;
  charge: number;
  status: JobStatus;
  customerId: string;
  workerId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  platformFee: number | null;
  workerEarnings: number | null;
  paymentStatus: PaymentStatus;
  paymentReferenceId: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  startProofPhoto: string | null;
  startProofGpsLat: number | null;
  startProofGpsLng: number | null;
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
}

export interface JobApplication {
  id: string;
  jobPostingId: string;
  workerId: string;
  coverLetter: string | null;
  status: JobApplicationStatus;
  appliedAt: Timestamp;
  updatedAt: Timestamp;
  reviewedAt: Timestamp | null;
}

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  employmentType: EmploymentType;
  requiredSkills: string[];
  location: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  experienceRequired: number | null;
  status: JobPostingStatus;
  employerId: string;
  selectedWorkerId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp | null;
}

export interface Review {
  id: string;
  jobId: string;
  customerId: string;
  workerId: string;
  rating: number;
  comment: string | null;
  createdAt: Timestamp;
}

export interface Transaction {
  id: string;
  userId: string;
  jobId: string | null;
  amount: number;
  type: TransactionType;
  createdAt: Timestamp;
}

export interface JobLog {
  id: string;
  jobId: string;
  fromStatus: JobStatus | null;
  toStatus: JobStatus;
  action: string;
  performedBy: string;
  metadata: any;
  createdAt: Timestamp;
}

export interface TranslationCache {
  id: string;
  hashKey: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  context: string | null;
  createdAt: Timestamp;
  lastAccessedAt: Timestamp;
}

// Helper function to generate unique IDs
export const generateId = () => {
  return doc(collection(db, 'temp')).id;
};

// Helper to convert Firestore Timestamp to Date
export const timestampToDate = (timestamp: Timestamp | null | undefined): Date | null => {
  return timestamp ? timestamp.toDate() : null;
};

// Helper to convert Date to Firestore Timestamp
export const dateToTimestamp = (date: Date | string | null | undefined): Timestamp | null => {
  if (!date) return null;
  if (date instanceof Date) return Timestamp.fromDate(date);
  return Timestamp.fromDate(new Date(date));
};

// Export Firestore utilities
export { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove,
};

// Export admin db for server-side operations
export { adminDb };
