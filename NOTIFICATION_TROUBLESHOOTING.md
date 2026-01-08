# 🔍 Push Notifications Troubleshooting Guide

## ⚠️ You didn't receive notifications? Follow these steps:

---

## Step 1: Get the Correct VAPID Key

### 🔑 From Firebase Console:

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Select: `nearserve-pho`

2. **Navigate to Settings**
   - Click ⚙️ (gear icon) next to "Project Overview"
   - Click "Project settings"

3. **Cloud Messaging Tab**
   - Click "Cloud Messaging" tab

4. **Web Push Certificates**
   - Scroll to "Web Push certificates" section
   - If you see a key → Copy it
   - If NO key → Click "Generate key pair"
   - The key is ~88 characters long

5. **Update Your Code**
   - Open: `lib/fcm.ts`
   - Line 6: Replace `VAPID_KEY` with your copied key
   - Save and restart server

---

## Step 2: Enable Firebase APIs

### 📡 Enable Cloud Messaging API:

1. In Firebase Console → Cloud Messaging tab
2. Look for "Cloud Messaging API" status
3. If disabled:
   - Click "Manage API in Google Cloud Console"
   - Search for "Firebase Cloud Messaging API"
   - Click **ENABLE**

### 📡 Enable FCM Registration API:

1. Go to: https://console.cloud.google.com/
2. Select project: `nearserve-pho`
3. Search: "FCM Registration API"
4. Click **ENABLE**

---

## Step 3: Use Debug Panel

### 🔧 I've added a Debug Panel to your worker dashboard:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Login as a worker**
   - Go to: http://localhost:3000/sign-in
   - Login with worker account

3. **Find Debug Panel**
   - Look at bottom-right corner
   - You'll see "🔧 Notification Debug Panel"

4. **Run Tests in Order:**
   - Click "1. Check Permission" → See if browser supports notifications
   - Click "2. Check Service Worker" → Verify service worker
   - Click "3. Check Firebase Config" → Verify environment variables
   - Click "4. Request Permission & Get Token" → Get FCM token
   - Click "5. Send Test Notification" → Send yourself a test

5. **Read the Logs**
   - Green ✅ = Success
   - Red ❌ = Error
   - Copy error messages if you see any

---

## Step 4: Common Issues & Fixes

### ❌ "Permission denied"
**Fix:** Clear browser site settings
```
Chrome: Settings → Privacy → Site Settings → Notifications → Remove localhost
```

### ❌ "Service worker registration failed"
**Fix:** Must be on HTTPS or localhost
```
Check: window.location.protocol should be "http:" (for localhost) or "https:"
```

### ❌ "FCM token not generated"
**Possible causes:**
1. Wrong VAPID key → Get correct key from Firebase Console
2. FCM API not enabled → Enable in Google Cloud Console
3. Browser doesn't support → Try Chrome/Edge

### ❌ "Notification not sent"
**Check:**
1. Is FCM token saved in Firestore?
   - Go to Firestore → `worker_profiles` → check `fcmToken` field
2. Are Firebase Admin credentials correct in `.env.local`?
3. Check server logs for errors

---

## Step 5: Verify Setup

### ✅ Checklist:

- [ ] VAPID key copied from Firebase Console
- [ ] VAPID key updated in `lib/fcm.ts` line 6
- [ ] Cloud Messaging API enabled in Google Cloud Console
- [ ] Server restarted after changes
- [ ] Logged in as worker
- [ ] Notification permission granted
- [ ] FCM token appears in debug panel
- [ ] FCM token saved in Firestore
- [ ] Firebase Admin credentials in `.env.local`

---

## Step 6: Manual Test

### 📤 Test via API:

```bash
# Get your worker user ID from debug panel

# Test 1: Check if notifications enabled
curl "http://localhost:3000/api/test-notification?workerId=YOUR_WORKER_USER_ID"

# Test 2: Send notification
curl -X POST http://localhost:3000/api/test-notification \
  -H "Content-Type: application/json" \
  -d '{"workerId":"YOUR_WORKER_USER_ID","title":"Test","body":"Hello!"}'
```

---

## Step 7: Check Browser Console

### 🔍 Open Developer Tools:
- Press `F12` or `Ctrl+Shift+I`
- Go to "Console" tab
- Look for errors (red text)
- Common errors to look for:
  - "Messaging: We are unable to register the default service worker"
  - "FirebaseError: Installations: API key is invalid"
  - "Messaging: A problem occurred while subscribing the user to FCM"

---

## Step 8: Verify Firebase Admin SDK

### Check `.env.local`:

```env
# These must be set correctly:
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@nearserve-pho.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Important:** 
- Private key must have `\n` for line breaks
- Must be wrapped in quotes
- Must start with `-----BEGIN PRIVATE KEY-----`

---

## Step 9: Test Booking Flow

### 🎯 End-to-End Test:

1. **Open two browsers:**
   - Browser 1: Login as worker (enable notifications)
   - Browser 2: Login as customer

2. **From Browser 2 (customer):**
   - Find the worker from Browser 1
   - Book that worker
   - Submit booking

3. **Check Browser 1 (worker):**
   - Should receive notification immediately
   - Check notification center if app is in background

---

## 📊 What Should Happen

### Successful Flow:
```
1. Worker enables notifications
   ↓
2. Browser shows "Allow notifications?" → Click Allow
   ↓
3. FCM token generated (88+ characters)
   ↓
4. Token saved to Firestore (worker_profiles.fcmToken)
   ↓
5. Debug panel shows: ✅ Token saved to database
   ↓
6. Customer books worker
   ↓
7. Server fetches FCM token from Firestore
   ↓
8. Server sends notification via Firebase Admin
   ↓
9. Firebase delivers to worker's browser
   ↓
10. Worker sees notification!
```

---

## 🆘 Still Not Working?

### Share This Info:

1. **From Debug Panel:**
   - Copy all logs
   - Note any ❌ errors

2. **From Browser Console (F12):**
   - Copy any error messages (red text)

3. **From Firebase Console:**
   - Screenshot of Cloud Messaging tab
   - Verify VAPID key is shown

4. **From `.env.local`:**
   - Confirm all Firebase variables are set (don't share the actual values)

5. **From Server Logs:**
   - Check terminal for errors when booking

---

## 🎯 Quick Debug Commands

### In Browser Console:

```javascript
// Check notification support
console.log('Notification' in window);

// Check permission
console.log(Notification.permission);

// Check service worker
navigator.serviceWorker.getRegistrations().then(console.log);

// Check Firebase config
console.log({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});
```

---

## 📞 Next Steps

1. **Use the Debug Panel** - It will tell you exactly what's wrong
2. **Get the correct VAPID key** - Most common issue
3. **Enable FCM API** - Second most common issue
4. **Check browser console** - Look for error messages

**The debug panel will guide you through everything! 🚀**
