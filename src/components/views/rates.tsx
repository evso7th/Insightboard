
'use client';
import { RussianRuble, BarChart as BarChartIcon } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getGeoAndRates } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { AIInsight } from "../ai-insight";
import { ScrollArea } from "../ui/scroll-area";


export function RatesView({ data }: { data: MessageData[] }) {
  const { validRatesCount, averageRate, rateData, boxPlotData } = getGeoAndRates(data);

  const aiInput = {
    dataSummary: `Найдено ${validRatesCount} валидных ставок. Средняя ставка: ${Math.round(averageRate)} руб/ч. Данные показывают анализ ставок по ролям.`,
    viewDescription: "Это представление анализирует ставки оплаты. Оно показывает средние ставки по самым популярным ролям и предоставляет разбивку по зарплатным ставкам для каждой роли."
  };

  const chartConfig = {
    averageRate: {
      label: "Сред. ставка",
      color: "hsl(var(--chart-2))",
    },
  };
  
  return (
    <div className="grid gap-4 md:gap-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard title="Кол-во найденных ставок" value={validRatesCount} icon={BarChartIcon} />
        <KpiCard title="Средняя ставка" value={`${Math.round(averageRate)}`} icon={RussianRuble} description="руб/ч" />
      </div>
      
      <div className="grid gap-8 lg:grid-cols-2">
         <Card>
            <CardHeader>
            <CardTitle>Средние ставки по ролям (ТОП-10)</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] w-full pl-2">
                <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={boxPlotData} margin={{ top: 20, right: 30, left: 10, bottom: 70 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="role" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={80} interval={0}/>
                            <YAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} domain={['dataMin - 1000', 'auto']} />
                            <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }}/>
                            <Bar dataKey="averageRate" fill="hsl(var(--chart-2))" name="Сред. ставка" radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="averageRate" position="top" offset={5} fontSize={10} fill="hsl(var(--foreground))" formatter={(value: number) => value.toLocaleString()} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Сводная таблица: Ставки по ролям</CardTitle>
                <CardDescription>Все роли, для которых были найдены ставки</CardDescription>
            </CardHeader>
            <CardContent className="h-[385px]">
            <ScrollArea className="h-full">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Роль</TableHead>
                    <TableHead>Сред. ставка</TableHead>
                    <TableHead>Мин/Макс</TableHead>
                    <TableHead>Кол-во ставок</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rateData.map((row) => (
                    <TableRow key={row.role}>
                        <TableCell className="font-medium">{row.role}</TableCell>
                        <TableCell>{row.averageRate} руб/ч</TableCell>
                        <TableCell>{row.minRate} / {row.maxRate}</TableCell>
                        <TableCell>{row.count}</TableCell>
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
