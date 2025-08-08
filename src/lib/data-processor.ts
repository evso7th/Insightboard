
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


const processRoles = (roleString: string): string[] => {
    if (!roleString) return [];
    return String(roleString).split(/[,/]/).map(r => r.trim()).filter(r => r && r.length > 0);
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
  }).filter((item): item is typeof item & {dateObj: Date} => item.dateObj !== null);

  const filteredData = year ? datedData.filter(item => item.dateObj?.getUTCFullYear() === year) : datedData;

  const roles: { [key: string]: { demand: number; supply: number } } = {};

  filteredData.forEach(item => {
    const roleList = processRoles(item['Роль']);
    roleList.forEach(role => {
        if (!roles[role]) {
            roles[role] = { demand: 0, supply: 0 };
        }
        const eventType = item['Тип события'] ? String(item['Тип события']).trim().toLowerCase() : '';
        if (eventType === 'спрос') {
            roles[role].demand++;
        } else if (eventType === 'предложение') {
            roles[role].supply++;
        }
    });
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
    const roleList = processRoles(item['Роль']);
    if (roleList.includes(role)) {
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
// List of terms that are likely roles/tech and not author names.
const IGNORE_LIST = new Set(['qa', 'c#', 'devops', 'python', 'react', 'php', 'linux', 'vue', 'go', 'backend', 'frontend', 'analyst', 'project manager', 'product manager', 'designer', 'node.js', 'javascript']);

export const getCompanyActivity = (data: MessageData[]) => {
  if (!data || data.length === 0) return { topOfferingCompany: 'N/A', topDemandingCompany: 'N/A', topOfferingAuthor: 'N/A', topDemandingAuthor: 'N/A', totalMentions: 0, companyData: [], top20CompanyChart: [] };

  const participants: { [key: string]: { offers: number; demands: number; roles: Set<string>; originalName: string, isAuthor: boolean } } = {};

  data.forEach(item => {
    let originalName: string;
    let isAuthorFlag = false;

    const companyName = item['Компания'] ? String(item['Компания']).trim() : '';
    const authorName = item['Отправитель'] ? String(item['Отправитель']).trim() : '';
    
    if (!companyName || companyName === '-' || companyName.toLowerCase() === 'n/a' || companyName.toLowerCase() === 'na') {
      originalName = authorName;
      isAuthorFlag = true;
    } else {
      originalName = companyName;
    }

    if (!originalName) return;

    const key = originalName.toLowerCase();
    
    // Enhanced Ignore List Check for authors
    if (isAuthorFlag) {
        const authorWords = key.toLowerCase().split(/[\s,./]+/);
        const isIgnored = authorWords.some(word => IGNORE_LIST.has(word));
        if(isIgnored) return;
    }

    if (!participants[key]) {
      participants[key] = { offers: 0, demands: 0, roles: new Set(), originalName: originalName, isAuthor: isAuthorFlag };
    }
    
    // If we see a participant that was an author, but now has a company name, update it to be a company.
    if (!isAuthorFlag && participants[key].isAuthor) {
        participants[key].isAuthor = false;
        participants[key].originalName = originalName;
    }
    
    const eventType = item['Тип события'] ? String(item['Тип события']).trim().toLowerCase() : '';
    if (eventType === 'предложение') {
      participants[key].offers++;
    } else if (eventType === 'спрос') {
      participants[key].demands++;
    }
    
    const roleList = processRoles(item['Роль']);
    roleList.forEach(role => {
      if(role) participants[key].roles.add(role)
    });
  });

  const allParticipants = Object.values(participants).map(p => ({
      name: p.originalName,
      offers: p.offers,
      demands: p.demands,
      uniqueRoles: p.roles.size,
      isAuthor: p.isAuthor
  }));
  
  const realCompanies = allParticipants.filter(p => !p.isAuthor);
  const authorsAsCompanies = allParticipants.filter(p => p.isAuthor);
  
  realCompanies.sort((a,b) => (b.offers + b.demands) - (a.offers + a.demands));
  authorsAsCompanies.sort((a,b) => (b.offers + b.demands) - (a.offers + a.demands));

  const companyData = [...realCompanies, ...authorsAsCompanies];
  
  const topOfferingCompany = [...realCompanies].sort((a,b) => b.offers - a.offers)[0]?.name || 'N/A';
  const topDemandingCompany = [...realCompanies].sort((a,b) => b.demands - a.demands)[0]?.name || 'N/A';
  const topOfferingAuthor = [...authorsAsCompanies].sort((a,b) => b.offers - a.offers)[0]?.name || 'N/A';
  const topDemandingAuthor = [...authorsAsCompanies].sort((a,b) => b.demands - a.demands)[0]?.name || 'N/A';
  
  const sortedByOffers = companyData
    .filter(p => p.offers > 0)
    .sort((a, b) => b.offers - a.offers);

  const top20CompanyChart = sortedByOffers
    .slice(0, 20)
    .sort((a,b) => a.offers - b.offers);

  return {
    topOfferingCompany,
    topDemandingCompany,
    topOfferingAuthor,
    topDemandingAuthor,
    totalMentions: companyData.reduce((sum, c) => sum + c.offers + c.demands, 0),
    companyData,
    top20CompanyChart
  };
};

export const getCompanyDetail = (data: MessageData[], participantName: string, year: number | null) => {
  const allParticipantData = data.filter(d => {
      let currentParticipant = d['Компания'] ? String(d['Компания']).trim() : '';
      if (!currentParticipant || currentParticipant === '-' || currentParticipant.toLowerCase() === 'n/a' || currentParticipant.toLowerCase() === 'na') {
        currentParticipant = d['Отправитель'] ? String(d['Отправитель']).trim() : '';
      }
      return currentParticipant.toLowerCase() === participantName.toLowerCase();
  });

  const years = new Set<number>();
  const datedData = allParticipantData.map(item => {
    const date = parseDate(item['Дата']);
    if (date) {
      years.add(date.getUTCFullYear());
    }
    return { ...item, dateObj: date };
  }).filter((item): item is typeof item & { dateObj: Date } => item.dateObj !== null);

  const filteredData = year ? datedData.filter(item => item.dateObj.getUTCFullYear() === year) : datedData;

  const roles: { [key: string]: { offers: number; demands: number } } = {};

  filteredData.forEach(item => {
    const roleList = processRoles(item['Роль']);
    roleList.forEach(role => {
        if (!role) return;
        if (!roles[role]) {
            roles[role] = { offers: 0, demands: 0 };
        }
        const eventType = item['Тип события'] ? String(item['Тип события']).trim().toLowerCase() : '';
        if (eventType === 'предложение') {
            roles[role].offers++;
        } else if (eventType === 'спрос') {
            roles[role].demands++;
        }
    })
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
  if (!data || data.length === 0) return { uniqueNiches: 0, topNiche: 'N/A', urgentExpertise: 0, nicheData: [] };

  const niches: { [key: string]: { count: number; companies: Set<string>; contexts: string[]; urgent: number } } = {};

  data.forEach(item => {
    const nicheValue = item['Ниша / уникальная экспертиза'];
    let niche: string;

    if (nicheValue === undefined || nicheValue === null || String(nicheValue).trim() === '') {
        niche = '(Не указана)';
    } else {
        niche = String(nicheValue).trim();
    }
    
    if (!niches[niche]) {
      niches[niche] = { count: 0, companies: new Set(), contexts: [], urgent: 0 };
    }
    niches[niche].count++;
    
    const companyValue = item['Компания'];
    if (companyValue && typeof companyValue === 'string' && companyValue.trim() && companyValue.trim() !== '-') {
      niches[niche].companies.add(companyValue.trim());
    }
    
    const contextValue = item['Контекст'];
    if (contextValue && typeof contextValue === 'string' && contextValue.trim()) {
      niches[niche].contexts.push(contextValue.trim());
    }
    
    const urgencyValue = item['Срочность'];
    if (urgencyValue === 'urgent' || urgencyValue === 'immediate') {
        niches[niche].urgent++;
    }
  });
  
  const nicheData = Object.entries(niches).map(([name, data]) => ({
    name,
    mentions: data.count,
    companies: Array.from(data.companies).join(', ') || 'N/A',
    contextExamples: data.contexts.slice(0, 2).join('; '),
  })).sort((a, b) => b.mentions - a.mentions);
  
  const topNiche = nicheData.find(n => n.name !== '(Не указана)')?.name || 'N/A';
  const urgentExpertise = Object.values(niches).reduce((sum, n) => sum + n.urgent, 0);

  return {
    uniqueNiches: nicheData.filter(n => n.name !== '(Не указана)').length,
    topNiche,
    urgentExpertise,
    nicheData,
  };
};

// 5. Rates
const parseRate = (rate: any): number[] => {
    if (rate === null || rate === undefined) return [];
    
    const strRate = String(rate).replace(/\s/g, '').toLowerCase();

    if (!/\d/.test(strRate)) return [];
    
    const numbers = strRate.split(/[-/–—]/).map(s => parseInt(s.replace(/\D/g, ''), 10));
    
    return numbers.filter(n => !isNaN(n) && n > 100 && n < 100000);
};

export const getGeoAndRates = (data: MessageData[]) => {
  if (!data || data.length === 0) return { validRatesCount: 0, averageRate: 0, rateData: [], boxPlotData: [] };

  const allRates: number[] = [];
  const rateByRole: { [key:string]: { rates: number[] } } = {};

  data.forEach(item => {
    const rates = parseRate(item['Ставка (руб/ч)']);
    if (rates.length > 0) {
      allRates.push(...rates);
      
      const roleList = processRoles(item['Роль']);
      roleList.forEach(role => {
          if (!role) return;
          if (!rateByRole[role]) {
              rateByRole[role] = { rates: [] };
          }
          rateByRole[role].rates.push(...rates);
      })
    }
  });

  const averageRate = allRates.length > 0 ? allRates.reduce((a, b) => a + b, 0) / allRates.length : 0;

  const rateData = Object.entries(rateByRole).map(([role, data]) => {
    const rates = data.rates;
    if (rates.length === 0) return null;
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    return {
      role,
      averageRate: Math.round(avg),
      minRate: Math.min(...rates),
      maxRate: Math.max(...rates),
      count: rates.length,
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a,b) => b.count - a.count);
  
  const boxPlotData = rateData.filter(r => r.averageRate > 0).slice(0, 10);
  
  return {
    validRatesCount: allRates.length,
    averageRate,
    rateData,
    boxPlotData,
  };
};

// 6. Invitation Network
export const getInvitationNetwork = (data: MessageData[]) => {
  if (!data || data.length === 0) return { topInviter: 'N/A', totalInvitations: 0, averageInvitations: 0, networkData: [], topInvitersChartData: [] };
  
  // Look for connections in all rows, not just ones with event type 'invitation'
  const invitations = data.filter(item => item['Связь (from → to)']);

  const invitationLinks = invitations
    .map(item => {
        const fromTo = String(item['Связь (from → to)']);
        const [from, to] = fromTo.includes('->') ? fromTo.split('->').map(s => s.trim()) : [fromTo, ''];
        return { from, to, date: item['Дата'] };
    })
    .filter(link => link.from && link.to); // Ensure both from and to are present

  if (invitationLinks.length === 0) return { topInviter: 'N/A', totalInvitations: 0, averageInvitations: 0, networkData: [], topInvitersChartData: [] };

  const inviterCounts = countBy(invitationLinks, 'from');
  const topInviter = Object.keys(inviterCounts).length > 0
    ? Object.keys(inviterCounts).reduce((a, b) => inviterCounts[a] > inviterCounts[b] ? a : b, 'N/A')
    : 'N/A';

  const totalParticipants = new Set(data.map(d => d['Отправитель'])).size;
  const averageInvitations = totalParticipants > 0 ? invitationLinks.length / totalParticipants : 0;
  
  const topInvitersChartData = Object.entries(inviterCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .sort((a,b) => a.count - b.count);

  return {
    topInviter,
    totalInvitations: invitationLinks.length,
    averageInvitations,
    networkData: invitationLinks.filter(l => l.from && l.to),
    topInvitersChartData
  };
};
