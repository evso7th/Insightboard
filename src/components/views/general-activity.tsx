
'use client';
import { useState, useMemo } from 'react';
import { BarChart, Briefcase, Users, Download } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getGeneralActivityMetrics, getParticipantMetrics } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { ScrollArea } from "../ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { exportToCSV } from '@/lib/utils';

export function GeneralActivityView({ data }: { data: MessageData[] }) {
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const { 
    participantsWithCounts, 
    top10Participants, 
    totalEvents: allEvents,
    uniqueYears,
  } = useMemo(() => {
    return getGeneralActivityMetrics(data);
  }, [data]);
  
  const {
    totalEvents,
    offers,
    demands,
    activityByDate,
    latestEvents,
  } = useMemo(() => {
    const filteredByParticipantData = selectedParticipant
      ? data.filter(d => d['Отправитель'] === selectedParticipant)
      : data;
      
    return getParticipantMetrics(filteredByParticipantData, selectedYear);
  }, [data, selectedParticipant, selectedYear]);

  const handleExportTopParticipants = () => {
    const headers = ['"Участник"', '"События"'];
    const dataToExport = top10Participants.map(row => `"${row.name}",${row.count}`);
    exportToCSV(headers, dataToExport, 'top_10_participants.csv');
  };

  const handleExportLatestEvents = () => {
    const headers = ['"Дата"', '"Отправитель"', '"Тип"', '"Роль"'];
    const dataToExport = latestEvents.map(row => `"${row['Дата']}","${row['Отправитель']}","${row['Тип события']}","${row['Роль']}"`);
    exportToCSV(headers, dataToExport, `latest_events_${selectedParticipant || 'all'}.csv`);
  };

  const chartConfig = {
    count: {
      label: "События",
      color: "hsl(var(--primary))",
    },
  };

  const handleParticipantChange = (value: string | null) => {
    setSelectedParticipant(value === 'all' ? null : value);
  };
  
  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Общее число событий" value={totalEvents} icon={BarChart} />
        <KpiCard title="Количество предложений" value={offers} icon={Briefcase} />
        <KpiCard title="Количество запросов" value={demands} icon={Users} />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Активный участник</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={(value) => handleParticipantChange(value)} value={selectedParticipant || 'all'}>
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
      
      <div className="mb-4 md:mb-8">
        <Card>
          <CardHeader>
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
               <CardTitle>Активность по дням {selectedParticipant ? `- ${selectedParticipant}` : ''}</CardTitle>
               <div className="flex items-center gap-2 flex-wrap">
                <Button variant={selectedYear === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedYear(null)}>Все года</Button>
                {uniqueYears.map(year => (
                  <Button key={year} variant={selectedYear === year ? 'default' : 'outline'} size="sm" onClick={() => setSelectedYear(year)}>{year}</Button>
                ))}
               </div>
            </div>
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
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-4 md:mb-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle>ТОП-10 Участников</CardTitle>
              <Button variant="outline" size="sm" onClick={handleExportTopParticipants} disabled={top10Participants.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
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
                    <TableRow
                        onClick={() => handleParticipantChange(null)}
                        className={`cursor-pointer ${selectedParticipant === null ? 'bg-muted' : ''}`}
                      >
                        <TableCell className="font-medium">Все участники</TableCell>
                        <TableCell className="text-right">{allEvents}</TableCell>
                      </TableRow>
                    {top10Participants.map((p) => (
                      <TableRow 
                        key={p.name}
                        onClick={() => handleParticipantChange(p.name)}
                        className={`cursor-pointer ${selectedParticipant === p.name ? 'bg-muted' : ''}`}
                      >
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
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle>Последние 20 событий {selectedParticipant ? `- ${selectedParticipant}`: ''}</CardTitle>
               <Button variant="outline" size="sm" onClick={handleExportLatestEvents} disabled={latestEvents.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
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
      
    </div>
  );
}
