# 🚀 FCM HTTP v1 - Quick Start (3 Minutes)

## Step 1: Get VAPID Key (1 min)

1. Open: https://console.firebase.google.com/project/nearserve-pho/settings/cloudmessaging
2. Scroll to "Web Push certificates"
3. Click "Generate key pair" (if not already done)
4. Copy the key (starts with 'B...')

## Step 2: Get Service Account (1 min)

1. Open: https://console.firebase.google.com/project/nearserve-pho/settings/serviceaccounts
2. Click "Generate new private key"
3. Download JSON file
4. Open the JSON and copy these 3 values:
   - `project_id`
   - `client_email`
   - `private_key`

## Step 3: Configure Environment (1 min)

Create `.env.local` in project root:

```env
# VAPID Key (from Step 1)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE

# Service Account (from Step 2 JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**⚠️ Keep the `\n` characters in FIREBASE_PRIVATE_KEY!**

Save and restart server:
```bash
npm run dev
```

## Step 4: Test (30 seconds)

1. Open: http://localhost:3000/fcm-demo
2. Click "Enable Notifications"
3. Grant permission
4. Fill in title and message
5. Click "Send Test"
6. 🎉 Notification appears!

---

## ✅ What Works Now

- ✅ Push notifications (FCM HTTP v1)
- ✅ Realtime content updates (Firestore)
- ✅ `<div id="liveContent">` auto-updates
- ✅ Background notifications
- ✅ Token storage in Firestore
- ✅ Broadcast to all users
- ✅ 100% FREE (no billing)

---

## 📖 Full Documentation

See [FCM_V1_SETUP_GUIDE.md](./FCM_V1_SETUP_GUIDE.md) for:
- Complete API reference
- Code examples
- Troubleshooting
- Security best practices
- Deployment guide

---

## 🐛 Quick Troubleshooting

**"Failed to get VAPID key"**
→ Check NEXT_PUBLIC_FIREBASE_VAPID_KEY in `.env.local`

**"Service account credentials missing"**
→ Check all 3 FIREBASE_* variables in `.env.local`

**"Permission denied"**
→ Grant notification permission in browser settings

**Still issues?**
→ Check browser console for detailed errors
→ Restart dev server: `npm run dev`

---

**🚀 You're ready to send unlimited FREE push notifications!**
