# 🎉 100% FREE Firebase Push Notifications Setup

**No billing account required! Works on Firebase Spark (free) plan.**

---

## ✅ What's Implemented

### ✨ Core Features
- ✅ Browser push notifications (foreground + background)
- ✅ FCM token generation with VAPID key
- ✅ Token storage in Firestore
- ✅ FCM HTTP API for sending (no Admin SDK)
- ✅ Next.js API routes (runs on Vercel free tier)
- ✅ Service worker for background notifications
- ✅ Real-time UI updates with Firestore listeners
- ✅ **NO CLOUD FUNCTIONS** - 100% FREE!

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Get Firebase Keys

**A) VAPID Key** (for token generation)
```
1. Go to: https://console.firebase.google.com/project/nearserve-pho/settings/cloudmessaging
2. Scroll to "Web Push certificates"
3. Click "Generate key pair" if none exists
4. Copy the key (starts with 'B...')
```

**B) Server Key** (for sending notifications)
```
1. Same page: Project Settings → Cloud Messaging
2. Under "Cloud Messaging API (Legacy)", copy "Server key"
3. Keep it secret!
```

### Step 2: Add to Environment

Create/update `.env.local`:

```env
# VAPID Key (Public - for browser token generation)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE

# Server Key (Secret - for sending notifications)
FCM_SERVER_KEY=YOUR_SERVER_KEY_HERE
```

### Step 3: Restart Server

```bash
npm run dev
```

**That's it! No deployment, no billing required! 🎉**

---

## 🧪 Test It Now

### 1. Open Test Page
```
http://localhost:3000/test-fcm
```

### 2. Enable Notifications
- Click "Enable Notifications" button
- Grant permission in browser popup
- Your FCM token will be generated and stored

### 3. Send Test Notification
- Fill in title and message
- Click "Send Test"
- All subscribed devices will receive the notification!

### 4. Test Background Notifications
- Close/minimize your browser
- Have someone else send a notification (or use another browser tab)
- You'll receive a browser notification
- Click it to open your app

---

## 📡 How to Send Notifications

### Option 1: Broadcast to All Users (Recommended)

**From Your App:**
```typescript
const response = await fetch('/api/notifications/broadcast', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'New Update!',
    message: 'Check out our latest features',
    icon: '/icon-192x192.png' // optional
  })
});
```

**From External Server/Script:**
```bash
curl -X POST https://your-domain.com/api/notifications/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Server Update",
    "message": "System maintenance completed"
  }'
```

### Option 2: Send to Specific Token

```typescript
const response = await fetch('/api/fcm/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'USER_FCM_TOKEN_HERE',
    notification: {
      title: 'Personal Message',
      body: 'This is for you!',
      icon: '/icon-192x192.png'
    }
  })
});
```

### Option 3: Trigger on Firestore Update

```typescript
// After adding document to Firestore, trigger notification
await addDoc(collection(db, 'refresh_data'), {
  title: 'New Content',
  message: 'Fresh content available',
  created_at: serverTimestamp()
});

// Then manually trigger notification
await fetch('/api/notifications/trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    collection: 'refresh_data'
  })
});
```

---

## 🏗️ Architecture (FREE TIER)

```
┌─────────────────────┐
│   Browser Client    │
│   - Generate Token  │
│   - Store in DB     │
│   - Receive Push    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Firestore DB      │
│   Collection:       │
│   refresh_data_     │
│   tokens            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Next.js API       │
│   /api/fcm/send     │
│   /api/notifications│
│   /broadcast        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   FCM HTTP API      │
│   (Google Servers)  │
│   fcm.googleapis    │
│   .com/fcm/send     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Push to Devices   │
│   - Foreground      │
│   - Background      │
└─────────────────────┘
```

**Key Differences from Paid Version:**
- ❌ No Cloud Functions (paid feature)
- ❌ No automatic Firestore triggers
- ✅ Manual notification sending via API routes
- ✅ Runs on Vercel/Netlify free tier
- ✅ Uses FCM HTTP API (legacy, but FREE)
- ✅ 100% FREE - unlimited notifications!

---

## 📊 API Routes Reference

### 1. `/api/fcm/send` - Send Notification

**Single Device:**
```json
POST /api/fcm/send
{
  "to": "DEVICE_TOKEN",
  "notification": {
    "title": "Hello",
    "body": "World",
    "icon": "/icon.png"
  },
  "data": {
    "custom": "field"
  }
}
```

**Multiple Devices:**
```json
POST /api/fcm/send
{
  "tokens": ["TOKEN1", "TOKEN2", "TOKEN3"],
  "notification": {
    "title": "Hello All",
    "body": "Broadcast message"
  }
}
```

### 2. `/api/notifications/broadcast` - Send to All

```json
POST /api/notifications/broadcast
{
  "title": "Update",
  "message": "New features available",
  "icon": "/icon.png"
}
```

Automatically fetches all tokens from Firestore and sends.

### 3. `/api/notifications/trigger` - Manual Trigger

