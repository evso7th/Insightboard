
import type { MessageData } from '@/types';

// Helper to count occurrences
const countBy = (data: any[], key: string) => {
  return data.reduce((acc, item) => {
    const value = item[key];
    if (value) {
      acc[value] = (acc[value] || 0) + 1;
    }
    return acc;
  }, {});
};

// Helper to parse DD.MM.YYYY date strings
const parseDate = (dateString: string): Date | null => {
    if (!dateString || typeof dateString !== 'string') return null;
    const parts = dateString.split('.');
    if (parts.length === 3) {
        // new Date(year, monthIndex, day)
        const date = new Date(+parts[2], +parts[1] - 1, +parts[0]);
        // Check if the parsed date is valid and the year is reasonable
        if (!isNaN(date.getTime()) && date.getFullYear() > 1970) {
            return date;
        }
    }
    return null;
};


// 1. General Activity
export const getGeneralActivityMetrics = (data: MessageData[]) => {
  if (!data || data.length === 0) {
    return {
      totalEvents: 0,
      offers: 0,
      demands: 0,
      invitations: 0,
      topParticipant: 'N/A',
      activityByDate: [],
      latestEvents: [],
    };
  }

  const counts = countBy(data, 'Тип события');
  const participantActivity = countBy(data, 'Отправитель');
  const topParticipant = Object.keys(participantActivity).reduce((a, b) => participantActivity[a] > participantActivity[b] ? a : b, 'N/A');
  
  const activityByDate = Object.entries(countBy(data.filter(d => d['Дата']), 'Дата'))
    .map(([date, count]) => ({ date, count, dateObj: parseDate(date) }))
    .filter(item => item.dateObj !== null)
    // @ts-ignore
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .map(({date, count, dateObj}) => ({ date, count, dateObj }));


  return {
    totalEvents: data.length,
    offers: counts['предложение'] || 0,
    demands: counts['спрос'] || 0,
    invitations: counts['приглашение'] || 0,
    topParticipant,
    activityByDate,
    latestEvents: data.slice(-20).reverse(),
  };
};

// 2. Demand vs. Supply by Roles
export const getDemandSupplyByRole = (data: MessageData[]) => {
   if (!data || data.length === 0) return { rolesInDemand: 0, rolesInSupply: 0, imbalance: 0, roleData: [], top10RolesChart: [] };

  const roles: { [key: string]: { demand: number; supply: number } } = {};

  data.forEach(item => {
    const role = item['Роль'];
    if (role) {
      if (!roles[role]) {
        roles[role] = { demand: 0, supply: 0 };
      }
      const eventType = item['Тип события'] ? String(item['Тип события']).trim().toLowerCase() : '';
      if (eventType === 'спрос') {
        roles[role].demand++;
      } else if (eventType === 'предложение') {
        roles[role].supply++;
      }
    }
  });
  
  const roleData = Object.entries(roles).map(([role, { demand, supply }]) => ({
    role,
    demand,
    supply,
    balance: demand - supply,
  })).sort((a, b) => (b.demand + b.supply) - (a.demand + a.supply));

  const totalDemand = roleData.reduce((sum, r) => sum + r.demand, 0);
  const totalSupply = roleData.reduce((sum, r) => sum + r.supply, 0);

  return {
    rolesInDemand: totalDemand,
    rolesInSupply: totalSupply,
    imbalance: totalDemand - totalSupply,
    roleData,
    top10RolesChart: roleData.slice(0, 10),
  };
};

// 3. Activity by Companies
export const getCompanyActivity = (data: MessageData[]) => {
  if (!data || data.length === 0) return { topOfferingCompany: 'N/A', topDemandingCompany: 'N/A', totalMentions: 0, companyData: [], top10CompanyChart: [] };
  
  const companies: { [key: string]: { offers: number; demands: number; roles: Set<string> } } = {};

  data.forEach(item => {
    const company = item['Компания'] ? String(item['Компания']).trim() : '';
    // Filter out empty or placeholder company names
    if (company && company !== '-' && company.toLowerCase() !== 'n/a') {
      if (!companies[company]) {
        companies[company] = { offers: 0, demands: 0, roles: new Set() };
      }
      const eventType = item['Тип события'] ? String(item['Тип события']).trim().toLowerCase() : '';
      if (eventType === 'предложение') {
        companies[company].offers++;
      } else if (eventType === 'спрос') {
        companies[company].demands++;
      }
      if (item['Роль']) {
        companies[company].roles.add(item['Роль']);
      }
    }
  });

  const companyData = Object.entries(companies).map(([name, data]) => ({
    name,
    offers: data.offers,
    demands: data.demands,
    uniqueRoles: data.roles.size,
  })).sort((a,b) => (b.offers + b.demands) - (a.offers + a.demands));

  const topOfferingCompany = [...companyData].sort((a,b) => b.offers - a.offers)[0]?.name || 'N/A';
  const topDemandingCompany = [...companyData].sort((a,b) => b.demands - a.demands)[0]?.name || 'N/A';

  return {
    topOfferingCompany,
    topDemandingCompany,
    totalMentions: companyData.reduce((sum, c) => sum + c.offers + c.demands, 0),
    companyData,
    top10CompanyChart: [...companyData].sort((a,b) => b.offers - a.offers).slice(0, 10),
  };
};

