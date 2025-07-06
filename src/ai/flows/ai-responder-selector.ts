'use server';

/**
 * @fileOverview An AI flow that acts as a chat moderator, selecting the most appropriate AI assistant to respond
 * to a message and generating that response. This consolidates multiple AI checks into a single API call to
 * prevent rate-limiting issues.
 *
 * - selectRespondingAI - The function that handles the AI selection and response generation.
 * - ResponderSelectorInput - The input type for the selectRespondingAI function.
 * - ResponderSelectorOutput - The return type for the selectRespondingAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ResponderSelectorInputSchema = z.object({
  message: z.string().describe('The content of the latest message to be analyzed.'),
  chatHistory: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        text: z.string(),
      })
    )
    .describe('The recent chat history, with IDs for each message.'),
  participants: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        persona: z
          .string()
          .describe(
            'The configured persona of the AI assistant (e.g., tone, expertise).'
          ),
      })
    )
    .describe(
      'A list of available AI assistants that could potentially respond.'
    ),
});
export type ResponderSelectorInput = z.infer<typeof ResponderSelectorInputSchema>;

const ResponderSelectorOutputSchema = z.object({
  shouldReply: z
    .boolean()
    .describe('Whether an AI assistant should reply to the message.'),
  responderId: z
    .string()
    .optional()
    .describe('The ID of the AI assistant that should reply.'),
  replyToId: z
    .string()
    .optional()
    .describe(
      'The ID of the message from the chat history that the AI is directly replying to. Should be omitted if it is not a direct reply.'
    ),
  reply: z
    .string()
    .optional()
    .describe(
      "The AI assistant's reply to the message, if shouldReply is true."
    ),
});
export type ResponderSelectorOutput = z.infer<
  typeof ResponderSelectorOutputSchema
>;

export async function selectRespondingAI(
  input: ResponderSelectorInput
): Promise<ResponderSelectorOutput> {
  // If there are no potential responders, don't even call the AI.
  if (input.participants.length === 0) {
    return {shouldReply: false};
  }
  return responderSelectorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'responderSelectorPrompt',
  input: {schema: ResponderSelectorInputSchema},
  output: {schema: ResponderSelectorOutputSchema},
  prompt: `You are a master chat moderator for a group chat with humans and multiple AI assistants.
Your task is to analyze the latest message in the context of the recent chat history and decide which AI assistant, if any, should reply.

Here are the available AI assistants who can reply:
{{#each participants}}
- ID: {{id}}
  Name: {{name}}
  Persona: {{persona}}
{{/each}}

Here is the recent chat history (from oldest to newest):
{{#each chatHistory}}
- Message ID: {{id}}
  From: {{name}}
  Content: "{{text}}"
{{/each}}

And here is the latest message you must evaluate:
"{{message}}"

Your decision framework:
1.  **Relevance and Value:** An AI should only reply if it can add significant value. Is the message a direct question to an AI? Does it fall into a specific AI's expertise?
2.  **Avoid Noise:** Do not reply to simple acknowledgements ("ok", "thanks", "lol") or messages that don't invite a response. Your goal is to contribute meaningfully, not to be noisy.
3.  **Encourage Discussion:** If the last message was from another AI, consider if one of your available AIs has a significant counter-argument, a supporting point, or a clarifying question. Do not simply agree. Add new information or a new perspective to encourage a discussion.
4.  **Select ONE Responder:** Choose the *single best* AI to respond from the provided list. Do not select an AI that isn't in the list.
5.  **Identify Reply Context:** If your response is a direct reply to a specific message in the history, you MUST provide the ID of that message in the \`replyToId\` field. Otherwise, omit this field.
6.  **Generate the Response:** If you decide an AI should reply, you must generate a thoughtful and relevant response *for that AI*, perfectly matching its name and persona. The reply should be concise, as if in a real-time chat.

Your output MUST be in the specified JSON format.

If you decide a reply is warranted:
{
  "shouldReply": true,
  "responderId": "the-id-of-the-chosen-ai",
  "replyToId": "message-id-being-replied-to",
  "reply": "The generated reply in the voice of the chosen AI..."
}

If no reply is necessary:
{
  "shouldReply": false
}
`,
});

const responderSelectorFlow = ai.defineFlow(
  {
    name: 'responderSelectorFlow',
    inputSchema: ResponderSelectorInputSchema,
    outputSchema: ResponderSelectorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
