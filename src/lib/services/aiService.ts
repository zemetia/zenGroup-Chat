import { db } from '@/lib/firebase';
import type { AIAssistant, Persona } from '@/lib/types';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';

const aiCollectionRef = collection(db, 'customAIs');

export const getCustomAIsFromFirestore = async (): Promise<AIAssistant[]> => {
  const snapshot = await getDocs(aiCollectionRef);
  return snapshot.docs.map(doc => {
    // We only store the persona and other details, not runtime state like memory
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      avatar: data.avatar,
      isAI: true,
      isCustom: true,
      description: data.description,
      persona: data.persona,
      memoryBank: [], // Memory is stateful and handled on the client
    } as AIAssistant;
  });
};

export const addCustomAIToFirestore = async (
  ai: Omit<AIAssistant, 'id' | 'memoryBank'>
): Promise<string> => {
  const docRef = await addDoc(aiCollectionRef, ai);
  return docRef.id;
};

export const updateCustomAIInFirestore = async (
  id: string,
  updates: { name?: string; persona?: Persona }
): Promise<void> => {
  const aiDoc = doc(db, 'customAIs', id);
  // Remove undefined values so Firestore doesn't overwrite fields with null
  const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
  await updateDoc(aiDoc, cleanUpdates);
};

export const deleteCustomAIFromFirestore = async (id: string): Promise<void> => {
  const aiDoc = doc(db, 'customAIs', id);
  await deleteDoc(aiDoc);
};
