
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
export const getCompanyActivity = (data: MessageData[]) => {
  if (!data || data.length === 0) return { topOfferingCompany: 'N/A', topDemandingCompany: 'N/A', topOfferingAuthor: 'N/A', topDemandingAuthor: 'N/A', totalMentions: 0, companyData: [], top20CompanyChart: [] };

  const participants: { [key: string]: { offers: number; demands: number; roles: Set<string>; isAuthor: boolean } } = {};

  data.forEach(item => {
    const originalCompany = item['Компания'] ? String(item['Компания']).trim() : '';
    const author = item['Отправитель'] ? String(item['Отправитель']).trim() : '';

    let participantName: string;
    let isAuthor = false;

    if (!originalCompany || originalCompany === '-' || originalCompany.toLowerCase() === 'n/a' || originalCompany.toLowerCase() === 'na') {
      participantName = author;
      isAuthor = true;
    } else {
      participantName = originalCompany;
    }

    if (participantName) {
      if (!participants[participantName]) {
        participants[participantName] = { offers: 0, demands: 0, roles: new Set(), isAuthor: isAuthor };
      }
      
      // If a participant is found as a company, it should not be an author.
      if (!isAuthor && participants[participantName].isAuthor) {
          participants[participantName].isAuthor = false;
      }
      
      const eventType = item['Тип события'] ? String(item['Тип события']).trim().toLowerCase() : '';
      if (eventType === 'предложение') {
        participants[participantName].offers++;
      } else if (eventType === 'спрос') {
        participants[participantName].demands++;
      }
      
      const roleList = processRoles(item['Роль']);
      roleList.forEach(role => {
        if(role) participants[participantName].roles.add(role)
      });
    }
  });

  const allParticipants = Object.entries(participants).map(([name, data]) => ({
    name,
    offers: data.offers,
    demands: data.demands,
    uniqueRoles: data.roles.size,
    isAuthor: data.isAuthor,
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
  
  const sortedCompaniesForChart = realCompanies
    .sort((a, b) => b.offers - a.offers);

  const sortedAuthorsForChart = authorsAsCompanies
    .sort((a, b) => b.offers - a.offers);

  const top20CompanyChart = [...sortedCompaniesForChart, ...sortedAuthorsForChart]
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
      return currentParticipant === participantName;
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

    if (!nicheValue || String(nicheValue).trim() === '') {
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
  
  if (nicheData.length === 0) {
    return { uniqueNiches: 0, topNiche: 'N/A', urgentExpertise: 0, nicheData: [] };
  }
  
  const topNiche = nicheData.find(n => n.name !== '(Не указана)')?.name || 'N/A';
  const urgentExpertise = Object.values(niches).reduce((sum, n) => sum + n.urgent, 0);

  return {
    uniqueNiches: nicheData.filter(n => n.name !== '(Не указана)').length,
    topNiche,
    urgentExpertise,
    nicheData,
  };
};

// 5. Geography and Rates
const parseRate = (rate: any): number[] => {
    if (rate === null || rate === undefined) return [];

    const strRate = String(rate).replace(/ /g, '');
    const numbers = strRate.split(/[-/–—]/).map(s => parseInt(s.replace(/[^0-9]/g, ''), 10));
    
    const validNumbers = numbers.filter(n => !isNaN(n) && n > 0);

    // Handle cases like "16002500" which might be "1600-2500" but without a separator
    if (validNumbers.length === 1 && validNumbers[0] > 1000000) {
      const numStr = String(validNumbers[0]);
      if (numStr.length === 8) { // Heuristic for something like 16002500
        const first = parseInt(numStr.substring(0, 4), 10);
        const second = parseInt(numStr.substring(4), 10);
        if(!isNaN(first) && !isNaN(second)) {
            return [first, second];
        }
      }
    }

    return validNumbers;
}


export const getGeoAndRates = (data: MessageData[]) => {
  if (!data || data.length === 0) return { uniqueLocations: 0, validRatesCount: 0, averageRate: 0, geoSplit: [], rateData: [], boxPlotData: [] };

  const allRates: number[] = [];
  const locationCounts: { [key: string]: number } = {};
  const rateByRole: { [key: string]: { rates: number[], geos: Set<string> } } = {};

  data.forEach(item => {
    // Process geography
    const location = item['Гео / локация'];
    if (location && String(location).trim()) {
      const cleanLocation = String(location).trim();
      locationCounts[cleanLocation] = (locationCounts[cleanLocation] || 0) + 1;
    }

    // Process rates
    const rates = parseRate(item['Ставка (руб/ч)']);
    if (rates.length > 0) {
      allRates.push(...rates);
      
      const roleList = processRoles(item['Роль']);
      roleList.forEach(role => {
          if (!rateByRole[role]) {
              rateByRole[role] = { rates: [], geos: new Set() };
          }
          rateByRole[role].rates.push(...rates);
          if (location) rateByRole[role].geos.add(String(location).trim());
      })
    }
  });

  const averageRate = allRates.length > 0 ? allRates.reduce((a, b) => a + b, 0) / allRates.length : 0;
  
  // Prepare geo data for chart
  const sortedGeo = Object.entries(locationCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  const top5Geo = sortedGeo.slice(0, 5);
  const otherGeoCount = sortedGeo.slice(5).reduce((acc, curr) => acc + curr.value, 0);
  const geoSplit = [...top5Geo];
  if (otherGeoCount > 0) {
    geoSplit.push({ name: 'Другие', value: otherGeoCount });
  }

  // Prepare rate data for table
  const rateData = Object.entries(rateByRole).map(([role, data]) => {
    const rates = data.rates;
    if (rates.length === 0) return null;
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    return {
      role,
      averageRate: Math.round(avg),
      minRate: Math.min(...rates),
      maxRate: Math.max(...rates),
      geo: Array.from(data.geos).join(', ') || 'N/A',
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a,b) => b.averageRate - a.averageRate);
  
  return {
    uniqueLocations: Object.keys(locationCounts).length,
    validRatesCount: allRates.length,
    averageRate,
    geoSplit,
    rateData,
    boxPlotData: rateData.filter(r => r.averageRate > 0).slice(0, 10), // For chart
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


    

    