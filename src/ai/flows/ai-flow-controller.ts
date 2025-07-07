'use server';

/**
 * @fileOverview An AI flow that allows an individual AI assistant to autonomously decide whether to respond to a message.
 *
 * - controlAiFlow - A function that handles the AI assistant's decision-making process.
 * - ControlAiFlowInput - The input type for the controlAiFlow function.
 * - ControlAiFlowOutput - The return type for the controlAiFlow function.
 */

import { z } from 'genkit';
import { getBotAiInstance } from '../bot-ai-provider';
import Handlebars from 'handlebars';

const ControlAiFlowInputSchema = z.object({
  messageToConsider: z.object({
      authorName: z.string(),
      text: z.string(),
  }).describe("The specific message the AI is currently evaluating."),
  recentHistory: z.string().describe('The last 4 messages in the chat to provide conversational context.'),
  aiParticipant: z.object({
      name: z.string().describe("The AI's own name."),
      persona: z.string().describe("The AI's detailed persona, including tone, expertise, and specific instructions."),
      memories: z.array(z.string()).describe("A list of key facts and summaries the AI has remembered from past conversations."),
  }).describe("The full details of the AI assistant that is making the decision.")
});
export type ControlAiFlowInput = z.infer<typeof ControlAiFlowInputSchema>;

const ControlAiFlowOutputSchema = z.object({
  shouldReply: z.boolean().describe('Whether the AI has decided to reply to the message.'),
  reply: z.string().optional().describe('The content of the AI\'s reply. This should only be present if shouldReply is true.'),
});
export type ControlAiFlowOutput = z.infer<typeof ControlAiFlowOutputSchema>;


const PROMPT_TEMPLATE = `You are an AI assistant in a group chat. Your name is {{aiParticipant.name}} and your persona is: "{{aiParticipant.persona}}".

You must make a STRICT decision about whether to reply to the latest message. Do not reply to be polite or to acknowledge something. ONLY reply if the message meets one of these criteria:
1.  The message directly mentions you by your name, "{{aiParticipant.name}}".
2.  The message is highly and directly relevant to your specific expertise and persona.
3.  The message asks a question you are uniquely qualified to answer based on your expertise.

Analyze the following information:

**Your Memories:**
{{#if aiParticipant.memories}}
{{#each aiParticipant.memories}}
- {{{this}}}
{{/each}}
{{else}}
You have no memories.
{{/if}}

**Recent Chat History (for context):**
{{recentHistory}}

**The Message to Consider:**
{{messageToConsider.authorName}}: "{{messageToConsider.text}}"

---
**Your Task:**
Based on your strict decision framework, your persona, your memories, and the chat context, decide if you should reply.

- If you decide to reply, set "shouldReply" to true and write a concise, relevant response that is consistent with your persona.
- If you decide NOT to reply, set "shouldReply" to false and do not provide a reply.
`;

const compiledTemplate = Handlebars.compile(PROMPT_TEMPLATE);


export async function controlAiFlow(input: ControlAiFlowInput): Promise<ControlAiFlowOutput> {
  // Prevent AI from replying to itself if it was the last one to speak.
  if (input.messageToConsider.authorName === input.aiParticipant.name) {
      return { shouldReply: false };
  }

  const botAi = await getBotAiInstance();
  const finalPrompt = compiledTemplate(input);

  const result = await botAi.generate({
    prompt: finalPrompt,
    model: 'googleai/gemini-2.0-flash',
    output: {
        schema: ControlAiFlowOutputSchema,
    }
  });

  const output = result.output;
  
  // Ensure that if shouldReply is false, reply is not sent.
  if (!output?.shouldReply) {
      return { shouldReply: false };
  }
  return output!;
}
