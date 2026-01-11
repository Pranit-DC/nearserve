# 🎯 Firebase Migration - Next Steps

## ✅ What's Completed

### Core Infrastructure (100%)
- ✅ Firebase Client & Admin SDK configured
- ✅ Firestore schema documented
- ✅ Authentication system with Email/Password & Google OAuth
- ✅ User profile hooks updated
- ✅ Sign-in and Sign-up pages created
- ✅ Header and layout components updated
- ✅ Middleware for session protection
- ✅ Environment variables configured
- ✅ Dependencies installed

---

## 🔥 Firebase Console Setup (REQUIRED)

Before running the app, complete these steps in Firebase Console:

### 1. Enable Authentication Methods
Go to: **Firebase Console → Authentication → Sign-in method**

Enable:
- ✅ **Email/Password** authentication
- ✅ **Google** authentication
  - Add authorized domain: `localhost`
  - For production, add your domain

### 2. Create Firestore Database
Go to: **Firebase Console → Firestore Database**

1. Click **"Create database"**
2. Choose **"Production mode"** (we'll add security rules later)
3. Select a location closest to your users
4. Click **"Enable"**

### 3. Set up Firestore Security Rules
Go to: **Firestore Database → Rules**

Paste this and **Publish**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && 
        (isOwner(resource.data.firebaseUid) || request.auth.uid == resource.data.firebaseUid);
    }
    
    // Worker profiles
    match /worker_profiles/{profileId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
    
    // Customer profiles  
    match /customer_profiles/{profileId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
    
    // Jobs
    match /jobs/{jobId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && 
        (request.auth.uid == resource.data.customerId || 
         request.auth.uid == resource.data.workerId);
    }
    
    // Previous works (portfolio)
    match /previous_works/{workId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn();
    }
    
    // Reviews
    match /reviews/{reviewId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.auth.uid == request.resource.data.customerId;
      allow update, delete: if false; // Reviews are immutable
    }
    
    // Transactions
    match /transactions/{transactionId} {
      allow read: if isSignedIn() && request.auth.uid == resource.data.userId;
      allow create: if isSignedIn();
      allow update, delete: if false; // Transactions are immutable
    }
    
    // Job postings
    match /job_postings/{postingId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && request.auth.uid == resource.data.employerId;
    }
    
    // Job applications
    match /job_applications/{applicationId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && 
        (request.auth.uid == resource.data.workerId || 
         request.auth.uid == get(/databases/$(database)/documents/job_postings/$(resource.data.jobPostingId)).data.employerId);
    }
    
    // Job logs (audit trail)
    match /job_logs/{logId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if false; // Logs are immutable
    }
    
    // Default deny all
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Create Firestore Indexes (Important!)
Go to: **Firestore Database → Indexes → Composite tab**

Create these indexes:

1. **jobs** collection:
   - `customerId` (Ascending) + `status` (Ascending)
   - `workerId` (Ascending) + `status` (Ascending)

2. **job_postings** collection:
   - `employerId` (Ascending) + `status` (Ascending)
   - `status` (Ascending) + `createdAt` (Descending)

3. **job_applications** collection:
   - `jobPostingId` (Ascending) + `workerId` (Ascending)
   - `jobPostingId` (Ascending) + `status` (Ascending)
   - `workerId` (Ascending) + `status` (Ascending)

4. **job_logs** collection:
   - `jobId` (Ascending) + `createdAt` (Descending)

> **Note**: Firestore will auto-create some indexes when you run queries. You can create them on-demand when errors appear in console.

---

## 🚀 Running the Application

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Authentication
1. Visit: http://localhost:3000
2. Click "Sign Up"
3. Create a test account with:
   - Email: test@example.com
   - Password: test123
   - Name: Test User

4. Check Firebase Console:
   - **Authentication** → Should see new user
   - **Firestore** → `users` collection → Should see user document

### 3. Complete Onboarding
After signing up, you'll be redirected to `/onboarding`:
- Choose CUSTOMER or WORKER role
- Complete the profile setup
- Data will be saved to Firestore

---

## ⚠️ Important Remaining Work

### API Routes Migration (Priority: HIGH)
All API routes still use Prisma and need to be converted to Firestore:

**Status**: NOT STARTED

Files to migrate:
```
app/api/
├── actions/
│   ├── onboarding.ts          ❌ Needs migration
├── auth/
│   └── [...nextauth]/         ❌ May need removal
├── customer/
│   └── [...]                  ❌ Needs migration
├── jobs/
│   ├── route.ts               ❌ Needs migration
│   └── [id]/route.ts          ❌ Needs migration
├── reviews/
│   └── route.ts               ❌ Needs migration
├── user/
│   ├── profile/route.ts       ❌ Needs migration
│   └── role/route.ts          ❌ Needs migration
├── worker/
│   └── [...]                  ❌ Needs migration
└── workers/
    └── route.ts               ❌ Needs migration
```

### Example Migration Pattern:

**Before (Prisma):**
```typescript
import prisma from "@/lib/prisma";

const user = await prisma.user.findUnique({
  where: { clerkUserId: userId },
});
```

**After (Firestore):**
```typescript
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";

const usersRef = adminDb.collection(COLLECTIONS.USERS);
const userQuery = await usersRef.where('firebaseUid', '==', userId).limit(1).get();
const user = userQuery.empty ? null : { id: userQuery.docs[0].id, ...userQuery.docs[0].data() };
```

---

## 📋 Testing Checklist

Once API routes are migrated, test these workflows:

### Authentication
- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Sign in with Google
- [ ] Sign out
- [ ] Session persistence (refresh page)

### Onboarding
- [ ] Choose CUSTOMER role
- [ ] Complete customer profile
- [ ] Choose WORKER role
- [ ] Complete worker profile

### Customer Features
- [ ] Search for workers
- [ ] View worker profiles
- [ ] Create a job booking
- [ ] View job dashboard
- [ ] Complete payment
- [ ] Leave a review

### Worker Features
- [ ] View job requests
- [ ] Accept a job
- [ ] Start work (proof submission)
- [ ] Complete job
- [ ] View earnings

---

## 🔧 Troubleshooting

### Error: "Firebase Admin not configured"
- Check `.env.local` has all Firebase Admin variables
- Restart dev server after adding env variables

### Error: "Missing or insufficient permissions"
- Update Firestore security rules (see step 3 above)
- Make sure you're signed in

### Error: "Index not found"
- Go to Firestore Console → Indexes
- Click the link in the error message to auto-create the index

### Authentication not working
- Check Firebase Console → Authentication is enabled
- Verify authorized domains include `localhost`

---

## 📚 Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Firestore Queries**: https://firebase.google.com/docs/firestore/query-data/queries
- **Security Rules**: https://firebase.google.com/docs/firestore/security/get-started
- **Migration Schema**: See `FIRESTORE_SCHEMA.md`

---

## 🎉 What to Expect

After completing Firebase Console setup:
1. ✅ Authentication works (sign-up, sign-in, Google OAuth)
2. ✅ User profiles are created in Firestore
3. ✅ Session management works
4. ⏳ API routes need migration for full functionality
5. ⏳ Customer/Worker dashboards need API updates

**Current Status**: ~70% Complete
**Remaining Work**: API routes migration (~4-6 hours)