```json
POST /api/notifications/trigger
{
  "collection": "refresh_data",
  "documentId": "abc123"  // optional
}
```

Reads Firestore document and sends notification based on content.

---

## 🔒 Security

### Protect Your Server Key!

**✅ DO:**
- Keep `FCM_SERVER_KEY` in `.env.local` (never commit)
- Use environment variables in production
- Add `.env.local` to `.gitignore`

**❌ DON'T:**
- Expose server key in client-side code
- Commit server key to GitHub
- Share server key publicly

### API Route Protection (Optional)

Add authentication to your API routes:

```typescript
// app/api/notifications/broadcast/route.ts
export async function POST(request: NextRequest) {
  // Check authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ... rest of code
}
```

---

## 🎯 Integration Examples

### Add to Your App Layout

```tsx
// app/layout.tsx
import { FCMProvider } from '@/components/fcm-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <FCMProvider>{children}</FCMProvider>
        {children}
      </body>
    </html>
  );
}
```

### Send Notification from Admin Panel

```tsx
'use client';

function AdminNotificationSender() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const sendToAll = async () => {
    const response = await fetch('/api/notifications/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message })
    });
    
    const result = await response.json();
    alert(`Sent to ${result.sent} users!`);
  };

  return (
    <div>
      <input value={title} onChange={e => setTitle(e.target.value)} />
      <textarea value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={sendToAll}>Send to All Users</button>
    </div>
  );
}
```

### Automate with Cron Jobs

```typescript
// vercel.json (for scheduled notifications)
{
  "crons": [{
    "path": "/api/notifications/daily-reminder",
    "schedule": "0 9 * * *"  // Every day at 9 AM
  }]
}

// app/api/notifications/daily-reminder/route.ts
export async function GET() {
  await fetch('/api/notifications/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Daily Reminder',
      message: 'Check out today\'s updates!'
    })
  });
  
  return Response.json({ success: true });
}
```

---

## 🐛 Troubleshooting

### "FCM_SERVER_KEY not configured"

**Solution:**
```bash
# Add to .env.local
FCM_SERVER_KEY=YOUR_SERVER_KEY_FROM_FIREBASE_CONSOLE

# Restart server
npm run dev
```

### "VAPID key not configured"

**Solution:**
```bash
# Add to .env.local
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE

# Restart server
npm run dev
```

### "No tokens found"

**Solution:**
- Make sure at least one user has granted permission
- Check Firestore collection `refresh_data_tokens`
- Visit `/test-fcm` and enable notifications

### "Permission denied"

**Solution:**
- User must click "Allow" in browser popup
- Check browser notification settings (not blocked)
- Clear browser cache if stuck

### "Service worker not found"

**Solution:**
- Verify file exists at `public/firebase-messaging-sw.js`
- Check browser DevTools → Application → Service Workers
- Try unregistering and re-registering

---

## 📱 Browser Compatibility

| Browser | Push Notifications | Service Worker |
|---------|-------------------|----------------|
| Chrome  | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari  | ✅ (iOS 16.4+) | ✅ |
| Edge    | ✅ | ✅ |
| Opera   | ✅ | ✅ |

**Notes:**
- iOS Safari requires iOS 16.4+ and "Add to Home Screen"
- Desktop Safari 16+ fully supports push
- All features work on localhost (HTTP) for development
- HTTPS required in production

---

## 💰 Cost Breakdown

### Firebase Spark (FREE) Plan
- ✅ Firestore: 50K reads, 20K writes per day
- ✅ FCM: Unlimited push notifications
- ✅ Storage: 1GB
- ✅ Hosting: 10GB transfer per month

### Vercel/Netlify FREE Tier
- ✅ API Routes: Unlimited requests
- ✅ Serverless Functions: 100GB-hours
- ✅ Bandwidth: 100GB per month

**Total Cost: $0.00/month** 🎉

---

## ✅ Deployment Checklist

- [ ] VAPID key added to `.env.local`
- [ ] Server key added to `.env.local`
- [ ] Service worker at `public/firebase-messaging-sw.js`
- [ ] Firestore rules updated with `refresh_data_tokens` collection
- [ ] Dev server restarted
- [ ] Test page works at `/test-fcm`
- [ ] Notifications granted in browser
- [ ] Token generated and stored in Firestore
- [ ] Broadcast API works
- [ ] Background notifications work
- [ ] Environment variables added to Vercel/hosting

---

## 🎉 You're Ready!

Your push notification system is now:
- ✅ 100% FREE (no billing required)
- ✅ Production-ready
- ✅ Scalable (unlimited notifications)
- ✅ Easy to use (simple API)
- ✅ Secure (keys in environment)

**Next Steps:**
1. Test at `/test-fcm`
2. Integrate into your app
3. Deploy to production
4. Send unlimited free notifications! 🚀

---

**Need help? Check the other documentation files:**
- `FCM_QUICK_REFERENCE.md` - Quick commands
- `FCM_ARCHITECTURE_DIAGRAM.md` - Visual diagrams
