
'use client';
import { useState, useMemo } from 'react';
import { BarChart, Briefcase, Users } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getGeneralActivityMetrics, getParticipantMetrics } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { AIInsight } from "../ai-insight";
import { ScrollArea } from "../ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function GeneralActivityView({ data }: { data: MessageData[] }) {
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);

  const { participantsWithCounts } = useMemo(() => getGeneralActivityMetrics(data), [data]);

  const {
    totalEvents,
    offers,
    demands,
    activityByDate,
    latestEvents,
    top10Participants
  } = useMemo(() => {
    const filtered = selectedParticipant
      ? data.filter(d => d['Отправитель'] === selectedParticipant)
      : data;
    
    const metrics = getParticipantMetrics(filtered);
    
    const top10 = getGeneralActivityMetrics(filtered).top10Participants;

    return {
      ...metrics,
      top10Participants: top10,
    };
  }, [data, selectedParticipant]);
  
  const aiInput = {
    dataSummary: `Статистика для ${selectedParticipant || 'всех участников'}: Всего событий - ${totalEvents}, Предложений - ${offers}, Запросов - ${demands}.`,
    viewDescription: `Это общая сводка по активности для ${selectedParticipant || 'всех участников'}. Здесь показаны общие количества различных типов событий и визуализирована динамика активности по времени.`
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
    <div className="flex flex-col gap-4 md:gap-8">
      {/* KPI cards and participant selector */}
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
      
      {/* Chart Container */}
      <Card>
        <CardHeader>
          <CardTitle>Активность по дням {selectedParticipant ? `- ${selectedParticipant}` : ''}</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] w-full pl-2">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart data={activityByDate} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>ТОП-10 Участников</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[240px]">
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
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Последние 20 событий {selectedParticipant ? `- ${selectedParticipant}`: ''}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[240px]">
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
      </div>
      
      <div>
        <AIInsight input={aiInput} />
      </div>
    </div>
  );
}

    