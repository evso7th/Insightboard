import type { MessageData } from '@/types';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

// Helper to format date object to DD.MM.YYYY string
const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
};

export const loadSampleData = (): MessageData[] => {
  try {
    const xlsxFilePath = path.join(process.cwd(), 'TG group parsed.xlsx');
    const buf = fs.readFileSync(xlsxFilePath);
    const workbook = XLSX.read(buf, { type: 'buffer', cellDates: true, dateNF: 'dd.mm.yyyy' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Set raw: false to ensure dates are parsed as Date objects
    const json = XLSX.utils.sheet_to_json<MessageData>(worksheet, { raw: false });
    
    // Sanitize data for Next.js serialization
    const sanitizedData = json.map(row => {
        const newRow: Partial<MessageData> = {};
        for (const key in row) {
            const typedKey = key as keyof MessageData;
            let value = row[typedKey];
            
            if (typedKey === 'Дата' && value instanceof Date) {
                 // Format all dates to a consistent string format
                 (newRow as any)[typedKey] = formatDate(value);
            } else if (value instanceof Date) {
                // For other potential date/time fields, just convert to locale string
                (newRow as any)[typedKey] = value.toLocaleTimeString('ru-RU');
            }
             else {
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
