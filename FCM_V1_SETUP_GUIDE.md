# 🔔 FCM HTTP v1 API - Complete Setup Guide

**Modern Firebase Cloud Messaging with OAuth2 authentication - 100% FREE!**

---

## ✅ What's Implemented

### 🎯 Core Features
- ✅ **FCM HTTP v1 API** (modern, OAuth2-based)
- ✅ **Browser push notifications** (foreground + background)
- ✅ **Realtime Firestore updates** (no page reload)
- ✅ **Service worker** for background notifications
- ✅ **Token management** in Firestore
- ✅ **Broadcast to all users**
- ✅ **Live content in `<div id="liveContent">`**
- ✅ **100% FREE** - no Cloud Functions needed!

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Get VAPID Key

```
1. Go to: https://console.firebase.google.com/project/nearserve-pho/settings/cloudmessaging
2. Scroll to "Web Push certificates"
3. Click "Generate key pair"
4. Copy the key (starts with 'B...')
```

### Step 2: Get Service Account Credentials

```
1. Go to: https://console.firebase.google.com/project/nearserve-pho/settings/serviceaccounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract these 3 values:
   - project_id
   - client_email
   - private_key
```

### Step 3: Configure Environment

Create `.env.local`:

```env
# VAPID Key (Public)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY

# Service Account (Private - from downloaded JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**⚠️ Important:**
- Keep the `\n` characters in FIREBASE_PRIVATE_KEY
- Never commit service account credentials
- Add to `.gitignore`

**Restart server:**
```bash
npm run dev
```

---

## 🧪 Test It Now

### 1. Open Demo Page
```
http://localhost:3000/fcm-demo
```

### 2. Enable Notifications
- Click "Enable Notifications"
- Grant permission in browser
- FCM token generated and stored

### 3. Send Test
- Fill in title and message
- Click "Send Test"
- Notification appears instantly!
- Content updates in "Live Content" section (no reload!)

### 4. Test Background
- Minimize browser
- Send another test
- Browser notification appears
- Click to open app

---

## 📁 New Files Created

### Frontend

**1. `lib/fcm-client.ts`** - Complete FCM client service
```typescript
Features:
- isPushNotificationSupported()
- requestNotificationPermission()
- generateFCMToken()
- storeFCMToken()
- setupForegroundNotifications()
- setupRealtimeContentListener() ← Updates <div id="liveContent">
- initializeFCM()
```

**2. `app/fcm-demo/page.tsx`** - Full-featured demo page
```typescript
Features:
- Status monitoring
- Token display
- Send test notifications
- Live content updates
- Realtime Firestore listener
```

### Backend (API Routes)

**3. `app/api/fcm/send-v1/route.ts`** - FCM HTTP v1 sender
```typescript
POST /api/fcm/send-v1
{
  "to": "device_token",  // or "tokens": ["token1", "token2"]
  "title": "Hello",
  "body": "World",
  "icon": "/icon.png",
  "data": { "key": "value" }
}
```

**4. `app/api/notifications/broadcast-v1/route.ts`** - Broadcast to all
```typescript
POST /api/notifications/broadcast-v1
{
  "title": "Update",
  "body": "New content available"
}
```

---

## 🎯 How to Use

### Initialize in Your App

```tsx
// app/layout.tsx or app/page.tsx
'use client';

import { useEffect } from 'react';
import { initializeFCM } from '@/lib/fcm-client';

export default function MyApp() {
  useEffect(() => {
    // Initialize FCM on app load
    initializeFCM().then(result => {
      if (result.success) {
        console.log('FCM ready! Token:', result.token);
      }
    });
  }, []);

  return (
    <div>
      {/* Your app content */}
      
      {/* This div will auto-update with Firestore changes */}
      <div id="liveContent"></div>
    </div>
  );
}
```

### Send Notifications from Your Code

**Method 1: Broadcast to All Users**
```typescript
const response = await fetch('/api/notifications/broadcast-v1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'New Update!',
    body: 'Check out our latest features'
  })
});

const result = await response.json();
console.log(`Sent to ${result.sent} users`);
```

**Method 2: Send to Specific Token**
```typescript
await fetch('/api/fcm/send-v1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'USER_FCM_TOKEN',
    title: 'Personal Message',
    body: 'This is for you!'
  })
});
```

**Method 3: Add to Firestore (Triggers Realtime Update)**
```typescript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

// Add document - realtime listener will auto-update UI
await addDoc(collection(db, 'refresh_data'), {
  title: 'New Content',
  message: 'Check this out!',
  created_at: serverTimestamp()
});

// Content appears in <div id="liveContent"> instantly!
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│              FCM HTTP v1 API ARCHITECTURE                │
└──────────────────────────────────────────────────────────┘

Browser Client
├─ Request permission
├─ Generate FCM token (VAPID key)
├─ Store token in Firestore
├─ Setup onMessage() listener (foreground)
└─ Setup onSnapshot() listener (realtime content)
     │
     ▼
Firestore Database
├─ Collection: refresh_data_tokens (FCM tokens)
└─ Collection: refresh_data (content updates)
     │
     │ Triggers realtime listener
     ▼
<div id="liveContent"> Updates Automatically ✨
     │
     ▼
Next.js API Routes
├─ /api/fcm/send-v1 (FCM sender)
└─ /api/notifications/broadcast-v1 (broadcast)
     │
     ▼