// 4. Niche Expertise
export const getNicheExpertise = (data: MessageData[]) => {
   if (!data || data.length === 0) return { uniqueNiches: 0, topNiche: 'N/A', urgentExpertise: 0, nicheData: [], heatmapData: [] };

  const niches: { [key: string]: { count: number; companies: Set<string>; contexts: string[], urgent: number } } = {};
  
  data.forEach(item => {
    const niche = item['Ниша / уникальная экспертиза'];
    if (niche) {
      if (!niches[niche]) {
        niches[niche] = { count: 0, companies: new Set(), contexts: [], urgent: 0 };
      }
      niches[niche].count++;
      if (item['Компания']) niches[niche].companies.add(item['Компания']);
      if (item['Контекст']) niches[niche].contexts.push(item['Контекст']);
      if (item['Срочность'] === 'urgent' || item['Срочность'] === 'immediate') {
          niches[niche].urgent++;
      }
    }
  });
  
  const nicheData = Object.entries(niches).map(([name, data]) => ({
    name,
    mentions: data.count,
    companies: Array.from(data.companies).join(', '),
    contextExamples: data.contexts.slice(0, 2).join('; '),
  })).sort((a, b) => b.mentions - a.mentions);
  
  const topNiche = nicheData[0]?.name || 'N/A';
  const urgentExpertise = Object.values(niches).reduce((sum, n) => sum + n.urgent, 0);

  const heatmapData = Object.entries(niches).flatMap(([niche, nicheData]) => {
      return Array.from(nicheData.companies).map(company => ({
          niche,
          company,
          value: 1 // simple count, can be enhanced
      }));
  });

  return {
    uniqueNiches: nicheData.length,
    topNiche,
    urgentExpertise,
    nicheData,
    heatmapData, // For bubble chart
  };
};

// 5. Geography and Rates
export const getGeoAndRates = (data: MessageData[]) => {
  if (!data || data.length === 0) return { rfShare: 0, averageRate: 0, maxRate: 0, geoSplit: [], rateData: [], boxPlotData: [] };

  const validRates = data.map(item => item['Ставка (руб/ч)']).filter(rate => rate != null && rate > 0) as number[];
  const averageRate = validRates.length > 0 ? validRates.reduce((a, b) => a + b, 0) / validRates.length : 0;
  const maxRate = validRates.length > 0 ? Math.max(...validRates) : 0;

  const geoCounts = countBy(data.filter(d => d['Гео / локация']), 'Гео / локация');
  const totalGeo = Object.values(geoCounts).reduce((a: number, b: any) => a + b, 0);
  const rfShare = totalGeo > 0 ? ((geoCounts['РФ'] || 0) / totalGeo) * 100 : 0;

  const geoSplit = Object.entries(geoCounts).map(([name, value]) => ({ name, value }));

  const rateByRole: { [key: string]: { rates: number[], geos: Set<string> } } = {};
  data.forEach(item => {
    if (item['Роль'] && item['Ставка (руб/ч)'] != null) {
      if (!rateByRole[item['Роль']]) {
        rateByRole[item['Роль']] = { rates: [], geos: new Set() };
      }
      rateByRole[item['Роль']].rates.push(item['Ставка (руб/ч)']);
      if(item['Гео / локация']) rateByRole[item['Роль']].geos.add(item['Гео / локация']);
    }
  });

  const rateData = Object.entries(rateByRole).map(([role, data]) => {
    const rates = data.rates;
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    return {
      role,
      averageRate: Math.round(avg),
      minRate: Math.min(...rates),
      maxRate: Math.max(...rates),
      geo: Array.from(data.geos).join(', '),
    };
  }).sort((a,b) => b.averageRate - a.averageRate);
  
  return {
    rfShare,
    averageRate,
    maxRate,
    geoSplit,
    rateData,
    boxPlotData: rateData.slice(0, 10), // For chart
  };
};

// 6. Invitation Network
export const getInvitationNetwork = (data: MessageData[]) => {
  if (!data || data.length === 0) return { topInviter: 'N/A', totalInvitations: 0, averageInvitations: 0, networkData: [] };
  
  const invitations = data.filter(item => item['Тип события'] === 'приглашение' && item['Связь (from → to)']);

  const invitationLinks = invitations.map(item => {
    const [from, to] = item['Связь (from → to)'].split('->').map(s => s.trim());
    return { from, to, date: item['Дата'] };
  });

  if (invitationLinks.length === 0) return { topInviter: 'N/A', totalInvitations: 0, averageInvitations: 0, networkData: [] };

  const inviterCounts = countBy(invitationLinks, 'from');
  const topInviter = Object.keys(inviterCounts).reduce((a, b) => inviterCounts[a] > inviterCounts[b] ? a : b, 'N/A');

  const totalParticipants = new Set(data.map(d => d['Отправитель'])).size;
  const averageInvitations = totalParticipants > 0 ? invitations.length / totalParticipants : 0;
  
  return {
    topInviter,
    totalInvitations: invitations.length,
    averageInvitations,
    networkData: invitationLinks,
  };
};


    