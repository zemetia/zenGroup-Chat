'use server';

import { addApiKey } from '@/lib/services/apiKeyService';
import { z } from 'zod';

const apiKeySchema = z.string().min(10, 'API key must be at least 10 characters long.');

export async function addNewApiKey(apiKey: string) {
  try {
    const validation = apiKeySchema.safeParse(apiKey);
    if (!validation.success) {
      return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
    }

    await addApiKey(apiKey);
    return { success: true };
  } catch (error) {
    console.error('Failed to add API key:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
