'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AIInsightProps {
  input: {
    dataSummary: string;
    viewDescription: string;
  };
}

// ЗАМЕНИТЕ ЭТОТ URL НА URL ВАШЕГО API-ПОСРЕДНИКА
const API_ENDPOINT_URL = 'YOUR_API_ENDPOINT_URL';

export function AIInsight({ input }: AIInsightProps) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (API_ENDPOINT_URL === 'YOUR_API_ENDPOINT_URL') {
      setError('Пожалуйста, укажите URL вашего API-посредника в файле src/components/ai-insight.tsx');
      return;
    }

    setLoading(true);
    setError('');
    setInsight('');
    try {
      const response = await fetch(API_ENDPOINT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.insights) {
        throw new Error("Ответ от API не содержит поля 'insights'");
      }

      setInsight(result.insights);

    } catch (e: any) {
      setError(`Не удалось сгенерировать аналитику. ${e.message}. Попробуйте снова.`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-primary/5 border-primary/20 shadow-inner">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold text-primary/90 flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Аналитика от ИИ
        </CardTitle>
        <Button onClick={handleGenerate} disabled={loading} size="sm" variant="outline" className="bg-background/80 hover:bg-background">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Генерация...' : 'Сгенерировать'}
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {loading && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Анализ данных...</p>}
        {error && 
          <Alert variant="destructive">
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        }
        {insight && <p className="text-sm text-foreground/90 whitespace-pre-wrap font-sans">{insight}</p>}
        {!loading && !insight && !error && <p className="text-sm text-muted-foreground">Нажмите "Сгенерировать", чтобы получить аналитику для этого представления.</p>}
      </CardContent>
    </Card>
  );
}
