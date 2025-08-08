
import type { MessageData } from '@/types';

// Helper to count occurrences
const countBy = (data: any[], key: string) => {
  return data.reduce((acc: {[key: string]: number}, item) => {
    const value = item[key as keyof typeof item];
    if (value) {
      const aValue = String(value).trim().toLowerCase();
      acc[aValue] = (acc[aValue] || 0) + 1;
    }
    return acc;
  }, {});
};

// Helper to parse DD.MM.YYYY or DD.MM.YY date strings
const parseDate = (dateString: string): Date | null => {
    if (!dateString || typeof dateString !== 'string') return null;
    const parts = dateString.split('.').map(part => parseInt(part, 10));
    if (parts.length < 3 || parts.some(isNaN)) { // allow more than 3 parts but require at least 3
        return null;
    }

    let [day, month, year] = parts;

    // Handle 2-digit years
    if (year < 100) {
        year += 2000;
    }
    
    // Month in JS Date is 0-indexed
    const date = new Date(Date.UTC(year, month - 1, day));

    // Basic validation to ensure the date is real
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }
    
    return date;
};


// 1. General Activity
export const getGeneralActivityMetrics = (data: MessageData[]) => {
  if (!data || data.length === 0) {
    return {
      participantsWithCounts: [],
      top10Participants: [],
      totalEvents: 0,
      uniqueYears: [],
    };
  }
  
  const participantActivity = data.reduce((acc: {[key: string]: number}, item) => {
    const value = item['Отправитель'];
    if (value) {
      acc[value] = (acc[value] || 0) + 1;
    }
    return acc;
  }, {});

  const participantsWithCounts = Object.entries(participantActivity)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count);
  const top10Participants = participantsWithCounts.slice(0, 10);

  const years = new Set<number>();
  data.forEach(item => {
    const date = parseDate(item['Дата']);
    if (date) {
      years.add(date.getUTCFullYear());
    }
  });

  return {
    participantsWithCounts,
    top10Participants,
    totalEvents: data.length,
    uniqueYears: Array.from(years).sort((a,b) => a - b),
  };
};

