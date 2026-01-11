# 📡 FCM HTTP v1 API Reference

Complete reference for the Firebase Cloud Messaging HTTP v1 implementation.

---

## 🔧 Client-Side Functions

All functions are exported from `lib/fcm-client.ts`:

### `isPushNotificationSupported()`

Check if browser supports push notifications.

```typescript
const isSupported = isPushNotificationSupported();
if (!isSupported) {
  console.log('Push notifications not supported');
}
```

**Returns:** `boolean`

---

### `requestNotificationPermission()`

Request browser permission for notifications.

```typescript
const result = await requestNotificationPermission();
if (result.granted) {
  console.log('Permission granted!');
} else {
  console.error(result.error);
}
```

**Returns:** `Promise<{ granted: boolean, error?: string }>`

**Possible states:**
- `granted`: User allowed notifications
- `denied`: User blocked notifications
- `default`: User dismissed prompt

---

### `registerServiceWorker()`

Register the Firebase Messaging service worker.

```typescript
const registration = await registerServiceWorker();
if (registration) {
  console.log('Service worker registered');
}
```

**Returns:** `Promise<ServiceWorkerRegistration | null>`

**Service worker path:** `/firebase-messaging-sw.js`

---

### `generateFCMToken(vapidKey: string)`

Generate FCM device token for push notifications.

```typescript
const token = await generateFCMToken('YOUR_VAPID_KEY');
if (token) {
  console.log('FCM Token:', token);
}
```

**Parameters:**
- `vapidKey` (string): VAPID public key from Firebase Console

**Returns:** `Promise<string | null>`

