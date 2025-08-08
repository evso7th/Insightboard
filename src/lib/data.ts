import type { MessageData } from '@/types';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

export const loadSampleData = (): MessageData[] => {
  try {
    const xlsxFilePath = path.join(process.cwd(), 'TG group parsed.xlsx');
    const buf = fs.readFileSync(xlsxFilePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<MessageData>(worksheet);
    
    return json;

  } catch (error) {
    console.error("Error reading or parsing TG group parsed.xlsx:", error);
    // Fallback to empty array if file is not found or fails to parse
    try {
        // Fallback to CSV if XLSX is not found
        const csvFilePath = path.join(process.cwd(), 'TG group parsed.csv');
        const csvFile = fs.readFileSync(csvFilePath, 'utf8');
        const Papa = require('papaparse');
        const parsed = Papa.parse<MessageData>(csvFile, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            quotes: false,
            transformHeader: (header: string) => header.trim(),
        });
        if (parsed.errors.length > 0) {
            console.error("Errors parsing fallback CSV:", parsed.errors);
        }
        return parsed.data;
    } catch (csvError) {
        console.error("Could not load fallback CSV either:", csvError);
        return [];
    }
  }
};
