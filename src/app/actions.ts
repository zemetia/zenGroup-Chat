'use server';

import { 
    addApiKey,
    deleteApiKey,
    getApiKeys,
    updateApiKeyName
} from '@/lib/services/apiKeyService';
import type { ApiKey } from '@/lib/types';

export const getApiKeysAction = async (): Promise<ApiKey[]> => {
    return await getApiKeys();
}

export const addApiKeyAction = async (name: string, key: string): Promise<ApiKey> => {
    return await addApiKey(name, key);
}

export const updateApiKeyNameAction = async (id: string, name: string): Promise<void> => {
    await updateApiKeyName(id, name);
}

export const deleteApiKeyAction = async (id: string): Promise<void> => {
    await deleteApiKey(id);
}
