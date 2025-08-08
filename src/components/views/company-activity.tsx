
'use client';
import { useState, useMemo } from 'react';
import { Building, Users, Briefcase } from "lucide-react";
import { getCompanyActivity, getCompanyDetail } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { AIInsight } from "../ai-insight";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';

const CustomTick = (props: any) => {
  const { x, y, payload, data } = props;
  const item = data.find((d: any) => d.name === payload.value);
  const isCompany = item && !item.isAuthor;

  const label = payload.value;
  const truncatedLabel = label.length > 20 ? `${label.substring(0, 18)}...` : label;
  
  return (
     <g transform={`translate(${x},${y})`}>
      <title>{label}</title>
      <text x={0} y={0} dy={4} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize={12} fontWeight={isCompany ? 'bold' : 'normal'}>
        {truncatedLabel}
      </text>
    </g>
  );
};

const XAxisRoleTick = (props: any) => {
    const { x, y, payload } = props;
    const label = payload.value;
    const truncatedLabel = label.length > 10 ? `${label.substring(0, 8)}...` : label;
    return (
        <g transform={`translate(${x},${y})`}>
            <title>{label}</title>
            <text x={0} y={0} dy={16} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize={12} transform="rotate(-35)">
                {truncatedLabel}
            </text>
        </g>
    );
};


export function CompanyActivityView({ data }: { data: MessageData[] }) {
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const { topOfferingCompany, topDemandingCompany, topOfferingAuthor, topDemandingAuthor, totalMentions, companyData, top20CompanyChart } = useMemo(() => {
    return getCompanyActivity(data);
  }, [data]);

  const { companyDetails, uniqueYearsInCompany } = useMemo(() => {
    if (!selectedParticipant) return { companyDetails: [], uniqueYearsInCompany: [] };
    return getCompanyDetail(data, selectedParticipant, selectedYear);
  }, [data, selectedParticipant, selectedYear]);

  const handleParticipantSelect = (participant: string) => {
    setSelectedParticipant(participant);
    setSelectedYear(null);
  };

  const handleBackToOverview = () => {
    setSelectedParticipant(null);
    setSelectedYear(null);
  };

  const aiInput = {
    dataSummary: selectedParticipant 
      ? `Анализ для участника "${selectedParticipant}" за ${selectedYear || 'все время'}. Данные показывают спрос и предложение по ролям.`
      : `Топ-1 компания по предложениям: ${topOfferingCompany}, Топ-1 компания по спросу: ${topDemandingCompany}, Общее число упоминаний компаний: ${totalMentions}.`,
    viewDescription: selectedParticipant
      ? `Это детальное представление активности участника "${selectedParticipant}", показывающее разбивку по спросу и предложению для каждой роли.`
      : "Это представление фокусируется на активности различных компаний и участников. Оно определяет ведущих участников по предложениям и спросу и позволяет детализировать данные по каждому из них."
  };

  const chartConfig = {
    offers: { label: "Предложения", color: "hsl(var(--primary))" },
    demands: { label: "Спрос", color: "hsl(var(--accent))" },
  };

  if (selectedParticipant) {
    return (
      <div className="grid gap-4 md:gap-8">
        <div>
          <Button onClick={handleBackToOverview} variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться к списку
          </Button>
          <Card>
            <CardHeader>
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Детализация по участнику: {selectedParticipant}</CardTitle>
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
            <CardContent className="grid gap-6 md:grid-cols-5">
               <div className="h-[400px] w-full md:col-span-3">
                 <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={companyDetails} margin={{ top: 5, right: 20, left: 10, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="role" tick={<XAxisRoleTick/>} height={60} interval={0} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
                      <Bar dataKey="demands" fill="hsl(var(--accent))" name="Спрос" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="offers" fill="hsl(var(--primary))" name="Предложения" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
               <div className="h-[400px] md:col-span-2">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Роль</TableHead>
                        <TableHead>Предл.</TableHead>
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
        </div>
         <AIInsight input={aiInput} />
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Топ по предложениям</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-lg font-bold">{topOfferingCompany}</div>
                <p className="text-xs text-muted-foreground">ТОП-1 Компания</p>
                <div className="text-lg font-bold mt-2">{topOfferingAuthor}</div>
                <p className="text-xs text-muted-foreground">ТОП-1 Автор</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Топ по спросу</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-lg font-bold">{topDemandingCompany}</div>
                <p className="text-xs text-muted-foreground">ТОП-1 Компания</p>
                <div className="text-lg font-bold mt-2">{topDemandingAuthor}</div>
                <p className="text-xs text-muted-foreground">ТОП-1 Автор</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Общее число упоминаний</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalMentions}</div>
                <p className="text-xs text-muted-foreground">Всего компаний и авторов</p>
            </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
            <CardHeader>
            <CardTitle>ТОП-20 компаний по числу предложений</CardTitle>
            <CardDescription>Нажмите на столбец для детализации</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] w-full pl-2">
            <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top20CompanyChart} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }} onClick={(e) => e && e.activePayload && handleParticipantSelect(e.activePayload[0].payload.name)}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" width={150} interval={0} tick={<CustomTick data={top20CompanyChart} />} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="offers" fill="hsl(var(--primary))" name="Предложения" radius={[0, 4, 4, 0]} className="cursor-pointer">
                    <LabelList dataKey="offers" position="right" offset={5} fontSize={12} fill="hsl(var(--foreground))" />
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
            <CardTitle>Активность по компаниям</CardTitle>
            <CardDescription className="text-xs">Если компания не обнаружена в исходных данных, выводится имя автора. Некоторые ники авторов могут совпадать с названиями ролей (например, 'QA').</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
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
                    <TableRow key={row.name} onClick={() => handleParticipantSelect(row.name)} className="cursor-pointer">
                        <TableCell className={row.isAuthor ? '' : 'font-bold'}>{row.name}</TableCell>
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
      </div>

      <AIInsight input={aiInput} />
    </div>
  );
}
