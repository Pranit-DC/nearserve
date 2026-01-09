/**
 * Firestore Change Listener with Automatic Notifications
 * 
 * This API route can be called to check for new Firestore documents
 * and automatically send push notifications
 * 
 * Alternative to Cloud Functions - runs on free tier
 * 
 * Endpoint: POST /api/notifications/trigger
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collection = 'refresh_data', documentId } = body;

    console.log('🔔 [Trigger] Checking for notification trigger:', { collection, documentId });

    // Get the document that triggered this
    let docData;
    if (documentId) {
      const docRef = await db.collection(collection).doc(documentId).get();
      if (!docRef.exists) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }
      docData = docRef.data();
    } else {
      // Get the most recent document
      const snapshot = await db.collection(collection)
        .orderBy('created_at', 'desc')
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return NextResponse.json({
          success: true,
          message: 'No documents found'
        });
      }
      
      docData = snapshot.docs[0].data();
    }

    console.log('📄 [Trigger] Document data:', docData);

    // Extract notification content
    const title = docData?.title || 'New Update';
    const message = docData?.message || 'You have a new notification';

    // Get all tokens
    const tokensSnapshot = await db.collection('refresh_data_tokens').get();
    const tokens = tokensSnapshot.docs.map(doc => doc.data().token).filter(Boolean);

    if (tokens.length === 0) {
      console.log('⚠️ [Trigger] No tokens found');
      return NextResponse.json({
        success: true,
        message: 'No recipients to notify',
        sent: 0
      });
    }

    // Send notification
    const fcmResponse = await fetch(`${request.nextUrl.origin}/api/fcm/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokens,
        notification: {
          title,
          body: message,
          icon: '/icon-192x192.png',
        },
        data: {
          type: 'refresh_data_update',
          documentId: documentId || 'latest',
          timestamp: new Date().toISOString()
        }
      }),
    });

    const result = await fcmResponse.json();

    console.log('✅ [Trigger] Notifications sent:', result);

    return NextResponse.json({
      success: true,
      document: {
        title,
        message
      },
      notification: {
        sent: result.successCount || 0,
        failed: result.failureCount || 0,
        total: tokens.length
      }
    });

  } catch (error) {
    console.error('❌ [Trigger] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
