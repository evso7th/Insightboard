'use client';
import { Briefcase, Users, Scale } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getDemandSupplyByRole } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AIInsight } from "../ai-insight";
import { ScrollArea } from "../ui/scroll-area";

export function DemandSupplyView({ data }: { data: MessageData[] }) {
  const { rolesInDemand, rolesInSupply, imbalance, roleData, top10RolesChart } = getDemandSupplyByRole(data);
  
  const aiInput = {
    dataSummary: `Total roles in demand: ${rolesInDemand}, Total roles in supply: ${rolesInSupply}, Imbalance: ${imbalance}. The chart compares demand and supply for the top 10 roles. The table provides a full breakdown.`,
    viewDescription: "This view analyzes the job market by comparing demand (requests for roles) versus supply (offers for roles). It highlights which roles are most sought after and which are most available, showing the balance for each."
  };

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-3 xl:col-span-3">
        <KpiCard title="Всего ролей в спросе" value={rolesInDemand} icon={Users} />
        <KpiCard title="Всего ролей в предложении" value={rolesInSupply} icon={Briefcase} />
        <KpiCard title="Дисбаланс" value={imbalance} icon={Scale} description="(Спрос - Предложение)" />
      </div>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Спрос и предложение по ТОП-10 ролям</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top10RolesChart} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="role" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Legend wrapperStyle={{fontSize: "12px"}}/>
              <Bar dataKey="demand" fill="hsl(var(--primary))" name="Спрос" radius={[4, 4, 0, 0]} />
              <Bar dataKey="supply" fill="hsl(var(--accent))" name="Предложение" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Сводная таблица по ролям</CardTitle>
        </CardHeader>
        <CardContent>
           <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Роль</TableHead>
                  <TableHead>Спрос</TableHead>
                  <TableHead>Предложение</TableHead>
                  <TableHead>Баланс</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleData.map((row) => (
                  <TableRow key={row.role}>
                    <TableCell className="font-medium">{row.role}</TableCell>
                    <TableCell>{row.demand}</TableCell>
                    <TableCell>{row.supply}</TableCell>
                    <TableCell className={row.balance > 0 ? "text-green-600" : "text-red-600"}>{row.balance}</TableCell>
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
