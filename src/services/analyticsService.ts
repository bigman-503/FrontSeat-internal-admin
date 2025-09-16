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
  isMockData?: boolean;
  dataSource?: 'bigquery' | 'mock' | 'unavailable';
}

export class AnalyticsService {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  /**
   * Get device analytics for a specific date range
   * This method will try to fetch from a backend API first, then fallback to mock data
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
        
        // Check if this is real data or mock/unavailable data
        if (data.dataSource === 'unavailable') {
          console.log(`⚠️ AnalyticsService: Data unavailable - BigQuery not configured, using mock data`);
          return this.generateMockData(deviceId, startDate, endDate);
        } else if (data.dataSource === 'mock') {
          console.log(`✅ AnalyticsService: Retrieved mock data from API`);
          return data;
        } else if (data.dataSource === 'bigquery') {
          console.log(`✅ AnalyticsService: Retrieved real data from BigQuery`);
          return data;
        } else {
          // Legacy response without dataSource field - treat as mock data
          console.log(`⚠️ AnalyticsService: Retrieved data without source info - treating as mock data`);
          return { ...data, dataSource: 'mock', isMockData: true };
        }
      } else {
        console.log(`⚠️ AnalyticsService: API not available, using mock data`);
        return this.generateMockData(deviceId, startDate, endDate);
      }
    } catch (error) {
      console.log(`⚠️ AnalyticsService: Error fetching from API, using mock data:`, error);
      return this.generateMockData(deviceId, startDate, endDate);
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
   * Generate mock analytics data for demonstration purposes
   */
  private static generateMockData(
    deviceId: string,
    startDate: string,
    endDate: string
  ): DeviceHistoricalData {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const analytics: DeviceAnalytics[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      
      const totalUptime = 8 + Math.random() * 8; // 8-16 hours
      const averageBatteryLevel = 20 + Math.random() * 60; // 20-80%
      const totalHeartbeats = 50 + Math.random() * 100;
      const locationUpdates = 10 + Math.random() * 20;
      const networkConnections = 5 + Math.random() * 15;
      const screenOnTime = 120 + Math.random() * 240; // 2-6 hours
      
      const appUsage = [
        { appName: 'FrontSeat App', packageName: 'com.frontseat.app', usageTime: 60 + Math.random() * 120 },
        { appName: 'Chrome', packageName: 'com.android.chrome', usageTime: 30 + Math.random() * 60 },
        { appName: 'Settings', packageName: 'com.android.settings', usageTime: 10 + Math.random() * 20 },
        { appName: 'Camera', packageName: 'com.android.camera', usageTime: 5 + Math.random() * 15 },
      ];
      
      const alerts = [];
      if (averageBatteryLevel < 30) {
        alerts.push({
          type: 'battery_low' as const,
          timestamp: date.toISOString(),
          message: 'Battery level is critically low',
        });
      }
      
      if (Math.random() < 0.1) { // 10% chance of network alert
        alerts.push({
          type: 'network_disconnected' as const,
          timestamp: date.toISOString(),
          message: 'Network connection lost temporarily',
        });
      }
      
      analytics.push({
        deviceId,
        date: date.toISOString().split('T')[0],
        totalUptime,
        averageBatteryLevel,
        totalHeartbeats,
        locationUpdates,
        networkConnections,
        screenOnTime,
        appUsage,
        performanceMetrics: {
          averageMemoryUsage: 40 + Math.random() * 30,
          averageCpuUsage: 20 + Math.random() * 40,
          storageUsage: 60 + Math.random() * 20,
        },
        alerts,
      });
    }
    
    const summary = this.calculateSummary(analytics);
    
    return {
      deviceId,
      startDate,
      endDate,
      analytics,
      summary,
      isMockData: true,
      dataSource: 'mock',
    };
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
