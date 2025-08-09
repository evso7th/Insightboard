
'use client';
import { useState, useMemo } from "react";
import { Share2, Users, CalendarCheck, Download, Star, FilterX } from "lucide-react";
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
  const [selectedParticipant, setSelectedParticipant] = useState<{ name: string; type: 'inviter' | 'invitee' } | null>(null);

  const { 
    topInviter, 
    totalInvitations, 
    averageInvitations, 
    networkData, 
    topInvitersChartData, 
    topInvitee,
    inviteeData,
    topInviteesChartData 
  } = useMemo(() => getInvitationNetwork(data), [data]);
  
  const filteredNetworkData = useMemo(() => {
    if (!selectedParticipant) return networkData;
    if (selectedParticipant.type === 'inviter') {
      return networkData.filter(item => item.from.toLowerCase() === selectedParticipant.name.toLowerCase());
    }
    // For invitee, we still show the full network data list but it could be filtered if needed.
    // This implementation filters the "from -> to" table for inviter clicks.
    return networkData.filter(item => item.to.toLowerCase() === selectedParticipant.name.toLowerCase());
  }, [networkData, selectedParticipant]);

  const filteredInviteeData = useMemo(() => {
    if (!selectedParticipant) return inviteeData;
     if (selectedParticipant.type === 'invitee') {
       return inviteeData.filter(item => item.name.toLowerCase() === selectedParticipant.name.toLowerCase());
     }
    return inviteeData;
  }, [inviteeData, selectedParticipant]);


  const handleExportNetwork = () => {
    const headers = ['"Кто пригласил"', '"Кого пригласил"', '"Дата"'];
    const dataToExport = filteredNetworkData.map(row => 
      `"${row.from.replace(/"/g, '""')}","${row.to.replace(/"/g, '""')}","${row.date}"`
    );
    exportToCSV(headers, dataToExport, "invitation_network.csv");
  };

  const handleExportInvitees = () => {
    const headers = ['"Кого пригласили"', '"Кол-во"'];
    const dataToExport = filteredInviteeData.map(row => `"${row.name.replace(/"/g, '""')}",${row.count}`);
    exportToCSV(headers, dataToExport, 'top_invitees.csv');
  };
  
  const handleChartClick = (payload: any, type: 'inviter' | 'invitee') => {
    if (payload && payload.activePayload) {
      const participantName = payload.activePayload[0].payload.name;
      if(selectedParticipant && selectedParticipant.name === participantName && selectedParticipant.type === type) {
        setSelectedParticipant(null); // Deselect if clicking the same bar
      } else {
        setSelectedParticipant({ name: participantName, type });
      }
    }
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
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Топ-1 приглашающий" value={topInviter} icon={Users} />
        <KpiCard title="Топ-1 приглашенный" value={topInvitee} icon={Star} />
        <KpiCard title="Общее число приглашений" value={totalInvitations} icon={Share2} />
        <KpiCard title="Среднее число приглашений" value={averageInvitations.toFixed(2)} icon={CalendarCheck} description="на участника" />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>ТОП-10 приглашающих</CardTitle>
            <CardDescription>Нажмите на столбец для фильтрации таблицы справа</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full pl-2">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topInvitersChartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }} onClick={(e) => handleChartClick(e, 'inviter')}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} interval={0} width={150} />
                  <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Приглашения" radius={[0, 4, 4, 0]} className="cursor-pointer">
                    <LabelList dataKey="count" position="right" offset={5} fontSize={12} fill="hsl(var(--foreground))" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>
                {selectedParticipant && selectedParticipant.type === 'inviter' 
                  ? `Приглашения от: ${selectedParticipant.name}` 
                  : "Список всех приглашений"}
              </CardTitle>
              <CardDescription>Данные в формате "Кто пригласил" → "Кого пригласил"</CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedParticipant && (
                 <Button variant="outline" size="sm" onClick={() => setSelectedParticipant(null)}>
                    <FilterX className="mr-2 h-4 w-4"/>
                    Сбросить
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExportNetwork} disabled={networkData.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
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
                  {filteredNetworkData.map((row, index) => (
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
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>ТОП-10 приглашенных</CardTitle>
            <CardDescription>Нажмите на столбец для фильтрации таблицы справа</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full pl-2">
            <ChartContainer config={chartConfigInvitee}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topInviteesChartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }} onClick={(e) => handleChartClick(e, 'invitee')}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} interval={0} width={150} />
                  <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" name="Получено" radius={[0, 4, 4, 0]} className="cursor-pointer">
                    <LabelList dataKey="count" position="right" offset={5} fontSize={12} fill="hsl(var(--foreground))" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>
                 {selectedParticipant && selectedParticipant.type === 'invitee' 
                  ? `Кого приглашали: ${selectedParticipant.name}`
                  : "Рейтинг приглашенных"}
              </CardTitle>
              <CardDescription>Список всех участников, которых приглашали</CardDescription>
            </div>
             <div className="flex gap-2">
              {selectedParticipant && (
                 <Button variant="outline" size="sm" onClick={() => setSelectedParticipant(null)}>
                    <FilterX className="mr-2 h-4 w-4"/>
                    Сбросить
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExportInvitees} disabled={inviteeData.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
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
                  {filteredInviteeData.map((row, index) => (
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
