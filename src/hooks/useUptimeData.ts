import { useState, useEffect, useCallback } from 'react';
import { Device } from '@/types/device';

// Types for the new backend response
interface UptimeDataPoint {
  time: string;
  displayTime: string;
  isOnline: number;
  prevIsOnline: number | null;
  batteryLevel: number;
  cpuUsage: number;
  heartbeatCount: number;
}

interface UptimeStats {
  totalUptime: number;
  uptimePercentage: number;
  totalSessions: number;
  averageSessionLength: number;
  longestSession: number;
  longestOffline: number;
  firstOnline: string | null;
  lastOnline: string | null;
}

interface DevicePatterns {
  mostActiveHour: string | null;
  leastActiveHour: string | null;
  averageSessionLength: number;
  offlineFrequency: number;
  reliabilityScore: number;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

interface UptimeResponse {
  deviceId: string;
  timeRange: string;
  timeInterval: number;
  uptimeData: UptimeDataPoint[];
  stats: UptimeStats;
  patterns: DevicePatterns;
  dateRange: DateRange;
  isMockData: boolean;
  dataSource: 'bigquery' | 'mock';
}

interface UseUptimeDataProps {
  device: Device | null;
  timeRange: string;
  timeInterval: number;
  useCustomRange: boolean;
  customStartDate: string;
  customEndDate: string;
}

interface UseUptimeDataReturn {
  uptimeData: UptimeDataPoint[];
  uptimeDataWithZoom: UptimeDataPoint[];
  uptimeStats: UptimeStats;
  devicePatterns: DevicePatterns;
  dateRange: DateRange;
  loading: boolean;
  error: string | null;
  refreshData: () => void;
  isMockData: boolean;
  dataSource: string;
}

export const useUptimeData = ({
  device,
  timeRange,
  timeInterval,
  useCustomRange,
  customStartDate,
  customEndDate
}: UseUptimeDataProps): UseUptimeDataReturn => {
  const [data, setData] = useState<UptimeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUptimeData = useCallback(async () => {
    if (!device?.deviceId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startDate = useCustomRange ? customStartDate : getDefaultStartDate(timeRange);
      const endDate = useCustomRange ? customEndDate : getDefaultEndDate(timeRange);

      console.log('📊 Fetching uptime data:', {
        deviceId: device.deviceId,
        timeRange,
        timeInterval,
        startDate,
        endDate
      });

      const response = await fetch(`/api/analytics/device/${device.deviceId}/uptime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          timeInterval,
          timeRange
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: UptimeResponse = await response.json();
      console.log('✅ Uptime data received:', {
        dataPoints: result.uptimeData.length,
        stats: result.stats,
        isMockData: result.isMockData,
        dataSource: result.dataSource,
        sampleData: result.uptimeData.slice(0, 3),
        dateRange: result.dateRange
      });
      
      // Debug: Check if any data points are online
      const onlineData = result.uptimeData.filter(d => d.isOnline === 1);
      const offlineData = result.uptimeData.filter(d => d.isOnline === 0);
      console.log('🔍 Data analysis:', {
        totalDataPoints: result.uptimeData.length,
        onlineCount: onlineData.length,
        offlineCount: offlineData.length,
        onlineData: onlineData.slice(0, 3),
        offlineData: offlineData.slice(0, 3)
      });

      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch uptime data';
      console.error('❌ Error fetching uptime data:', {
        error: errorMessage,
        deviceId: device?.deviceId,
        timeRange,
        timeInterval,
        startDate,
        endDate,
        fullError: err
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [device?.deviceId, timeRange, timeInterval, useCustomRange, customStartDate, customEndDate]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchUptimeData();
  }, [fetchUptimeData]);

  // Apply zoom to uptime data (simplified since processing is now server-side)
  const uptimeDataWithZoom = data?.uptimeData || [];
  const uptimeData = data?.uptimeData || [];
  const uptimeStats = data?.stats || getEmptyStats();
  const devicePatterns = data?.patterns || getEmptyPatterns();
  const dateRange = data?.dateRange || { startDate: '', endDate: '' };
  const isMockData = data?.isMockData || false;
  const dataSource = data?.dataSource || 'unknown';

  return {
    uptimeData,
    uptimeDataWithZoom,
    uptimeStats,
    devicePatterns,
    dateRange,
    loading,
    error,
    refreshData: fetchUptimeData,
    isMockData,
    dataSource
  };
};

// Helper functions
function getDefaultStartDate(timeRange: string): string {
  // Get current time in PST
  const now = new Date();
  
  console.log('🕐 getDefaultStartDate called:', {
    timeRange,
    nowUTC: now.toISOString(),
    nowPST: now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  });
  
  switch (timeRange) {
    case '24h':
      // For 24h view, start from 24 hours ago to include the rolling 24-hour window
      const yesterday24h = new Date(now);
      yesterday24h.setDate(yesterday24h.getDate() - 1);
      const yesterday24hPSTString = yesterday24h.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [yMonth, yDay, yYear] = yesterday24hPSTString.split('/');
      const result = `${yYear}-${yMonth}-${yDay}`;
      console.log('🕐 24h start date calculation (24h ago):', {
        yesterday24hPSTString,
        yMonth, yDay, yYear,
        result
      });
      return result;
    case '7d':
      // For 7d view, go back 6 days to include today (7 days total)
      const startDate7d = new Date(now);
      startDate7d.setDate(startDate7d.getDate() - 6);
      const start7dPSTString = startDate7d.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [s7Month, s7Day, s7Year] = start7dPSTString.split('/');
      return `${s7Year}-${s7Month}-${s7Day}`;
    case '30d':
      // For 30d view, go back 29 days to include today (30 days total)
      const startDate30d = new Date(now);
      startDate30d.setDate(startDate30d.getDate() - 29);
      const start30dPSTString = startDate30d.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [s30Month, s30Day, s30Year] = start30dPSTString.split('/');
      return `${s30Year}-${s30Month}-${s30Day}`;
    default:
      const defaultStart = new Date(now);
      defaultStart.setDate(defaultStart.getDate() - 1);
      const defaultPSTString = defaultStart.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [dMonth, dDay, dYear] = defaultPSTString.split('/');
      return `${dYear}-${dMonth}-${dDay}`;
  }
}

function getDefaultEndDate(timeRange: string): string {
  // Get current time in PST
  const now = new Date();
  
  console.log('🕐 getDefaultEndDate called:', {
    timeRange,
    nowUTC: now.toISOString(),
    nowPST: now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  });
  
  if (timeRange === '24h') {
    // For 24h view, end at today to capture the rolling 24-hour window
    const today24h = new Date(now);
    const today24hPSTString = today24h.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [tMonth, tDay, tYear] = today24hPSTString.split('/');
    const result = `${tYear}-${tMonth}-${tDay}`;
    console.log('🕐 24h end date calculation (today):', {
      today24hPSTString,
      tMonth, tDay, tYear,
      result
    });
    return result;
  }
  
  const nowPSTString = now.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [month, day, year] = nowPSTString.split('/');
  return `${year}-${month}-${day}`;
}

function getEmptyStats(): UptimeStats {
  return {
    totalUptime: 0,
    uptimePercentage: 0,
    totalSessions: 0,
    averageSessionLength: 0,
    longestSession: 0,
    longestOffline: 0,
    firstOnline: null,
    lastOnline: null
  };
}

function getEmptyPatterns(): DevicePatterns {
  return {
    mostActiveHour: null,
    leastActiveHour: null,
    averageSessionLength: 0,
    offlineFrequency: 0,
    reliabilityScore: 0
  };
}