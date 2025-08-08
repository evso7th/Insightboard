
"use client";

import { useState } from 'react';
import type { MessageData } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralActivityView } from './views/general-activity';
import { DemandSupplyView } from './views/demand-supply';
import { CompanyActivityView } from './views/company-activity';
import { NicheExpertiseView } from './views/niche-expertise';
import { RatesView } from './views/rates';
import { InvitationNetworkView } from './views/invitation-network';
import { WorkFormatView } from './views/work-format';
import { useToast } from '@/hooks/use-toast';

interface DashboardProps {
  initialData: MessageData[];
}

export default function Dashboard({ initialData }: DashboardProps) {
  const [data, setData] = useState<MessageData[]>(initialData);
  const [activeFileName, setActiveFileName] = useState<string>("TG group parsed.xlsx");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight">InsightBoard</h1>
        <div className="flex items-center gap-4">
            <div className="flex flex-col items-end text-right">
                <p className="text-xs text-muted-foreground mt-1">
                    Активный файл: <span className="font-semibold">{activeFileName}</span>
                </p>
            </div>
        </div>
      </div>
      
      <Tabs defaultValue="general-activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general-activity">Общая активность</TabsTrigger>
          <TabsTrigger value="demand-supply">Спрос vs Предложение</TabsTrigger>
          <TabsTrigger value="company-activity">Активность по компаниям</TabsTrigger>
          <TabsTrigger value="niche-expertise">Нишевые экспертизы</TabsTrigger>
          <TabsTrigger value="geo-rates">Ставки</TabsTrigger>
          <TabsTrigger value="invitation-network">Сеть приглашений</TabsTrigger>
          <TabsTrigger value="work-format">Формат работы</TabsTrigger>
        </TabsList>
        <TabsContent value="general-activity" className="space-y-4">
          <GeneralActivityView data={data} />
        </TabsContent>
        <TabsContent value="demand-supply" className="space-y-4">
          <DemandSupplyView data={data} />
        </TabsContent>
        <TabsContent value="company-activity" className="space-y-4">
          <CompanyActivityView data={data} />
        </TabsContent>
        <TabsContent value="niche-expertise" className="space-y-4">
          <NicheExpertiseView data={data} />
        </TabsContent>
        <TabsContent value="geo-rates" className="space-y-4">
          <RatesView data={data} />
        </TabsContent>
        <TabsContent value="invitation-network" className="space-y-4">
          <InvitationNetworkView data={data} />
        </TabsContent>
        <TabsContent value="work-format" className="space-y-4">
          <WorkFormatView data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
