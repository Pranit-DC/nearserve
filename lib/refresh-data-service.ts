/**
 * Refresh Data Service
 * 
 * Purpose: Manage real-time content updates in Firestore
 * Collection: refresh_data
 * 
 * This service provides helper functions to add, update, and delete
 * live content items that automatically sync across all connected clients
 * via Firestore's real-time listeners.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './firebase-client';
import { COLLECTIONS } from './firestore';

// TypeScript interfaces
export interface RefreshDataItem {
  id?: string;
  title: string;
  message: string;
  timestamp?: Timestamp | any;
  [key: string]: any;
}

/**
 * Add a new live content item to Firestore
 * All connected clients will see this update instantly
 * 
 * @param data - Content data with title and message
 * @returns Document ID of the created item
 */
export async function addLiveContent(data: Omit<RefreshDataItem, 'id'>): Promise<string> {
  try {
    console.log('📝 [RefreshData] Adding new content:', data);
    
    const contentRef = collection(db, COLLECTIONS.REFRESH_DATA);
    const docRef = await addDoc(contentRef, {
      ...data,
      timestamp: serverTimestamp(), // Firestore server timestamp
    });
    
    console.log('✅ [RefreshData] Content added with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ [RefreshData] Error adding content:', error);
    throw new Error(`Failed to add content: ${error.message}`);
  }
}

/**
 * Update an existing live content item
 * Changes will propagate to all connected clients instantly
 * 
 * @param id - Document ID to update
 * @param data - Partial data to update
 */
export async function updateLiveContent(
  id: string,
  data: Partial<Omit<RefreshDataItem, 'id'>>
): Promise<void> {
  try {
    console.log('🔄 [RefreshData] Updating content:', id, data);
    
    const docRef = doc(db, COLLECTIONS.REFRESH_DATA, id);
    await updateDoc(docRef, {
      ...data,
      timestamp: serverTimestamp(), // Update timestamp
    });
    
    console.log('✅ [RefreshData] Content updated successfully');
  } catch (error: any) {
    console.error('❌ [RefreshData] Error updating content:', error);
    throw new Error(`Failed to update content: ${error.message}`);
  }
}

/**
 * Delete a live content item
 * Removal will be reflected on all connected clients instantly
 * 
 * @param id - Document ID to delete
 */
export async function deleteLiveContent(id: string): Promise<void> {
  try {
    console.log('🗑️ [RefreshData] Deleting content:', id);
    
    const docRef = doc(db, COLLECTIONS.REFRESH_DATA, id);
    await deleteDoc(docRef);
    
    console.log('✅ [RefreshData] Content deleted successfully');
  } catch (error: any) {
    console.error('❌ [RefreshData] Error deleting content:', error);
    throw new Error(`Failed to delete content: ${error.message}`);
  }
}

/**
 * Get a single live content item by ID (one-time read)
 * For real-time updates, use the useFirestoreLiveContent hook instead
 * 
 * @param id - Document ID to fetch
 * @returns Content item or null if not found
 */
export async function getLiveContentById(id: string): Promise<RefreshDataItem | null> {
  try {
    console.log('📖 [RefreshData] Fetching content:', id);
    
    const docRef = doc(db, COLLECTIONS.REFRESH_DATA, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('✅ [RefreshData] Content found');
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as RefreshDataItem;
    } else {
      console.log('❌ [RefreshData] Content not found');
      return null;
    }
  } catch (error: any) {
    console.error('❌ [RefreshData] Error fetching content:', error);
    throw new Error(`Failed to fetch content: ${error.message}`);
  }
}

/**
 * Get all live content items (one-time read)
 * For real-time updates, use the useFirestoreLiveContent hook instead
 * 
 * @param maxItems - Maximum number of items to fetch
 * @returns Array of content items
 */
export async function getAllLiveContent(maxItems: number = 10): Promise<RefreshDataItem[]> {
  try {
    console.log('📚 [RefreshData] Fetching all content, max:', maxItems);
    
    const contentRef = collection(db, COLLECTIONS.REFRESH_DATA);
    const q = query(
      contentRef,
      orderBy('timestamp', 'desc'),
      limit(maxItems)
    );
    
    const querySnapshot = await getDocs(q);
    const items: RefreshDataItem[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as RefreshDataItem[];
    
    console.log('✅ [RefreshData] Fetched', items.length, 'items');
    return items;
  } catch (error: any) {
    console.error('❌ [RefreshData] Error fetching all content:', error);
    throw new Error(`Failed to fetch content: ${error.message}`);
  }
}

/**
 * Add multiple test content items at once
 * Useful for testing and demonstrations
 * 
 * @param count - Number of test items to create
 * @returns Array of created document IDs
 */
export async function addTestContent(count: number = 5): Promise<string[]> {
  try {
    console.log(`🧪 [RefreshData] Adding ${count} test items`);
    
    const ids: string[] = [];
    const testMessages = [
      'Welcome to real-time content updates!',
      'This content syncs across all connected clients.',
      'No page refresh needed - it just works!',
      'Powered by Firebase Firestore WebSockets.',
      'Try updating this in Firebase Console!',
    ];
    
    for (let i = 0; i < count; i++) {
      const id = await addLiveContent({
        title: `Test Item #${i + 1}`,
        message: testMessages[i % testMessages.length],
      });
      ids.push(id);
    }
    
    console.log('✅ [RefreshData] Test items added:', ids);
    return ids;
  } catch (error: any) {
    console.error('❌ [RefreshData] Error adding test content:', error);
    throw new Error(`Failed to add test content: ${error.message}`);
  }
}

/**
 * Clear all content from the collection
 * WARNING: This will delete all items!
 * 
 * @returns Number of items deleted
 */
export async function clearAllLiveContent(): Promise<number> {
  try {
    console.log('🧹 [RefreshData] Clearing all content...');
    
    const contentRef = collection(db, COLLECTIONS.REFRESH_DATA);
    const querySnapshot = await getDocs(contentRef);
    
    let count = 0;
    const deletePromises = querySnapshot.docs.map(async (document) => {
      await deleteDoc(doc(db, COLLECTIONS.REFRESH_DATA, document.id));
      count++;
    });
    
    await Promise.all(deletePromises);
    
    console.log(`✅ [RefreshData] Cleared ${count} items`);
    return count;
  } catch (error: any) {
    console.error('❌ [RefreshData] Error clearing content:', error);
    throw new Error(`Failed to clear content: ${error.message}`);
  }
}
