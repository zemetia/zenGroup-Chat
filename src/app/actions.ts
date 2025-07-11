'use server';

import {
  addApiKey,
  deleteApiKey,
  getApiKeys,
  updateApiKeyName,
} from '@/lib/services/apiKeyService';
import {
  addMessageToGroup,
  createChatGroup,
  deleteChatGroup,
  getChatGroups,
  getMessagesForGroup,
  getParticipantsForGroup,
  updateChatGroup,
  updateParticipantsForGroup,
} from '@/lib/services/chatService';
import type { ApiKey, ChatGroup, Message, Participant } from '@/lib/types';

// --- API Key Actions ---
export const getApiKeysAction = async (): Promise<ApiKey[]> => {
  return await getApiKeys();
};

export const addApiKeyAction = async (
  name: string,
  key: string
): Promise<ApiKey> => {
  return await addApiKey(name, key);
};

export const updateApiKeyNameAction = async (
  id: string,
  name: string
): Promise<void> => {
  await updateApiKeyName(id, name);
};

export const deleteApiKeyAction = async (id: string): Promise<void> => {
  await deleteApiKey(id);
};

// --- Chat Group Actions ---
export const getChatGroupsAction = async (): Promise<ChatGroup[]> => {
  return await getChatGroups();
};

export const createChatGroupAction = async (
  name: string,
  icon: string
): Promise<ChatGroup> => {
  return await createChatGroup(name, icon, 'Add a description...');
};

export const updateChatGroupAction = async (
  groupId: string,
  updates: { name?: string; icon?: string; description?: string }
): Promise<void> => {
  return await updateChatGroup(groupId, updates);
};

export const deleteChatGroupAction = async (groupId: string): Promise<void> => {
  return await deleteChatGroup(groupId);
};

// --- Message Actions ---
export const getMessagesForGroupAction = async (
  groupId: string
): Promise<Message[]> => {
  return await getMessagesForGroup(groupId);
};

export const addMessageToGroupAction = async (
  groupId: string,
  message: Message
): Promise<string> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, timestamp, ...messageData } = message;
  return await addMessageToGroup(groupId, messageData);
};

// --- Participant Actions ---
export const getParticipantsForGroupAction = async (
  groupId: string
): Promise<Participant[]> => {
  return await getParticipantsForGroup(groupId);
};

export const updateParticipantsForGroupAction = async (
  groupId: string,
  participants: Participant[]
): Promise<void> => {
  return await updateParticipantsForGroup(groupId, participants);
};
