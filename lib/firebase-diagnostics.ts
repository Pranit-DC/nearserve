/**
 * Firebase Diagnostic Script
 * 
 * This script tests Firebase connectivity and data storage.
 * Run this in your API route or server component to diagnose issues.
 */

import { adminAuth, adminDb, COLLECTIONS } from '@/lib/firebase-admin';

export async function runFirebaseDiagnostics() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as Array<{ name: string; status: 'PASS' | 'FAIL'; message: string; details?: any }>,
  };

  console.log('🔍 Starting Firebase Diagnostics...\n');

  // Test 1: Firebase Admin Initialization
  try {
    if (adminDb && adminAuth) {
      results.tests.push({
        name: 'Firebase Admin Initialization',
        status: 'PASS',
        message: 'Firebase Admin SDK initialized successfully',
      });
      console.log('✅ Test 1: Firebase Admin SDK initialized');
    } else {
      throw new Error('Firebase services not initialized');
    }
  } catch (error: any) {
    results.tests.push({
      name: 'Firebase Admin Initialization',
      status: 'FAIL',
      message: error.message,
    });
    console.log('❌ Test 1 FAILED:', error.message);
  }

  // Test 2: Firestore Write Test
  try {
    const testRef = adminDb.collection('_diagnostics').doc('test');
    await testRef.set({
      message: 'Test write from diagnostics',
      timestamp: new Date(),
    });
    
    results.tests.push({
      name: 'Firestore Write Test',
      status: 'PASS',
      message: 'Successfully wrote to Firestore',
    });
    console.log('✅ Test 2: Firestore write successful');
    
    // Clean up
    await testRef.delete();
  } catch (error: any) {
    results.tests.push({
      name: 'Firestore Write Test',
      status: 'FAIL',
      message: `Write failed: ${error.message}`,
      details: error.code,
    });
    console.log('❌ Test 2 FAILED:', error.message);
  }

  // Test 3: Firestore Read Test
  try {
    const usersSnapshot = await adminDb.collection(COLLECTIONS.USERS).limit(1).get();
    
    results.tests.push({
      name: 'Firestore Read Test',
      status: 'PASS',
      message: `Successfully read from ${COLLECTIONS.USERS} collection`,
      details: { documentCount: usersSnapshot.size },
    });
    console.log('✅ Test 3: Firestore read successful. Found', usersSnapshot.size, 'users');
  } catch (error: any) {
    results.tests.push({
      name: 'Firestore Read Test',
      status: 'FAIL',
      message: `Read failed: ${error.message}`,
      details: error.code,
    });
    console.log('❌ Test 3 FAILED:', error.message);
  }

  // Test 4: Collection Names
  try {
    const collections = Object.values(COLLECTIONS);
    results.tests.push({
      name: 'Collection Names',
      status: 'PASS',
      message: 'COLLECTIONS constant properly exported',
      details: { collections },
    });
    console.log('✅ Test 4: COLLECTIONS constant found:', collections.length, 'collections');
  } catch (error: any) {
    results.tests.push({
      name: 'Collection Names',
      status: 'FAIL',
      message: error.message,
    });
    console.log('❌ Test 4 FAILED:', error.message);
  }

  // Test 5: Environment Variables
  try {
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
    ];
    
    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missing.length === 0) {
      results.tests.push({
        name: 'Environment Variables',
        status: 'PASS',
        message: 'All required environment variables are set',
      });
      console.log('✅ Test 5: All environment variables present');
    } else {
      throw new Error(`Missing: ${missing.join(', ')}`);
    }
  } catch (error: any) {
    results.tests.push({
      name: 'Environment Variables',
      status: 'FAIL',
      message: error.message,
    });
    console.log('❌ Test 5 FAILED:', error.message);
  }

  // Test 6: User Creation Test
  try {
    // Create a test user document
    const testUserId = adminDb.collection('temp').doc().id;
    const testUserData = {
      email: 'test@example.com',
      name: 'Test User',
      phone: '+1234567890',
      role: 'UNASSIGNED',
      firebaseUid: 'test-uid-' + Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(testUserId);
    await userRef.set(testUserData);
    
    // Verify it was created
    const userDoc = await userRef.get();
    const exists = userDoc.exists;
    
    // Clean up
    await userRef.delete();
    
    if (exists) {
      results.tests.push({
        name: 'User Document Creation',
        status: 'PASS',
        message: 'Successfully created and retrieved user document',
      });
      console.log('✅ Test 6: User document creation successful');
    } else {
      throw new Error('Document not found after creation');
    }
  } catch (error: any) {
    results.tests.push({
      name: 'User Document Creation',
      status: 'FAIL',
      message: `User creation failed: ${error.message}`,
      details: error.code,
    });
    console.log('❌ Test 6 FAILED:', error.message);
  }

  // Summary
  const passCount = results.tests.filter(t => t.status === 'PASS').length;
  const failCount = results.tests.filter(t => t.status === 'FAIL').length;
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📝 Total:  ${results.tests.length}`);
  console.log('='.repeat(50) + '\n');

  if (failCount > 0) {
    console.log('❌ FAILURES DETECTED:');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(test => {
        console.log(`  • ${test.name}: ${test.message}`);
      });
    console.log('');
  }

  return results;
}

// Example usage in an API route:
/*
import { runFirebaseDiagnostics } from '@/lib/firebase-diagnostics';

export async function GET() {
  const results = await runFirebaseDiagnostics();
  return Response.json(results);
}
*/
