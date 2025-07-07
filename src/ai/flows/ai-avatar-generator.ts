'use server';

/**
 * @fileOverview An AI agent that determines a suitable avatar style (male, female, or neutral) based on an AI's persona.
 *
 * - getAvatarStyle - A function that suggests an avatar style.
 * - AvatarStyleInput - The input type for the getAvatarStyle function.
 * - AvatarStyleOutput - The return type for the getAvatarStyle function.
 */

import {systemAI as ai} from '@/ai/genkit';
import {z} from 'genkit';

const AvatarStyleInputSchema = z.object({
  name: z.string().describe("The AI's name."),
  persona: z.string().describe("The AI's full persona description, including tone, expertise, and instructions."),
});
export type AvatarStyleInput = z.infer<typeof AvatarStyleInputSchema>;

const AvatarStyleOutputSchema = z.object({
  style: z.enum(['boy', 'girl', 'neutral']).describe("The suggested avatar style: 'boy' for male-presenting, 'girl' for female-presenting, or 'neutral' if unclear."),
});
export type AvatarStyleOutput = z.infer<typeof AvatarStyleOutputSchema>;

export async function getAvatarStyle(input: AvatarStyleInput): Promise<AvatarStyleOutput> {
  return avatarStyleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'avatarStylePrompt',
  input: {schema: AvatarStyleInputSchema},
  output: {schema: AvatarStyleOutputSchema},
  prompt: `Analyze the following AI persona to determine a suitable avatar style.
Based on the name and persona, decide if it leans more towards male, female, or is neutral/unspecified.

AI Name: {{{name}}}
AI Persona: {{{persona}}}

Your task is to choose one of the following styles for the avatar: 'boy', 'girl', or 'neutral'.
- If the persona has clear male indicators (name, pronouns, description), choose 'boy'.
- If the persona has clear female indicators, choose 'girl'.
- For anything else (gender-neutral names, non-human concepts, inanimate objects, or if it's ambiguous), choose 'neutral'.

Provide only the determined style.`,
});

const avatarStyleFlow = ai.defineFlow(
  {
    name: 'avatarStyleFlow',
    inputSchema: AvatarStyleInputSchema,
    outputSchema: AvatarStyleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
