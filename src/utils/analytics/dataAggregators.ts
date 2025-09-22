import { UptimeDataPoint } from '@/types/analytics';

export interface DaySummary {
  date: string;
  dayName: string;
  uptime: number;
  onlinePeriods: number;
  offlinePeriods: number;
  totalHeartbeats: number;
  isOnline: boolean;
  peakActivity?: string;
  intervals: UptimeDataPoint[];
}

export interface MonthDayData {
  date: string;
  dayOfMonth: number;
  uptime: number;
  onlinePeriods: number;
  offlinePeriods: number;
  totalHeartbeats: number;
  isOnline: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Aggregates uptime data into daily summaries for week view
 */
export function aggregateToDailySummaries(uptimeData: UptimeDataPoint[]): DaySummary[] {
  console.log('🔄 aggregateToDailySummaries called with:', {
    dataLength: uptimeData?.length || 0,
    sampleData: uptimeData?.slice(0, 2) || []
  });

  if (!uptimeData || uptimeData.length === 0) {
    console.log('❌ No uptime data provided');
    return [];
  }

  // Group data by date
  const dailyGroups = new Map<string, UptimeDataPoint[]>();
  
  uptimeData.forEach(point => {
    // Convert UTC time to PST for proper date grouping
    const utcDate = new Date(point.time);
    const pstDateString = utcDate.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [month, day, year] = pstDateString.split('/');
    const dateKey = `${year}-${month}-${day}`; // YYYY-MM-DD format in PST
    
    if (!dailyGroups.has(dateKey)) {
      dailyGroups.set(dateKey, []);
    }
    dailyGroups.get(dateKey)!.push(point);
  });

  console.log('📅 Daily groups created:', {
    groupCount: dailyGroups.size,
    groupKeys: Array.from(dailyGroups.keys())
  });

  // Convert to daily summaries
  const summaries: DaySummary[] = [];
  
  for (const [dateKey, intervals] of dailyGroups) {
    // Create date in PST timezone for correct day name calculation
    const date = new Date(dateKey + 'T00:00:00'); // Ensure we're working with the correct date
    const dayName = date.toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: 'America/Los_Angeles'
    });
    
    // Calculate uptime percentage
    const totalIntervals = intervals.length;
    const onlineIntervals = intervals.filter(interval => interval.isOnline === 1).length;
    const uptime = totalIntervals > 0 ? (onlineIntervals / totalIntervals) * 100 : 0;
    
    // Count periods (consecutive online/offline intervals)
    let onlinePeriods = 0;
    let offlinePeriods = 0;
    let currentState: number | null = null;
    
    intervals.forEach(interval => {
      if (currentState !== interval.isOnline) {
        if (interval.isOnline === 1) {
          onlinePeriods++;
        } else {
          offlinePeriods++;
        }
        currentState = interval.isOnline;
      }
    });
    
    // Calculate total heartbeats
    const totalHeartbeats = intervals.reduce((sum, interval) => sum + (interval.heartbeatCount || 0), 0);
    
    // Determine if device was online for majority of the day
    const isOnline = uptime > 50;
    
    // Find peak activity hour
    const hourlyActivity = new Map<number, number>();
    intervals.forEach(interval => {
      const hour = new Date(interval.time).getHours();
      const current = hourlyActivity.get(hour) || 0;
      hourlyActivity.set(hour, current + (interval.heartbeatCount || 0));
    });
    
    let peakHour = 0;
    let maxActivity = 0;
    for (const [hour, activity] of hourlyActivity) {
      if (activity > maxActivity) {
        maxActivity = activity;
        peakHour = hour;
      }
    }
    
    const peakActivity = maxActivity > 0 ? `${peakHour}:00` : undefined;
    
    summaries.push({
      date: dateKey,
      dayName,
      uptime,
      onlinePeriods,
      offlinePeriods,
      totalHeartbeats,
      isOnline,
      peakActivity,
      intervals
    });
  }
  
  console.log('✅ Daily summaries created:', {
    summariesLength: summaries.length,
    sampleSummary: summaries[0]
  });
  
  // Filter out future days (only show today and past days)
  const today = new Date();
  const todayPSTDateString = today.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [month, day, year] = todayPSTDateString.split('/');
  const todayStr = `${year}-${month}-${day}`;
  
  console.log('🔍 Filtering future days:', {
    currentTime: today.toISOString(),
    todayPSTDateString: todayPSTDateString,
    todayStr: todayStr,
    allDates: summaries.map(s => s.date),
    futureDates: summaries.filter(s => s.date > todayStr).map(s => s.date)
  });
  
  const filteredSummaries = summaries.filter(summary => summary.date <= todayStr);
  
  console.log('📅 After filtering:', {
    originalCount: summaries.length,
    filteredCount: filteredSummaries.length,
    filteredDates: filteredSummaries.map(s => s.date)
  });
  
  // Sort by date (most recent first)
  const sortedSummaries = filteredSummaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // For week view, limit to exactly 7 days (most recent 7 days)
  const limitedSummaries = sortedSummaries.slice(0, 7);
  
  console.log('📅 Limited to 7 days:', {
    originalLength: sortedSummaries.length,
    limitedLength: limitedSummaries.length,
    limitedDates: limitedSummaries.map(s => s.date)
  });
  
  return limitedSummaries;
}

/**
 * Aggregates daily summaries into month view data
 */
export function aggregateToMonthView(dailySummaries: DaySummary[], currentDate: Date = new Date()): MonthDayData[] {
  console.log('🔄 aggregateToMonthView called with:', {
    dailySummariesLength: dailySummaries?.length || 0,
    sampleDailySummary: dailySummaries?.[0] || null,
    currentDate: currentDate.toISOString()
  });

  console.log('📅 Daily summaries dates:', dailySummaries.map(d => d.date));

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = currentDate.toISOString().split('T')[0];
  
  // Get the first day of the month and calculate the starting Sunday
  const firstDay = new Date(currentYear, currentMonth, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Go back to Sunday
  
  // Get the last day of the month and calculate the ending Saturday
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // Go forward to Saturday
  
  const monthData: MonthDayData[] = [];
  const dailyMap = new Map(dailySummaries.map(day => [day.date, day]));
  
  // Generate calendar data
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateKey = date.toISOString().split('T')[0];
    const dayData = dailyMap.get(dateKey);
    const isCurrentMonth = date.getMonth() === currentMonth;
    const isToday = dateKey === today;
    
    // Debug logging for first few days
    if (monthData.length < 5) {
      console.log('📅 Calendar day:', {
        dateKey,
        dayData: dayData ? { uptime: dayData.uptime, isOnline: dayData.isOnline } : 'no data',
        isCurrentMonth
      });
    }
    
    monthData.push({
      date: dateKey,
      dayOfMonth: date.getDate(),
      uptime: dayData?.uptime || 0,
      onlinePeriods: dayData?.onlinePeriods || 0,
      offlinePeriods: dayData?.offlinePeriods || 0,
      totalHeartbeats: dayData?.totalHeartbeats || 0,
      isOnline: dayData?.isOnline || false,
      isCurrentMonth,
      isToday
    });
  }
  
  console.log('✅ Month view data created:', {
    monthDataLength: monthData.length,
    sampleMonthData: monthData[0],
    currentMonthDays: monthData.filter(day => day.isCurrentMonth).length
  });
  
  return monthData;
}

/**
 * Gets the current month name for display
 */
export function getCurrentMonthName(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Gets the previous month name for navigation
 */
export function getPreviousMonthName(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Gets the next month name for navigation
 */
export function getNextMonthName(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
