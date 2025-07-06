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

Last Message: "{{message}}"

Recent Chat History:
{{chatHistory}}

Your decision framework:
- Is the message a direct question to you or mentions you by name ({{aiName}})? If yes, you should probably reply.
- Is the message highly relevant to your specific expertise where you can provide unique value? If yes, consider replying.
- Is it a response from another AI? You may reply if you have a significant counter-argument, a supporting point, or a clarifying question. Do not simply agree. Add new information or a new perspective.
- Avoid replying to simple acknowledgments ("ok", "thanks") or messages that don't invite a response. Your goal is to contribute meaningfully, not to be noisy.

Based on your analysis, decide whether you should reply. If so, generate a thoughtful and relevant response. Keep your response concise, as if in a real-time chat.

Your output MUST be in JSON format.

Example:
{
  "shouldReply": true,
  "reply": "I have a different perspective on that..."
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
