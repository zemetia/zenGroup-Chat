'use server';

import { genkit, type Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { getApiKeys } from '@/lib/services/apiKeyService';
import { systemAI } from './genkit';

let botAIs: Genkit[] = [];
let lastFetchedTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
let currentIndex = 0;

async function initializeBotAIs() {
  const now = Date.now();
  if (now - lastFetchedTime > CACHE_DURATION_MS || botAIs.length === 0) {
    try {
      const apiKeys = await getApiKeys();
      if (apiKeys.length > 0) {
        botAIs = apiKeys.map(key => genkit({
          plugins: [googleAI({ apiKey: key.key })],
          model: 'googleai/gemini-2.0-flash',
        }));
        console.log(`Initialized ${botAIs.length} bot AI instances.`);
      } else {
        botAIs = [];
      }
      lastFetchedTime = now;
      currentIndex = 0;
    } catch (error) {
      console.error('Failed to initialize bot AI instances from Firestore:', error);
      // Do not clear existing instances if the fetch fails; use stale data instead.
      if (botAIs.length === 0) {
        console.error("No bot AI instances available.");
      }
    }
  }
}

/**
 * Gets the next AI instance from the pool in a round-robin fashion.
 * Falls back to the system AI if no bot keys are available.
 */
export async function getBotAiInstance(): Promise<Genkit> {
  await initializeBotAIs();
  
  if (botAIs.length === 0) {
    console.warn('No Gemini API keys found in Firestore. Falling back to system API key for bot response.');
    return systemAI;
  }
  
  const aiInstance = botAIs[currentIndex];
  currentIndex = (currentIndex + 1) % botAIs.length;
  return aiInstance;
}
