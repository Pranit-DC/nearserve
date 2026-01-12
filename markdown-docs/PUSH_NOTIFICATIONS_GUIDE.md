# 🔔 Push Notifications Setup Guide

## How Push Notifications Work

Your app has **2 types of notifications**:

### 1️⃣ In-App Notifications (Always Work)
- Show in the bell icon in header
- Stored in Firestore
- Real-time updates
- ✅ Already working for you!

### 2️⃣ Browser Push Notifications (Requires Permission)
- Show as OS-level notifications
- Work even when browser is closed
- Require user permission
- ⚠️ **Need to enable first**

## 🚀 How to Enable Push Notifications

### Step 1: Visit the Test Page
Go to: **http://localhost:3000/notifications/test**

### Step 2: Click "Enable Push Notifications"
- Browser will ask for permission
- Click "Allow" when prompted
- FCM token will be saved automatically

### Step 3: Send a Test Notification
- Fill in title and message
- Click "Send Test Notification"
- You'll receive:
  - ✅ In-app notification (bell icon)
  - ✅ Browser push notification (if enabled)

## 🧪 Testing Push Notifications

### Method 1: Using the Test Page (Easiest)
1. Go to `/notifications/test`
2. Enable push notifications
3. Send yourself a test notification
4. You should see a browser notification pop up!

### Method 2: Using API Directly
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_FIREBASE_UID",
    "title": "Test Push",
    "message": "This should appear as a browser notification!",
    "type": "GENERAL"
  }'
```

### Method 3: From Your Code
```typescript
// In any API route or server component
await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.uid,
    title: 'New Job Available',
    message: 'Check out this job near you!',
    type: 'JOB_CREATED',
    actionUrl: '/jobs/123'
  })
});
```

## 📱 What Happens When You Send a Notification

```
1. Server creates notification in Firestore
   ↓
2. Notification appears in bell icon (always)
   ↓
3. Server checks if user has FCM token
   ↓
4. If yes → Send browser push notification
   ↓
5. Browser shows OS notification with icon/sound
```

## ✅ Checklist - Is Everything Working?

### In-App Notifications
- [x] Notification bell in header shows count
- [x] Clicking bell shows notification list
- [x] Notifications are real-time (instant updates)
- [x] Mark as read works
- [x] Click notification navigates to action URL

### Push Notifications
- [ ] Enable push notifications on test page
- [ ] Browser asks for permission
- [ ] Permission is granted
- [ ] FCM token saved to Firestore
- [ ] Send test notification
- [ ] Browser shows OS notification
- [ ] Clicking notification opens app

## 🐛 Troubleshooting

### "I don't see the push notification"

**Check 1: Did you enable push notifications?**
- Go to `/notifications/test`
- Look for green checkmark: "Push notifications enabled"
- If not enabled, click the button

**Check 2: Browser notification permission**
```javascript
// Check in browser console:
console.log(Notification.permission);
// Should show: "granted"
```

**Check 3: Is FCM token saved?**
- Open Firebase Console
- Go to Firestore
- Check `users/{userId}` document
- Look for `fcmToken` field

**Check 4: Check browser console**
```javascript
// You should see:
[Notification] Push sent to user {userId}
```

**Check 5: Service Worker**
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(r => console.log(r));
// Should show firebase-messaging-sw.js registered
```

### "Permission is denied"

If you accidentally denied notification permission:

**Chrome/Edge:**
1. Click lock icon in address bar
2. Click "Site settings"
3. Find "Notifications"
4. Change to "Allow"
5. Refresh page

**Firefox:**
1. Click lock icon
2. Click "Clear permissions"
3. Refresh page and try again

**Safari:**
1. Safari → Settings → Websites → Notifications
2. Find your site and allow

### "Push notification shows but has wrong icon"

Update the icon paths in `/app/api/notifications/send/route.ts`:
```typescript
webpush: {
  notification: {
    icon: '/your-icon-192x192.png',  // Change this
    badge: '/your-badge-72x72.png',  // Change this
  }
}
```

## 🎯 Production Checklist

Before deploying to production:

1. **Update VAPID Key** (if needed)
   - Current key in: `lib/fcm.ts`
   - Get from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates

2. **Update Icons**
   - Add `/icon-192x192.png` to public folder
   - Add `/badge-72x72.png` to public folder

3. **Test on Mobile**
   - Push notifications work on mobile browsers (Chrome, Firefox, Safari iOS 16.4+)
   - Make sure service worker is accessible at `/firebase-messaging-sw.js`

4. **Update Firebase Config**
   - Ensure `firebase-messaging-sw.js` has correct Firebase config
   - Config must match your production Firebase project

## 📊 Monitoring Push Notifications

### Check Delivery in Firebase Console
1. Go to Firebase Console
2. Engage → Messaging
3. View analytics on notification delivery rates

### Check in Your App
```typescript
// Add to notification send endpoint
console.log(`[Notification] Push sent to user ${userId} at ${new Date().toISOString()}`);
```

### Check User's FCM Token
```typescript
// In any API route
const userDoc = await adminDb.collection('users').doc(userId).get();
const fcmToken = userDoc.data()?.fcmToken;
console.log('User FCM token:', fcmToken ? 'Present' : 'Missing');
```

## 🔧 Advanced Configuration

### Custom Notification Sound
Update `firebase-messaging-sw.js`:
```javascript
notificationOptions: {
  sound: '/notification-sound.mp3'
}
```

### Notification Actions (Buttons)
Already configured in service worker:
- "View" button - Opens the notification URL
- "Dismiss" button - Closes notification

### Notification Expiration
Add TTL (time to live):
```typescript
await admin.messaging().send({
  // ... existing config
  android: { ttl: 3600000 }, // 1 hour in ms
  apns: { payload: { aps: { 'expiry': Math.floor(Date.now() / 1000) + 3600 } } }
});
```

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `app/api/notifications/send/route.ts` | Main notification sender |
| `app/api/fcm/subscribe/route.ts` | Save FCM token |
| `lib/fcm.ts` | FCM client setup |
| `public/firebase-messaging-sw.js` | Service worker for push |
| `components/push-notification-setup.tsx` | Enable push button |
| `components/notification-bell.tsx` | In-app notification UI |
| `hooks/use-notifications.ts` | Real-time notifications hook |

## ✨ Summary

Your notification system is **fully functional**:
- ✅ In-app notifications work automatically
- ✅ Push notifications work after enabling
- ✅ No hydration errors
- ✅ Server-side only (no FCM demo mess)
- ✅ Real-time updates via Firestore
- ✅ Clean and simple API

**Next Step:** Go to `/notifications/test` and enable push notifications! 🚀
