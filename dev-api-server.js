#!/usr/bin/env node

// Simple local API server for development
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Local API server is running' });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Local API server is working!',
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

// Device analytics endpoint
app.post('/api/analytics/device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.body;

    console.log(`📊 Local API: Fetching analytics for device ${deviceId} from ${startDate} to ${endDate}`);

    // Check if BigQuery is configured
    const isBigQueryConfigured = process.env.GOOGLE_CLOUD_PROJECT_ID && 
                                 process.env.GOOGLE_CLOUD_PROJECT_ID !== 'your-project-id-here';

    if (!isBigQueryConfigured) {
      console.log(`⚠️ Local API: BigQuery not configured, returning mock data`);
      const mockData = generateMockAnalytics(deviceId, startDate, endDate);
      res.json({
        ...mockData,
        isMockData: true,
        dataSource: 'mock',
        message: 'BigQuery not configured. Using mock data.'
      });
      return;
    }

    // For now, return mock data even if BigQuery is configured
    // In a real implementation, you would query BigQuery here
    console.log(`✅ Local API: BigQuery configured, but using mock data for development`);
    const mockData = generateMockAnalytics(deviceId, startDate, endDate);
    res.json({
      ...mockData,
      isMockData: true,
      dataSource: 'mock',
      message: 'Local development mode - using mock data'
    });

  } catch (error) {
    console.error('Error in device analytics:', error);
    res.status(500).json({ error: 'Failed to fetch device analytics' });
  }
});

// Device events endpoint
app.get('/api/analytics/device/:deviceId/events', (req, res) => {
  const { deviceId } = req.params;
  const limit = parseInt(req.query.limit) || 100;

  console.log(`📋 Local API: Fetching events for device ${deviceId}`);

  const mockEvents = generateMockEvents(deviceId, limit);
  res.json(mockEvents);
});

// Fleet analytics endpoint
app.post('/api/analytics/fleet', (req, res) => {
  const { startDate, endDate } = req.body;

  console.log(`🚀 Local API: Fetching fleet analytics from ${startDate} to ${endDate}`);

  const mockFleetData = generateMockFleetAnalytics(startDate, endDate);
  res.json(mockFleetData);
});

// Helper functions (simplified versions)
function generateMockAnalytics(deviceId, startDate, endDate) {
  const analytics = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    
    analytics.push({
      deviceId,
      date: date.toISOString().split('T')[0],
      totalUptime: Math.random() * 24,
      averageBatteryLevel: Math.random() * 100,
      totalHeartbeats: Math.floor(Math.random() * 1000) + 100,
      locationUpdates: Math.floor(Math.random() * 50) + 10,
      networkConnections: Math.floor(Math.random() * 20) + 5,
      screenOnTime: Math.random() * 480,
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

  const summary = {
    totalDays: analytics.length,
    averageUptime: analytics.reduce((sum, day) => sum + day.totalUptime, 0) / analytics.length,
    totalAlerts: analytics.reduce((sum, day) => sum + day.alerts.length, 0),
    mostUsedApp: 'Chrome',
    batteryHealth: 'fair'
  };

  return {
    deviceId,
    startDate,
    endDate,
    analytics,
    summary
  };
}

function generateMockEvents(deviceId, limit) {
  const events = [];
  const eventTypes = ['battery_low', 'location_update', 'network_change', 'app_launch', 'system_alert'];
  
  for (let i = 0; i < Math.min(limit, 20); i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const timestamp = new Date();
    timestamp.setHours(timestamp.getHours() - Math.random() * 24 * 7);
    
    events.push({
      event_id: `event_${i + 1}`,
      device_id: deviceId,
      event_type: eventType,
      timestamp: timestamp.toISOString(),
      event_data: { message: `Mock ${eventType} event` },
      severity: Math.random() > 0.7 ? 'high' : 'medium'
    });
  }
  
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function generateMockFleetAnalytics(startDate, endDate) {
  const fleetData = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    
    fleetData.push({
      date: date.toISOString().split('T')[0],
      total_devices: Math.floor(Math.random() * 50) + 20,
      avg_uptime: Math.random() * 20 + 4,
      avg_battery: Math.random() * 40 + 40,
      total_heartbeats: Math.floor(Math.random() * 10000) + 5000,
      total_alerts: Math.floor(Math.random() * 10)
    });
  }

  return fleetData;
}

app.listen(PORT, () => {
  console.log(`🚀 Local API server running on port ${PORT}`);
  console.log(`📊 Analytics endpoints available at http://localhost:${PORT}/api/analytics`);
  console.log(`🔍 Health check available at http://localhost:${PORT}/api/health`);
});
