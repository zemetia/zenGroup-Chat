'use server';

/**
 * @fileOverview An AI agent that provides context-aware responses by incorporating recent chat history into its prompts.
 *
 * - getContextAwareResponse - A function that generates context-aware responses.
 * - ContextAwareResponseInput - The input type for the getContextAwareResponse function.
 * - ContextAwareResponseOutput - The return type for the getContextAwareResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContextAwareResponseInputSchema = z.object({
  chatHistory: z
    .string()
    .describe('The recent chat history to provide context for the AI.'),
  userMessage: z.string().describe('The current message from the user.'),
  aiPersona: z.string().describe('The persona of the AI assistant.'),
});
export type ContextAwareResponseInput = z.infer<typeof ContextAwareResponseInputSchema>;

const ContextAwareResponseOutputSchema = z.object({
  response: z.string().describe('The context-aware response from the AI.'),
});
export type ContextAwareResponseOutput = z.infer<typeof ContextAwareResponseOutputSchema>;

export async function getContextAwareResponse(
  input: ContextAwareResponseInput
): Promise<ContextAwareResponseOutput> {
  return contextAwareResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contextAwareResponsePrompt',
  input: {schema: ContextAwareResponseInputSchema},
  output: {schema: ContextAwareResponseOutputSchema},
  prompt: `You are an AI assistant with the following persona: {{{aiPersona}}}.

  You are participating in a chat with a user. The recent chat history is as follows:

  {{chatHistory}}

  The user has just sent the following message:

  {{userMessage}}

  Based on the chat history and the user's message, generate a context-aware response.`,
});

const contextAwareResponseFlow = ai.defineFlow(
  {
    name: 'contextAwareResponseFlow',
    inputSchema: ContextAwareResponseInputSchema,
    outputSchema: ContextAwareResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
