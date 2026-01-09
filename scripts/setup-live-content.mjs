#!/usr/bin/env node

/**
 * Setup Script: Initialize Real-time Content System
 * 
 * This script helps set up the refresh_data collection with sample data
 * Run: node scripts/setup-live-content.mjs
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp,
  getDocs 
} from 'firebase/firestore';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
console.log('🔌 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample content data
const sampleContent = [
  {
    title: '🎉 Welcome to Real-time Updates!',
    message: 'This content syncs automatically across all connected clients using Firebase Firestore WebSockets. Try opening this page in multiple browser windows!',
  },
  {
    title: '🚀 How It Works',
    message: 'Firebase Firestore uses persistent WebSocket connections to push updates instantly. When you add, update, or delete content in the Firebase Console, all connected clients see the changes immediately without refreshing.',
  },
  {
    title: '⚡ Zero Page Reloads',
    message: 'Notice how content appears and updates smoothly without any page refreshes? That\'s the power of real-time listeners. The page stays interactive and responsive at all times.',
  },
  {
    title: '🔥 Free Tier Friendly',
    message: 'This implementation is optimized for Firebase\'s free tier. It uses query limits, efficient reads, and minimizes unnecessary operations to keep costs low.',
  },
  {
    title: '✅ Production Ready',
    message: 'Complete with error handling, loading states, connection monitoring, and smooth animations. This code is ready for production use right out of the box.',
  },
];

/**
 * Check if collection already has data
 */
async function checkExistingData() {
  try {
    console.log('🔍 Checking for existing data...');
    const snapshot = await getDocs(collection(db, 'refresh_data'));
    return snapshot.size;
  } catch (error) {
    console.error('❌ Error checking data:', error);
    return 0;
  }
}

/**
 * Add sample content to collection
 */
async function addSampleContent() {
  try {
    console.log('📝 Adding sample content...');
    const contentRef = collection(db, 'refresh_data');
    
    for (let i = 0; i < sampleContent.length; i++) {
      const item = sampleContent[i];
      const docRef = await addDoc(contentRef, {
        ...item,
        timestamp: serverTimestamp(),
      });
      console.log(`  ✅ Added: ${item.title} (ID: ${docRef.id})`);
    }
    
    console.log('');
    console.log('✨ Successfully added', sampleContent.length, 'sample items!');
    return true;
  } catch (error) {
    console.error('❌ Error adding content:', error);
    return false;
  }
}

/**
 * Main setup function
 */
async function setup() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Real-time Content Setup Script');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // Check for existing data
  const existingCount = await checkExistingData();
  
  if (existingCount > 0) {
    console.log(`⚠️  Collection already has ${existingCount} items.`);
    console.log('');
    console.log('Options:');
    console.log('  1. Keep existing data (recommended)');
    console.log('  2. Add more sample data anyway');
    console.log('  3. Clear all and start fresh (careful!)');
    console.log('');
    console.log('To add data anyway, re-run with: npm run setup-live-content --force');
    console.log('');
    return;
  }

  // Add sample content
  console.log('📦 No existing data found. Adding sample content...');
  console.log('');
  
  const success = await addSampleContent();
  
  if (success) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  ✅ Setup Complete!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('Next steps:');
    console.log('');
    console.log('  1. Start your dev server:');
    console.log('     npm run dev');
    console.log('');
    console.log('  2. Open the demo page:');
    console.log('     http://localhost:3000/live-content');
    console.log('');
    console.log('  3. See real-time updates:');
    console.log('     - Open Firebase Console');
    console.log('     - Navigate to Firestore → refresh_data');
    console.log('     - Add/edit/delete documents');
    console.log('     - Watch instant updates on the page!');
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
  } else {
    console.log('');
    console.log('❌ Setup failed. Please check the error messages above.');
    console.log('');
    console.log('Common issues:');
    console.log('  - Firebase environment variables not set');
    console.log('  - Firestore security rules blocking access');
    console.log('  - Network connectivity issues');
    console.log('');
  }
}

// Run setup
setup().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
