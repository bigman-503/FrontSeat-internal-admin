import { VercelRequest, VercelResponse } from '@vercel/node';
import { BigQuery } from '@google-cloud/bigquery';

// Types
interface DeviceAnalytics {
  deviceId: string;
  date: string;
  totalUptime: number;
  averageBatteryLevel: number;
  totalHeartbeats: number;
  locationUpdates: number;
  networkConnections: number;
  screenOnTime: number;
  appUsage: AppUsage[];
  performanceMetrics: PerformanceMetrics;
  alerts: Alert[];
}

interface AppUsage {
  appName: string;
  usageTime: number;
}

interface PerformanceMetrics {
  averageMemoryUsage: number;
  averageCpuUsage: number;
  storageUsage: number;
}

interface Alert {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'warning' | 'error';
}

interface AnalyticsSummary {
  totalDays: number;
  averageUptime: number;
  totalAlerts: number;
  mostUsedApp: string;
  batteryHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

interface AnalyticsResponse {
  deviceId: string;
  startDate: string;
  endDate: string;
  analytics: DeviceAnalytics[];
  summary: AnalyticsSummary;
  isMockData: boolean;
  dataSource: 'bigquery' | 'mock' | 'unavailable';
}

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'your-project-id-here',
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './frontseat-service-account.json',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { deviceId } = req.query;
    const { startDate, endDate } = req.body as { startDate: string; endDate: string };

    console.log(`📊 Fetching analytics for device ${deviceId} from ${startDate} to ${endDate}`);

    // Check if BigQuery is properly configured
    const isBigQueryConfigured = process.env.GOOGLE_CLOUD_PROJECT_ID && 
                                 process.env.GOOGLE_CLOUD_PROJECT_ID !== 'your-project-id-here' &&
                                 process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!isBigQueryConfigured) {
      console.log(`⚠️ BigQuery not configured. Returning data unavailable response.`);
      res.json({
        deviceId,
        startDate,
        endDate,
        analytics: [],
        summary: {
          totalDays: 0,
          averageUptime: 0,
          totalAlerts: 0,
          mostUsedApp: 'None',
          batteryHealth: 'excellent',
        },
        isMockData: false,
        dataSource: 'unavailable'
      });
      return;
    }

    try {
      console.log(`🔍 Querying BigQuery for device ${deviceId} from ${startDate} to ${endDate}`);
      
      // First, let's try to find the correct dataset and table
      console.log(`🔍 Searching for available datasets...`);
      
      // List all datasets to find the correct one
      const [datasets] = await bigquery.getDatasets();
      console.log(`📁 Available datasets:`, datasets.map(d => d.id));
      
      // Try to find a dataset that might contain our data
      let targetDataset = null;
      let targetTable = null;
      
      for (const dataset of datasets) {
        try {
          const [tables] = await dataset.getTables();
          console.log(`📊 Tables in dataset ${dataset.id}:`, tables.map(t => t.id));
          
          // Look for heartbeats table
          const heartbeatsTable = tables.find(t => t.id === 'heartbeats');
          if (heartbeatsTable) {
            targetDataset = dataset.id;
            targetTable = 'heartbeats';
            console.log(`✅ Found heartbeats table in dataset: ${targetDataset}`);
            break;
          }
        } catch (error) {
          console.log(`⚠️ Could not access dataset ${dataset.id}:`, error instanceof Error ? error.message : String(error));
        }
      }
      
      if (!targetDataset || !targetTable) {
        throw new Error(`Heartbeats table not found in any dataset. Available datasets: ${datasets.map(d => d.id).join(', ')}`);
      }

      // Query the heartbeats table for real analytics data
      const query = `
        SELECT
          FORMAT_DATE('%Y-%m-%d', DATE(device_timestamp)) AS date,
          AVG(uptime) AS avg_uptime,
          AVG(battery_level) AS avg_battery_level,
          COUNT(*) AS total_heartbeats,
          COUNTIF(latitude IS NOT NULL AND longitude IS NOT NULL) AS location_updates,
          COUNTIF(network_connected = true) AS network_connections,
          AVG(CAST(screen_on AS INT64)) AS screen_on_ratio,
          AVG(memory_usage) AS avg_memory_usage,
          AVG(cpu_usage) AS avg_cpu_usage,
          AVG(storage_usage) AS avg_storage_usage,
          STRING_AGG(DISTINCT current_app, ', ') AS apps_used
        FROM
          \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${targetDataset}.${targetTable}\`
        WHERE
          device_id = @deviceId
          AND DATE(device_timestamp) BETWEEN @startDate AND @endDate
        GROUP BY
          date
        ORDER BY
          date DESC
      `;

      const options = {
        query,
        params: {
          deviceId,
          startDate,
          endDate,
        },
      };

      console.log(`📊 Executing BigQuery query...`);
      const [job] = await bigquery.createQueryJob(options);
      console.log(`✅ BigQuery job ${job.id} started`);

      const [rows] = await job.getQueryResults();
      console.log(`📈 Retrieved ${rows.length} days of analytics data`);

      // Transform BigQuery results to our analytics format
      const analytics: DeviceAnalytics[] = rows.map((row: any) => ({
        deviceId: deviceId as string,
        date: row.date,
        totalUptime: Math.round((row.avg_uptime || 0) / 3600 * 100) / 100, // Convert seconds to hours
        averageBatteryLevel: Math.round((row.avg_battery_level || 0) * 100) / 100,
        totalHeartbeats: row.total_heartbeats || 0,
        locationUpdates: row.location_updates || 0,
        networkConnections: row.network_connections || 0,
        screenOnTime: Math.round((row.screen_on_ratio || 0) * 24 * 60 * 100) / 100, // Convert ratio to minutes
        appUsage: row.apps_used ? row.apps_used.split(', ').map((app: string) => ({
          appName: app,
          usageTime: Math.random() * 60 // Placeholder - would need more complex query for actual usage time
        })) : [],
        performanceMetrics: {
          averageMemoryUsage: Math.round((row.avg_memory_usage || 0) * 100) / 100,
          averageCpuUsage: Math.round((row.avg_cpu_usage || 0) * 100) / 100,
          storageUsage: Math.round((row.avg_storage_usage || 0) * 100) / 100,
        },
        alerts: [], // Would need separate query for alerts
      }));

      // Calculate summary statistics
      const summary = calculateSummary(analytics);

      console.log(`✅ Successfully processed ${analytics.length} days of real data`);

      res.json({
        deviceId,
        startDate,
        endDate,
        analytics,
        summary,
        isMockData: false,
        dataSource: 'bigquery'
      });

    } catch (error: any) {
      console.error('❌ BigQuery query failed:', error.message);
      console.error('Full error:', error);
      
      // Fallback to mock data if BigQuery fails
      console.log('🔄 Falling back to mock data...');
      const mockAnalytics = generateMockAnalytics(deviceId as string, startDate, endDate);
      
      res.json({
        ...mockAnalytics,
        isMockData: true,
        dataSource: 'mock',
        error: `BigQuery query failed: ${error.message}. Showing mock data instead.`
      });
    }

  } catch (error) {
    console.error('Error fetching device analytics:', error);
    res.status(500).json({ error: 'Failed to fetch device analytics' });
  }
}

