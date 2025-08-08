'use client';
import { Share2, Users, CalendarCheck } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getInvitationNetwork } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { AIInsight } from "../ai-insight";
import { ScrollArea } from "../ui/scroll-area";

export function InvitationNetworkView({ data }: { data: MessageData[] }) {
  const { topInviter, totalInvitations, averageInvitations, networkData } = getInvitationNetwork(data);

  const aiInput = {
    dataSummary: `Топ-1 приглашающий: ${topInviter}, Всего приглашений: ${totalInvitations}, Среднее число приглашений на участника: ${averageInvitations.toFixed(2)}. Таблица содержит все связи приглашений "от -> к".`,
    viewDescription: "Это представление отображает сеть приглашений между участниками. Оно показывает, кто кого приглашает, выявляет самых активных приглашающих и количественно оценивает общую активность по приглашениям."
  };

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-3 xl:col-span-3">
        <KpiCard title="Топ-1 приглашающий" value={topInviter} icon={Users} />
        <KpiCard title="Общее число приглашений" value={totalInvitations} icon={Share2} />
        <KpiCard title="Среднее число приглашений" value={averageInvitations.toFixed(2)} icon={CalendarCheck} description="на участника" />
      </div>
      
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Интерактивный сетевой граф</CardTitle>
          <CardDescription>Визуализация связей (from → to)</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full flex items-center justify-center bg-muted/50 rounded-lg">
          <div className="text-center text-muted-foreground p-4">
            <Share2 className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold">Network Graph Placeholder</h3>
            <p className="text-sm">An interactive force-directed graph visualizing the invitation network would be rendered here.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список приглашений</CardTitle>
        </CardHeader>
        <CardContent>
           <ScrollArea className="h-[300px]">
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
      <div className="xl:col-span-3">
        <AIInsight input={aiInput} />
      </div>
    </div>
  );
}
