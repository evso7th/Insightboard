
'use server';

import { extractStructuredData } from '@/ai/flows/extract-structured-data';
import { loadSampleData, processChatlog } from "@/lib/data";
import type { MessageData } from '@/types';

export async function processChatlogFile(): Promise<{ data?: MessageData[], error?: string }> {
    try {
        const fileContent = await processChatlog();
        if (fileContent.error) {
            return { error: fileContent.error };
        }
        if (!fileContent.data) {
             return { error: 'No content found in chatlog.txt' };
        }

        const lines = fileContent.data.split('\n');
        const chunkSize = 200; // Process 200 lines at a time
        let allExtractedData: Omit<MessageData, '№ стр.'>[] = [];

        for (let i = 0; i < lines.length; i += chunkSize) {
            const chunk = lines.slice(i, i + chunkSize).join('\n');
            if (chunk.trim() === '') continue;

            const result = await extractStructuredData({ rawText: chunk });
            allExtractedData = allExtractedData.concat(result.extractedData);
        }

        // Add sequential line numbers after all data is collected
        const dataWithLineNumbers = allExtractedData.map((item, index) => ({
            ...item,
            '№ стр.': index + 1,
        }));

        return { data: dataWithLineNumbers };

    } catch (error: any) {
        console.error("Error in processChatlogFile action:", error);
        return { error: `An error occurred during chatlog processing: ${error.message}` };
    }
}


export async function loadDefaultXlsxFile() {
    return await loadSampleData();
}
