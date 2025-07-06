'use server';

/**
 * @fileOverview An AI agent that helps users optimize their prompts for creating custom AI personas.
 *
 * - optimizeAIPrompt - A function that takes a user's prompt idea and refines it.
 * - OptimizeAIPromptInput - The input type for the optimizeAIPrompt function.
 * - OptimizeAIPromptOutput - The return type for the optimizeAIPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeAIPromptInputSchema = z.object({
  promptIdea: z.string().describe('The user\'s initial idea or draft for the AI persona prompt.'),
});
export type OptimizeAIPromptInput = z.infer<typeof OptimizeAIPromptInputSchema>;

const OptimizeAIPromptOutputSchema = z.object({
  optimizedPrompt: z.string().describe('The AI-refined, optimized prompt for the custom persona.'),
});
export type OptimizeAIPromptOutput = z.infer<typeof OptimizeAIPromptOutputSchema>;

export async function optimizeAIPrompt(input: OptimizeAIPromptInput): Promise<OptimizeAIPromptOutput> {
  return optimizeAIPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeAIPrompt',
  input: {schema: OptimizeAIPromptInputSchema},
  output: {schema: OptimizeAIPromptOutputSchema},
  prompt: `You are an expert in prompt engineering. A user wants to create a custom AI assistant and has provided an idea for its persona. Your task is to refine this idea into a clear, effective, and detailed prompt that will guide the AI's behavior, tone, and responses.

The user's idea is:
"{{promptIdea}}"

Based on this idea, generate an optimized prompt for the "additional instructions" field of the AI's persona configuration. The prompt should be concise but comprehensive enough to establish a distinct personality. Do not add any preamble, just the optimized prompt.`,
});

const optimizeAIPromptFlow = ai.defineFlow(
  {
    name: 'optimizeAIPromptFlow',
    inputSchema: OptimizeAIPromptInputSchema,
    outputSchema: OptimizeAIPromptOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
