
'use client';
import { Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import React from 'react';
import * as XLSX from 'xlsx';

interface DataUploaderProps {
  onDataLoaded: (data: any[], fileName: string) => void;
}

export function DataUploader({ onDataLoaded }: DataUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name;

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          onDataLoaded(results.data, fileName);
          toast({ title: 'Success', description: 'CSV data loaded successfully.' });
        },
        error: (error: any) => {
          toast({ variant: 'destructive', title: 'Error', description: `Failed to parse CSV: ${error.message}` });
        },
      });
    } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          onDataLoaded(json, fileName);
          toast({ title: 'Success', description: 'JSON data loaded successfully.' });
        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: `Failed to parse JSON: ${error.message}` });
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                onDataLoaded(json, fileName);
                toast({ title: 'Success', description: 'XLSX data loaded successfully.' });
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: `Failed to parse XLSX: ${error.message}` });
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Unsupported file type. Please upload a CSV, JSON or XLSX file.' });
    }

    // Reset file input
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button asChild variant="outline" size="sm">
        <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Загрузить новый файл
        </label>
      </Button>
      <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".csv, .json, .xlsx" ref={fileInputRef} />
    </>
  );
}
