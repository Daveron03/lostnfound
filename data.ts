/**
 * Data layer for Campus Lost & Found Portal
 * Firebase Firestore implementation with localStorage fallback
 */

import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  orderBy, 
  query,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Item } from './types';
import { onItemsFallback, addItemFallback, markFoundFallback } from './fallback';

const COLLECTION_NAME = 'items';

/**
 * Real-time subscription to all items
 * @param callback Function called with updated items array
 * @returns Unsubscribe function
 */
export function onItems(callback: (items: Item[]) => void): () => void {
  console.log('🚀 Setting up Firestore listener...');
  
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, 
      (snapshot) => {
        console.log('📥 Firestore snapshot received, docs:', snapshot.size);
        const items: Item[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('📄 Processing doc:', doc.id, data);
          items.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            photo: data.photo || undefined,
            status: data.status,
            createdAt: data.createdAt?.toDate() || new Date()
          });
        });

        console.log('🔄 Calling callback with', items.length, 'items');
        callback(items);
      }, 
      (error) => {
        console.error('❌ Firestore listener error:', error);
        console.warn('⚠️ Falling back to localStorage...');
        return onItemsFallback(callback);
      }
    );
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    console.warn('⚠️ Using localStorage fallback');
    return onItemsFallback(callback);
  }
}

/**
 * Add a new lost item
 * @param data Item data without id, status, and createdAt
 */
export async function addItem(data: Omit<Item, 'id' | 'status' | 'createdAt'>): Promise<void> {
  console.log('💾 Adding item to Firestore:', data);
  
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      title: data.title,
      description: data.description,
      photo: data.photo || null,
      status: 'lost',
      createdAt: serverTimestamp()
    });
    console.log('✅ Item added with ID:', docRef.id);
  } catch (error) {
    console.error('❌ Error adding item to Firebase:', error);
    console.warn('⚠️ Falling back to localStorage...');
    return addItemFallback(data);
  }
}

/**
 * Mark an item as found
 * @param id Item document ID
 */
export async function markFound(id: string): Promise<void> {
  console.log('📍 Marking item as found:', id);
  
  try {
    const itemRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(itemRef, {
      status: 'found'
    });
    console.log('✅ Item marked as found');
  } catch (error) {
    console.error('❌ Error marking item as found in Firebase:', error);
    console.warn('⚠️ Falling back to localStorage...');
    return markFoundFallback(id);
  }
}
