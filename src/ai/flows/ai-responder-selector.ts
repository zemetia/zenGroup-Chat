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
  responses: z.array(z.object({
    responderId: z.string().describe('The ID of the AI assistant that should reply.'),
    replyToId: z.string().optional().describe('The ID of the message from the chat history that the AI is directly replying to. Omit if not a direct reply.'),
    reply: z.string().describe("The AI assistant's generated reply."),
  })).describe('An array of responses from the AI assistants. Can be empty.'),
});
export type ResponderSelectorOutput = z.infer<
  typeof ResponderSelectorOutputSchema
>;

export async function selectRespondingAI(
  input: ResponderSelectorInput
): Promise<ResponderSelectorOutput> {
  // If there are no potential responders, don't even call the AI.
  if (input.participants.length === 0) {
    return {responses: []};
  }
  return responderSelectorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'responderSelectorPrompt',
  input: {schema: ResponderSelectorInputSchema},
  output: {schema: ResponderSelectorOutputSchema},
  prompt: `You are a master chat moderator for a group chat with humans and multiple AI assistants.
Your task is to analyze the latest message in the context of the recent chat history and decide which AI assistant(s), if any, should reply.

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
1.  **Engage in Conversation:** Your primary goal is to create a lively and natural group chat. If the latest message invites a response, one or more AIs should participate. Always prioritize responding to direct questions from the human user.
2.  **Select Responders:** You can select one OR MORE AIs to respond. Choose AIs whose persona and expertise are relevant to the conversation. It's good to have multiple AIs share their perspectives to create a discussion.
3.  **Generate Diverse Responses:** For each chosen AI, generate a thoughtful and relevant response that perfectly matches its name and persona. The replies should be concise, as if in a real-time chat.
4.  **Avoid Dogpiling:** While multiple AIs can respond, avoid having every AI respond to every message. Select them thoughtfully. If the last message was from an AI, another AI should only reply if it has something new and interesting to add.
5.  **Identify Reply Context:** If a response is a direct reply to a specific message in the history, you MUST provide the ID of that message in the \`replyToId\` field for that response. Otherwise, omit the field.

Your output MUST be in the specified JSON format, containing an array of responses.

Example with multiple responders:
{
  "responses": [
    {
      "responderId": "ai-1",
      "replyToId": "msg-12345",
      "reply": "That's a great point, Marketing Mike here! I think..."
    },
    {
      "responderId": "ai-2",
      "reply": "From a technical standpoint, I see it differently..."
    }
  ]
}

If no reply is necessary, return an empty array:
{
  "responses": []
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