**Environment variable:** `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

---

### `storeFCMToken(token: string, userId?: string)`

Store FCM token in Firestore `refresh_data_tokens` collection.

```typescript
await storeFCMToken('device_token_here', 'user123');
```

**Parameters:**
- `token` (string): FCM device token
- `userId` (string, optional): User ID to associate with token

**Returns:** `Promise<void>`

**Firestore document:**
```typescript
{
  token: string,
  userId: string | null,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

---

### `setupForegroundNotifications(callback?: Function)`

Setup listener for notifications when app is open.

```typescript
const unsubscribe = setupForegroundNotifications((payload) => {
  console.log('New notification:', payload);
  // Custom handling
});

// Later: cleanup
unsubscribe();
```

**Parameters:**
- `callback` (function, optional): Custom handler for notification payload

**Returns:** `() => void` (unsubscribe function)

**Default behavior:** Shows browser notification automatically

---

### `setupRealtimeContentListener(elementId: string, callback?: Function)`

Setup Firestore listener for realtime content updates.

```typescript
const unsubscribe = setupRealtimeContentListener('liveContent', (updates) => {
  console.log('Content updated:', updates);
});

// Later: cleanup
unsubscribe();
```

**Parameters:**
- `elementId` (string): ID of DOM element to update (without `#`)
- `callback` (function, optional): Custom handler for updates

**Returns:** `() => void` (unsubscribe function)

**Default behavior:** 
- Automatically updates `<div id="liveContent">` with formatted HTML
- Listens to `refresh_data` Firestore collection
- Orders by `created_at` descending (newest first)
- Limits to 10 most recent updates

**HTML template:**
```html
<div class="border rounded-lg p-4 bg-muted/50">
  <h3 class="font-semibold">{title}</h3>
  <p class="text-sm text-muted-foreground">{message}</p>
  <time class="text-xs text-muted-foreground">{timestamp}</time>
</div>
```

---

### `initializeFCM(userId?: string)`

Complete FCM initialization (all-in-one).

```typescript
const result = await initializeFCM('user123');

if (result.success) {
  console.log('FCM ready!');
  console.log('Token:', result.token);
} else {
  console.error(result.error);
}
```

**Parameters:**
- `userId` (string, optional): User ID to associate with token

**Returns:** `Promise<{ success: boolean, token?: string, error?: string }>`

**What it does:**
1. ✅ Checks browser support
2. ✅ Requests notification permission
3. ✅ Registers service worker
4. ✅ Generates FCM token
5. ✅ Stores token in Firestore
6. ✅ Sets up foreground notifications
7. ✅ Sets up realtime content listener

---

## 🌐 Backend API Routes

### POST `/api/fcm/send-v1`

Send push notification via FCM HTTP v1 API.

**Single token:**
```typescript
const response = await fetch('/api/fcm/send-v1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'device_token_here',
    title: 'Hello',
    body: 'World',
    icon: '/icon.png',
    data: { key: 'value' }
  })
});

const result = await response.json();
// { success: true, sent: 1, failed: 0, messageId: "..." }
```

**Multiple tokens:**
```typescript
await fetch('/api/fcm/send-v1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tokens: ['token1', 'token2', 'token3'],
    title: 'Batch Notification',
    body: 'Sent to multiple devices'
  })
});

// { success: true, sent: 3, failed: 0, results: [...] }
```

**Request body:**
```typescript
{
  to?: string,              // Single token
  tokens?: string[],        // Multiple tokens (alternative to 'to')
  title: string,            // Notification title
  body: string,             // Notification body
  icon?: string,            // Notification icon URL
  data?: Record<string, any> // Custom data payload
}
```

**Response:**
```typescript
{
  success: boolean,
  sent: number,           // Number of successful sends
  failed: number,         // Number of failed sends
  messageId?: string,     // Single send only
  results?: Array<{       // Multiple send only
    success: boolean,
    messageId?: string,
    error?: string
  }>
}
```

---

### GET `/api/fcm/send-v1`

Get API documentation.

```bash
curl http://localhost:3000/api/fcm/send-v1
```

---

### POST `/api/notifications/broadcast-v1`

Broadcast notification to all registered devices.

```typescript
const response = await fetch('/api/notifications/broadcast-v1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'System Update',
    body: 'New features available!',
    icon: '/icon.png',
    data: {
      type: 'system',
      link: '/updates'
    }
  })
});

const result = await response.json();
// { success: true, sent: 42, failed: 1, total: 43 }
```

**Request body:**
```typescript
{
  title: string,            // Notification title
  body: string,             // Notification body
  icon?: string,            // Notification icon URL
  data?: Record<string, any> // Custom data payload
}
```

**Response:**
```typescript
{
  success: boolean,
  sent: number,           // Successful sends
  failed: number,         // Failed sends
  total: number          // Total attempts
}
```

**What it does:**
1. Fetches all tokens from `refresh_data_tokens` collection
2. Calls `/api/fcm/send-v1` with tokens array
3. Returns aggregated results

---

### GET `/api/notifications/broadcast-v1`

Get API documentation.

```bash
curl http://localhost:3000/api/notifications/broadcast-v1
```

---

## 🗄️ Firestore Collections

### `refresh_data_tokens`

Stores FCM device tokens.

**Structure:**
```typescript
{
  token: string,              // FCM device token (unique)
  userId: string | null,      // Optional user ID
  created_at: Timestamp,      // When created
  updated_at: Timestamp       // Last update
}
```

**Indexes:** None required (queries by token or userId)

**Security rules:**
```javascript
match /refresh_data_tokens/{tokenId} {
  allow read: if true;
  allow write: if true; // Or restrict to authenticated users
}
```

---

### `refresh_data`

Content updates that trigger realtime UI changes.

**Structure:**
```typescript
{
  title: string,              // Content title
  message: string,            // Content body
  created_at: Timestamp,      // When created
  type?: string               // Optional type
}
```

**Indexes:** 
- `created_at` (descending) - for ordered queries

**Security rules:**
```javascript
match /refresh_data/{docId} {
  allow read: if true;
  allow write: if true; // Or restrict to admin only
}
```

---

## 🔐 Environment Variables

### Client-Side (Public)

```env
# VAPID public key for FCM token generation
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BPxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to get:**
1. Firebase Console → Project Settings → Cloud Messaging
2. Web Push certificates → Generate key pair
3. Copy the public key

---

### Server-Side (Private)

```env
# Firebase Admin SDK service account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
```

**How to get:**
1. Firebase Console → Project Settings → Service Accounts
2. Generate new private key → Download JSON
3. Extract `project_id`, `client_email`, `private_key` from JSON

**⚠️ Security:**
- Never commit these to version control
- Add to `.gitignore`
- Keep `\n` characters in private key
- Use environment variables in production

---

## 🎯 Usage Examples

### Example 1: Initialize on App Load

```tsx
// app/layout.tsx
'use client';

import { useEffect } from 'react';
import { initializeFCM } from '@/lib/fcm-client';

export default function RootLayout({ children }) {
  useEffect(() => {
    initializeFCM().then(result => {
      if (result.success) {
        console.log('FCM initialized:', result.token);
      }
    });
  }, []);

  return (
    <html>
      <body>
        {children}
        <div id="liveContent"></div>
      </body>
    </html>
  );
}
```

---

### Example 2: Send Notification on Button Click

```tsx
// components/send-notification-button.tsx
'use client';

export function SendNotificationButton() {
  const handleSend = async () => {
    const response = await fetch('/api/notifications/broadcast-v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Feature!',
        body: 'Check out what we just launched'
      })
    });
    
    const result = await response.json();
    alert(`Sent to ${result.sent} users!`);
  };

  return <button onClick={handleSend}>Send Notification</button>;
}
```

---

### Example 3: Add Content to Firestore (Auto-Updates UI)

```typescript
// app/actions.ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

