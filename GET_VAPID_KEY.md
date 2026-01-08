# 🔑 How to Get Your VAPID Key from Firebase Console

## Steps:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select project: `nearserve-pho`

2. **Navigate to Project Settings**
   - Click the ⚙️ (gear icon) next to "Project Overview"
   - Click "Project settings"

3. **Go to Cloud Messaging Tab**
   - Click on the "Cloud Messaging" tab at the top

4. **Find Web Push Certificates Section**
   - Scroll down to "Web configuration"
   - Look for "Web Push certificates" section

5. **Generate or Copy Key**
   - If you see a key pair already → Copy it
   - If no key exists → Click "Generate key pair"
   - Copy the entire key (starts with letters/numbers, around 88 characters)

6. **Update in Code**
   - Open `lib/fcm.ts`
   - Replace the `VAPID_KEY` value on line 6
   - Save the file

## Example:
```typescript
const VAPID_KEY = 'YOUR_KEY_FROM_FIREBASE_CONSOLE';
```

## ⚠️ Important:
- The key should be around 88 characters long
- It contains letters, numbers, hyphens, and underscores
- Don't share this key publicly (but it's safe in your code)

## 🔍 Verify:
After updating, restart your dev server:
```bash
npm run dev
```
