# 🔔 Firebase Cloud Messaging (FCM) Setup Guide

Complete implementation of browser push notifications using Firebase Cloud Messaging.

---

## ✅ What's Been Implemented

### 1. **Frontend Service** (`lib/fcm-service.ts`)
- ✅ Permission request handling
- ✅ FCM token generation with VAPID key
- ✅ Token storage in Firestore (`refresh_data_tokens` collection)
- ✅ Topic subscription ("updates" topic)
- ✅ Foreground notification handler (`onMessage`)
- ✅ Complete initialization orchestration

### 2. **React Components & Hooks**
- ✅ `hooks/use-fcm-notifications.ts` - Custom hook with state management
- ✅ `components/fcm-provider.tsx` - Provider component for app-wide initialization
- ✅ `components/fcm-provider.tsx` - NotificationBell UI component

### 3. **Backend API** (`app/api/fcm/subscribe/route.ts`)
- ✅ POST `/api/fcm/subscribe` - Subscribe token to topic
- ✅ DELETE `/api/fcm/subscribe` - Unsubscribe token from topic
- ✅ Uses Firebase Admin SDK for server-side operations

### 4. **Cloud Functions** (`functions/src/index.ts`)
- ✅ `sendRefreshDataNotification` - Firestore trigger on `refresh_data/{docId}`
- ✅ Automatically sends push to "updates" topic when content is added
- ✅ `sendTestNotification` - HTTP endpoint for testing
- ✅ `sendToToken` - Send to specific FCM token

### 5. **Service Worker** (`public/firebase-messaging-sw.js`)
- ✅ Background message handler
- ✅ Notification click handler with window focusing
- ✅ Custom notification actions (View/Dismiss)
- ✅ Vibration support

---

## 🚀 Quick Start

### Step 1: Get VAPID Key from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **nearserve-pho**
3. Click ⚙️ Settings → Project settings
4. Go to **Cloud Messaging** tab
5. Scroll to **Web Push certificates**
6. If no key exists, click **Generate key pair**
7. Copy the **Key pair** value (starts with `B...`)

### Step 2: Add VAPID Key to Environment

Create or update `.env.local` in your project root:

```env
# Firebase Cloud Messaging VAPID Key
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

**⚠️ IMPORTANT:** 
- Replace `YOUR_VAPID_KEY_HERE` with your actual VAPID key
- Must use `NEXT_PUBLIC_` prefix to expose to browser
- Restart Next.js dev server after adding

### Step 3: Deploy Cloud Functions

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Login to Firebase (if not already)
npx firebase login

# Deploy all functions
npm run deploy

# Or deploy specific function
npx firebase deploy --only functions:sendRefreshDataNotification
```

### Step 4: Add FCM to Your App

**Option A: App-wide (Recommended)**

Add to your main layout (`app/layout.tsx`):

```tsx
import { FCMProvider } from '@/components/fcm-provider';
import { auth } from '@/lib/firebase-client';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <FCMProvider userId={auth.currentUser?.uid}>
          {children}
        </FCMProvider>
      </body>
    </html>
  );
}
```

**Option B: Specific Pages**

```tsx
'use client';

import { useFCMNotifications } from '@/hooks/use-fcm-notifications';
import { NotificationBell } from '@/components/fcm-provider';

export default function MyPage() {
  const fcm = useFCMNotifications();

  return (
    <div>
      <NotificationBell />
      
      {fcm.lastNotification && (
        <div className="notification-toast">
          <h3>{fcm.lastNotification.title}</h3>
          <p>{fcm.lastNotification.body}</p>
        </div>
      )}
    </div>
  );
}
```

### Step 5: Test the System

**Method 1: Add Data to Firestore**

Add a document to the `refresh_data` collection:

```javascript
// Firebase Console or your app
db.collection('refresh_data').add({
  title: 'Test Notification',
  message: 'This is a test message!',
  created_at: new Date()
});
```

The Cloud Function will automatically:
1. Detect the new document
2. Send push notification to all users subscribed to "updates" topic
3. Users will receive notification (background) or see it in-app (foreground)

**Method 2: HTTP Cloud Function (Testing)**

```bash
# Get your project URL
curl -X POST https://us-central1-nearserve-pho.cloudfunctions.net/sendTestNotification

# Or send to specific token
curl -X POST https://us-central1-nearserve-pho.cloudfunctions.net/sendToToken \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_FCM_TOKEN"}'
```

---

## 📊 Firestore Collections

### `refresh_data` (Existing)
Triggers notifications when documents are created/updated.

```typescript
{
  id: string;                    // Auto-generated
  title: string;                 // Notification title
  message: string;               // Notification body
  created_at: Timestamp;         // When created
}
```

### `refresh_data_tokens` (New - Auto-created)
Stores FCM tokens for users.

