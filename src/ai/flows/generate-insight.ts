
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
  prompt: `Ты — эксперт по анализу данных. Твоя задача — проанализировать предоставленную сводку данных и сгенерировать ключевые выводы.

Сводка данных: {{{dataSummary}}}
Описание представления: {{{viewDescription}}}

Основываясь на сводке данных и описании представления, определи и сформулируй значимые тенденции, аномалии и корреляции.

Особое внимание удели следующим аспектам, если они релевантны для текущего представления:

1.  **Анализ поведения участников (компаний и авторов):**
    *   Определи, кто из участников в основном предлагает услуги (перекос в сторону "предложения"), а кто ищет исполнителей (перекос в сторону "спроса").
    *   Отметь, если у кого-то наблюдается смешанная активность.
    *   Сравни поведение компаний и авторов в этом контексте.

2.  **Анализ ниши "(Не указана)":**
    *   Если в данных присутствует категория "(Не указана)", проанализируй примеры контекста из этой категории.
    *   Сделай вывод о том, что в основном содержат эти сообщения: это общие вакансии, запросы на рекомендации, неспецифические предложения услуг или что-то иное?
    *   Оцени, какие роли или технологии чаще всего упоминаются в этих сообщениях без указания конкретной ниши.

Предоставь эти выводы в краткой и понятной форме. Ответ должен быть только на русском языке.

Выводы:`,
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
