
'use server';

/**
 * @fileOverview An AI flow to extract structured data from raw text logs.
 *
 * This file defines a Genkit flow that takes a string of raw text (e.g., from a chat log),
 * analyzes it, and extracts structured information conforming to the MessageData schema.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Zod schema based on the MessageData type from src/types/index.ts
const MessageDataSchema = z.object({
  '№ стр.': z.number().describe('Line number, just use index of creation'),
  'Дата': z.string().describe('Date in DD.MM.YYYY format'),
  'Время': z.string().describe('Time in HH:MM:SS format'),
  'Отправитель': z.string().describe('Sender\'s name'),
  'Тип события': z.enum(['предложение', 'спрос', 'приглашение', 'событие']).describe('Type of event. Use "спрос" for requests/vacancies, "предложение" for offers.'),
  'Роль': z.string().describe('Job role or position mentioned.'),
  'Технологии': z.string().describe('Comma-separated list of technologies.'),
  'Компания': z.string().describe('Company name if mentioned.'),
  'Формат': z.string().describe('Work format (e.g., удаленка, фулл-тайм, гибрид).'),
  'Ставка (руб/ч)': z.union([z.number(), z.string(), z.null()]).describe('Hourly rate in RUB.'),
  'Срочность': z.enum(['regular', 'urgent', 'immediate']).describe('Urgency of the message.'),
  'Длительность (мес)': z.union([z.number(), z.null()]).describe('Duration in months.'),
  'Отрасль': z.string().describe('Industry or domain.'),
  'Контекст': z.string().describe('The full original message text.'),
  'Связь (from → to)': z.string().describe('If it is an invitation, this field contains the invited person\'s name.'),
  'Ниша / уникальная экспертиза': z.string().describe('Niche or unique expertise.'),
  'Гео / локация': z.string().describe('Geo-location.'),
});

const ExtractStructuredDataInputSchema = z.object({
  rawText: z.string().describe('The raw text content from a chat log file.'),
});

const ExtractStructuredDataOutputSchema = z.object({
  extractedData: z.array(MessageDataSchema).describe('An array of structured data objects extracted from the text.'),
});

export type ExtractStructuredDataInput = z.infer<typeof ExtractStructuredDataInputSchema>;
export type ExtractStructuredDataOutput = z.infer<typeof ExtractStructuredDataOutputSchema>;

export async function extractStructuredData(input: ExtractStructuredDataInput): Promise<ExtractStructuredDataOutput> {
  return extractStructuredDataFlow(input);
}

const extractorPrompt = ai.definePrompt({
  name: 'extractStructuredDataPrompt',
  input: { schema: ExtractStructuredDataInputSchema },
  output: { schema: ExtractStructuredDataOutputSchema },
  prompt: `You are an expert data analyst tasked with parsing a raw text log from a chat group and converting it into structured data.
Analyze the entire provided text. Identify every message that appears to be a job vacancy (спрос), a service offer (предложение), or an invitation (приглашение).
For each such message, extract the relevant information and create a JSON object that conforms to the provided output schema.

Here are detailed instructions for each field:
- '№ стр.': Use the index of the object you are creating in the array, starting from 1.
- 'Дата': Extract the date of the message. The date might be at the top of a block of messages.
- 'Время': Extract the timestamp of the message.
- 'Отправитель': Extract the name of the person who sent the message.
- 'Тип события': Classify the message. Use 'спрос' for job postings, requests for specialists. Use 'предложение' for offers of services or candidates. Use 'приглашение' if someone is clearly inviting another person (often indicated by 'In reply to this message' and text in 'Связь (from → to)'). Use 'событие' for other relevant but uncategorized messages.
- 'Роль': Identify the job title or role being discussed (e.g., 'QA', 'Frontend-разработчик').
- 'Компания': If a company name is mentioned, extract it. If not, leave it empty.
- 'Формат': Extract the work format, like 'удаленка', 'фулл-тайм', 'гибрид', 'проект'.
- 'Ставка (руб/ч)': If an hourly rate or salary is mentioned, extract it. Try to normalize it to an hourly rate in rubles if possible, otherwise, keep the original string.
- 'Контекст': Use the full, original text of the message as the context.
- 'Связь (from → to)': If a message is a reply and seems to be an invitation, put the name of the person being replied to here.
- For all other fields ('Технологии', 'Срочность', 'Длительность (мес)', 'Отрасль', 'Ниша / уникальная экспертиза', 'Гео / локация'), extract the information if it's present. If not, leave the fields as empty strings or null where appropriate.

Ignore simple conversational messages like "Локация?" or "И как? довольны?". Focus only on messages with substantive offers, requests, or event details.

Your entire output must be a single JSON object with one key: "extractedData", which should be an array of objects matching the schema. Do NOT output anything else.

Raw text to analyze:
{{{rawText}}}
`,
  config: {
    json: true,
  },
});

const extractStructuredDataFlow = ai.defineFlow(
  {
    name: 'extractStructuredDataFlow',
    inputSchema: ExtractStructuredDataInputSchema,
    outputSchema: ExtractStructuredDataOutputSchema,
  },
  async (input) => {
    const llmResponse = await extractorPrompt(input);
    const output = llmResponse.output;

    if (!output) {
      throw new Error("AI failed to return structured data.");
    }
    
    // Ensure line numbers are sequential
    const dataWithSequentialLineNumbers = output.extractedData.map((item, index) => ({
      ...item,
      '№ стр.': index + 1,
    }));
    
    return { extractedData: dataWithSequentialLineNumbers };
  }
);
