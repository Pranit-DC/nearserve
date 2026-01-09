import LiveContentDisplay from '@/components/live-content-display';
import { TestContentButton } from '@/components/test-content-button';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Content - Real-time Updates',
  description: 'Real-time content updates powered by Firebase Firestore',
};

/**
 * Live Content Demo Page
 * 
 * Demonstrates real-time Firestore updates without page reloads
 * Collection: refresh_data
 * Update Method: WebSocket-based persistent connection
 */
export default function LiveContentPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Live Content Feed
        </h1>
        <p className="text-muted-foreground">
          Content updates instantly from Firestore without refreshing the page
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-500 mt-0.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">
              How it works
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              This page uses Firebase Firestore's real-time listeners to display content. 
              Add, update, or delete documents in the <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded">refresh_data</code> collection 
              to see instant updates here without refreshing!
            </p>
          </div>
        </div>
      </div>

      {/* Live Content Component */}
      <LiveContentDisplay 
        showConnectionStatus={true}
        maxItems={10}
        className="mb-8"
      />

      {/* Instructions Section */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4">
          Testing Instructions
        </h2>
        
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Option 1: Using Firebase Console
            </h3>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Go to Firebase Console → Firestore Database</li>
              <li>Navigate to the <code className="px-1 py-0.5 bg-muted rounded">refresh_data</code> collection</li>
              <li>Add a new document with fields: <code className="px-1 py-0.5 bg-muted rounded">title</code> (string) and <code className="px-1 py-0.5 bg-muted rounded">message</code> (string)</li>
              <li>Watch the content appear instantly on this page!</li>
            </ol>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Option 2: Using Code
            </h3>
            <pre className="bg-black/90 text-green-400 rounded p-3 overflow-x-auto text-xs mt-2">
{`import { db } from '@/lib/firebase-client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Add a new document
await addDoc(collection(db, 'refresh_data'), {
  title: 'Breaking News',
  message: 'This content updates in real-time!',
  timestamp: serverTimestamp()
});`}
            </pre>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Option 3: Quick Test Button (Dev Only)
            </h3>
            <p className="mb-2">
              Use the button below to add test content directly:
            </p>
            <TestContentButton />
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="mt-8 border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4">
          Technical Details
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">
              ✅ Features
            </h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Real-time WebSocket connection</li>
              <li>Zero page reloads</li>
              <li>Smooth animations</li>
              <li>Automatic reconnection</li>
              <li>Error handling</li>
              <li>Free tier optimized</li>
            </ul>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">
              🔧 Implementation
            </h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Custom React hook</li>
              <li>Firestore onSnapshot</li>
              <li>Motion animations</li>
              <li>TypeScript typed</li>
              <li>Production-ready</li>
              <li>Modular architecture</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
