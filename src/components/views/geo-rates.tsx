
'use client';
import { Globe, RussianRuble,TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getGeoAndRates } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { Pie, PieChart, Tooltip, Cell, Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import { AIInsight } from "../ai-insight";
import { ScrollArea } from "../ui/scroll-area";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))'];

export function GeoRatesView({ data }: { data: MessageData[] }) {
  const { rfShare, averageRate, maxRate, geoSplit, rateData, boxPlotData } = getGeoAndRates(data);

  const aiInput = {
    dataSummary: `RF share of geo: ${rfShare.toFixed(1)}%. Average rate: ${Math.round(averageRate)} руб/ч. Max rate: ${maxRate} руб/ч. Data shows geo distribution and rate analysis by role.`,
    viewDescription: "This view analyzes the geographical distribution of activities and the associated pay rates. It highlights the proportion of domestic versus international activities and provides a breakdown of salary rates by role."
  };

  const chartConfig = {
    value: {
      label: "Count",
    },
    minRate: {
      label: "Мин. ставка",
      color: "hsl(var(--chart-4))",
    },
    averageRate: {
      label: "Сред. ставка",
      color: "hsl(var(--chart-2))",
    },
    maxRate: {
      label: "Макс. ставка",
      color: "hsl(var(--chart-5))",
    },
  };
  
  const geoConfig = {
    РФ: { label: 'РФ' },
    'вне РФ': { label: 'вне РФ' },
    удаленно: { label: 'Удаленно' },
  }

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-3 xl:col-span-3">
        <KpiCard title="Доля РФ" value={`${rfShare.toFixed(1)}%`} icon={Globe} />
        <KpiCard title="Средняя ставка" value={`${Math.round(averageRate)}`} icon={RussianRuble} description="руб/ч" />
        <KpiCard title="Максимальная ставка" value={`${maxRate}`} icon={TrendingUp} description="руб/ч" />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Доля по гео</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] w-full flex items-center justify-center pl-2">
          <ChartContainer config={geoConfig}>
            <PieChart>
              <Tooltip content={<ChartTooltipContent />} />
              <Pie data={geoSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                  return (
                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}>
                {geoSplit.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{fontSize: "12px"}}/>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Ставки по ролям (ТОП-10)</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] w-full pl-2">
            <ChartContainer config={chartConfig}>
                <BarChart data={boxPlotData} margin={{ top: 5, right: 20, left: 10, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="role" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={80} interval={0}/>
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }}/>
                    <Legend wrapperStyle={{fontSize: "12px"}} />
                    <Bar dataKey="averageRate" fill="hsl(var(--chart-2))" name="Сред. ставка" radius={[4, 4, 0, 0]} />
                </BarChart>
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
                  <TableHead>Гео</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rateData.map((row) => (
                  <TableRow key={row.role}>
                    <TableCell className="font-medium">{row.role}</TableCell>
                    <TableCell>{row.averageRate} руб/ч</TableCell>
                    <TableCell>{row.minRate} / {row.maxRate}</TableCell>
                    <TableCell>{row.geo}</TableCell>
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
