
'use client';
import { BrainCircuit, Star, Zap } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getNicheExpertise } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { Scatter, ScatterChart, CartesianGrid, XAxis, YAxis, ZAxis, Tooltip } from "recharts";
import { AIInsight } from "../ai-insight";
import { ScrollArea } from "../ui/scroll-area";

export function NicheExpertiseView({ data }: { data: MessageData[] }) {
  const { uniqueNiches, topNiche, urgentExpertise, nicheData, heatmapData } = getNicheExpertise(data);

  const aiInput = {
    dataSummary: `Total unique niches: ${uniqueNiches}, Top niche: ${topNiche}, Urgent expertise needs: ${urgentExpertise}. The data shows which niches are most mentioned, which companies are associated with them, and provides context examples.`,
    viewDescription: "This view analyzes niche or unique expertise mentioned in the data. It helps identify trending specializations, the companies seeking them, and the urgency associated with these skills."
  };

  const companies = Array.from(new Set(heatmapData.map(d => d.company)));
  const nichesForChart = Array.from(new Set(heatmapData.map(d => d.niche)));

  const chartConfig = {
    mentions: {
      label: "Mentions",
    },
  };

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-3 xl:col-span-3">
        <KpiCard title="Число уникальных ниш" value={uniqueNiches} icon={BrainCircuit} />
        <KpiCard title="Топ-1 ниша по частоте" value={topNiche} icon={Star} />
        <KpiCard title="Экспертиз с высокой срочностью" value={urgentExpertise} icon={Zap} />
      </div>
      
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Карта упоминаний: Ниша × Компания</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] w-full pl-2">
          <ChartContainer config={chartConfig}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 80, left: 120 }}>
              <CartesianGrid />
              <XAxis type="category" dataKey="company" name="Company"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                ticks={companies}
                angle={-45} textAnchor="end" height={80} interval={0}
                />
              <YAxis type="category" dataKey="niche" name="Niche" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                ticks={nichesForChart}
                width={120} interval={0}
               />
              <ZAxis type="number" dataKey="value" range={[100, 500]} name="Mentions" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent />} />
              <Scatter name="Mentions" data={heatmapData} fill="hsl(var(--primary))" shape="circle" />
            </ScatterChart>
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
