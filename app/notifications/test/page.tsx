'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserProfile } from '@/hooks/use-user-profile';
import { toast } from 'sonner';
import { PushNotificationSetup } from '@/components/push-notification-setup';

export default function NotificationTestPage() {
  const { userProfile } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('Test Notification');
  const [message, setMessage] = useState('This is a test notification message');

  const sendTestNotification = async () => {
    if (!userProfile?.id) {
      toast.error('Please sign in first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.id,
          title,
          message,
          type: 'GENERAL',
          actionUrl: '/notifications/test'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Notification sent! Check the bell icon in the header.');
      } else {
        toast.error(data.error || 'Failed to send notification');
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Test Notification System</CardTitle>
          <CardDescription>
            Send yourself a test notification. No FCM demo needed - everything works server-side!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!userProfile ? (
            <div className="text-center py-8 text-muted-foreground">
              Please sign in to test notifications
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="font-semibold mb-2">📱 Enable Push Notifications</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Get browser push notifications when you receive messages (even when the app is closed)
                </p>
                <PushNotificationSetup />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Notification Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter notification title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Notification Message</Label>
                <Input
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter notification message"
                />
              </div>

              <Button 
                onClick={sendTestNotification} 
                disabled={loading || !title || !message}
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Test Notification'}
              </Button>

              <div className="mt-6 p-4 bg-muted rounded-lg space-y-2 text-sm">
                <p className="font-semibold">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Notification saved to Firestore ✅</li>
                  <li>Shows in bell icon (header) instantly ✅</li>
                  <li>Push notification sent (if browser allowed) ✅</li>
                  <li>No client-side FCM complexity ✅</li>
                  <li>No hydration errors ✅</li>
                </ul>
              </div>

              <div className="mt-4 p-4 border border-blue-500/20 bg-blue-500/5 rounded-lg">
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  💡 Tip: Click the bell icon in the header to see your notifications
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>API Endpoint</CardTitle>
          <CardDescription>Use this endpoint in your code</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`// Send notification from any API route
await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'firebase-user-id',
    title: 'Job Created',
    message: 'New job available',
    type: 'JOB_CREATED',
    actionUrl: '/jobs/123'
  })
});`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
