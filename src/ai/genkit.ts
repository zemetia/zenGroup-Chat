import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { getApiKeys } from '@/lib/services/apiKeyService';
import { ApiKey } from '@/lib/types';

// This default instance is configured with the admin/system-level API key
// from the environment variables. It's used for background tasks like memory management.
export const systemAi = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});

// ChatBot's API Gemini Keys
// Take the Gemini APIs from firebase
const geminiApiKeys: ApiKey[] = await getApiKeys();
export const botAis = geminiApiKeys.map(api => {
  return genkit({
    plugins: [
      googleAI({
        apiKey: api.key,
      }),
    ],
  })
});

