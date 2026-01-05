# 🔍 Firebase Data Storage Troubleshooting Guide

## Issue Identified

The Firebase setup had a **critical missing export** that was just fixed:

### ✅ Fixed: Missing COLLECTIONS Export

**Problem:** The `COLLECTIONS` constant was only exported from `lib/firestore.ts` but many server-side files were importing it from `lib/firebase-admin.ts`

**Solution:** Added `COLLECTIONS` export to [lib/firebase-admin.ts](lib/firebase-admin.ts)

---

## 🧪 How to Test Data Storage

### 1. Test User Creation (Sign Up)

**Expected Flow:**
1. User signs up via `/sign-up` page
2. Firebase Auth creates user account
3. `checkUser()` function creates user document in Firestore `users` collection
4. User redirected to onboarding

**Test:**
```bash
1. Go to http://localhost:3000/sign-up
2. Sign up with email/password or Google
3. Check Firebase Console → Firestore → users collection
4. Should see new document with:
   - email
   - firebaseUid
   - name
   - role: "UNASSIGNED"
   - createdAt, updatedAt
```

### 2. Test Worker Onboarding

**Expected Flow:**
1. After signup, user goes to `/onboarding`
2. User selects "I am a Worker"
3. Fills worker form (skills, aadhar, rates, address)
4. Submits form → calls `setUserRole()` server action
5. Updates user role to "WORKER" in `users` collection
6. Creates document in `worker_profiles` collection
7. Creates documents in `previous_works` collection (if any)

**Test:**
```bash
1. Complete onboarding as worker
2. Check Firestore Console:
   - users/{userId} → role should be "WORKER"
   - worker_profiles → should have 1 document with:
     * userId (matches user document ID)
     * skilledIn (array of skills)
     * aadharNumber
     * hourlyRate, minimumFee
     * address, city, state, country, postalCode
     * availableAreas
   - previous_works → should have documents for each previous work
```

### 3. Test Customer Onboarding

**Expected Flow:**
1. User selects "I am a Customer"
2. Fills address form
3. Updates role to "CUSTOMER"
4. Creates document in `customer_profiles` collection

**Test:**
```bash
1. Complete onboarding as customer
2. Check Firestore Console:
   - users/{userId} → role should be "CUSTOMER"
   - customer_profiles → should have 1 document with:
     * userId
     * address, city, state, country, postalCode
```

### 4. Test Job Creation

**Expected Flow:**
1. Customer books a worker
2. Creates document in `jobs` collection
3. Creates log entry in `job_logs` collection

**Test:**
```bash
1. As customer, go to worker profile
2. Click "Book Worker"
3. Fill job details and submit
4. Check Firestore Console:
   - jobs → new document with:
     * customerId
     * workerId
     * description, location
     * status: "PENDING"
     * charge
   - job_logs → log entry for job creation
```

### 5. Test Review Creation

**Expected Flow:**
1. Customer leaves review after job completion
2. Creates document in `reviews` collection

**Test:**
```bash
1. Complete a job
2. Leave a review
3. Check reviews collection in Firestore
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Permission Denied" Error

**Symptoms:**
- Error: "Missing or insufficient permissions"
- Data not appearing in Firestore

**Cause:** Firestore Security Rules blocking writes

**Solution:**
```javascript
// Go to Firebase Console → Firestore → Rules
// Use these temporary OPEN rules for testing:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **WARNING:** These rules allow any authenticated user to read/write anything. Use for testing only!

