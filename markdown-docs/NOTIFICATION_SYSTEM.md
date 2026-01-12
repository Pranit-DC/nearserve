# Server-Side Notification System

## Overview
All FCM demo pages have been removed. The notification system now works entirely server-side, eliminating hydration issues.

## How It Works

### 1. In-App Notifications (Always Available)
All notifications are stored in Firestore and displayed in the notification bell component.

**Send a notification:**
```typescript
// From any API route or server action
const response = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'firebase-user-id',
    title: 'New Job Available',
    message: 'A new job matching your skills is available',
    type: 'JOB_CREATED',
    actionUrl: '/customer/dashboard'
  })
});
```

### 2. Push Notifications (Optional)
If a user has registered their FCM token, they'll also receive push notifications automatically.

**How users get push notifications:**
1. User visits your site
2. Browser requests notification permission (if not already granted)
3. FCM token is automatically registered via the service worker
4. All notifications sent via `/api/notifications/send` will trigger both in-app AND push

## Usage Examples

### Send notification when job is created:
```typescript
// In app/api/jobs/create/route.ts
await fetch('/api/notifications/send', {
  method: 'POST',
  body: JSON.stringify({
    userId: workerFirebaseUid,
    title: 'New Job Available',
    message: `${customerName} needs ${serviceName}`,
    type: 'JOB_CREATED',
    actionUrl: '/worker/dashboard'
  })
});
```

### Send notification when job is accepted:
```typescript
// In app/api/jobs/accept/route.ts
await fetch('/api/notifications/send', {
  method: 'POST',
  body: JSON.stringify({
    userId: customerFirebaseUid,
    title: 'Worker Accepted Your Job',
    message: `${workerName} will arrive in 30 minutes`,
    type: 'JOB_ACCEPTED',
    actionUrl: `/jobs/${jobId}`
  })
});
```

### Broadcast to all users:
```typescript
// Use existing broadcast endpoint
await fetch('/api/notifications/broadcast-v1', {
  method: 'POST',
  body: JSON.stringify({
    title: 'System Maintenance',
    message: 'Scheduled maintenance at 2 AM',
    type: 'GENERAL'
  })
});
```

## Notification Types
- `JOB_CREATED` - New job posted
- `JOB_ACCEPTED` - Worker accepted job
- `JOB_STARTED` - Worker started job
- `JOB_COMPLETED` - Job completed
- `JOB_CANCELLED` - Job cancelled
- `PAYMENT_RECEIVED` - Payment processed
- `REVIEW_RECEIVED` - New review posted
- `GENERAL` - General announcements

## Benefits of This Approach
✅ **No hydration errors** - Everything runs server-side
✅ **Simpler** - No complex FCM client setup
✅ **Reliable** - In-app notifications always work
✅ **Progressive** - Push notifications work when tokens are available
✅ **Automatic** - Service worker handles token registration

## Testing

### Test in-app notification:
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-firebase-uid",
    "title": "Test Notification",
    "message": "This is a test message",
    "type": "GENERAL"
  }'
```

### View notifications:
1. Click the bell icon in the header
2. Notifications appear in real-time via Firestore subscriptions

## Files Involved
- `/api/notifications/send` - Main endpoint to send notifications
- `/api/notifications/broadcast-v1` - Broadcast to all users
- `/api/notifications/mark-read` - Mark notification as read
- `/api/notifications/mark-all-read` - Mark all as read
- `lib/notification-service.ts` - Core notification functions
- `components/notification-bell.tsx` - UI component
- `hooks/use-notifications.ts` - React hook for notifications

## Migration from Old System
All existing notification functionality still works. The only change:
- ❌ Removed: Client-side FCM demo pages (caused hydration errors)
- ✅ Kept: Server-side notification system
- ✅ Kept: In-app notification bell
- ✅ Kept: Push notifications (via service worker)
- ✅ Added: Simple server-side API endpoint

No code changes needed in your existing features!
