
'use client';
import { useState } from 'react';
import { BarChart, Briefcase, Calendar, Users } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getGeneralActivityMetrics } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { AIInsight } from "../ai-insight";
import { ScrollArea } from "../ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formatDateForChart = (date: Date): string => {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
};

export function GeneralActivityView({ data }: { data: MessageData[] }) {
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);

  const {
    totalEvents,
    offers,
    demands,
    activityByDate,
    latestEvents,
    participantsWithCounts,
    top10Participants
  } = getGeneralActivityMetrics(data, selectedParticipant);

  const chartData = activityByDate.map(d => ({
    ...d,
    date: d.dateObj ? formatDateForChart(d.dateObj) : d.date
  }));

  const aiInput = {
    dataSummary: `Total events for ${selectedParticipant || 'all users'}: ${totalEvents}, Offers: ${offers}, Demands: ${demands}. Activity trends show counts of events per day.`,
    viewDescription: `This is a high-level overview of activities for ${selectedParticipant || 'all users'}. It shows total counts of different event types and visualizes the timeline of events.`
  };

  const chartConfig = {
    count: {
      label: "События",
      color: "hsl(var(--primary))",
    },
  };

  const handleParticipantChange = (value: string) => {
    setSelectedParticipant(value === 'all' ? null : value);
  };

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Общее число событий" value={totalEvents} icon={BarChart} />
        <KpiCard title="Количество предложений" value={offers} icon={Briefcase} />
        <KpiCard title="Количество запросов" value={demands} icon={Users} />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Активный участник</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handleParticipantChange} defaultValue="all">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите участника" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все участники</SelectItem>
                {participantsWithCounts.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    <div className="flex justify-between w-full">
                      <span>{p.name}</span>
                      <span className="text-muted-foreground ml-4">{p.count}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
      
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Активность по дням {selectedParticipant ? `- ${selectedParticipant}` : ''}</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] w-full">
          <ChartContainer config={chartConfig}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false}/>
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                content={<ChartTooltipContent indicator="dot" />}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '3 3' }}
              />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6, fill: 'hsl(var(--primary))' }} name="События"/>
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 auto-rows-min xl:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>ТОП-10 Участников</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[120px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Участник</TableHead>
                    <TableHead className="text-right">События</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top10Participants.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right">{p.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Последние 20 событий {selectedParticipant ? `- ${selectedParticipant}`: ''}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[140px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Отправитель</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Роль</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestEvents.map((event, index) => (
                    <TableRow key={`${event['№ стр.']}-${index}`}>
                      <TableCell>{event['Дата']}</TableCell>
                      <TableCell>{event['Отправитель']}</TableCell>
                      <TableCell>{event['Тип события']}</TableCell>
                      <TableCell>{event['Роль']}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="xl:col-span-3">
        <AIInsight input={aiInput} />
      </div>
    </div>
  );
}