Firebase Admin SDK
├─ OAuth2 authentication
├─ Service account credentials
└─ FCM HTTP v1 API
     │
     ▼
Firebase Cloud Messaging (Google)
├─ Queues notifications
├─ Delivers to browsers
└─ Handles offline devices
     │
     ▼
User Receives Notification
├─ App open → onMessage() → custom UI
└─ App closed → Service Worker → browser notification
```

---

## 📊 Firestore Collections

### `refresh_data_tokens` (Auto-created)
Stores FCM device tokens.

```typescript
{
  token: string,              // FCM device token
  userId: string | null,      // Optional user ID
  created_at: Timestamp,      // When created
  updated_at: Timestamp       // Last update
}
```

### `refresh_data` (Must exist)
Content updates that trigger realtime UI changes.

```typescript
{
  title: string,              // Content title
  message: string,            // Content body
  created_at: Timestamp,      // When created
  type?: string               // Optional type
}
```

**Auto-updates `<div id="liveContent">` without page reload!**

---

## 🎨 Customizing Live Content Display

The default styling can be customized:

```typescript
// lib/fcm-client.ts - setupRealtimeContentListener()

// Customize the HTML template:
element.innerHTML = updates.map(item => `
  <div class="your-custom-class">
    <h3>${item.title}</h3>
    <p>${item.message}</p>
    <small>${item.timestamp?.toDate?.().toLocaleString()}</small>
  </div>
`).join('');
```

Or use the callback for custom rendering:

```tsx
import { setupRealtimeContentListener } from '@/lib/fcm-client';

useEffect(() => {
  const unsubscribe = setupRealtimeContentListener('liveContent', (updates) => {
    // Custom rendering logic
    setMyState(updates);
  });
  
  return () => unsubscribe();
}, []);
```

---

## 🔐 Security

### Service Account Protection

**✅ DO:**
- Store in `.env.local` (never commit)
- Use environment variables in production
- Add to `.gitignore`
- Rotate keys periodically

**❌ DON'T:**
- Commit service account JSON
- Expose private key in client code
- Share credentials publicly
- Store in version control

### API Route Protection (Optional)

```typescript
// app/api/fcm/send-v1/route.ts
export async function POST(request: NextRequest) {
  // Check auth header
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ... rest of code
}
```

---

## 🐛 Troubleshooting

### "VAPID key not configured"
```bash
# Add to .env.local
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_KEY_HERE

# Restart
npm run dev
```

### "Service account credentials missing"
```bash
# Add all 3 to .env.local:
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Keep the \n characters!
# Restart
npm run dev
```

### "Failed to send notification"
- Check service account has FCM permissions
- Verify project ID matches
- Check token is valid and not expired
- View logs in browser console

### "Realtime updates not working"
- Check Firestore collection name: `refresh_data`
- Verify Firestore rules allow reads
- Check browser console for errors
- Ensure `<div id="liveContent">` exists

### "Service worker not found"
- File must be at `public/firebase-messaging-sw.js`
- Check browser DevTools → Application → Service Workers
- Try unregister and re-register

---

## 📱 Browser Compatibility

| Browser | FCM | Service Worker | Realtime |
|---------|-----|----------------|----------|
| Chrome  | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| Safari  | ✅ (16+) | ✅ | ✅ |
| Edge    | ✅ | ✅ | ✅ |

**Notes:**
- iOS Safari requires iOS 16.4+ and "Add to Home Screen"
- All features work on localhost (HTTP) for development
- HTTPS required in production

---

## 💰 Cost: $0.00/month

### Firebase Spark (FREE)
- ✅ Firestore: 50K reads, 20K writes/day
- ✅ FCM: Unlimited notifications
- ✅ Storage: 1GB

### Vercel/Netlify (FREE)
- ✅ API Routes: Unlimited
- ✅ Functions: 100GB-hours
- ✅ Bandwidth: 100GB/month

**Total: FREE!** 🎉

---

## ✅ Deployment Checklist

- [ ] VAPID key in `.env.local`
- [ ] Service account credentials in `.env.local`
- [ ] Service worker at `public/firebase-messaging-sw.js`
- [ ] Firestore rules allow reading `refresh_data`
- [ ] Firestore rules allow writing `refresh_data_tokens`
- [ ] `.gitignore` includes `.env.local` and service account JSON
- [ ] Test on `/fcm-demo` page
- [ ] Permission granted
- [ ] Token generated and in Firestore
- [ ] Test notification works
- [ ] Live content updates without reload
- [ ] Background notifications work
- [ ] Environment variables added to hosting platform

---

## 🎉 You're Ready!

Your FCM system now has:
- ✅ Modern HTTP v1 API (OAuth2)
- ✅ Realtime content updates (no reload)
- ✅ Push notifications (foreground + background)
- ✅ 100% FREE (no billing)
- ✅ Production-ready
- ✅ Scalable

**Test it:**
```
http://localhost:3000/fcm-demo
```

**Send notifications:**
```typescript
await fetch('/api/notifications/broadcast-v1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Hello World',
    body: 'This is FCM HTTP v1!'
  })
});
```

**Add content (auto-updates UI):**
```typescript
await addDoc(collection(db, 'refresh_data'), {
  title: 'Live Update',
  message: 'Content appears instantly!',
  created_at: serverTimestamp()
});
```

---

**🚀 Start sending unlimited FREE push notifications with realtime content updates!**
