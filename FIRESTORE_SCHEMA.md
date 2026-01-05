# Firestore Collections Schema

This document describes the Firestore collections structure, mapped from the original Prisma PostgreSQL schema.

## Collections Overview

### 1. **users**
Primary user accounts collection.

```typescript
{
  id: string (document ID)
  email: string (unique)
  phone: string (unique)
  name: string
  role: 'CUSTOMER' | 'WORKER' | 'UNASSIGNED'
  createdAt: Timestamp
  updatedAt: Timestamp
  firebaseUid: string (unique, Firebase Auth UID)
}
```

**Indexes:**
- `firebaseUid` (unique)
- `email` (unique)
- `phone` (unique)

---

### 2. **worker_profiles**
Extended profile information for workers.

```typescript
{
  id: string (document ID)
  userId: string (reference to users)
  skilledIn: string[]
  qualification: string | null
  certificates: string[]
  aadharNumber: string (unique)
  yearsExperience: number | null
  profilePic: string | null
  bio: string | null
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  availableAreas: string[]
  latitude: number | null
  longitude: number | null
  hourlyRate: number | null
  minimumFee: number | null
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Indexes:**
- `userId` (unique)
- `aadharNumber` (unique)
- `city`, `state`
- `latitude`, `longitude` (geohash for location queries)

---

### 3. **customer_profiles**
Extended profile information for customers.

```typescript
{
  id: string (document ID)
  userId: string (reference to users)
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Indexes:**
- `userId` (unique)

---

### 4. **previous_works**
Portfolio/showcase of workers' previous projects.

```typescript
{
  id: string (document ID)
  workerId: string (reference to worker_profiles)
  title: string | null
  description: string | null
  images: string[]
  location: string | null
  createdAt: Timestamp
}
```

**Indexes:**
- `workerId`

---

### 5. **jobs**
Job bookings and requests.

```typescript
{
  id: string (document ID)
  description: string
  details: string | null
  date: Timestamp
  time: Timestamp
  location: string
  charge: number
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  customerId: string (reference to users)
  workerId: string | null (reference to users)
  createdAt: Timestamp
  updatedAt: Timestamp
  
  // Payment fields
  platformFee: number | null
  workerEarnings: number | null
  paymentStatus: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  paymentReferenceId: string | null
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  razorpaySignature: string | null
  
  // Proof of work fields
  startProofPhoto: string | null
  startProofGpsLat: number | null
  startProofGpsLng: number | null
  startedAt: Timestamp | null
  completedAt: Timestamp | null
}
```

**Indexes:**
- `customerId`, `status` (composite)
- `workerId`, `status` (composite)
- `status`
- `createdAt`

---

### 6. **job_postings**
Job postings by employers looking for workers.

```typescript
{
  id: string (document ID)
  title: string
  description: string
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'TEMPORARY'
  requiredSkills: string[]
  location: string
  city: string
  state: string
  latitude: number | null
  longitude: number | null
  salaryMin: number | null
  salaryMax: number | null
  experienceRequired: number | null
  status: 'OPEN' | 'CLOSED' | 'FILLED' | 'EXPIRED'
  employerId: string (reference to users)
  selectedWorkerId: string | null (reference to users)
  createdAt: Timestamp
  updatedAt: Timestamp
  expiresAt: Timestamp | null
}
```

**Indexes:**
- `employerId`, `status` (composite)
- `status`, `createdAt` (composite)
- `latitude`, `longitude`

---

### 7. **job_applications**
Applications from workers to job postings.

```typescript
{
  id: string (document ID)
  jobPostingId: string (reference to job_postings)
  workerId: string (reference to users)
  coverLetter: string | null
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
  appliedAt: Timestamp
  updatedAt: Timestamp
  reviewedAt: Timestamp | null
}
```

**Indexes:**
- `jobPostingId`, `workerId` (composite, unique)
- `jobPostingId`, `status` (composite)
- `workerId`, `status` (composite)

---

### 8. **reviews**
Customer reviews for workers after job completion.

```typescript
{
  id: string (document ID)
  jobId: string (reference to jobs, unique)
  customerId: string (reference to users)
  workerId: string (reference to users)
  rating: number (1-5)
  comment: string | null
  createdAt: Timestamp
}
```

**Indexes:**
- `jobId` (unique)
- `workerId`
- `customerId`

---

### 9. **transactions**
Payment transaction records.

```typescript
{
  id: string (document ID)
  userId: string (reference to users)
  jobId: string | null (reference to jobs)
  amount: number
  type: 'PAYMENT' | 'PAYOUT' | 'REFUND'
  createdAt: Timestamp
}
```

**Indexes:**
- `userId`
- `jobId`
- `createdAt`

---

### 10. **job_logs**
Audit trail for job status changes.

```typescript
{
  id: string (document ID)
  jobId: string (reference to jobs)
  fromStatus: JobStatus | null
  toStatus: JobStatus
  action: string
  performedBy: string (reference to users)
  metadata: any (JSON object)
  createdAt: Timestamp
}
```

**Indexes:**
- `jobId`, `createdAt` (composite)

---

### 11. **translation_cache**
Cache for translated text (if multilingual support is enabled).

```typescript
{
  id: string (document ID)
  hashKey: string (unique)
  originalText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  context: string | null
  createdAt: Timestamp
  lastAccessedAt: Timestamp
}
```

**Indexes:**
- `hashKey` (unique)
- `sourceLanguage`, `targetLanguage` (composite)

---

## Important Notes

1. **Relationships**: Firestore doesn't have foreign keys like SQL. We store document IDs as strings for relationships.

2. **Unique Constraints**: Implement unique constraints using security rules and application logic.

3. **Indexes**: Create composite indexes in Firebase Console for complex queries.

4. **Timestamps**: Use Firebase `Timestamp` type instead of JavaScript `Date` for consistency.

5. **Arrays**: Firestore supports native arrays, perfect for `skilledIn`, `certificates`, etc.

6. **Transactions**: Use Firestore transactions for operations requiring atomicity (e.g., payment processing).

7. **Subcollections**: Can be used for related data, but we're using flat structure for simplicity and query flexibility.

---

## Migration Considerations

- All UUID IDs from PostgreSQL will be migrated as-is
- `clerkUserId` → `firebaseUid`
- Prisma's auto-generated UUIDs → Firestore auto-generated IDs (or custom UUIDs)
- SQL JOINs → Multiple Firestore queries or denormalization
- Complex SQL queries → May need restructuring for Firestore