```typescript
{
  token: string;                 // FCM registration token
  userId?: string;               // Optional user ID
  created_at: Timestamp;         // When token was registered
  updated_at: Timestamp;         // Last update
}
```

---

## 🔐 Firestore Security Rules

Add to `firestore.rules`:

```javascript
// FCM Token Management
match /refresh_data_tokens/{tokenId} {
  // Anyone can create tokens (for anonymous users)
  allow create: if request.auth != null || true;
  
  // Users can read/update/delete their own tokens
  allow read, update, delete: if request.auth != null && 
                                 request.auth.uid == resource.data.userId;
  
  // Or allow if no userId (anonymous)
  allow read, update, delete: if !('userId' in resource.data);
}
```

Deploy rules:

```bash
npx firebase deploy --only firestore:rules
```

---

## 🎯 How It Works

### Flow Diagram

```
┌─────────────────┐
│  User Opens App │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Request Permission     │ ← Browser prompt
└────────┬────────────────┘
         │ Granted
         ▼
┌─────────────────────────┐
│  Generate FCM Token     │ ← Uses VAPID key
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Store in Firestore     │ ← refresh_data_tokens collection
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Subscribe to Topic     │ ← "updates" topic via API
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Setup onMessage()      │ ← Foreground notifications
└─────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━
When Content is Added:
━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────┐
│  Add to refresh_data    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Firestore Trigger      │ ← Cloud Function
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Send to "updates"      │ ← FCM sends to all subscribed
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  User Receives Push     │
└─────────────────────────┘
         │
         ├─ App Active?
         │  ▼ YES: onMessage() handles in-app
         │  ▼ NO: Service Worker shows notification
         │
         └─ Click notification?
            ▼ YES: Opens/focuses app
```

### Background vs Foreground

**Foreground (App Open):**
- Handled by `onMessage()` listener
- Custom in-app UI (toast, modal, etc.)
- No browser notification by default
- Implement custom display logic

**Background (App Closed/Minimized):**
- Handled by Service Worker
- Browser notification automatically shown
- Click notification opens/focuses app
- Uses `firebase-messaging-sw.js`

---

## 🧪 Testing Checklist

- [ ] VAPID key added to `.env.local`
- [ ] Cloud Functions deployed successfully
- [ ] Service worker registered (check browser DevTools → Application → Service Workers)
- [ ] Permission granted in browser
- [ ] FCM token generated and stored in Firestore
- [ ] Token subscribed to "updates" topic
- [ ] Foreground notifications work (app open)
- [ ] Background notifications work (app closed)
- [ ] Click notification opens app
- [ ] Cloud Function triggers on `refresh_data` document creation

---

## 🐛 Troubleshooting

### "VAPID key not configured"

**Solution:** Ensure `.env.local` has `NEXT_PUBLIC_FIREBASE_VAPID_KEY` and restart dev server.

### "Permission denied"

**Solution:** User must manually allow notifications. Check browser settings → Site permissions → Notifications.

### "Token generation failed"

**Possible causes:**
- Service worker not registered
- VAPID key incorrect
- Browser doesn't support push notifications
- HTTPS required (localhost is OK)

**Solution:** Check browser console for errors, verify service worker is active.

### "Cloud Function not triggering"

**Possible causes:**
- Function not deployed
- Firebase Admin SDK not initialized
- Firestore rules blocking reads

**Solution:**
```bash
# Check function logs
npx firebase functions:log

# Verify deployment
npx firebase functions:list
```

### "Notification not appearing"

**Possible causes:**
- Token not subscribed to topic
- Topic name mismatch
- Browser notifications disabled
- Service worker not active

**Solution:**
1. Check Firestore `refresh_data_tokens` collection
2. Verify token in collection
3. Check browser notification settings
4. Test service worker: DevTools → Application → Service Workers

---

## 📱 Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Push Notifications | ✅ | ✅ | ✅ (iOS 16.4+) | ✅ |
| Service Workers | ✅ | ✅ | ✅ | ✅ |
| VAPID Keys | ✅ | ✅ | ✅ | ✅ |

**Notes:**
- iOS Safari requires iOS 16.4+ and explicit Add to Home Screen
- Desktop Safari 16+ supports push notifications
- All features work on localhost (HTTP) for development

---

## 🎉 Next Steps

1. **Customize Notifications:**
   - Update Cloud Function payload in `functions/src/index.ts`
   - Add custom icons, actions, sounds
   - Implement notification categories

2. **Add More Triggers:**
   - Create functions for different Firestore collections
   - Add HTTP endpoints for manual notifications
   - Implement scheduled notifications

3. **Enhance UI:**
   - Create notification center component
   - Add notification history
   - Implement notification preferences

4. **Analytics:**
   - Track notification delivery
   - Monitor click-through rates
   - A/B test notification content

---

## 📚 Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

---

**🎯 System Status: READY FOR TESTING**

All components are implemented. Follow the Quick Start guide to configure VAPID key and deploy Cloud Functions.
