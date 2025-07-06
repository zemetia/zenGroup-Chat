'use server';

/**
 * @fileOverview An AI flow that enables the AI assistant to analyze new messages,
 * determine if they are relevant or important, and decide whether a response is necessary,
 * ensuring efficient and meaningful contributions to the chat.
 *
 * - controlAiFlow - A function that handles the AI assistant's decision-making process for responding to messages.
 * - ControlAiInput - The input type for the controlAiFlow function.
 * - ControlAiOutput - The return type for the controlAiFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ControlAiInputSchema = z.object({
  message: z.string().describe('The content of the message to be analyzed.'),
  chatHistory: z.string().describe('The recent chat history to provide context.'),
  aiName: z.string().describe('The name of the AI assistant.'),
  aiPersona: z.string().describe('The configured persona of the AI assistant (e.g., tone, expertise).'),
});
export type ControlAiInput = z.infer<typeof ControlAiInputSchema>;

const ControlAiOutputSchema = z.object({
  shouldReply: z.boolean().describe('Whether the AI assistant should reply to the message.'),
  reply: z.string().optional().describe('The AI assistant\'s reply to the message, if shouldReply is true.'),
});
export type ControlAiOutput = z.infer<typeof ControlAiOutputSchema>;

export async function controlAi(input: ControlAiInput): Promise<ControlAiOutput> {
  return controlAiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'controlAiPrompt',
  input: {schema: ControlAiInputSchema},
  output: {schema: ControlAiOutputSchema},
  prompt: `You are an AI assistant named {{aiName}} with the following persona: {{aiPersona}}.

You are participating in a group chat. Analyze the following message and the recent chat history to determine if you should reply.

Message: {{message}}

Recent Chat History: {{chatHistory}}

Consider the following factors:
- Is the message relevant to your expertise or interests?
- Does the message tag you directly?
- Is the message important or urgent?

Based on your analysis, decide whether you should reply. If you should reply, generate a thoughtful and relevant response. Keep your response concise and to the point. Only provide a longer explanation if it is truly necessary to be helpful or if your persona dictates it. Avoid unnecessarily long messages.

Output your decision as a boolean value for shouldReply. If shouldReply is true, also output your reply.

Your output MUST be in JSON format.

Example:
{
  "shouldReply": true,
  "reply": "I agree with your assessment."
}

OR

{
  "shouldReply": false
}
`,
});

const controlAiFlow = ai.defineFlow(
  {
    name: 'controlAiFlow',
    inputSchema: ControlAiInputSchema,
    outputSchema: ControlAiOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
