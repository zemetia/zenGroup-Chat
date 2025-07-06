'use server';

/**
 * @fileOverview Manages an AI's memory through summarization, pruning, and retrieval.
 *
 * - summarizeAndStore - Creates new, concise memory items from a conversation.
 * - pruneMemories - Condenses a list of old memories into a shorter summary.
 * - getRelevantMemories - Retrieves memories relevant to a user's query.
 */

import { systemAi } from '@/ai/genkit';
import { z } from 'zod';

// Summarize and Store
const SummarizeInputSchema = z.object({
  conversationHistory: z.string().describe('The transcript of the recent conversation.'),
  botPersona: z.string().describe("The persona of the bot for which to generate memories."),
});
export type SummarizeInput = z.infer<typeof SummarizeInputSchema>;

const SummarizeOutputSchema = z.object({
  newMemory: z.string().describe('A new, dense, 1-2 sentence memory item summarizing the key points of the conversation. Should be a non-trivial fact or summary. If no key points are found, return an empty string.'),
});
export type SummarizeOutput = z.infer<typeof SummarizeOutputSchema>;

export async function summarizeAndStore(input: SummarizeInput): Promise<SummarizeOutput> {
  return summarizeAndStoreFlow(input);
}

const summarizePrompt = systemAi.definePrompt({
  name: 'summarizeMemoryPrompt',
  input: { schema: SummarizeInputSchema },
  output: { schema: SummarizeOutputSchema },
  prompt: `You are a memory management module for a conversational AI with the following persona: {{botPersona}}.
Your task is to analyze the following conversation transcript and extract the most important, non-trivial facts and key points.
Summarize these points into a single, dense, 1-2 sentence memory item. The summary must be under 100 words.

Do not include trivial chatter, greetings, or acknowledgments. Focus on information that would be important for the bot to remember in future conversations.
If the conversation contains no new, important information worth remembering, return an empty string for the 'newMemory' field.

Conversation Transcript:
---
{{conversationHistory}}
---
`,
});

const summarizeAndStoreFlow = systemAi.defineFlow(
  {
    name: 'summarizeAndStoreFlow',
    inputSchema: SummarizeInputSchema,
    outputSchema: SummarizeOutputSchema,
  },
  async (input) => {
    const { output } = await summarizePrompt(input);
    return output!;
  }
);


// Prune Memories
const PruneInputSchema = z.object({
  memoriesToPrune: z.array(z.string()).describe('A list of older memory items to be condensed.'),
});
export type PruneInput = z.infer<typeof PruneInputSchema>;

const PruneOutputSchema = z.object({
  prunedSummary: z.string().describe('A single, cohesive summary paragraph that merges and condenses the provided memories. The summary must be under 100 words.'),
});
export type PruneOutput = z.infer<typeof PruneOutputSchema>;

export async function pruneMemories(input: PruneInput): Promise<PruneOutput> {
  return pruneMemoriesFlow(input);
}

const prunePrompt = systemAi.definePrompt({
  name: 'pruneMemoriesPrompt',
  input: { schema: PruneInputSchema },
  output: { schema: PruneOutputSchema },
  prompt: `You are a memory management module. Your task is to merge and prune the following list of older memories into a single, tighter, and more comprehensive summary.
The final summary must be under 100 words and capture the essence of all the provided points.

Memories to prune:
{{#each memoriesToPrune}}
- {{{this}}}
{{/each}}
`,
});

const pruneMemoriesFlow = systemAi.defineFlow(
  {
    name: 'pruneMemoriesFlow',
    inputSchema: PruneInputSchema,
    outputSchema: PruneOutputSchema,
  },
  async (input) => {
    const { output } = await prunePrompt(input);
    return output!;
  }
);


// Get Relevant Memories
const RelevantMemoriesInputSchema = z.object({
  query: z.string().describe("The user's current query or message."),
  memoryBank: z.array(z.string()).describe("The bot's entire memory bank."),
});
export type RelevantMemoriesInput = z.infer<typeof RelevantMemoriesInputSchema>;

const RelevantMemoriesOutputSchema = z.object({
  relevantMemories: z.array(z.string()).describe('A list of memory items from the bank that are semantically relevant to the user\'s query.'),
});
export type RelevantMemoriesOutput = z.infer<typeof RelevantMemoriesOutputSchema>;


export async function getRelevantMemories(input: RelevantMemoriesInput): Promise<RelevantMemoriesOutput> {
    if (input.memoryBank.length === 0) {
        return { relevantMemories: [] };
    }
    return getRelevantMemoriesFlow(input);
}


const relevantMemoriesPrompt = systemAi.definePrompt({
  name: 'getRelevantMemoriesPrompt',
  input: { schema: RelevantMemoriesInputSchema },
  output: { schema: RelevantMemoriesOutputSchema },
  prompt: `You are a memory retrieval module. Your task is to select memory items from the memory bank that are most relevant to the user's current query.
Return only the memories that are directly related to the query's topics. Do not return all memories.

User's Query: "{{query}}"

Memory Bank:
{{#each memoryBank}}
- {{{this}}}
{{/each}}
`,
});

const getRelevantMemoriesFlow = systemAi.defineFlow(
  {
    name: 'getRelevantMemoriesFlow',
    inputSchema: RelevantMemoriesInputSchema,
    outputSchema: RelevantMemoriesOutputSchema,
  },
  async (input) => {
    const { output } = await relevantMemoriesPrompt(input);
    return output!;
  }
);
