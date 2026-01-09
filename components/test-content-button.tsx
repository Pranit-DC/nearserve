'use client';

/**
 * Test Content Button Component
 * 
 * Client component for testing - adds sample content to Firestore
 */

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

export function TestContentButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const addTestContent = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const testData = {
        title: `Test Update #${Math.floor(Math.random() * 1000)}`,
        message: `This is a test message created at ${new Date().toLocaleTimeString()}`,
        timestamp: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'refresh_data'), testData);
      setMessage('✅ Test content added successfully!');
    } catch (error: any) {
      console.error('Error adding test content:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={addTestContent}
        disabled={loading}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {loading ? 'Adding...' : 'Add Test Content'}
      </button>
      {message && (
        <p className="mt-2 text-sm">{message}</p>
      )}
    </div>
  );
}
