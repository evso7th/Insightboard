
'use client';
import { BrainCircuit, Star, Zap } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getNicheExpertise } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { AIInsight } from "../ai-insight";
import { ScrollArea } from "../ui/scroll-area";
import { useMemo } from "react";

const CustomTick = (props: any) => {
  const { x, y, payload } = props;
  const label = payload.value;
  const truncatedLabel = label.length > 25 ? `${label.substring(0, 23)}...` : label;
  
  return (
     <g transform={`translate(${x},${y})`}>
      <title>{label}</title>
      <text x={0} y={0} dy={4} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize={12}>
        {truncatedLabel}
      </text>
    </g>
  );
};

export function NicheExpertiseView({ data }: { data: MessageData[] }) {
  const { uniqueNiches, topNiche, urgentExpertise, nicheData } = useMemo(() => getNicheExpertise(data), [data]);

  const unnamedNicheContext = useMemo(() => {
    const unnamed = nicheData.find(n => n.name === '(Не указана)');
    return unnamed ? unnamed.contextExamples : '';
  }, [nicheData]);

  const aiInput = {
    dataSummary: `Всего уникальных ниш: ${uniqueNiches}, Топ-1 ниша: ${topNiche}, Экспертиз с высокой срочностью: ${urgentExpertise}. Есть большая категория ниш "(Не указана)", примеры контекста из которой: "${unnamedNicheContext}". Данные показывают, какие ниши наиболее упоминаемы.`,
    viewDescription: "Это представление анализирует нишевую или уникальную экспертизу, упомянутую в данных. Оно помогает выявить трендовые специализации. Особое внимание уделяется категории '(Не указана)', чтобы понять ее содержание."
  };
  
  const chartData = nicheData.slice(0, 15).sort((a,b) => a.mentions - b.mentions);

  const chartConfig = {
    mentions: {
      label: "Упоминания",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-3 xl:col-span-3">
        <KpiCard title="Число уникальных ниш" value={uniqueNiches} icon={BrainCircuit} description="Без учета категории '(Не указана)'"/>
        <KpiCard title="Топ-1 ниша по частоте" value={topNiche} icon={Star} />
        <KpiCard title="Экспертиз с высокой срочностью" value={urgentExpertise} icon={Zap} />
      </div>
      
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Топ-15 ниш по количеству упоминаний</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] w-full pl-2">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={200} interval={0} tick={<CustomTick/>} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="mentions" fill="hsl(var(--primary))" name="Упоминания" radius={[0, 4, 4, 0]}>
                   <LabelList dataKey="mentions" position="right" offset={5} fontSize={12} fill="hsl(var(--foreground))" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Данные по нишам</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
           <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ниша</TableHead>
                  <TableHead>Компании</TableHead>
                  <TableHead>Упоминания</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nicheData.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-xs">{row.companies}</TableCell>
                    <TableCell>{row.mentions}</TableCell>
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
