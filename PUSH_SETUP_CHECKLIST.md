# Push Notifications Setup Checklist

## ✅ Already Configured

- [x] VAPID key updated in `lib/fcm.ts`
- [x] Service worker (`firebase-messaging-sw.js`)
- [x] Firebase Admin SDK configured
- [x] API endpoints created (`/api/notifications/send`, `/api/fcm/subscribe`)
- [x] Auto-registration component
- [x] In-app notifications working

## ⚠️ Recommended (Optional)

### 1. Notification Icons
Add these to the `public` folder for better-looking push notifications:

**Required files:**
- `icon-192x192.png` - Main notification icon (192x192px)
- `badge-72x72.png` - Badge icon (72x72px, monochrome recommended)

**How to create:**
1. Use your app logo
2. Resize to 192x192px (PNG format)
3. Create a smaller 72x72px version for badge
4. Save both in `public` folder

**Quick solution:** Use an online tool like:
- https://realfavicongenerator.net/
- https://favicon.io/

### 2. Test Push Notifications
1. Visit: http://localhost:3000/notifications/test
2. Should see "Push notifications enabled" (green checkmark)
3. Send a test notification
4. Check if you receive browser push

### 3. Production Deployment Checklist

Before deploying to production:

**Environment Variables:**
Make sure these are set in your production environment:
```env
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=nearserve-pho
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=nearserve-pho.firebasestorage.app
```

**Service Worker:**
- Verify `/firebase-messaging-sw.js` is publicly accessible
- Check in production: `https://your-domain.com/firebase-messaging-sw.js`

**HTTPS Required:**
- Push notifications only work on HTTPS (or localhost)
- Make sure your production domain has SSL

**Firebase Console Settings:**
1. Go to Firebase Console
2. Cloud Messaging → Add your production domain to authorized domains
3. Check that FCM API is enabled

### 4. Browser Permissions

**Users need to:**
1. Grant notification permission when prompted
2. Make sure notifications aren't blocked in browser settings

**Desktop:**
- Chrome/Edge: Settings → Privacy → Site Settings → Notifications
- Firefox: Settings → Privacy → Permissions → Notifications
- Safari: Preferences → Websites → Notifications

**Mobile:**
- Chrome Android: Settings → Notifications → Sites
- Safari iOS: Settings → Safari → [Your Site] → Notifications

## 🧪 Testing

### Test In-App Notifications:
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_FIREBASE_UID",
    "title": "Test",
    "message": "In-app notification test"
  }'
```

### Test Push Notifications:
1. Close browser tab
2. Send notification via API
3. Should receive OS notification
4. Click notification → should open app

### Check FCM Token Saved:
1. Open Firebase Console
2. Firestore Database
3. `users/{userId}` document
4. Check for `fcmToken` field

## 📊 Monitoring

### Check Notification Delivery:
- Firebase Console → Engage → Messaging
- View delivery rates and statistics

### Debug Mode:
```javascript
// In browser console:
console.log(Notification.permission); // Should be "granted"

navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('Service Workers:', regs));
```

## 🎯 Current Status

**What's Working:**
- ✅ In-app notifications (bell icon)
- ✅ Real-time updates via Firestore
- ✅ Mark as read functionality
- ✅ Auto-registration when permission granted

**What Needs Testing:**
- ⚠️ Browser push notifications (need to test after adding icons)
- ⚠️ Background notifications (when app is closed)
- ⚠️ Notification click actions

## 🚨 Common Issues

**"FCM token not found"**
- User hasn't granted permission
- Check: `Notification.permission === "granted"`

**"Push notification not showing"**
- Check browser notification settings
- Verify service worker is registered
- Check notification icons exist

**"Works on localhost but not production"**
- Verify HTTPS is enabled
- Check authorized domains in Firebase
- Verify environment variables are set

## 📝 Next Steps

1. ✅ VAPID key is updated → **Done!**
2. 📸 Add notification icons → **Recommended**
3. 🧪 Test on multiple browsers → **Verify**
4. 🚀 Deploy to production → **When ready**

---

**Everything is configured!** Just add the icons for better-looking notifications. The system works without them, but they improve the user experience.
