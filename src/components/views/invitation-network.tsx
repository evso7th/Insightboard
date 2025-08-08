
'use client';
import { Share2, Users, CalendarCheck, Download, Star } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getInvitationNetwork } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { AIInsight } from "../ai-insight";
import { ScrollArea } from "../ui/scroll-area";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { Button } from "../ui/button";
import { exportToCSV } from "@/lib/utils";

export function InvitationNetworkView({ data }: { data: MessageData[] }) {
  const { topInviter, totalInvitations, averageInvitations, networkData, topInvitersChartData, topInvitee, inviteeData, topInviteesChartData } = getInvitationNetwork(data);

  const handleExportNetwork = () => {
    const headers = ['"Кто пригласил"', '"Кого пригласил"', '"Дата"'];
    const dataToExport = networkData.map(row => 
      `"${row.from.replace(/"/g, '""')}","${row.to.replace(/"/g, '""')}","${row.date}"`
    );
    exportToCSV(headers, dataToExport, "invitation_network.csv");
  };

  const handleExportInvitees = () => {
    const headers = ['"Кого пригласили"', '"Кол-во"'];
    const dataToExport = inviteeData.map(row => `"${row.name.replace(/"/g, '""')}",${row.count}`);
    exportToCSV(headers, dataToExport, 'top_invitees.csv');
  };

  const aiInput = {
    dataSummary: `Топ-1 приглашающий: ${topInviter}, Топ-1 приглашенный: ${topInvitee}, Всего приглашений: ${totalInvitations}, Среднее число приглашений на участника: ${averageInvitations.toFixed(2)}. Таблица содержит все связи приглашений "от -> к".`,
    viewDescription: "Это представление отображает сеть приглашений между участниками. Оно показывает, кто кого приглашает, выявляет самых активных приглашающих и самых востребованных участников."
  };

  const chartConfig = {
    count: {
      label: "Приглашения",
      color: "hsl(var(--chart-1))",
    },
  };
  
  const chartConfigInvitee = {
    count: {
      label: "Получено приглашений",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <div className="grid gap-4 md:gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Топ-1 приглашающий" value={topInviter} icon={Users} />
        <KpiCard title="Топ-1 приглашенный" value={topInvitee} icon={Star} />
        <KpiCard title="Общее число приглашений" value={totalInvitations} icon={Share2} />
        <KpiCard title="Среднее число приглашений" value={averageInvitations.toFixed(2)} icon={CalendarCheck} description="на участника" />
      </div>
      
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>ТОП-10 приглашающих</CardTitle>
            <CardDescription>Наиболее активные участники по отправленным приглашениям</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full pl-2">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topInvitersChartData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} interval={0} width={100} />
                  <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Приглашения" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="count" position="right" offset={5} fontSize={12} fill="hsl(var(--foreground))" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ТОП-10 приглашенных</CardTitle>
            <CardDescription>Наиболее востребованные участники</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full pl-2">
            <ChartContainer config={chartConfigInvitee}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topInviteesChartData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} interval={0} width={100} />
                  <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" name="Получено" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="count" position="right" offset={5} fontSize={12} fill="hsl(var(--foreground))" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Список всех приглашений</CardTitle>
              <CardDescription>Данные в формате "Кто пригласил" → "Кого пригласил"</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportNetwork} disabled={networkData.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Выгрузить в CSV
            </Button>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ScrollArea className="h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Кто пригласил</TableHead>
                    <TableHead>Кого пригласил</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {networkData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.from}</TableCell>
                      <TableCell>{row.to}</TableCell>
                      <TableCell>{row.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Рейтинг приглашенных</CardTitle>
              <CardDescription>Список всех участников, которых приглашали</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportInvitees} disabled={inviteeData.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Выгрузить в CSV
            </Button>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ScrollArea className="h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Кого пригласили</TableHead>
                    <TableHead className="text-right">Количество</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inviteeData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
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
