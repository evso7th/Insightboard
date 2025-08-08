import type { MessageData } from '@/types';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

export const loadSampleData = (): MessageData[] => {
  try {
    const xlsxFilePath = path.join(process.cwd(), 'TG group parsed.xlsx');
    const buf = fs.readFileSync(xlsxFilePath);
    const workbook = XLSX.read(buf, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Set raw: false to ensure dates are parsed as Date objects
    const json = XLSX.utils.sheet_to_json<MessageData>(worksheet, { raw: false });
    
    // Sanitize data for Next.js serialization
    const sanitizedData = json.map(row => {
        const newRow: Partial<MessageData> = {};
        for (const key in row) {
            const typedKey = key as keyof MessageData;
            const value = row[typedKey];
            if (value instanceof Date) {
                // Check if it's just a time
                if (value.getFullYear() === 1899) {
                     (newRow as any)[typedKey] = value.toLocaleTimeString('ru-RU');
                } else {
                     (newRow as any)[typedKey] = value.toLocaleDateString('ru-RU');
                }
            } else {
                (newRow as any)[typedKey] = value;
            }
        }
        return newRow as MessageData;
    });
    
    return sanitizedData;

  } catch (error) {
    console.error("Error reading or parsing 'TG group parsed.xlsx':", error);
    return [];
  }
};
