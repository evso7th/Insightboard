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
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Use raw: true to get string values, which we will parse manually for consistency
    const json = XLSX.utils.sheet_to_json<MessageData>(worksheet, { raw: true });
    
    // Sanitize data for Next.js serialization
    const sanitizedData = json.map(row => {
        const newRow: Partial<MessageData> = {};
        for (const key in row) {
            const typedKey = key as keyof MessageData;
            let value = (row as any)[typedKey];

            // Manually handle numeric dates from Excel
            if (typedKey === 'Дата' && typeof value === 'number') {
                const date = XLSX.SSF.parse_date_code(value);
                (newRow as any)[typedKey] = `${String(date.d).padStart(2, '0')}.${String(date.m).padStart(2, '0')}.${date.y}`;
            } else if (value === undefined || value === null) {
                (newRow as any)[typedKey] = ''; // Ensure no undefined/null values
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
