"use strict";
/**
 * Firebase Cloud Functions
 *
 * Function: sendRefreshDataNotification
 * Trigger: Firestore document update in refresh_data collection
 * Purpose: Send push notification to all subscribed users when new content is added
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToToken = exports.sendTestNotification = exports.sendRefreshDataNotification = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
admin.initializeApp();
/**
 * Firestore Trigger: Send notification when refresh_data is updated
 *
 * Triggers on: Create, Update operations
 * Collection: refresh_data
 *
 * Sends notification to topic: 'updates'
 */
exports.sendRefreshDataNotification = functions.firestore
    .document('refresh_data/{docId}')
    .onWrite(async (change, context) => {
    try {
        const docId = context.params.docId;
        // Get the new data
        const newData = change.after.exists ? change.after.data() : null;
        // Skip if document was deleted
        if (!newData) {
            console.log('📭 Document deleted, skipping notification');
            return null;
        }
        // Skip if document was just updated (not created)
        const oldData = change.before.exists ? change.before.data() : null;
        if (oldData) {
            console.log('🔄 Document updated (not created), skipping notification');
            return null;
        }
        console.log('📝 New content detected in refresh_data:', docId);
        console.log('📄 Data:', newData);
        // Extract notification content
        const title = newData.title || 'New Update Available';
        const body = newData.message || 'Check out the latest content';
        const icon = '/icon-192x192.png';
        // Prepare notification payload
        const message = {
            notification: {
                title,
                body,
                icon,
            },
            data: {
                docId,
                type: 'refresh_data_update',
                click_action: '/live-content',
                timestamp: Date.now().toString(),
            },
            topic: 'updates', // Send to all users subscribed to 'updates' topic
        };
        console.log('📨 Sending notification to topic: updates');
        console.log('📦 Payload:', JSON.stringify(message, null, 2));
        // Send notification
        const response = await admin.messaging().send(message);
        console.log('✅ Notification sent successfully:', response);
        return {
            success: true,
            messageId: response,
        };
    }
    catch (error) {
        console.error('❌ Error sending notification:', error);
        // Don't throw error to prevent function retry
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
});
/**
 * HTTP Function: Send test notification
 *
 * Endpoint: POST /sendTestNotification
 * Body: { title?: string, body?: string, topic?: string }
 *
 * For testing purposes only
 */
exports.sendTestNotification = functions.https.onRequest(async (req, res) => {
    try {
        // Only allow POST
        if (req.method !== 'POST') {
            res.status(405).send('Method not allowed');
            return;
        }
        const { title, body, topic } = req.body;
        console.log('🧪 Test notification requested');
        const message = {
            notification: {
                title: title || 'Test Notification',
                body: body || 'This is a test notification from Firebase Functions',
                icon: '/icon-192x192.png',
            },
            data: {
                type: 'test',
                timestamp: Date.now().toString(),
            },
            topic: topic || 'updates',
        };
        const response = await admin.messaging().send(message);
        console.log('✅ Test notification sent:', response);
        res.status(200).json({
            success: true,
            messageId: response,
            message: 'Test notification sent successfully',
        });
    }
    catch (error) {
        console.error('❌ Error sending test notification:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
/**
 * HTTP Function: Send notification to specific token
 *
 * Endpoint: POST /sendToToken
 * Body: { token: string, title: string, body: string }
 *
 * For targeted notifications
 */
exports.sendToToken = functions.https.onRequest(async (req, res) => {
    try {
        if (req.method !== 'POST') {
            res.status(405).send('Method not allowed');
            return;
        }
        const { token, title, body } = req.body;
        if (!token) {
            res.status(400).json({ error: 'Token is required' });
            return;
        }
        const message = {
            notification: {
                title: title || 'NearServe Notification',
                body: body || 'You have a new notification',
                icon: '/icon-192x192.png',
            },
            token,
        };
        const response = await admin.messaging().send(message);
        res.status(200).json({
            success: true,
            messageId: response,
        });
    }
    catch (error) {
        console.error('❌ Error sending to token:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
//# sourceMappingURL=index.js.map