export async function addContentUpdate(title: string, message: string) {
  // Add to Firestore - realtime listener will auto-update UI
  await addDoc(collection(db, 'refresh_data'), {
    title,
    message,
    created_at: serverTimestamp()
  });
  
  // Content appears in <div id="liveContent"> instantly!
}
```

---

### Example 4: Custom Realtime Content Rendering

```tsx
'use client';

import { useEffect, useState } from 'react';
import { setupRealtimeContentListener } from '@/lib/fcm-client';

export function LiveFeed() {
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    const unsubscribe = setupRealtimeContentListener('myDiv', (data) => {
      setUpdates(data); // Custom state update
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      {updates.map(item => (
        <div key={item.id}>
          <h3>{item.title}</h3>
          <p>{item.message}</p>
        </div>
      ))}
    </div>
  );
}
```

---

### Example 5: Custom Notification Handler

```tsx
'use client';

import { useEffect } from 'react';
import { setupForegroundNotifications } from '@/lib/fcm-client';
import { toast } from 'sonner'; // Or your toast library

export function NotificationHandler() {
  useEffect(() => {
    const unsubscribe = setupForegroundNotifications((payload) => {
      // Custom UI instead of browser notification
      toast.success(payload.notification?.title, {
        description: payload.notification?.body
      });
    });

    return () => unsubscribe();
  }, []);

  return null;
}
```

---

## 🧪 Testing

### Test Notification Permission

```typescript
const result = await requestNotificationPermission();
console.log('Permission:', result.granted ? 'Granted' : 'Denied');
```

### Test Token Generation

```typescript
const token = await generateFCMToken(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!);
console.log('Token:', token);
```

### Test Sending

```bash
curl -X POST http://localhost:3000/api/fcm/send-v1 \
  -H "Content-Type: application/json" \
  -d '{
    "to": "YOUR_TOKEN_HERE",
    "title": "Test",
    "body": "Hello from curl!"
  }'
```

### Test Broadcast

```bash
curl -X POST http://localhost:3000/api/notifications/broadcast-v1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Broadcast Test",
    "body": "Sent to all users"
  }'
```

### Test Realtime Updates

```typescript
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

await addDoc(collection(db, 'refresh_data'), {
  title: 'Test Update',
  message: 'Testing realtime listener',
  created_at: serverTimestamp()
});

// Check if <div id="liveContent"> updated
```

---

## 🐛 Error Handling

### Client-Side

```typescript
try {
  const result = await initializeFCM();
  if (!result.success) {
    console.error('FCM init failed:', result.error);
    // Handle error
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### Server-Side

```typescript
const response = await fetch('/api/fcm/send-v1', { ... });

if (!response.ok) {
  const error = await response.json();
  console.error('Send failed:', error);
}
```

---

## 📊 Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Notification sent |
| 400 | Bad Request | Check request body |
| 401 | Unauthorized | Check service account |
| 404 | Not Found | Endpoint doesn't exist |
| 500 | Server Error | Check logs |

---

## 🔗 Useful Links

- [FCM HTTP v1 API Docs](https://firebase.google.com/docs/cloud-messaging/http-server-ref)
- [Firebase Console](https://console.firebase.google.com)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**📖 Complete implementation guide:** [FCM_V1_SETUP_GUIDE.md](./FCM_V1_SETUP_GUIDE.md)

**🚀 Quick start:** [FCM_QUICK_START.md](./FCM_QUICK_START.md)
