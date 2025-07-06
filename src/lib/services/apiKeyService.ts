import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

const keysCollectionRef = collection(db, 'geminiApiKeys');

/**
 * Retrieves all API keys from the Firestore collection.
 * @returns A promise that resolves to an array of key strings.
 */
export const getApiKeys = async (): Promise<string[]> => {
  const snapshot = await getDocs(keysCollectionRef);
  return snapshot.docs.map(doc => doc.data().key as string);
};

/**
 * Adds a new API key to the Firestore collection.
 * @param key The Gemini API key to add.
 */
export const addApiKey = async (key: string): Promise<void> => {
  await addDoc(keysCollectionRef, { key });
};

/**
 * Deletes an API key from the Firestore collection.
 * @param key The Gemini API key to delete.
 */
export const deleteApiKey = async (key: string): Promise<void> => {
  const q = query(keysCollectionRef, where('key', '==', key));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // This isn't an error, just means there's nothing to delete.
    return;
  }

  const batch = writeBatch(db);
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};
