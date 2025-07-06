import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

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
