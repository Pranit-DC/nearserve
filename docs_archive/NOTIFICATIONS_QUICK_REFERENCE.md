# 🔔 Push Notifications - Quick Reference

## ✅ What's Working Now

### 1. Worker Gets Booked
- **When:** Customer books a specific worker
- **Who receives:** The booked worker only
- **Notification:** "✅ You have been booked! {Customer} booked you for {Service}"
- **Status:** ✅ **IMPLEMENTED**

### 2. Notification Permission UI
- **When:** Worker logs into dashboard
- **What:** Popup asking to enable notifications
- **Status:** ✅ **IMPLEMENTED**

### 3. FCM Token Storage
- **Where:** Firestore → `worker_profiles` → `fcmToken` field
- **Status:** ✅ **IMPLEMENTED**

---

## 🚀 Test Your Implementation

### Step 1: Enable Notifications (As Worker)
1. Login as a worker
2. Wait for notification permission popup (3 seconds)
3. Click "Enable" → Browser asks permission
4. Grant permission
5. See green badge "Notifications enabled"

### Step 2: Test Booking Notification
1. Login as a customer (different browser/incognito)
2. Book the worker who enabled notifications
3. Worker receives notification instantly!

### Step 3: Test via API (Developer)
```bash
# Check if worker has notifications enabled
curl http://localhost:3000/api/test-notification?workerId=WORKER_USER_ID

# Send test notification
curl -X POST http://localhost:3000/api/test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "workerId": "WORKER_USER_ID",
    "title": "Test Notification",
    "body": "This is a test!"
  }'
```

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| [`lib/fcm.ts`](lib/fcm.ts) | Client-side FCM utilities |
| [`lib/sendNotification.ts`](lib/sendNotification.ts) | Server-side notification functions |
| [`public/firebase-messaging-sw.js`](public/firebase-messaging-sw.js) | Service worker for background notifications |
| [`components/worker/notification-permission.tsx`](components/worker/notification-permission.tsx) | Permission UI component |
| [`app/api/worker/update-fcm-token/route.ts`](app/api/worker/update-fcm-token/route.ts) | Save FCM token API |
| [`app/api/jobs/route.ts`](app/api/jobs/route.ts) | Sends notification on booking |

---

## 🎯 Notification Functions Available

### 1. `notifyWorkerBooked(token, details)`
Sends notification when worker is booked.
```typescript
await notifyWorkerBooked(workerProfile.fcmToken, {
  customerName: 'John Doe',
  serviceName: 'Plumbing Repair',
  date: '2026-01-08',
  time: '10:00 AM',
  location: 'Downtown Area'
});
```

### 2. `notifyWorkerNewJob(token, jobDetails)`
Sends notification about new job opportunity.
```typescript
await notifyWorkerNewJob(workerProfile.fcmToken, {
  title: 'Electrical Work',
  location: 'Sector 15',
  budget: 2500,
  customerName: 'Jane Smith'
});
```

### 3. `sendPushNotification(token, payload)`
Generic notification sender.
```typescript
await sendPushNotification(token, {
  title: 'Custom Title',
  body: 'Custom message',
  icon: '/icon-192x192.png',
  click_action: '/worker/jobs',
  data: { type: 'custom' }
});
```

### 4. `sendMulticastNotification(tokens, payload)`
Send to multiple devices at once.
```typescript
await sendMulticastNotification(
  [token1, token2, token3],
  {
    title: 'Broadcast',
    body: 'Message to multiple workers'
  }
);
```

---

## 🔧 Environment Variables Used

```env
# Already configured in .env.local ✅
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```
Key
**VAPID  (Hardcoded in [`lib/fcm.ts`](lib/fcm.ts)):**
```

```

---

## 🎨 Notification Icons

To use custom notification icons:

1. Create icons in `public/` folder:
   - `icon-192x192.png` (192x192 pixels)
   - `icon-512x512.png` (512x512 pixels)

2. Update [`public/firebase-messaging-sw.js`](public/firebase-messaging-sw.js):
```javascript
icon: '/icon-192x192.png',
badge: '/icon-192x192.png',
```

---

## 🐛 Common Issues & Solutions

### Issue: "Notification permission denied"
**Solution:** Clear browser site settings and try again
```
Chrome → Settings → Privacy → Site Settings → Notifications
```

### Issue: "Service worker registration failed"
**Solution:** Must be on HTTPS or localhost
```javascript
// Check in console:
console.log(window.location.protocol); // Should be "https:" or "http:" (localhost only)
```

### Issue: "FCM token not saved"
**Solution:** Check browser console for errors
```javascript
// Check in console:
localStorage.getItem('debug')
```

### Issue: "Notification not received"
**Solution:** Verify FCM token in Firestore
```
Firestore → worker_profiles → {profile_id} → fcmToken
```

---

## 📊 Notification Delivery States

| State | What It Means | Where It Appears |
|-------|--------------|------------------|
| **Background** | App closed, notification in system tray | OS notification center |
| **Foreground** | App open, notification as toast | In-app toast (sonner) |
| **Clicked** | User clicked notification | Opens specified URL |

---

## 🎯 Next Steps (Optional Enhancements)

### 1. Notify Nearby Workers (EXAMPLE PROVIDED)
See [`app/api/jobs/route-enhanced.ts.example`](app/api/jobs/route-enhanced.ts.example)

This enhancement sends notifications to workers within 25km radius when a new job is created.

### 2. Add Notification Preferences
Let workers choose which notifications to receive:
- New jobs in their area
- Booking confirmations
- Job status updates
- Payment notifications

### 3. Add Notification History
Create a page showing past notifications:
- `/worker/notifications`
- Store notifications in Firestore
- Mark as read/unread

### 4. Add Rich Notifications
Include images, action buttons:
```typescript
{
  title: 'New Job',
  body: 'Plumbing work available',
  image: '/job-image.jpg',
  actions: [
    { action: 'accept', title: 'Accept Job' },
    { action: 'view', title: 'View Details' }
  ]
}
```

---

## ✅ Implementation Checklist

- [x] Install Firebase packages
- [x] Create FCM utility functions
- [x] Create service worker
- [x] Add VAPID key
- [x] Create permission UI component
- [x] Add FCM token field to worker profile
- [x] Implement token storage API
- [x] Add notification to worker layout
- [x] Send notification on booking
- [x] Add toast notifications for foreground
- [x] Create test API endpoint
- [ ] Test with real devices
- [ ] Add notification icons
- [ ] Deploy to production

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firebase credentials in `.env.local`
3. Test with the `/api/test-notification` endpoint
4. Check Firestore for FCM tokens

**Everything is set up and ready to test! 🚀**
