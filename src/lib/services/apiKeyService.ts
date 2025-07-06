import { db } from '@/lib/firebase';
import type { ApiKey } from '@/lib/types';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';

const keysCollectionRef = collection(db, 'geminiApiKeys');

/**
 * Retrieves all API keys from the Firestore collection.
 * @returns A promise that resolves to an array of ApiKey objects.
 */
export const getApiKeys = async (): Promise<ApiKey[]> => {
  const snapshot = await getDocs(keysCollectionRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as { name: string; key: string }),
  }));
};

/**
 * Adds a new API key to the Firestore collection.
 * @param name The name/title for the API key.
 * @param key The Gemini API key to add.
 * @returns The newly created ApiKey object with its ID.
 */
export const addApiKey = async (name: string, key: string): Promise<ApiKey> => {
  const docRef = await addDoc(keysCollectionRef, { name, key });
  return { id: docRef.id, name, key };
};

/**
 * Updates an API key's name in the Firestore collection.
 * @param id The ID of the API key document to update.
 * @param name The new name for the API key.
 */
export const updateApiKeyName = async (id: string, name: string): Promise<void> => {
    const keyDoc = doc(db, 'geminiApiKeys', id);
    await updateDoc(keyDoc, { name });
};


/**
 * Deletes an API key from the Firestore collection.
 * @param id The ID of the API key document to delete.
 */
export const deleteApiKey = async (id: string): Promise<void> => {
  const keyDoc = doc(db, 'geminiApiKeys', id);
  await deleteDoc(keyDoc);
};
