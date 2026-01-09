/**
 * Firestore Security Rules for Real-time Content
 * 
 * Copy these rules to Firebase Console → Firestore → Rules
 * 
 * These rules control who can read and write to the refresh_data collection
 */

// =============================================================================
// PRODUCTION RULES (Recommended)
// =============================================================================

export const PRODUCTION_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Real-time Content Collection
    match /refresh_data/{document} {
      // Allow all users to read (public content)
      allow read: if true;
      
      // Only authenticated users can write
      allow create, update: if request.auth != null;
      
      // Only the creator or admin can delete
      allow delete: if request.auth != null && 
                      (request.auth.uid == resource.data.createdBy || 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN');
      
      // Validate data structure on write
      allow write: if request.auth != null &&
                     request.resource.data.keys().hasAll(['title', 'message']) &&
                     request.resource.data.title is string &&
                     request.resource.data.message is string &&
                     request.resource.data.title.size() > 0 &&
                     request.resource.data.title.size() <= 200 &&
                     request.resource.data.message.size() > 0 &&
                     request.resource.data.message.size() <= 2000;
    }
  }
}
`;

// =============================================================================
// DEVELOPMENT RULES (Testing Only - Less Secure)
// =============================================================================

export const DEVELOPMENT_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Real-time Content Collection - Open for testing
    match /refresh_data/{document} {
      // Allow all operations for testing
      allow read, write: if true;
    }
  }
}
`;

// =============================================================================
// AUTHENTICATED ONLY RULES (More Secure)
// =============================================================================

export const AUTHENTICATED_ONLY_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Real-time Content Collection - Authenticated users only
    match /refresh_data/{document} {
      // Only authenticated users can read
      allow read: if request.auth != null;
      
      // Only authenticated users can write
      allow create, update, delete: if request.auth != null;
    }
  }
}
`;

// =============================================================================
// ADMIN ONLY RULES (Most Secure)
// =============================================================================

export const ADMIN_ONLY_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }
    
    // Real-time Content Collection - Admin only writes
    match /refresh_data/{document} {
      // All users can read
      allow read: if true;
      
      // Only admins can write
      allow create, update, delete: if isAdmin();
    }
  }
}
`;

// =============================================================================
// Usage Instructions
// =============================================================================

export const USAGE_INSTRUCTIONS = `
🔒 How to Apply Firestore Security Rules:

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Navigate to: Firestore Database → Rules
4. Copy one of the rule sets above
5. Paste it into the rules editor
6. Click "Publish"

📋 Rule Set Recommendations:

- DEVELOPMENT: Use during initial testing (⚠️ Not secure!)
- PRODUCTION: Recommended for most apps
- AUTHENTICATED_ONLY: For private content
- ADMIN_ONLY: For content management systems

🔍 Testing Your Rules:

Use the "Rules Playground" in Firebase Console to test:
- Authenticated reads/writes
- Unauthenticated access
- Data validation

⚡ Quick Start (Development):

For testing, use DEVELOPMENT_RULES:
{
  "refresh_data": {
    "allow read, write": true
  }
}

Then switch to PRODUCTION_RULES when ready for deployment.
`;

// =============================================================================
// Export all rule sets
// =============================================================================

export const FIRESTORE_RULES = {
  production: PRODUCTION_RULES,
  development: DEVELOPMENT_RULES,
  authenticated: AUTHENTICATED_ONLY_RULES,
  adminOnly: ADMIN_ONLY_RULES,
  instructions: USAGE_INSTRUCTIONS,
};

export default FIRESTORE_RULES;
