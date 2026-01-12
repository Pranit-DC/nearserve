# 🚀 FCM Quick Reference

Fast reference for Firebase Cloud Messaging implementation.

---

## 📦 Installation Status

✅ All files created:
- `lib/fcm-service.ts` - Core FCM service
- `hooks/use-fcm-notifications.ts` - React hook
- `components/fcm-provider.tsx` - React components
- `app/api/fcm/subscribe/route.ts` - Backend API
- `functions/src/index.ts` - Cloud Functions
- `public/firebase-messaging-sw.js` - Service worker

---

## ⚡ Quick Commands

### Setup VAPID Key
```bash
# 1. Get key from Firebase Console:
# https://console.firebase.google.com/project/nearserve-pho/settings/cloudmessaging

# 2. Add to .env.local:
echo "NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_KEY_HERE" >> .env.local

# 3. Restart dev server
npm run dev
```

### Deploy Cloud Functions
```bash
cd functions
npm install
npm run deploy
```

### Test Notification
```javascript
// Add to Firestore (automatic notification)
db.collection('refresh_data').add({
  title: 'Test',
  message: 'Hello!',
  created_at: new Date()
});
```

---

## 🎯 Usage Examples

### Basic Setup (App Layout)
```tsx
import { FCMProvider } from '@/components/fcm-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <FCMProvider>{children}</FCMProvider>
      </body>
    </html>
  );
}
```

### Using the Hook
```tsx
'use client';

import { useFCMNotifications } from '@/hooks/use-fcm-notifications';

export default function MyComponent() {
  const { permission, token, lastNotification, initialize } = useFCMNotifications();

  if (permission !== 'granted') {
    return <button onClick={initialize}>Enable Notifications</button>;
  }

  return (
    <div>
      {lastNotification && (
        <div className="toast">
          <h3>{lastNotification.title}</h3>
          <p>{lastNotification.body}</p>
        </div>
      )}
    </div>
  );
}
```

### Notification Bell Component
```tsx
import { NotificationBell } from '@/components/fcm-provider';

export default function Header() {
  return (
    <header>
      <NotificationBell />
    </header>
  );
}
```

---

## 🔧 API Reference

### Client Functions (`lib/fcm-service.ts`)

```typescript
// Check if browser supports push
isPushNotificationSupported(): boolean

// Request permission
requestNotificationPermission(): Promise<boolean>

// Generate FCM token
generateFCMToken(): Promise<string | null>

// Subscribe to topic
subscribeToTopic(token: string, topic: string): Promise<boolean>

// Setup foreground listener
setupForegroundNotifications(callback: (notification) => void): () => void

// Complete initialization
initializeFCM(userId?: string): Promise<{ success: boolean; token?: string; error?: string }>
```

### Hook API (`use-fcm-notifications`)

```typescript
const {
  isSupported,          // boolean: Browser support
  permission,           // NotificationPermission: 'default' | 'granted' | 'denied'
  token,                // string | null: FCM token
  subscribed,           // boolean: Topic subscription status
  loading,              // boolean: Loading state
  error,                // string | null: Error message
  lastNotification,     // FCMNotification | null: Last received
  requestPermission,    // () => Promise<boolean>
  initialize,           // () => Promise<void>
  unsubscribe          // () => Promise<void>
} = useFCMNotifications(userId?);
```

### Backend API

**Subscribe to Topic**
```bash
POST /api/fcm/subscribe
Content-Type: application/json

{
  "token": "FCM_TOKEN",
  "topic": "updates"
}
```

**Unsubscribe from Topic**
```bash
DELETE /api/fcm/subscribe
Content-Type: application/json

{
  "token": "FCM_TOKEN",
  "topic": "updates"
}
```

---

## 🔥 Cloud Functions

### Automatic Trigger
```javascript
// Triggers on: refresh_data/{docId} create/update
exports.sendRefreshDataNotification = functions.firestore
  .document('refresh_data/{docId}')
  .onWrite(async (change, context) => {
    // Automatically sends to "updates" topic
  });
```

