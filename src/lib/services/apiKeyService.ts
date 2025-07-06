import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import type { ApiKey } from '@/lib/types';

const keysCollectionRef = collection(db, 'geminiApiKeys');

/**
 * Retrieves all API keys from the Firestore collection.
 * @returns A promise that resolves to an array of ApiKey objects.
 */
export const getApiKeys = async (): Promise<ApiKey[]> => {
    const snapshot = await getDocs(keysCollectionRef);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name as string,
        key: doc.data().key as string,
    }));
};

/**
 * Adds a new API key to the Firestore collection.
 * @param name The name for the API key.
 * @param key The Gemini API key to add.
 */
export const addApiKey = async (name: string, key: string): Promise<void> => {
    await addDoc(keysCollectionRef, { name, key });
};


/**
 * Deletes an API key from the Firestore collection.
 * @param id The ID of the key to delete.
 */
export const deleteApiKey = async (id: string): Promise<void> => {
    const keyDoc = doc(db, 'geminiApiKeys', id);
    await deleteDoc(keyDoc);
}