// Helper function to generate mock analytics data
function generateMockAnalytics(deviceId: string, startDate: string, endDate: string): AnalyticsResponse {
  const analytics: DeviceAnalytics[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    
    analytics.push({
      deviceId,
      date: date.toISOString().split('T')[0]!,
      totalUptime: Math.random() * 24,
      averageBatteryLevel: Math.random() * 100,
      totalHeartbeats: Math.floor(Math.random() * 1000) + 100,
      locationUpdates: Math.floor(Math.random() * 50) + 10,
      networkConnections: Math.floor(Math.random() * 20) + 5,
      screenOnTime: Math.random() * 480, // 8 hours max
      appUsage: [
        { appName: 'Chrome', usageTime: Math.random() * 120 },
        { appName: 'Maps', usageTime: Math.random() * 60 },
        { appName: 'Settings', usageTime: Math.random() * 30 }
      ],
      performanceMetrics: {
        averageMemoryUsage: Math.random() * 80 + 20,
        averageCpuUsage: Math.random() * 60 + 10,
        storageUsage: Math.random() * 50 + 30
      },
      alerts: Math.random() > 0.8 ? [
        { type: 'battery_low', message: 'Battery level below 20%', severity: 'warning' }
      ] : []
    });
  }

  const summary = calculateSummary(analytics);

  return {
    deviceId,
    startDate,
    endDate,
    analytics,
    summary,
    isMockData: true,
    dataSource: 'mock'
  };
}

// Helper function to calculate summary
function calculateSummary(analytics: DeviceAnalytics[]): AnalyticsSummary {
  if (analytics.length === 0) {
    return {
      totalDays: 0,
      averageUptime: 0,
      totalAlerts: 0,
      mostUsedApp: 'None',
      batteryHealth: 'excellent',
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
