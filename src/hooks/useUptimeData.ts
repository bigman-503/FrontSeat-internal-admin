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
  const nowPST = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  
  switch (timeRange) {
    case '24h':
      // For 24h view, go back 24 hours from current PST time
      const yesterdayPST = new Date(nowPST);
      yesterdayPST.setDate(yesterdayPST.getDate() - 1);
      return yesterdayPST.toISOString().split('T')[0];
    case '7d':
      nowPST.setDate(nowPST.getDate() - 6); // Go back 6 days to include today (7 days total)
      break;
    case '30d':
      nowPST.setDate(nowPST.getDate() - 29); // Go back 29 days to include today (30 days total)
      break;
    default:
      nowPST.setDate(nowPST.getDate() - 1);
  }
  
  return nowPST.toISOString().split('T')[0];
}

function getDefaultEndDate(timeRange: string): string {
  // Get current time in PST
  const now = new Date();
  const nowPST = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  
  if (timeRange === '24h') {
    // For 24h view, use current date in PST
    return nowPST.toISOString().split('T')[0];
  }
  
  return nowPST.toISOString().split('T')[0];
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