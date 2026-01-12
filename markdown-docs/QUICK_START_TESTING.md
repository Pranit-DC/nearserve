# 🚀 Quick Start - Testing Firebase Data Storage

## The Problem
Data wasn't being stored in Firestore properly.

## The Fix
Added missing `COLLECTIONS` export to `lib/firebase-admin.ts` + enhanced logging.

---

## 🎯 Quick Test (5 minutes)

### 1. Run Diagnostics
```bash
# In browser, visit:
http://localhost:3000/api/firebase-diagnostics

# Expected: All 6 tests PASS ✅
```

### 2. Test Signup
```bash
1. Go to http://localhost:3000/sign-up
2. Sign up with test@example.com
3. Check terminal - should see: "✅ User created successfully in Firestore"
4. Check Firebase Console → Firestore → users collection
5. Should see new user document
```

### 3. Test Onboarding
```bash
1. Select "I am a Worker" or "I am a Customer"
2. Fill form and submit
3. Check terminal for success logs
4. Check Firestore for worker_profiles or customer_profiles
```

---

## 🔍 Where to Look

### Terminal Output
Should see these logs when data is stored:
- `✅ User created successfully in Firestore`
- `✅ Updated user role to WORKER/CUSTOMER`
- `✅ Created worker/customer profile: <id>`

### Firebase Console
Check these collections have data:
- `users` - All users
- `worker_profiles` - Worker details
- `customer_profiles` - Customer details
- `jobs` - Job requests
- `reviews` - Reviews

### Browser Console
- Open DevTools (F12)
- Check for any red errors
- Check Network tab for failed requests

---

## ❌ If Still Not Working

### Check Security Rules
```javascript
// Use OPEN rules for testing (Firebase Console → Firestore → Rules)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Check Environment Variables
```bash
# .env.local should have:
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
```

### Restart Server
```bash
# Stop current dev server (Ctrl+C)
npm run dev
```

---

## 📚 Full Documentation

- **[FIREBASE_FIXES_SUMMARY.md](FIREBASE_FIXES_SUMMARY.md)** - What was fixed
- **[FIREBASE_TROUBLESHOOTING.md](FIREBASE_TROUBLESHOOTING.md)** - Complete guide
- **[FIREBASE_MIGRATION_SUCCESS.md](FIREBASE_MIGRATION_SUCCESS.md)** - Migration details

---

## 🆘 Still Having Issues?

1. Run diagnostics: `/api/firebase-diagnostics`
2. Check which test failed
3. Read the error message
4. Check troubleshooting guide for that specific error

---

**Quick Summary:**
- ✅ Added COLLECTIONS export
- ✅ Added comprehensive logging  
- ✅ Created diagnostic tools
- ✅ Zero compilation errors

**Next:** Test signup and onboarding flows!
