// Analytics Service - Browser-compatible version
// This service provides device analytics data and can be extended to use a backend API

export interface DeviceAnalytics {
  deviceId: string;
  date: string;
  totalUptime: number; // in hours
  averageBatteryLevel: number;
  totalHeartbeats: number;
  locationUpdates: number;
  networkConnections: number;
  screenOnTime: number; // in minutes
  appUsage: Array<{
    appName: string;
    packageName: string;
    usageTime: number; // in minutes
  }>;
  performanceMetrics: {
    averageMemoryUsage: number;
    averageCpuUsage: number;
    storageUsage: number;
  };
  alerts: Array<{
    type: 'battery_low' | 'network_disconnected' | 'app_crash' | 'storage_full';
    timestamp: string;
    message: string;
  }>;
}

export interface DeviceHistoricalData {
  deviceId: string;
  startDate: string;
  endDate: string;
  analytics: DeviceAnalytics[];
  summary: {
    totalDays: number;
    averageUptime: number;
    totalAlerts: number;
    mostUsedApp: string;
    batteryHealth: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export class AnalyticsService {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  /**
   * Get device analytics for a specific date range
   * This method will try to fetch from a backend API first, then show a message if not available
   */
  static async getDeviceAnalytics(
    deviceId: string,
    startDate: string,
    endDate: string
  ): Promise<DeviceHistoricalData> {
    try {
      console.log(`🔍 AnalyticsService: Fetching analytics for device ${deviceId} from ${startDate} to ${endDate}`);

      // Try to fetch from backend API first
      const response = await fetch(`${this.API_BASE_URL}/analytics/device/${deviceId}`, {
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
        console.log(`✅ AnalyticsService: Retrieved real data from API`);
        return data;
      } else {
        console.log(`⚠️ AnalyticsService: API not available`);
        throw new Error('Analytics data is not available. Please ensure the backend API is running and configured.');
      }
    } catch (error) {
      console.log(`⚠️ AnalyticsService: Error fetching from API:`, error);
      throw new Error('Analytics data is not available. Please ensure the backend API is running and configured.');
    }
  }

  /**
   * Get real-time device events
   */
  static async getDeviceEvents(
    deviceId: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/analytics/device/${deviceId}/events?limit=${limit}`);
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Device events are not available. Please ensure the backend API is running and configured.');
      }
    } catch (error) {
      console.log(`⚠️ AnalyticsService: Error fetching events:`, error);
      throw new Error('Device events are not available. Please ensure the backend API is running and configured.');
    }
  }

  /**
   * Get fleet-wide analytics
   */
  static async getFleetAnalytics(
    startDate: string,
    endDate: string
  ): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/analytics/fleet`, {
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
        return await response.json();
      } else {
        throw new Error('Fleet analytics are not available. Please ensure the backend API is running and configured.');
      }
    } catch (error) {
      console.log(`⚠️ AnalyticsService: Error fetching fleet analytics:`, error);
      throw new Error('Fleet analytics are not available. Please ensure the backend API is running and configured.');
    }
  }

  /**
   * Calculate summary statistics from analytics data
   */
  private static calculateSummary(analytics: DeviceAnalytics[]) {
    if (analytics.length === 0) {
      return {
        totalDays: 0,
        averageUptime: 0,
        totalAlerts: 0,
        mostUsedApp: 'None',
        batteryHealth: 'excellent' as const,
      };
    }

    const totalDays = analytics.length;
    const averageUptime = analytics.reduce((sum, day) => sum + day.totalUptime, 0) / totalDays;
    const totalAlerts = analytics.reduce((sum, day) => sum + day.alerts.length, 0);
    
    // Find most used app
    const appUsageMap = new Map<string, number>();
    analytics.forEach(day => {
      day.appUsage.forEach(app => {
        const current = appUsageMap.get(app.appName) || 0;
        appUsageMap.set(app.appName, current + app.usageTime);
      });
    });
    
    const mostUsedApp = appUsageMap.size > 0 
      ? Array.from(appUsageMap.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : 'None';

    // Calculate battery health
    const avgBattery = analytics.reduce((sum, day) => sum + day.averageBatteryLevel, 0) / totalDays;
    let batteryHealth: 'excellent' | 'good' | 'fair' | 'poor';
    if (avgBattery >= 80) batteryHealth = 'excellent';
    else if (avgBattery >= 60) batteryHealth = 'good';
    else if (avgBattery >= 40) batteryHealth = 'fair';
    else batteryHealth = 'poor';

    return {
      totalDays,
      averageUptime,
      totalAlerts,
      mostUsedApp,
      batteryHealth,
    };
  }

}