export const getParticipantMetrics = (data: MessageData[], year: number | null) => {
  if (!data || data.length === 0) {
    return {
      totalEvents: 0,
      offers: 0,
      demands: 0,
      activityByDate: [],
      latestEvents: [],
    };
  }

  let datedData = data
    .map(item => ({ ...item, dateObj: parseDate(item['Дата']) }))
    .filter((item): item is MessageData & { dateObj: Date } => item.dateObj !== null);
  
  let filteredByYearData = datedData;
  if (year) {
    filteredByYearData = datedData.filter(item => item.dateObj.getUTCFullYear() === year);
  }
  
  const counts = countBy(filteredByYearData, 'Тип события');
  
  const activityByDateCounts = filteredByYearData.reduce((acc: { [key: string]: number }, item) => {
    const dateKey = item.dateObj.toISOString().split('T')[0];
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {});
  
  const activityByDate = Object.entries(activityByDateCounts)
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('ru-RU', { year: '2-digit', month: '2-digit', day: '2-digit'}),
      count,
    }))
    .sort((a, b) => {
        const dateA = a.date.split('.').reverse().join('-');
        const dateB = b.date.split('.').reverse().join('-');
        return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

  return {
    totalEvents: filteredByYearData.length,
    offers: counts['предложение'] || 0,
    demands: counts['спрос'] || 0,
    activityByDate,
    latestEvents: filteredByYearData
      .sort((a, b) => b.dateObj!.getTime() - a.dateObj!.getTime())
      .slice(0, 20),
  };
};


// 2. Demand vs. Supply by Roles
export const getDemandSupplyByRole = (data: MessageData[], year: number | null) => {
   if (!data || data.length === 0) return { rolesInDemand: 0, rolesInSupply: 0, imbalance: 0, roleData: [], top10RolesChart: [], uniqueYears: [] };

  const years = new Set<number>();
  const datedData = data.map(item => {
    const date = parseDate(item['Дата']);
    if (date) {
      years.add(date.getUTCFullYear());
    }
    return { ...item, dateObj: date };
  }).filter(item => item.dateObj !== null);

  const filteredData = year ? datedData.filter(item => item.dateObj?.getUTCFullYear() === year) : datedData;

  const roles: { [key: string]: { demand: number; supply: number } } = {};

  filteredData.forEach(item => {
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
    uniqueYears: Array.from(years).sort((a,b) => a - b),
  };
};

export const getRoleYearlyDemandSupply = (data: MessageData[], role: string) => {
  const yearlyData: { [key: number]: { demand: number; supply: number } } = {};

  data.forEach(item => {
    if (item['Роль'] === role) {
      const date = parseDate(item['Дата']);
      if (date) {
        const year = date.getUTCFullYear();
        if (!yearlyData[year]) {
          yearlyData[year] = { demand: 0, supply: 0 };
        }
        const eventType = item['Тип события'] ? String(item['Тип события']).trim().toLowerCase() : '';
        if (eventType === 'спрос') {
          yearlyData[year].demand++;
        } else if (eventType === 'предложение') {
          yearlyData[year].supply++;
        }
      }
    }
  });

  return Object.entries(yearlyData)
    .map(([year, { demand, supply }]) => ({
      year: parseInt(year),
      demand,
      supply,
    }))
    .sort((a, b) => a.year - b.year);
};


// 3. Activity by Companies
export const getCompanyActivity = (data: MessageData[]) => {
  if (!data || data.length === 0) return { topOfferingCompany: 'N/A', topDemandingCompany: 'N/A', totalMentions: 0, companyData: [], top10CompanyChart: [] };
  
  const companies: { [key: string]: { offers: number; demands: number; roles: Set<string> } } = {};

  data.forEach(item => {
    const company = item['Компания'] ? String(item['Компания']).trim() : '';
    if (company && company !== '-' && company.toLowerCase() !== 'n/a' && company.toLowerCase() !== 'na') {
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

export const getCompanyDetail = (data: MessageData[], company: string, year: number | null) => {
  const companyData = data.filter(d => d['Компания'] === company);

  const years = new Set<number>();
  const datedData = companyData.map(item => {
    const date = parseDate(item['Дата']);
    if (date) {
      years.add(date.getUTCFullYear());
    }
    return { ...item, dateObj: date };
  }).filter((item): item is typeof item & { dateObj: Date } => item.dateObj !== null);

  const filteredData = year ? datedData.filter(item => item.dateObj?.getUTCFullYear() === year) : datedData;

  const roles: { [key: string]: { offers: number; demands: number } } = {};

  filteredData.forEach(item => {
    const role = item['Роль'];
    if (role) {
      if (!roles[role]) {
        roles[role] = { offers: 0, demands: 0 };
      }
      const eventType = item['Тип события'] ? String(item['Тип события']).trim().toLowerCase() : '';
      if (eventType === 'предложение') {
        roles[role].offers++;
      } else if (eventType === 'спрос') {
        roles[role].demands++;
      }
    }
  });

  const companyDetails = Object.entries(roles).map(([role, { offers, demands }]) => ({
    role,
    offers,
    demands
  })).sort((a, b) => (b.offers + b.demands) - (a.offers + a.demands));

  return {
    companyDetails,
    uniqueYearsInCompany: Array.from(years).sort((a, b) => a - b)
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

  const geoCounts = data.filter(d => d['Гео / локация']).reduce((acc: { [key: string]: number }, item) => {
    const value = item['Гео / локация']!;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  const totalGeo = Object.values(geoCounts).reduce((a: number, b: any) => a + b, 0);
  const rfShare = totalGeo > 0 ? ((geoCounts['РФ'] || 0) / totalGeo) * 100 : 0;

  const geoSplit = Object.entries(geoCounts).map(([name, value]) => ({ name, value: value as number }));

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
