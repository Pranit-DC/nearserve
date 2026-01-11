# 🔔 Push Notification Testing Guide

## ✅ FIXED: Direct Function Calls
All push notifications now use **direct server-side function calls** instead of HTTP fetch requests. This ensures reliable delivery.

---

## Testing Checklist

### Prerequisites
1. ✅ Both users have FCM tokens registered
2. ✅ Both users have granted browser notification permission
3. ✅ Service worker is active (`/test-push` to verify)

---

### 1️⃣ Test: Job Creation
**Steps:**
1. Login as **Customer**
2. Book a worker (create new job)
3. Check terminal for: `[Push] 📤 Sending to user [workerId]: 🔔 New Job Available`
4. Check terminal for: `[Push] ✅ Sent successfully!`

**Expected:**
- ✅ Worker gets push notification: "🔔 New Job Available"
- ✅ Worker sees in-app notification in bell icon
- ✅ Terminal shows success message

**If Failed:**
- Check worker has FCM token: Visit `/test-push` as worker
- Check terminal for error messages
- Verify worker granted notification permission

---

### 2️⃣ Test: Job Acceptance
**Steps:**
1. Login as **Worker**
2. Go to dashboard and accept the job
3. Check terminal for: `[Push] 📤 Sending to user [customerId]: ✅ Job Accepted`

**Expected:**
- ✅ Customer gets push notification: "✅ Job Accepted"
- ✅ Customer sees in-app notification
- ✅ Terminal shows success message

**If Failed:**
- Check customer has FCM token
- Check terminal logs for specific error

---

### 3️⃣ Test: Job Start
**Steps:**
1. Login as **Worker**
2. Start the job (upload proof photo)
3. Check terminal for: `[Push] 📤 Sending to user [customerId]: 🚀 Job Started`

**Expected:**
- ✅ Customer gets push notification: "🚀 Job Started"
- ✅ Customer sees in-app notification

---

### 4️⃣ Test: Job Completion
**Steps:**
1. Login as **Worker** 
2. Complete the job
3. Check terminal for: `[Push] 📤 Sending to user [customerId]: ✅ Work Completed`

**Expected:**
- ✅ Customer gets push notification: "✅ Work Completed - Please pay ₹[amount]"
- ✅ Customer sees payment prompt

---

### 5️⃣ Test: Payment
**Steps:**
1. Login as **Customer**
2. Pay for the completed job
3. Check terminal for: `[Push] 📤 Sending to user [workerId]: 💰 Payment Received`

**Expected:**
- ✅ Worker gets push notification: "💰 Payment Received - ₹[earnings]"
- ✅ Worker sees in-app notification

---

### 6️⃣ Test: Review
**Steps:**
1. Login as **Customer**
2. Submit a review for the worker
3. Check terminal for: `[Push] 📤 Sending to user [workerId]: ⭐ New Review`

**Expected:**
- ✅ Worker gets push notification: "⭐ New Review - [rating] stars"
- ✅ Worker sees in-app notification

---

## Common Issues & Solutions

### Issue: "User has no FCM token"
**Terminal Log:** `[Push] ℹ️ User [userId] has no FCM token`

**Solution:**
1. Visit `/test-push` as that user
2. Click "Request Permission" and allow
3. Click "Send FCM Push Notification" to register token
4. Try the workflow again

---

### Issue: "Invalid registration token"
**Terminal Log:** `[Push] ⚠️ Failed: messaging/registration-token-not-registered`

**Solution:**
1. Token expired or browser data cleared
2. Visit `/test-push` as that user
3. Click "Clear Service Workers"
4. Refresh page
5. Request permission again
6. Token will auto-refresh

---

### Issue: No push notification but in-app works
**Terminal Log:** `[Push] ✅ Sent successfully!` but no notification appears

**Solution:**
1. **Windows Settings:**
   - Press `Win + I`
   - System → Notifications
   - Find your browser (Chrome/Opera)
   - Make sure it's **ON**

2. **Focus Assist:**
   - Click notification icon in taskbar
   - Turn **OFF** Focus Assist

3. **Browser Settings:**
   - Chrome: `chrome://settings/content/notifications`
   - Make sure `localhost:3000` is allowed

4. **Tab Focus:**
   - Push notifications work differently when tab is focused
   - Try switching to another tab after sending notification

---

### Issue: Foreground vs Background
**Behavior:**
- **Tab Focused:** Message received by app (shows via `onMessage` listener)
- **Tab Not Focused:** Message received by service worker (shows automatically)

**Solution:**
- Both cases are handled automatically
- Check browser console for "🔔 Foreground message received"
- If you see this log, notification system is working

---

## Verification Commands

### Check FCM Token
```javascript
// In browser console
localStorage.getItem('fcmToken')
```

### Check Service Worker
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registered:', regs.map(r => r.active?.scriptURL))
})
```

### Check Notification Permission
```javascript
// In browser console
console.log('Permission:', Notification.permission)
```

---

## Terminal Logs to Look For

### ✅ Success Pattern:
```
[Push] 📤 Sending to user abc123: 🔔 New Job Available
[Push] ✅ Sent successfully! Message ID: xyz789
```

### ⚠️ No Token Pattern:
```
[Push] ℹ️ User abc123 has no FCM token
```

### ❌ Invalid Token Pattern:
```
[Push] ⚠️ Failed: messaging/registration-token-not-registered
[Push] 🧹 Removing invalid FCM token for user abc123
```

---

## Quick Debug Steps

1. **Verify Environment:**
   - Check `.env.local` has `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
   - Restart dev server after any .env changes

2. **Check Both Users:**
   - Customer needs FCM token
   - Worker needs FCM token
   - Both need notification permission granted

3. **Test Locally First:**
   - Visit `/test-push` as both users
   - Click "Send Local Notification" - should work immediately
   - Click "Send FCM Push Notification" - should work if token exists

4. **Monitor Terminal:**
   - Keep terminal visible during testing
   - Look for `[Push]` prefixed logs
   - Success = `✅`, Warning = `⚠️`, Info = `ℹ️`

---

## Files to Check

- ✅ **lib/push-notification.ts** - Main push function
- ✅ **app/api/jobs/route.ts** - Job creation
- ✅ **app/api/jobs/[id]/route.ts** - Job status updates
- ✅ **app/api/reviews/route.ts** - Review creation
- ✅ **public/firebase-messaging-sw.js** - Service worker
- ✅ **app/test-push/page.tsx** - Testing interface

---

## Status: ✅ READY TO TEST

All push notifications are now implemented with direct function calls. No more HTTP fetch issues!

**Next Steps:**
1. Open two browser windows (Customer & Worker)
2. Follow the testing checklist above
3. Watch terminal logs for confirmation
4. Report any issues with terminal output
