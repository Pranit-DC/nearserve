# 🔍 Quick Notification Verification Checklist

Run through this checklist to ensure everything is working:

## 1️⃣ Service Worker Check
Open browser console and run:
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs.map(r => r.scope));
});
```
**Expected**: Should show `/firebase-messaging-sw.js` registered

## 2️⃣ FCM Token Check
Visit: `/fcm-diagnostic`
**Expected**: Should show your FCM token (long string starting with letters/numbers)

## 3️⃣ Firestore Verification
1. Open Firebase Console → Firestore
2. Navigate to: USERS → {your-user-id}
3. Check: `fcmToken` field exists and has a value
**Expected**: Field should contain a 152+ character token

## 4️⃣ Notification Permission
Open browser console and run:
```javascript
console.log('Notification permission:', Notification.permission);
```
**Expected**: Should show `"granted"`

## 5️⃣ Test Single Notification
1. Visit: `/test-notifications`
2. Click "📤 Test Single Notification"
3. Check browser for notification popup
**Expected**: Should receive a test notification

## 6️⃣ Test Full Workflow
1. Visit: `/test-notifications`
2. Click "🚀 Full Workflow Test"
3. Watch the terminal logs
**Expected**: Should see multiple "[Push] ✅ Sent successfully!" messages

## 7️⃣ Terminal Logs to Watch For

### ✅ Success Messages:
```
[Push] 📤 Sending to user abc123...
[Push] ✅ Sent successfully! Message ID: 0:1234567890
[Notification] ✅ In-app notification created for worker abc123
```

### ❌ Error Messages (If any):
```
[Push] ❌ FCM Error: registration-token-not-registered
→ Solution: User needs to refresh their FCM token (revisit site)

[Push] ℹ️ Worker abc123 has no FCM token or push failed
→ Solution: Worker needs to grant notification permissions

[Notification] ❌ Failed: Error: ...
→ Check full error message for details
```

## 8️⃣ Real-World Test

### As Customer:
1. Sign in as Customer
2. Go to `/customer/workers`
3. Book a worker for a service
4. **Check Worker's device** → Should receive "🔔 New Job Available"

### As Worker:
1. Sign in as Worker
2. Go to `/worker/dashboard`
3. Accept the job
4. **Check Customer's device** → Should receive "✅ Job Accepted"
5. Start the job
6. **Check Customer's device** → Should receive "🚀 Job Started"
7. Complete the job
8. **Check Customer's device** → Should receive "🎉 Job Completed!"

### As Customer (continued):
1. Pay for the job
2. **Check Worker's device** → Should receive "💰 Payment Received"
3. Leave a review
4. **Check Worker's device** → Should receive "⭐ New Review"

---

## 🎯 Quick Fixes

### If no notifications:
1. Clear browser cache and reload
2. Check notification permission: `Notification.permission`
3. Revisit site to refresh FCM token
4. Check terminal for "[Push]" logs
5. Visit `/fcm-diagnostic` to debug

### If only some notifications work:
1. Check terminal logs for specific failures
2. Verify USERS collection has fcmToken for both users
3. Test with `/test-notifications` page

### If terminal shows no logs:
1. Make sure dev server is running
2. Check browser console for errors
3. Verify you're logged in
4. Try manual API calls with Postman/curl

---

## ✅ All Systems Go!

If you see:
- ✅ Service worker registered
- ✅ FCM token exists
- ✅ Notification permission granted
- ✅ Terminal shows "[Push] ✅ Sent successfully!"
- ✅ Device receives notifications

**Then everything is working perfectly! 🎉**

---

## 📞 Still Having Issues?

1. Check [PUSH_NOTIFICATIONS_FINAL_FIX.md](./PUSH_NOTIFICATIONS_FINAL_FIX.md) for detailed explanation
2. Visit `/test-notifications` for automated testing
3. Check browser console for JavaScript errors
4. Verify Firebase project settings and VAPID key
5. Ensure both users have FCM tokens in Firestore

**Remember**: Push notifications require:
- HTTPS (or localhost)
- Notification permission granted
- Service worker active
- FCM token stored in Firestore
- Firebase Cloud Messaging enabled in Firebase Console
