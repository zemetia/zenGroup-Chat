'use server';

/**
 * @fileOverview An AI flow that enables an AI assistant to analyze new messages,
 * determine if they are relevant or important, and decide whether a response is necessary,
 * ensuring efficient and meaningful contributions to the chat.
 *
 * This file does NOT export a Genkit flow directly. Instead, it exports a function
 * that dynamically creates a Genkit instance with a specific API key to generate a response.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

const ControlAiInputSchema = z.object({
  message: z.string().describe('The content of the message to be analyzed.'),
  chatHistory: z
    .string()
    .describe('The recent chat history to provide context.'),
  aiName: z.string().describe('The name of the AI assistant.'),
  aiPersona: z
    .string()
    .describe(
      'The configured persona of the AI assistant (e.g., tone, expertise).'
    ),
  memories: z
    .array(z.string())
    .optional()
    .describe('A list of relevant memories for this AI, retrieved based on the current query.'),
});
export type ControlAiInput = z.infer<typeof ControlAiInputSchema>;

const ControlAiOutputSchema = z.object({
  shouldReply: z
    .boolean()
    .describe('Whether the AI assistant should reply to the message.'),
  reply: z
    .string()
    .optional()
    .describe("The AI assistant's reply to the message, if shouldReply is true."),
});
export type ControlAiOutput = z.infer<typeof ControlAiOutputSchema>;

export type GetDecisiveAIResponseRequest = ControlAiInput & { apiKey: string };

const promptTemplate = `You are an AI assistant named {{aiName}} with the following persona: {{aiPersona}}.

You are participating in a group chat. Analyze the following message, chat history, and your relevant memories to determine if you should reply.

Here are your relevant memories for this topic:
{{#if memories}}
  {{#each memories}}
  - {{{this}}}
  {{/each}}
{{else}}
  (No relevant memories for this topic)
{{/if}}

Last Message: "{{message}}"

Recent Chat History:
{{chatHistory}}

Your decision framework:
1.  **Direct Engagement is a Priority:** If the message is a direct question to you or mentions you by name ({{aiName}}), you MUST reply. This is your most important rule.
2.  **Contribute Your Expertise:** If the message is highly relevant to your specific expertise ({{aiPersona}}) or your memories, you SHOULD reply to add value.
3.  **Engage with Other AIs:** You can reply to other AIs if you have a significant counter-argument, a supporting point, or a clarifying question. Do not just agree. Add new information or a new perspective.
4.  **Be Conversational:** Your goal is to contribute meaningfully but also to keep the conversation flowing. Don't be overly hesitant. Avoid replying only to simple acknowledgments like "ok" or "thanks".
5.  **Use Your Memories:** When you reply, incorporate relevant memories to show you recall past conversations. Don't just state the memory; use it to inform your response.

Based on your analysis, decide whether you should reply. If so, generate a thoughtful and relevant response. Keep your response concise, as if in a real-time chat.

Your output MUST be in JSON format.

Example:
{
  "shouldReply": true,
  "reply": "That reminds me of when we discussed..."
}

OR

{
  "shouldReply": false
}
`;

/**
 * Generates a response from an AI assistant after it decides whether it should reply.
 * This function creates a temporary Genkit instance with the provided API key.
 * @param request The request object containing the message, context, and API key.
 * @returns A promise that resolves to the AI's response or a decision not to reply.
 */
export async function getDecisiveAIResponse(
  request: GetDecisiveAIResponseRequest
): Promise<ControlAiOutput> {
  const { apiKey, ...controlInput } = request;

  if (!apiKey) {
    console.error(`No API key provided for AI: ${controlInput.aiName}`);
    return { shouldReply: false };
  }

  try {
    const botAI = genkit({
      plugins: [googleAI({ apiKey: apiKey })],
    });

    // Define the prompt dynamically for this instance
    const prompt = botAI.definePrompt({
      name: `decisivePrompt_${controlInput.aiName.replace(/\s+/g, '')}`,
      input: { schema: ControlAiInputSchema },
      output: { schema: ControlAiOutputSchema },
      prompt: promptTemplate,
    });

    const { output } = await prompt(controlInput);
    if (!output) {
      console.error(`AI model failed to return a valid response object for ${controlInput.aiName}. The prompt output was null or undefined.`);
      return { shouldReply: false };
    }
    
    // Log the output for debugging, as requested.
    console.log(`[getDecisiveAIResponse Output for ${controlInput.aiName}]`, output);
    
    return output;
  } catch (error) {
    console.error(
      `AI response generation failed for ${controlInput.aiName}:`,
      error
    );
    // Don't crash the whole app, just fail for this bot.
    return { shouldReply: false };
  }
}
