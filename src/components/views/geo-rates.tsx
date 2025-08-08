
'use client';
import { Globe, RussianRuble, BarChart as BarChartIcon } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getGeoAndRates } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { AIInsight } from "../ai-insight";
import { ScrollArea } from "../ui/scroll-area";


export function GeoRatesView({ data }: { data: MessageData[] }) {
  const { uniqueLocations, validRatesCount, averageRate, allLocations, rateData, boxPlotData } = getGeoAndRates(data);

  const aiInput = {
    dataSummary: `Найдено ${validRatesCount} валидных ставок. Средняя ставка: ${Math.round(averageRate)} руб/ч. Обнаружено ${uniqueLocations} уникальных локаций. Данные показывают распределение по географии и анализ ставок по ролям.`,
    viewDescription: "Это представление анализирует географическое распределение активностей и связанные с ними ставки оплаты. Оно показывает распределение по самым популярным локациям и предоставляет разбивку по зарплатным ставкам для каждой роли."
  };

  const chartConfig = {
    averageRate: {
      label: "Сред. ставка",
      color: "hsl(var(--chart-2))",
    },
    locations: {
      label: "Локации",
      color: "hsl(var(--chart-1))"
    }
  };
  

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-3 xl:col-span-3">
        <KpiCard title="Кол-во уникальных локаций" value={uniqueLocations} icon={Globe} />
        <KpiCard title="Кол-во найденных ставок" value={validRatesCount} icon={BarChartIcon} />
        <KpiCard title="Средняя ставка" value={`${Math.round(averageRate)}`} icon={RussianRuble} description="руб/ч" />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Распределение по локациям</CardTitle>
          <CardDescription>Все найденные уникальные локации</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] w-full">
          {allLocations && allLocations.length > 0 ? (
             <ScrollArea className="h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Локация</TableHead>
                    <TableHead className="text-right">Упоминания</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLocations.map((loc) => (
                    <TableRow key={loc.name}>
                      <TableCell className="font-medium">{loc.name}</TableCell>
                      <TableCell className="text-right">{loc.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center text-muted-foreground flex items-center justify-center h-full">
              <div>
                <Globe className="mx-auto h-12 w-12 mb-4" />
                <p>Нет данных по локациям.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
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

      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Сводная таблица: Ставки по ролям</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
           <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Роль</TableHead>
                  <TableHead>Сред. ставка</TableHead>
                  <TableHead>Мин/Макс</TableHead>
                  <TableHead>Локации</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rateData.map((row) => (
                  <TableRow key={row.role}>
                    <TableCell className="font-medium">{row.role}</TableCell>
                    <TableCell>{row.averageRate} руб/ч</TableCell>
                    <TableCell>{row.minRate} / {row.maxRate}</TableCell>
                    <TableCell className="text-xs">{row.geo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="xl:col-span-3">
        <AIInsight input={aiInput} />
      </div>
    </div>
  );
}


    