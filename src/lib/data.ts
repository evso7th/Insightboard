import type { MessageData } from '@/types';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export const loadSampleData = (): MessageData[] => {
  try {
    const csvFilePath = path.join(process.cwd(), 'TG group parsed.csv');
    const csvFile = fs.readFileSync(csvFilePath, 'utf8');
    
    const parsed = Papa.parse<MessageData>(csvFile, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length) {
      console.error("Errors parsing CSV:", parsed.errors);
    }

    return parsed.data;

  } catch (error) {
    console.error("Error reading or parsing TG group parsed.csv:", error);
    // Fallback to empty array or some default structure if file is not found or fails to parse
    return [];
  }
};

export const sampleData = loadSampleData();
