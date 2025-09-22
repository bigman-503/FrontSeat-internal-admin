/**
 * Date utilities for handling Pacific timezone (PST/PDT) consistently across the application
 * Automatically handles both PST (UTC-8) and PDT (UTC-7) based on the current date
 */

/**
 * Get today's date in Pacific timezone as YYYY-MM-DD format
 */
export function getTodayPST(): string {
  const now = new Date();
  const pacificDateString = now.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [month, day, year] = pacificDateString.split('/');
  const formattedDate = `${year}-${month}-${day}`;
  
  console.log('📅 getTodayPST called:', { 
    now: now.toISOString(), 
    pacificDateString,
    formattedDate 
  });
  return formattedDate;
}

/**
 * Get a date in Pacific timezone as YYYY-MM-DD format
 */
export function getDatePST(date: Date): string {
  const pacificDateString = date.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [month, day, year] = pacificDateString.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date for display in Pacific timezone
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
 * Format a date and time for display in Pacific timezone
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
 * Get a date range for different time periods in Pacific timezone
 */
export function getDateRangePST(timeRange: string): { startDate: string; endDate: string } {
  const now = new Date();
  
  switch (timeRange) {
    case '24h':
      const today24h = getTodayPST();
      return {
        startDate: today24h,
        endDate: today24h
      };
    case '7d':
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 6 days ago + today = 7 days
      return {
        startDate: getDatePST(sevenDaysAgo),
        endDate: getTodayPST()
      };
    case '30d':
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // 29 days ago + today = 30 days
      return {
        startDate: getDatePST(thirtyDaysAgo),
        endDate: getTodayPST()
      };
    case '90d':
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89); // 89 days ago + today = 90 days
      return {
        startDate: getDatePST(ninetyDaysAgo),
        endDate: getTodayPST()
      };
    case '1y':
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return {
        startDate: getDatePST(oneYearAgo),
        endDate: getTodayPST()
      };
    default:
      const today = getTodayPST();
      return {
        startDate: today,
        endDate: today
      };
  }
}

/**
 * Check if a date is today in Pacific timezone
 */
export function isTodayPST(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const todayPST = getTodayPST();
  const datePST = getDatePST(dateObj);
  return todayPST === datePST;
}

/**
 * Get the current time in Pacific timezone
 */
export function getCurrentTimePST(): Date {
  const now = new Date();
  const pacificTimeString = now.toLocaleString("en-US", { 
    timeZone: "America/Los_Angeles",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Parse the Pacific time string back to a Date object
  const [datePart, timePart] = pacificTimeString.split(', ');
  const [month, day, year] = datePart.split('/');
  const [hour, minute, second] = timePart.split(':');
  
  // Create a new Date object in the local timezone that represents the Pacific time
  const pacificDate = new Date(
    parseInt(year), 
    parseInt(month) - 1, 
    parseInt(day), 
    parseInt(hour), 
    parseInt(minute), 
    parseInt(second)
  );
  
  return pacificDate;
}

/**
 * Convert Pacific date to UTC date range for BigQuery queries
 * This ensures we capture all records for a Pacific date regardless of timezone
 */
export function getDateRangeForBigQuery(timeRange: string): { startDate: string; endDate: string } {
  const now = new Date();
  
  switch (timeRange) {
    case '24h':
      // For 24h, we want to capture the full Pacific day
      const today = getTodayPST();
      return {
        startDate: today,
        endDate: today
      };
    case '7d':
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      return {
        startDate: getDatePST(sevenDaysAgo),
        endDate: getTodayPST()
      };
    case '30d':
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      return {
        startDate: getDatePST(thirtyDaysAgo),
        endDate: getTodayPST()
      };
    case '90d':
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
      return {
        startDate: getDatePST(ninetyDaysAgo),
        endDate: getTodayPST()
      };
    case '1y':
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return {
        startDate: getDatePST(oneYearAgo),
        endDate: getTodayPST()
      };
    default:
      return getDateRangePST(timeRange);
  }
}