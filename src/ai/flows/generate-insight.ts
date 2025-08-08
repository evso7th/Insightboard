// src/ai/flows/generate-insight.ts
'use server';

/**
 * @fileOverview AI-powered insights generation flow.
 *
 * This file defines a Genkit flow that analyzes input data and provides key insights,
 * highlighting significant trends, anomalies, and correlations.
 *
 * @interface GenerateInsightInput - The input type for the generateInsight function.
 * @interface GenerateInsightOutput - The return type for the generateInsight function.
 * @function generateInsight - A function that handles the insight generation process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInsightInputSchema = z.object({
  dataSummary: z
    .string()
    .describe(
      'A summary of the data to analyze, including key metrics and dimensions.'
    ),
  viewDescription: z
    .string()
    .describe(
      'A description of the current view or perspective on the data being analyzed.'
    ),
});
export type GenerateInsightInput = z.infer<typeof GenerateInsightInputSchema>;

const GenerateInsightOutputSchema = z.object({
  insights: z
    .string()
    .describe(
      'Key insights derived from the data, highlighting significant trends, anomalies, and correlations.'
    ),
});
export type GenerateInsightOutput = z.infer<typeof GenerateInsightOutputSchema>;

export async function generateInsight(input: GenerateInsightInput): Promise<GenerateInsightOutput> {
  return generateInsightFlow(input);
}

const insightPrompt = ai.definePrompt({
  name: 'insightPrompt',
  input: {schema: GenerateInsightInputSchema},
  output: {schema: GenerateInsightOutputSchema},
  prompt: `You are an expert data analyst. Your task is to analyze the provided data summary and generate key insights.

Data Summary: {{{dataSummary}}}
View Description: {{{viewDescription}}}

Based on the data summary and the view description, identify and articulate significant trends, anomalies, and correlations.
Provide these insights in a concise and easily understandable manner.

Insights:`, // Using a more direct prompt for generating insights
});

const generateInsightFlow = ai.defineFlow(
  {
    name: 'generateInsightFlow',
    inputSchema: GenerateInsightInputSchema,
    outputSchema: GenerateInsightOutputSchema,
  },
  async input => {
    const {output} = await insightPrompt(input);
    return output!;
  }
);
