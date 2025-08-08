'use client';
import { BarChart, Briefcase, Calendar, Users } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getGeneralActivityMetrics } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AIInsight } from "../ai-insight";
import { ScrollArea } from "../ui/scroll-area";

export function GeneralActivityView({ data }: { data: MessageData[] }) {
  const { totalEvents, offers, demands, invitations, topParticipant, activityByDate, latestEvents } = getGeneralActivityMetrics(data);

  const chartData = activityByDate.map(d => ({...d, date: new Date(d.date.split('.').reverse().join('-')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}));

  const aiInput = {
    dataSummary: `Total events: ${totalEvents}, Offers: ${offers}, Demands: ${demands}, Invitations: ${invitations}. Activity trends show counts of events per day. Recent events are listed.`,
    viewDescription: "This is a high-level overview of all recorded activities. It shows total counts of different event types, identifies the most active participant, and visualizes the timeline of events."
  };

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-2 xl:col-span-3 xl:grid-cols-4">
        <KpiCard title="Общее число событий" value={totalEvents} icon={BarChart} />
        <KpiCard title="Количество предложений" value={offers} icon={Briefcase} />
        <KpiCard title="Количество запросов" value={demands} icon={Users} />
        <KpiCard title="Топ-1 участник" value={topParticipant} icon={Calendar} description="по активности" />
      </div>
      
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Активность по дням</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false}/>
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                content={<ChartTooltipContent indicator="dot" />}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '3 3' }}
              />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6, fill: 'hsl(var(--primary))' }} name="События"/>
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Последние 20 событий</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
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
                {latestEvents.map((event) => (
                  <TableRow key={event['№ стр.']}>
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
      <div className="xl:col-span-3">
        <AIInsight input={aiInput} />
      </div>
    </div>
  );
}
