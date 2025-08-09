
'use client';
import { useState, useMemo } from "react";
import { Briefcase, Users, Scale, Download } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { getDemandSupplyByRole, getRoleYearlyDemandSupply } from "@/lib/data-processor";
import type { MessageData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { exportToCSV } from "@/lib/utils";

export function DemandSupplyView({ data }: { data: MessageData[] }) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const { rolesInDemand, rolesInSupply, imbalance, roleData, top10RolesChart, uniqueYears } = useMemo(() => {
    return getDemandSupplyByRole(data, selectedYear);
  }, [data, selectedYear]);

  const roleYearlyData = useMemo(() => {
    if (!selectedRole) return [];
    return getRoleYearlyDemandSupply(data, selectedRole);
  }, [data, selectedRole]);
  
  const handleRoleClick = (role: string) => {
    setSelectedRole(prevRole => prevRole === role ? null : role);
  };
  
  const handleYearChange = (year: number | null) => {
    setSelectedYear(year);
    setSelectedRole(null); // Reset role selection when year changes
  }

  const handleExportRoles = () => {
    const headers = ['"Роль"', '"Спрос"', '"Предложение"', '"Баланс"'];
    const dataToExport = roleData.map(row => `"${row.role}",${row.demand},${row.supply},${row.balance}`);
    exportToCSV(headers, dataToExport, `demand_supply_by_role_${selectedYear || 'all_years'}.csv`);
  };

  const chartConfig = {
    demand: {
      label: "Спрос",
      color: "hsl(var(--primary))",
    },
    supply: {
      label: "Предложение",
      color: "hsl(var(--accent))",
    },
  };

  return (
    <div className="grid gap-4 md:gap-8">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <KpiCard title="Всего ролей в спросе" value={rolesInDemand} icon={Users} />
        <KpiCard title="Всего ролей в предложении" value={rolesInSupply} icon={Briefcase} />
        <KpiCard title="Дисбаланс" value={imbalance} icon={Scale} description="(Спрос - Предложение)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>
                  {selectedRole ? `Динамика по роли: ${selectedRole}` : `Спрос и предложение по ТОП-10 ролям`}
                </CardTitle>
                <CardDescription>
                  {selectedRole ? 'Сравнение спроса и предложения по годам' : `Данные за ${selectedYear || 'всё время'}`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant={selectedYear === null ? 'default' : 'outline'} size="sm" onClick={() => handleYearChange(null)}>Все года</Button>
                {uniqueYears.map(year => (
                  <Button key={year} variant={selectedYear === year ? 'default' : 'outline'} size="sm" onClick={() => handleYearChange(year)}>{year}</Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] w-full pl-2">
            {selectedRole ? (
               <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={roleYearlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="year" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Legend wrapperStyle={{fontSize: "12px"}}/>
                  <Bar dataKey="demand" fill="hsl(var(--primary))" name="Спрос" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="supply" fill="hsl(var(--accent))" name="Предложение" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={top10RolesChart} margin={{ top: 5, right: 20, left: 10, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="role" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={80} interval={0}/>
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Legend wrapperStyle={{fontSize: "12px"}}/>
                  <Bar dataKey="demand" fill="hsl(var(--primary))" name="Спрос" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="supply" fill="hsl(var(--accent))" name="Предложение" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Сводная таблица по ролям</CardTitle>
              <CardDescription>Нажмите на строку для просмотра динамики</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportRoles} disabled={roleData.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </CardHeader>
          <CardContent className="h-[350px]">
             <ScrollArea className="h-full">
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
                    <TableRow 
                      key={row.role}
                      onClick={() => handleRoleClick(row.role)}
                      className={`cursor-pointer ${selectedRole === row.role ? 'bg-muted' : ''}`}
                    >
                      <TableCell className="font-medium">{row.role}</TableCell>
                      <TableCell>{row.demand}</TableCell>
                      <TableCell>{row.supply}</TableCell>
                      <TableCell className={row.balance > 0 ? "text-green-600" : row.balance < 0 ? "text-red-600" : ""}>{row.balance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
