// This is an AI-only file, so all code here runs on the server.
'use server';

/**
 * @fileOverview Configures the AI assistant's personality based on user-defined characteristics.
 *
 * - configureAIPersona - Configures the AI persona for tailored responses.
 * - ConfigureAIPersonaInput - Input type for configuring the AI persona.
 * - ConfigureAIPersonaOutput - Output type confirming the AI persona configuration.
 */

import {systemAi} from '@/ai/genkit';
import {z} from 'genkit';

const ConfigureAIPersonaInputSchema = z.object({
  tone: z
    .string()
    .describe('The desired tone of the AI assistant (e.g., professional, friendly, humorous).'),
  expertise: z
    .string()
    .describe('The area of expertise for the AI assistant (e.g., marketing, technical support, creative writing).'),
  additionalInstructions: z
    .string()
    .optional()
    .describe('Any other instructions for configuring the AI assistant persona.'),
});
export type ConfigureAIPersonaInput = z.infer<typeof ConfigureAIPersonaInputSchema>;

const ConfigureAIPersonaOutputSchema = z.object({
  confirmationMessage: z
    .string()
    .describe('A message confirming that the AI persona has been configured with the specified characteristics.'),
});
export type ConfigureAIPersonaOutput = z.infer<typeof ConfigureAIPersonaOutputSchema>;

export async function configureAIPersona(input: ConfigureAIPersonaInput): Promise<ConfigureAIPersonaOutput> {
  return configureAIPersonaFlow(input);
}

const configureAIPersonaPrompt = systemAi.definePrompt({
  name: 'configureAIPersonaPrompt',
  input: {schema: ConfigureAIPersonaInputSchema},
  output: {schema: ConfigureAIPersonaOutputSchema},
  prompt: `You are configuring the personality of an AI assistant for a group chat.

  Based on the user's input, you will confirm that the AI persona has been configured with the specified characteristics.
  Tone: {{{tone}}}
  Expertise: {{{expertise}}}
  Additional Instructions: {{{additionalInstructions}}}

  Generate a confirmation message that acknowledges the configuration.
  Confirmation Message: `,
});

const configureAIPersonaFlow = systemAi.defineFlow(
  {
    name: 'configureAIPersonaFlow',
    inputSchema: ConfigureAIPersonaInputSchema,
    outputSchema: ConfigureAIPersonaOutputSchema,
  },
  async input => {
    const {output} = await configureAIPersonaPrompt(input);
    return output!;
  }
);
