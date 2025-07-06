import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This default instance is configured with the admin/system-level API key
// from the environment variables. It's used for background tasks like memory management.
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});
