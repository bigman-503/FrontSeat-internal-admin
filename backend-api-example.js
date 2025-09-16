// Backend API Example for BigQuery Integration
// This is an example of how to implement the backend API that the frontend calls
// You can implement this in Node.js, Python, Go, or any other backend language

const express = require('express');
const { BigQuery } = require('@google-cloud/bigquery');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const DATASET_ID = 'fleet_analytics';
const DEVICE_ANALYTICS_TABLE = 'device_daily_analytics';
const DEVICE_EVENTS_TABLE = 'device_events';

// Get device analytics
app.post('/api/analytics/device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.body;

    const query = `
      SELECT 
        device_id,
        date,
        total_uptime_hours,
        average_battery_level,
        total_heartbeats,
        location_updates,
        network_connections,
        screen_on_time_minutes,
        app_usage,
        performance_metrics,
        alerts
      FROM \`${DATASET_ID}.${DEVICE_ANALYTICS_TABLE}\`
      WHERE device_id = @deviceId
        AND date BETWEEN @startDate AND @endDate
      ORDER BY date DESC
    `;

    const options = {
      query,
      params: {
        deviceId,
        startDate,
        endDate,
      },
    };

    const [rows] = await bigquery.query(options);
    
    // Transform the data
    const analytics = rows.map((row) => ({
      deviceId: row.device_id,
      date: row.date,
      totalUptime: row.total_uptime_hours || 0,
      averageBatteryLevel: row.average_battery_level || 0,
      totalHeartbeats: row.total_heartbeats || 0,
      locationUpdates: row.location_updates || 0,
      networkConnections: row.network_connections || 0,
      screenOnTime: row.screen_on_time_minutes || 0,
      appUsage: row.app_usage || [],
      performanceMetrics: row.performance_metrics || {
        averageMemoryUsage: 0,
        averageCpuUsage: 0,
        storageUsage: 0,
      },
      alerts: row.alerts || [],
    }));

    // Calculate summary
    const summary = calculateSummary(analytics);

    res.json({
      deviceId,
      startDate,
      endDate,
      analytics,
      summary,
    });
  } catch (error) {
    console.error('Error fetching device analytics:', error);
    res.status(500).json({ error: 'Failed to fetch device analytics' });
  }
});

// Get device events
app.get('/api/analytics/device/:deviceId/events', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const query = `
      SELECT 
        event_id,
        device_id,
        event_type,
        timestamp,
        event_data,
        severity
      FROM \`${DATASET_ID}.${DEVICE_EVENTS_TABLE}\`
      WHERE device_id = @deviceId
      ORDER BY timestamp DESC
      LIMIT @limit
    `;

    const options = {
      query,
      params: {
        deviceId,
        limit,
      },
    };

    const [rows] = await bigquery.query(options);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching device events:', error);
    res.status(500).json({ error: 'Failed to fetch device events' });
  }
});

// Get fleet analytics
app.post('/api/analytics/fleet', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const query = `
      SELECT 
        date,
        COUNT(DISTINCT device_id) as total_devices,
        AVG(total_uptime_hours) as avg_uptime,
        AVG(average_battery_level) as avg_battery,
        SUM(total_heartbeats) as total_heartbeats,
        COUNT(CASE WHEN alerts IS NOT NULL THEN 1 END) as total_alerts
      FROM \`${DATASET_ID}.${DEVICE_ANALYTICS_TABLE}\`
      WHERE date BETWEEN @startDate AND @endDate
      GROUP BY date
      ORDER BY date DESC
    `;

    const options = {
      query,
      params: {
        startDate,
        endDate,
      },
    };

    const [rows] = await bigquery.query(options);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching fleet analytics:', error);
    res.status(500).json({ error: 'Failed to fetch fleet analytics' });
  }
});

// Helper function to calculate summary
function calculateSummary(analytics) {
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
  const appUsageMap = new Map();
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
  let batteryHealth;
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`BigQuery integration ready for project: ${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
});

module.exports = app;