**Production Rules** (use after testing):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.firebaseUid;
    }
    
    // Worker profiles
    match /worker_profiles/{profileId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(resource.data.userId)).data.firebaseUid == request.auth.uid;
    }
    
    // Customer profiles
    match /customer_profiles/{profileId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(resource.data.userId)).data.firebaseUid == request.auth.uid;
    }
    
    // Jobs
    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.customerId == request.auth.uid || 
         resource.data.workerId == request.auth.uid);
    }
    
    // Job logs
    match /job_logs/{logId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Reviews
    match /reviews/{reviewId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        resource.data.customerId == request.auth.uid;
    }
    
    // Previous works
    match /previous_works/{workId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Issue 2: Data Not Showing in UI

**Symptoms:**
- Data saved in Firestore but not displaying
- Dashboard shows empty or "no data"

**Possible Causes:**
1. Frontend fetching from wrong collection
2. Query filters not matching
3. User ID mismatch

**Solution:**
```bash
# Check browser console for errors
1. Open DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
```

**Common fixes:**
- Verify query uses correct collection name
- Check userId matches between collections
- Verify timestamp fields are properly converted

### Issue 3: Session Cookie Issues

**Symptoms:**
- User signed in but redirected to login
- "Unauthorized" errors
- Session not persisting

**Solution:**
```bash
# 1. Clear cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

# 2. Sign out and sign in again
# 3. Check session cookie is created:
console.log(document.cookie);
# Should see: __session=<long-token>
```

### Issue 4: Environment Variables Missing

**Symptoms:**
- "Firebase Admin credentials not configured" error
- App crashes on server-side operations

**Solution:**
Check `.env.local` file has all required variables:
```env
# Firebase Admin (Server)
FIREBASE_CLIENT_EMAIL=your-client-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# Firebase Client (Browser)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Issue 5: Firestore Indexes Missing

**Symptoms:**
- "The query requires an index" error
- Complex queries failing

**Solution:**
Click the link in the error message to auto-create the index, or manually create:

**Required Indexes:**
1. Collection: `users`
   - Fields: `role` (ASC), `createdAt` (DESC)

2. Collection: `jobs`
   - Fields: `workerId` (ASC), `status` (ASC), `createdAt` (DESC)
   - Fields: `customerId` (ASC), `status` (ASC), `createdAt` (DESC)

3. Collection: `worker_profiles`
   - Fields: `aadharNumber` (ASC), `userId` (ASC)

---

## 🔎 Debugging Checklist

When data isn't storing properly, check these in order:

### 1. ✅ Firebase Console Access
- [ ] Can you access Firebase Console?
- [ ] Is the correct project selected?
- [ ] Do you have owner/editor permissions?

### 2. ✅ Authentication Working
- [ ] Can you sign up?
- [ ] Can you sign in?
- [ ] Is user visible in Firebase Auth console?
- [ ] Does session cookie exist? (check browser DevTools → Application → Cookies)

### 3. ✅ Firestore Database Enabled
- [ ] Is Firestore created in Firebase Console?
- [ ] Is it in production mode or test mode?
- [ ] Are security rules published?

### 4. ✅ Environment Variables
- [ ] All FIREBASE_* variables set in `.env.local`?
- [ ] Private key properly formatted with `\n` preserved?
- [ ] Server restarted after changing env vars?

### 5. ✅ Security Rules
- [ ] Are rules too restrictive?
- [ ] Try open rules for testing (shown above)
- [ ] Check rules match your auth structure

### 6. ✅ Code Verification
- [ ] No TypeScript errors? (`npm run build`)
- [ ] COLLECTIONS constant properly imported?
- [ ] Server actions using `adminDb` correctly?
- [ ] Timestamp fields using `FieldValue.serverTimestamp()`?

### 7. ✅ Network & Errors
- [ ] Check browser console for errors
- [ ] Check server terminal for errors
- [ ] Check Network tab for failed API calls
- [ ] Check Firestore Console → Usage for activity

---

## 🛠️ Manual Test Script

Run this in browser console to test Firestore write directly:

```javascript
// Test Firestore write (run in browser console)
async function testFirestoreWrite() {
  try {
    const { db } = await import('/lib/firebase-client.ts');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    
    const testDoc = await addDoc(collection(db, 'test_collection'), {
      message: 'Test write from browser',
      timestamp: serverTimestamp(),
    });
    
    console.log('✅ Write successful! Document ID:', testDoc.id);
    return testDoc.id;
  } catch (error) {
    console.error('❌ Write failed:', error);
    return null;
  }
}

testFirestoreWrite();
```

If this fails, check:
1. Firestore security rules
2. Browser network tab for 403 errors
3. Firebase project configuration

---

## 📊 Expected Firestore Structure

After successful data storage, your Firestore should look like:

```
firestore/
├── users/
│   └── {userId}/
│       ├── email: string
│       ├── firebaseUid: string
│       ├── name: string
│       ├── phone: string
│       ├── role: "WORKER" | "CUSTOMER" | "UNASSIGNED"
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── worker_profiles/
│   └── {profileId}/
│       ├── userId: string (ref to users)
│       ├── skilledIn: array<string>
│       ├── aadharNumber: string
│       ├── hourlyRate: number
│       ├── minimumFee: number
│       ├── address: string
│       ├── city: string
│       ├── state: string
│       ├── latitude: number (optional)
│       ├── longitude: number (optional)
│       └── ...
│
├── customer_profiles/
│   └── {profileId}/
│       ├── userId: string (ref to users)
│       ├── address: string
│       ├── city: string
│       └── ...
│
├── jobs/
│   └── {jobId}/
│       ├── customerId: string
│       ├── workerId: string
│       ├── description: string
│       ├── status: "PENDING" | "ACCEPTED" | "COMPLETED" | ...
│       ├── charge: number
│       └── ...
│
├── job_logs/
│   └── {logId}/
│       ├── jobId: string
│       ├── action: string
│       ├── performedBy: string
│       └── ...
│
├── reviews/
│   └── {reviewId}/
│       ├── jobId: string
│       ├── customerId: string
│       ├── workerId: string
│       ├── rating: number
│       └── ...
│
└── previous_works/
    └── {workId}/
        ├── workerId: string (ref to worker_profiles)
        ├── title: string
        ├── description: string
        └── images: array<string>
```

---

## 🆘 Still Having Issues?

### Step 1: Enable Debug Logging

Add this to [lib/firebase-admin.ts](lib/firebase-admin.ts):
```typescript
// After adminDb initialization
adminDb.settings({
  ignoreUndefinedProperties: true,
});

// Enable logging
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Firebase Admin initialized');
  console.log('📊 Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}
```

### Step 2: Test Each Operation Individually

1. **Test sign up** - does user appear in Firebase Auth?
2. **Test checkUser** - does user document get created?
3. **Test onboarding** - do profile documents get created?
4. **Test job creation** - do job documents get created?

### Step 3: Check Specific Errors

Look for these error patterns:

**"PERMISSION_DENIED"**
→ Fix Firestore security rules (use open rules for testing)

**"INVALID_ARGUMENT"**
→ Check data types match Firestore schema

**"NOT_FOUND"**
→ Collection or document doesn't exist

**"UNAUTHENTICATED"**
→ Session cookie not set or expired

---

## 📝 Next Steps After Fix

1. ✅ **Test all user flows** - Sign up, onboarding, dashboard
2. ✅ **Check Firestore Console** - Verify data is appearing
3. ✅ **Update security rules** - Switch from open to production rules
4. ✅ **Create indexes** - For complex queries
5. ✅ **Monitor errors** - Check Firebase Console → Firestore → Errors

---

**Fixed:** Added COLLECTIONS export to firebase-admin.ts  
**Status:** Ready for testing  
**Action Required:** Test user signup and onboarding flows
