
'use client';
import { useMemo } from 'react';
import { Briefcase, Users, Download, Scale } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getWorkFormatAnalysis } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AIInsight } from "../ai-insight";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { exportToCSV } from "@/lib/utils";

export function WorkFormatView({ data }: { data: MessageData[] }) {
  const { topDemandedFormat, topOfferedFormat, formatData, chartData } = useMemo(() => getWorkFormatAnalysis(data), [data]);

  const handleExportFormats = () => {
    const headers = ['"Формат"', '"Спрос"', '"Предложение"', '"Баланс"'];
    const dataToExport = formatData.map(row => `"${row.format}",${row.demand},${row.supply},${row.balance}`);
    exportToCSV(headers, dataToExport, 'work_format_analysis.csv');
  };

  const aiInput = {
    dataSummary: `Самый востребованный формат (спрос): ${topDemandedFormat}. Самый предлагаемый формат: ${topOfferedFormat}.`,
    viewDescription: "Это представление анализирует популярность различных форматов работы, сравнивая спрос и предложение на фулл-тайм, удаленку, проектную работу и т.д."
  };

  const chartConfig = {
    demand: { label: "Спрос", color: "hsl(var(--primary))" },
    supply: { label: "Предложение", color: "hsl(var(--accent))" },
  };
  
  return (
    <div className="grid gap-4 md:gap-8">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Самый популярный формат в спросе" value={topDemandedFormat} icon={Users} />
        <KpiCard title="Самый популярный формат в предложениях" value={topOfferedFormat} icon={Briefcase} />
        <KpiCard title="Всего форматов" value={formatData.length} icon={Scale} description="упомянутых в данных"/>

      </div>
      
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
         <Card>
            <CardHeader>
              <CardTitle>Спрос и предложение по форматам работы</CardTitle>
            </CardHeader>
            <CardContent className="h-[450px] w-full pl-2">
                <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="format" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={60} interval={0}/>
                            <YAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                            <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }}/>
                            <Legend wrapperStyle={{fontSize: "12px"}}/>
                            <Bar dataKey="demand" fill="hsl(var(--primary))" name="Спрос" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="supply" fill="hsl(var(--accent))" name="Предложение" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>Сводная таблица по форматам</CardTitle>
                  <CardDescription>Все форматы, найденные в данных</CardDescription>
                </div>
                 <Button variant="outline" size="sm" onClick={handleExportFormats} disabled={formatData.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                </Button>
            </CardHeader>
            <CardContent className="h-[485px]">
              <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                        <TableRow>
                          <TableHead>Формат</TableHead>
                          <TableHead>Спрос</TableHead>
                          <TableHead>Предложение</TableHead>
                          <TableHead>Баланс</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {formatData.map((row) => (
                        <TableRow key={row.format}>
                            <TableCell className="font-medium">{row.format}</TableCell>
                            <TableCell>{row.demand}</TableCell>
                            <TableCell>{row.supply}</TableCell>
                            <TableCell className={row.balance > 0 ? "text-green-600" : row.balance < 0 ? "text-red-600" : ""}>{row.balance}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                  </Table>
              </ScrollArea>
            </CardContent>
        </Card>
      </div>

      <AIInsight input={aiInput} />
    </div>
  );
}
