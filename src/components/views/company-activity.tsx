
'use client';
import { useState, useMemo } from 'react';
import { Building, Users, Briefcase, ArrowLeft } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getCompanyActivity, getCompanyDetail } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Legend } from "recharts";
import { AIInsight } from "../ai-insight";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from '../ui/button';

const CustomTick = (props: any) => {
  const { x, y, payload, width } = props;
  const label = payload.value;
  // A simple heuristic to truncate long labels, can be improved
  const truncatedLabel = label.length > 20 ? `${label.substring(0, 18)}...` : label;
  return (
     <g transform={`translate(${x},${y})`}>
      <title>{label}</title>
      <text x={0} y={0} dy={4} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize={12}>
        {truncatedLabel}
      </text>
    </g>
  );
};


export function CompanyActivityView({ data }: { data: MessageData[] }) {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const { topOfferingCompany, topDemandingCompany, totalMentions, companyData, top10CompanyChart } = useMemo(() => {
    return getCompanyActivity(data);
  }, [data]);

  const { companyDetails, uniqueYearsInCompany } = useMemo(() => {
    if (!selectedCompany) return { companyDetails: [], uniqueYearsInCompany: [] };
    return getCompanyDetail(data, selectedCompany, selectedYear);
  }, [data, selectedCompany, selectedYear]);

  const handleCompanySelect = (company: string) => {
    setSelectedCompany(company);
    setSelectedYear(null);
  };

  const handleBackToOverview = () => {
    setSelectedCompany(null);
    setSelectedYear(null);
  };

  const aiInput = {
    dataSummary: selectedCompany 
      ? `Анализ для компании "${selectedCompany}" за ${selectedYear || 'все время'}. Данные показывают спрос и предложение по ролям.`
      : `Топ-1 компания по предложениям: ${topOfferingCompany}, Топ-1 компания по спросу: ${topDemandingCompany}, Общее число упоминаний компаний: ${totalMentions}.`,
    viewDescription: selectedCompany
      ? `Это детальное представление активности компании "${selectedCompany}", показывающее разбивку по спросу и предложению для каждой роли.`
      : "Это представление фокусируется на активности различных компаний. Оно определяет ведущие компании по предложениям и спросу и позволяет детализировать данные по каждой из них."
  };

  const chartConfig = {
    offers: { label: "Предложения", color: "hsl(var(--primary))" },
    demands: { label: "Спрос", color: "hsl(var(--accent))" },
  };

  if (selectedCompany) {
    return (
      <div className="flex flex-col gap-4">
        <Button onClick={handleBackToOverview} variant="ghost" className="self-start">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться к списку компаний
        </Button>
        <Card>
          <CardHeader>
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Детализация по компании: {selectedCompany}</CardTitle>
                <CardDescription>Спрос и предложение по ролям за {selectedYear || 'все время'}</CardDescription>
              </div>
               <div className="flex items-center gap-2 flex-wrap">
                <Button variant={selectedYear === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedYear(null)}>Все года</Button>
                {uniqueYearsInCompany.map(year => (
                  <Button key={year} variant={selectedYear === year ? 'default' : 'outline'} size="sm" onClick={() => setSelectedYear(year)}>{year}</Button>
                ))}
               </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="h-[350px] w-full pl-2">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={companyDetails} margin={{ top: 5, right: 20, left: 10, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="role" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={80} interval={0}/>
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Legend wrapperStyle={{fontSize: "12px"}}/>
                  <Bar dataKey="demands" fill="hsl(var(--accent))" name="Спрос" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="offers" fill="hsl(var(--primary))" name="Предложения" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
             <div className="h-[350px]">
              <ScrollArea className="h-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Роль</TableHead>
                      <TableHead>Предложения</TableHead>
                      <TableHead>Спрос</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyDetails.map((row) => (
                      <TableRow key={row.role}>
                        <TableCell className="font-medium">{row.role}</TableCell>
                        <TableCell>{row.offers}</TableCell>
                        <TableCell>{row.demands}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
             </div>
          </CardContent>
        </Card>
         <AIInsight input={aiInput} />
      </div>
    )
  }

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
          <CardDescription>Нажмите на столбец для детализации</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] w-full pl-2">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart data={top10CompanyChart} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }} onClick={(e) => e && e.activePayload && handleCompanySelect(e.activePayload[0].payload.name)}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={150} interval={0} tick={<CustomTick />} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Bar dataKey="offers" fill="hsl(var(--primary))" name="Предложения" radius={[0, 4, 4, 0]} className="cursor-pointer">
                 <LabelList dataKey="offers" position="right" offset={5} fontSize={12} fill="hsl(var(--foreground))" />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Активность компаний</CardTitle>
          <CardDescription>Нажмите на строку для детализации</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
           <ScrollArea className="h-full">
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
                  <TableRow key={row.name} onClick={() => handleCompanySelect(row.name)} className="cursor-pointer">
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
