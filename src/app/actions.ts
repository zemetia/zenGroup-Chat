'use server';

import { addApiKey, deleteApiKey, getApiKeys } from '@/lib/services/apiKeyService';
import type { ApiKey } from '@/lib/types';
import { z } from 'zod';

const addApiKeySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  key: z.string().min(10, 'API key must be at least 10 characters long.'),
});

export async function addNewApiKey(data: { name: string; key: string }) {
  try {
    const validation = addApiKeySchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
    }

    await addApiKey(data.name, data.key);
    return { success: true };
  } catch (error) {
    console.error('Failed to add API key:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function getApiKeysAction(): Promise<ApiKey[]> {
  try {
    return await getApiKeys();
  } catch (error) {
    console.error('Failed to get API keys:', error);
    return [];
  }
}

export async function deleteApiKeyAction(id: string) {
  try {
    if (!id) {
        return { success: false, error: 'No ID provided.' };
    }
    await deleteApiKey(id);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete API key:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