### Test Function (HTTP)
```bash
curl https://us-central1-nearserve-pho.cloudfunctions.net/sendTestNotification
```

### Send to Token (HTTP)
```bash
curl -X POST https://us-central1-nearserve-pho.cloudfunctions.net/sendToToken \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_FCM_TOKEN"}'
```

---

## 📊 Firestore Structure

### `refresh_data` (Content Trigger)
```javascript
{
  title: "New Update",
  message: "Content description",
  created_at: Timestamp
}
```

### `refresh_data_tokens` (Token Storage)
```javascript
{
  token: "FCM_REGISTRATION_TOKEN",
  userId: "optional-user-id",
  created_at: Timestamp,
  updated_at: Timestamp
}
```

---

## 🛠️ Debugging

### Check Service Worker
```javascript
// Browser console
navigator.serviceWorker.getRegistrations().then(regs => console.log(regs));
```

### Check FCM Token
```javascript
// Browser console
const token = await generateFCMToken();
console.log('Token:', token);
```

### Check Permission
```javascript
// Browser console
console.log('Permission:', Notification.permission);
```

### View Function Logs
```bash
npx firebase functions:log --only sendRefreshDataNotification
```

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| "VAPID key not configured" | Add to `.env.local`, restart server |
| Permission denied | User must allow in browser settings |
| Service worker not found | Must be at `/firebase-messaging-sw.js` |
| Token generation fails | Check VAPID key, verify HTTPS/localhost |
| No notifications | Check browser notification settings |
| Function not triggering | Deploy functions, check Firestore rules |

---

## 📞 Testing Workflow

1. ✅ Add VAPID key to `.env.local`
2. ✅ Deploy Cloud Functions
3. ✅ Run `npm run dev`
4. ✅ Open app in browser
5. ✅ Grant notification permission
6. ✅ Check console for "Initialized successfully"
7. ✅ Add document to `refresh_data` collection
8. ✅ Receive notification
9. ✅ Click notification → app opens

---

## 🎨 Customization

### Custom Notification UI
```tsx
import { useFCMNotifications } from '@/hooks/use-fcm-notifications';

function CustomNotificationToast() {
  const { lastNotification } = useFCMNotifications();

  if (!lastNotification) return null;

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded shadow-lg">
      <h3 className="font-bold">{lastNotification.title}</h3>
      <p>{lastNotification.body}</p>
    </div>
  );
}
```

### Custom Cloud Function Payload
```javascript
// functions/src/index.ts
const message = {
  notification: {
    title: data.title || 'Custom Title',
    body: data.message || 'Custom message',
    icon: '/custom-icon.png'
  },
  data: {
    click_action: '/custom-page',
    custom_field: 'custom_value'
  },
  topic: 'updates'
};
```

---

## 📚 Files Overview

| File | Purpose | Type |
|------|---------|------|
| `lib/fcm-service.ts` | Core FCM logic | Client |
| `hooks/use-fcm-notifications.ts` | React state management | Client |
| `components/fcm-provider.tsx` | UI components | Client |
| `app/api/fcm/subscribe/route.ts` | Topic subscription | Server |
| `functions/src/index.ts` | Cloud Functions | Firebase |
| `public/firebase-messaging-sw.js` | Background handler | Service Worker |

---

## ✅ Checklist

**Setup:**
- [ ] VAPID key in `.env.local`
- [ ] Cloud Functions deployed
- [ ] Dev server restarted

**Testing:**
- [ ] Service worker registered
- [ ] Permission granted
- [ ] Token generated
- [ ] Token in Firestore
- [ ] Subscribed to "updates" topic

**Functionality:**
- [ ] Foreground notifications work
- [ ] Background notifications work
- [ ] Click opens app
- [ ] Cloud Function triggers

---

**Ready to use! 🎉**

For detailed setup: See `FCM_SETUP_GUIDE.md`
