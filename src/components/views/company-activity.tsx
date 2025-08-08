
'use client';
import { Building, Users, Briefcase } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getCompanyActivity } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LabelList } from "recharts";
import { AIInsight } from "../ai-insight";
import { ScrollArea } from "../ui/scroll-area";

export function CompanyActivityView({ data }: { data: MessageData[] }) {
  const { topOfferingCompany, topDemandingCompany, totalMentions, companyData, top10CompanyChart } = getCompanyActivity(data);

  const aiInput = {
    dataSummary: `Top offering company: ${topOfferingCompany}, Top demanding company: ${topDemandingCompany}, Total company mentions: ${totalMentions}. The chart and table show offers, demands, and unique roles per company.`,
    viewDescription: "This view focuses on the activity of different companies in the dataset. It identifies the top companies for offering positions and for seeking talent, and provides a breakdown of their activity levels."
  };

  const chartConfig = {
    offers: {
      label: "Предложения",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-3 xl:col-span-3">
        <KpiCard title="Топ-1 компания по предложениям" value={topOfferingCompany} icon={Briefcase} />
        <KpiCard title="Топ-1 компания по спросу" value={topDemandingCompany} icon={Users} />
        <KpiCard title="Общее число упоминаний" value={totalMentions} icon={Building} />
      </div>
      
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>ТОП-10 компаний по числу предложений</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          <ChartContainer config={chartConfig}>
            <BarChart data={top10CompanyChart} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Bar dataKey="offers" fill="hsl(var(--primary))" name="Предложения" radius={[0, 4, 4, 0]}>
                 <LabelList dataKey="offers" position="right" offset={5} fontSize={12} fill="hsl(var(--foreground))" />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Активность компаний</CardTitle>
        </CardHeader>
        <CardContent>
           <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Компания</TableHead>
                  <TableHead>Предложения</TableHead>
                  <TableHead>Спрос</TableHead>
                  <TableHead>Уник. роли</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyData.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.offers}</TableCell>
                    <TableCell>{row.demands}</TableCell>
                    <TableCell>{row.uniqueRoles}</TableCell>
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
