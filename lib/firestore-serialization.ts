/**
 * Firestore Data Serialization Utilities
 * 
 * Converts Firestore Timestamp objects to plain JavaScript types
 * for safe serialization in Next.js Server/Client component boundaries
 */

/**
 * Recursively converts Firestore Timestamp objects to ISO date strings
 * Safe for passing from Server Components to Client Components
 */
export function serializeFirestoreData<T = any>(data: any): T {
  if (!data) return data;
  
  if (typeof data === 'object' && data !== null) {
    // Check if it's a Firestore Timestamp (admin SDK format)
    if (data._seconds !== undefined && data._nanoseconds !== undefined) {
      return new Date(data._seconds * 1000 + data._nanoseconds / 1000000).toISOString() as any;
    }
    
    // Check if it has a toDate method (Firestore Timestamp - client SDK)
    if (typeof data.toDate === 'function') {
      try {
        return data.toDate().toISOString() as any;
      } catch {
        return data as any;
      }
    }
    
    // Handle Date objects
    if (data instanceof Date) {
      return data.toISOString() as any;
    }
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => serializeFirestoreData(item)) as any;
    }
    
    // Handle plain objects
    const serialized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        serialized[key] = serializeFirestoreData(data[key]);
      }
    }
    return serialized;
  }
  
  return data;
}

/**
 * Serializes a Firestore document snapshot
 */
export function serializeDocSnapshot(docSnapshot: any) {
  if (!docSnapshot.exists) return null;
  
  return serializeFirestoreData({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  });
}

/**
 * Serializes multiple Firestore document snapshots
 */
export function serializeDocsSnapshot(querySnapshot: any) {
  return querySnapshot.docs.map((doc: any) => serializeDocSnapshot(doc));
}
