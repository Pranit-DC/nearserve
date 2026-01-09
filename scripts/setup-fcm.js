#!/usr/bin/env node

/**
 * Script to verify and update VAPID key for FCM
 * Run: node scripts/setup-fcm.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const fcmFilePath = path.join(__dirname, '..', 'lib', 'fcm.ts');

console.log('\n🔔 FCM VAPID Key Setup\n');
console.log('Follow these steps to get your VAPID key:\n');
console.log('1. Go to: https://console.firebase.google.com/');
console.log('2. Select your project: nearserve-pho');
console.log('3. Click ⚙️ (gear icon) → Project settings');
console.log('4. Click "Cloud Messaging" tab');
console.log('5. Scroll to "Web Push certificates"');
console.log('6. Click "Generate key pair" (if no key exists)');
console.log('7. Copy the key (should be ~88 characters)\n');

rl.question('Enter your VAPID key: ', (vapidKey) => {
  const trimmedKey = vapidKey.trim();
  
  // Validate key
  if (!trimmedKey) {
    console.error('❌ No key provided');
    rl.close();
    return;
  }
  
  if (trimmedKey.length < 80) {
    console.error('❌ Key too short. VAPID keys are typically 88 characters');
    console.error(`   Your key is only ${trimmedKey.length} characters`);
    rl.close();
    return;
  }
  
  // Read current file
  let content = fs.readFileSync(fcmFilePath, 'utf8');
  
  // Replace VAPID key
  const regex = /const VAPID_KEY = ['"`]([^'"`]+)['"`];/;
  const match = content.match(regex);
  
  if (match) {
    const oldKey = match[1];
    content = content.replace(regex, `const VAPID_KEY = '${trimmedKey}';`);
    
    // Write back to file
    fs.writeFileSync(fcmFilePath, content, 'utf8');
    
    console.log('\n✅ VAPID key updated successfully!');
    console.log(`   Old key: ${oldKey.substring(0, 20)}...`);
    console.log(`   New key: ${trimmedKey.substring(0, 20)}...`);
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your dev server: npm run dev');
    console.log('   2. Visit: http://localhost:3000/notifications/test');
    console.log('   3. Enable push notifications');
    console.log('\n');
  } else {
    console.error('❌ Could not find VAPID_KEY in fcm.ts');
  }
  
  rl.close();
});
