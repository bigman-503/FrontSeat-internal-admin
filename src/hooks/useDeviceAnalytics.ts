import { useState, useEffect, useCallback } from 'react';
import { Device } from '@/types/device';
import { AnalyticsService, DeviceHistoricalData } from '@/services/analyticsService';
import { getDateRangeForBigQuery } from '@/lib/dateUtils';
import { AnalyticsState, ChartControls } from '@/types/analytics';

interface UseDeviceAnalyticsProps {
  device: Device | null;
  open: boolean;
  timeRange: string;
  useCustomRange: boolean;
  customStartDate: string;
  customEndDate: string;
}

export const useDeviceAnalytics = ({
  device,
  open,
  timeRange,
  useCustomRange,
  customStartDate,
  customEndDate
}: UseDeviceAnalyticsProps) => {
  const [state, setState] = useState<AnalyticsState>({
    analyticsData: null,
    heartbeatData: [],
    loading: false,
    error: null,
    isExporting: false
  });

  const fetchAnalytics = useCallback(async () => {
    if (!device) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Use custom date range if enabled, otherwise use predefined ranges
      let startDate, endDate;
      
      if (useCustomRange) {
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        // Use BigQuery-optimized date range for the selected time range
        const dateRange = getDateRangeForBigQuery(timeRange);
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
      }

      const data = await AnalyticsService.getDeviceAnalytics(
        device.deviceId,
        startDate,
        endDate
      );

      console.log('📊 Analytics data received:', { 
        dataSource: data.dataSource, 
        isMockData: data.isMockData, 
        analyticsLength: data.analytics?.length 
      });
      
      setState(prev => ({ ...prev, analyticsData: data }));
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Failed to fetch analytics data' 
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [device, timeRange, useCustomRange, customStartDate, customEndDate]);

  const fetchHeartbeatData = useCallback(async () => {
    if (!device) return;

    try {
      // Use custom date range if enabled, otherwise use predefined ranges
      let startDate, endDate;
      
      if (useCustomRange) {
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        // Use BigQuery-optimized date range for the selected time range
        const dateRange = getDateRangeForBigQuery(timeRange);
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
      }

      const response = await fetch(`/api/analytics/device/${device.deviceId}/heartbeats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('💓 Heartbeat data received:', { 
          dataSource: data.dataSource, 
          isMockData: data.isMockData, 
          heartbeatsLength: data.heartbeats?.length 
        });
        setState(prev => ({ ...prev, heartbeatData: data.heartbeats || [] }));
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch heartbeat data:', errorData);
        setState(prev => ({ 
          ...prev, 
          error: errorData.message || 'Failed to fetch heartbeat data',
          heartbeatData: []
        }));
      }
    } catch (error) {
      console.error('Error fetching heartbeat data:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Network error while fetching heartbeat data',
        heartbeatData: []
      }));
    }
  }, [device, timeRange, useCustomRange, customStartDate, customEndDate]);

  const refreshData = useCallback(async () => {
    await Promise.all([fetchAnalytics(), fetchHeartbeatData()]);
  }, [fetchAnalytics, fetchHeartbeatData]);

  const setExporting = useCallback((isExporting: boolean) => {
    setState(prev => ({ ...prev, isExporting }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    if (device && open) {
      refreshData();
    }
  }, [device, open, refreshData]);

  return {
    ...state,
    fetchAnalytics,
    fetchHeartbeatData,
    refreshData,
    setExporting,
    clearError
  };
};
