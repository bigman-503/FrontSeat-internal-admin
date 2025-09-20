/**
 * Date utilities for handling PST timezone consistently across the application
 */

/**
 * Get today's date in PST timezone as YYYY-MM-DD format
 */
export function getTodayPST(): string {
  const now = new Date();
  const pstDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const formattedDate = pstDate.toISOString().split('T')[0];
  console.log('📅 getTodayPST called:', { 
    now: now.toISOString(), 
    pstDate: pstDate.toISOString(), 
    formattedDate 
  });
  return formattedDate;
}

/**
 * Get a date in PST timezone as YYYY-MM-DD format
 */
export function getDatePST(date: Date): string {
  const pstDate = new Date(date.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  return pstDate.toISOString().split('T')[0];
}

/**
 * Format a date for display in PST timezone
 */
export function formatDatePST(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid
  if (!dateObj || isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    ...options
  });
}

/**
 * Format a date and time for display in PST timezone
 */
export function formatDateTimePST(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid
  if (!dateObj || isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return dateObj.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    ...options
  });
}

/**
 * Get a date range for different time periods in PST
 */
export function getDateRangePST(timeRange: string): { startDate: string; endDate: string } {
  const today = new Date();
  const todayPST = new Date(today.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  
  switch (timeRange) {
    case '24h':
      return {
        startDate: getDatePST(todayPST),
        endDate: getDatePST(todayPST)
      };
    case '7d':
      const sevenDaysAgo = new Date(todayPST);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return {
        startDate: getDatePST(sevenDaysAgo),
        endDate: getDatePST(todayPST)
      };
    case '30d':
      const thirtyDaysAgo = new Date(todayPST);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return {
        startDate: getDatePST(thirtyDaysAgo),
        endDate: getDatePST(todayPST)
      };
    case '90d':
      const ninetyDaysAgo = new Date(todayPST);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      return {
        startDate: getDatePST(ninetyDaysAgo),
        endDate: getDatePST(todayPST)
      };
    case '1y':
      const oneYearAgo = new Date(todayPST);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return {
        startDate: getDatePST(oneYearAgo),
        endDate: getDatePST(todayPST)
      };
    default:
      return {
        startDate: getDatePST(todayPST),
        endDate: getDatePST(todayPST)
      };
  }
}

/**
 * Check if a date is today in PST
 */
export function isTodayPST(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const todayPST = getTodayPST();
  const datePST = getDatePST(dateObj);
  return todayPST === datePST;
}

/**
 * Get the current time in PST
 */
export function getCurrentTimePST(): Date {
  const now = new Date();
  const pstTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  
  // Fallback if timezone conversion fails
  if (isNaN(pstTime.getTime())) {
    const pstOffset = -8 * 60; // PST is UTC-8 (in minutes)
    return new Date(now.getTime() + (pstOffset * 60 * 1000));
  }
  
  return pstTime;
}

/**
 * Convert PST date to UTC date range for BigQuery queries
 * This ensures we capture all records for a PST date regardless of timezone
 */
export function getDateRangeForBigQuery(timeRange: string): { startDate: string; endDate: string } {
  // Get current date in PST timezone using a more reliable method
  const now = new Date();
  const pstOffset = -8 * 60; // PST is UTC-8 (in minutes)
  const pstTime = new Date(now.getTime() + (pstOffset * 60 * 1000));
  
  console.log('🔍 getDateRangeForBigQuery:', { 
    timeRange, 
    now: now.toISOString(), 
    pstTime: pstTime.toISOString() 
  });
  
  switch (timeRange) {
    case '24h':
      // For 24h, we want to capture the full PST day
      const startOfDayPST = new Date(pstTime);
      startOfDayPST.setHours(0, 0, 0, 0);
      const endOfDayPST = new Date(pstTime);
      endOfDayPST.setHours(23, 59, 59, 999);
      
      const result = {
        startDate: startOfDayPST.toISOString().split('T')[0],
        endDate: endOfDayPST.toISOString().split('T')[0]
      };
      console.log('📅 24h date range for BigQuery:', result);
      return result;
    case '7d':
      const sevenDaysAgo = new Date(pstTime);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const endOfToday = new Date(pstTime);
      endOfToday.setHours(23, 59, 59, 999);
      
      return {
        startDate: sevenDaysAgo.toISOString().split('T')[0],
        endDate: endOfToday.toISOString().split('T')[0]
      };
    case '30d':
      const thirtyDaysAgo = new Date(pstTime);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      const endOfToday30d = new Date(pstTime);
      endOfToday30d.setHours(23, 59, 59, 999);
      
      return {
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: endOfToday30d.toISOString().split('T')[0]
      };
    case '90d':
      const ninetyDaysAgo = new Date(pstTime);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      ninetyDaysAgo.setHours(0, 0, 0, 0);
      const endOfToday90d = new Date(pstTime);
      endOfToday90d.setHours(23, 59, 59, 999);
      
      return {
        startDate: ninetyDaysAgo.toISOString().split('T')[0],
        endDate: endOfToday90d.toISOString().split('T')[0]
      };
    case '1y':
      const oneYearAgo = new Date(pstTime);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      oneYearAgo.setHours(0, 0, 0, 0);
      const endOfToday1y = new Date(pstTime);
      endOfToday1y.setHours(23, 59, 59, 999);
      
      return {
        startDate: oneYearAgo.toISOString().split('T')[0],
        endDate: endOfToday1y.toISOString().split('T')[0]
      };
    default:
      return getDateRangePST(timeRange);
  }
}
