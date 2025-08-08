
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
        let allExtractedData: MessageData[] = [];
        let totalProcessedCount = 0;

        for (let i = 0; i < lines.length; i += chunkSize) {
            const chunk = lines.slice(i, i + chunkSize).join('\n');
            if (chunk.trim() === '') continue;

            const result = await extractStructuredData({ rawText: chunk });
            
            // Add the new data and re-calculate line numbers
            const processedDataWithCorrectedLineNumbers = result.extractedData.map((item: any) => {
                const newItem = { ...item, '№ стр.': totalProcessedCount + 1 };
                totalProcessedCount++;
                return newItem;
            });
            allExtractedData = allExtractedData.concat(processedDataWithCorrectedLineNumbers);
        }

        return { data: allExtractedData };

    } catch (error: any) {
        console.error("Error in processChatlogFile action:", error);
        return { error: `An error occurred during chatlog processing: ${error.message}` };
    }
}


export async function loadDefaultXlsxFile() {
    return await loadSampleData();
}
