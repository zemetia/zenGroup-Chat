
import { db } from '@/lib/firebase';
import type { ChatGroup, Message, Participant } from '@/lib/types';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
  orderBy,
  query,
  limit,
  getDoc,
  setDoc,
} from 'firebase/firestore';

const groupsCollectionRef = collection(db, 'chatGroups');

const getGroupDocRef = (groupId: string) => doc(db, 'chatGroups', groupId);
const getMessagesCollectionRef = (groupId: string) => collection(db, 'chatGroups', groupId, 'messages');
const getParticipantsDocRef = (groupId: string) => doc(db, 'chatGroups', groupId, 'state', 'participants');

// == GROUP CRUD ==

export const getChatGroups = async (): Promise<ChatGroup[]> => {
    const snapshot = await getDocs(query(groupsCollectionRef, orderBy('createdAt', 'desc')));
    // Deserialize the createdAt field from a Firestore Timestamp to a number
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            icon: data.icon,
            createdAt: data.createdAt.toMillis(),
            description: data.description || '',
        } as ChatGroup;
    });
};

export const createChatGroup = async (name: string, icon: string, description: string = ''): Promise<ChatGroup> => {
    const newGroupData = {
        name,
        icon,
        description,
        createdAt: Timestamp.now(), // Use a Firestore Timestamp for consistency
    };
    const docRef = await addDoc(groupsCollectionRef, newGroupData);
    return { 
        id: docRef.id, 
        name: newGroupData.name,
        icon: newGroupData.icon,
        description: newGroupData.description,
        createdAt: newGroupData.createdAt.toMillis(), // Return a number for the client
    };
};

export const updateChatGroup = async (groupId: string, updates: { name?: string, icon?: string, description?: string }): Promise<void> => {
    const groupDoc = getGroupDocRef(groupId);
    // Filter out undefined values so Firestore doesn't complain
    const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
    await updateDoc(groupDoc, cleanUpdates);
};

export const deleteChatGroup = async (groupId: string): Promise<void> => {
    // Note: This doesn't delete subcollections in the client SDK.
    // A cloud function would be needed for full cleanup, but for now we delete the group doc.
    const groupDoc = getGroupDocRef(groupId);
    await deleteDoc(groupDoc);
};


// == MESSAGES ==

const serializeMessageForFirestore = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const messageData: any = {
        ...message,
        timestamp: Timestamp.now(),
    };
    if (message.author) {
        // Store a simplified author object to prevent deep nesting and circular refs
        messageData.author = {
            id: message.author.id,
            name: message.author.name,
            isAI: message.author.isAI,
        };
    }
    // Remove undefined fields so they are not stored in Firestore
    if (messageData.replyToId === undefined) {
        delete messageData.replyToId;
    }
    return messageData;
};

const deserializeMessageFromFirestore = (doc: any): Message => {
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
        timestamp: data.timestamp.toMillis(),
    } as Message;
}

export const getMessagesForGroup = async (groupId: string): Promise<Message[]> => {
    const messagesQuery = query(getMessagesCollectionRef(groupId), orderBy('timestamp', 'asc'), limit(100));
    const snapshot = await getDocs(messagesQuery);
    return snapshot.docs.map(deserializeMessageFromFirestore);
};

export const addMessageToGroup = async (groupId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<string> => {
    const serializedMessage = serializeMessageForFirestore(message);
    const docRef = await addDoc(getMessagesCollectionRef(groupId), serializedMessage);
    return docRef.id;
};


// == PARTICIPANTS (with AI Memories) ==

// We store participants in a single document for simplicity.
// This includes AI memory, which is now scoped to the group.

export const getParticipantsForGroup = async (groupId: string): Promise<Participant[]> => {
    const participantsDoc = await getDoc(getParticipantsDocRef(groupId));
    if (participantsDoc.exists()) {
        return participantsDoc.data().participants as Participant[];
    }
    return []; // Return empty array if no participants doc yet
}

export const updateParticipantsForGroup = async (groupId: string, participants: Participant[]): Promise<void> => {
    await setDoc(getParticipantsDocRef(groupId), { participants });
}
