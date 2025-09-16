# Device Analytics Feature

## Overview
The Device Analytics feature provides comprehensive historical data analysis for individual devices in the fleet. When you click on any device in the `/devices` page, a detailed analytics dialog opens showing real-time and historical performance data.

## Features

### 🎯 Click-to-Analyze
- **Clickable Device Rows**: Click on any device row in the devices table to open analytics
- **Analytics Button**: Use the chart icon in the actions column for quick access
- **Visual Indicators**: Hover effects show analytics availability

### 📊 Analytics Dashboard
The analytics dialog includes four main tabs:

#### 1. Performance Tab
- **Uptime Trend**: Daily uptime over the selected period
- **Network Activity**: Network connections and location updates
- **Real-time Charts**: Interactive line and bar charts using Recharts

#### 2. Battery Tab
- **Battery Level Trend**: Average battery level over time
- **Battery Health Assessment**: Excellent, Good, Fair, or Poor rating
- **Charging Patterns**: Historical charging behavior

#### 3. App Usage Tab
- **Usage Distribution**: Time spent in different applications
- **Most Used App**: Primary application identification
- **Pie Chart Visualization**: Visual breakdown of app usage

#### 4. Alerts Tab
- **Device Alerts**: Recent alerts and issues
- **Alert Types**: Battery low, network disconnected, app crashes, storage full
- **Timeline View**: Chronological alert history

### 📈 Summary Metrics
- **Total Days**: Number of days in the selected period
- **Average Uptime**: Mean daily uptime in hours
- **Total Alerts**: Count of all alerts in the period
- **Battery Health**: Overall battery condition assessment

### ⏰ Time Range Selection
- **Last 7 days**: Recent performance data
- **Last 30 days**: Monthly overview
- **Last 90 days**: Quarterly analysis
- **Last year**: Annual trends

## Technical Implementation

### Data Sources
- **Real-time Data**: Firebase Firestore for live device status
- **Historical Data**: Backend API with BigQuery integration for analytics and trends
- **Fallback**: Mock data for development and testing

### Backend API Integration
The frontend uses a browser-compatible `AnalyticsService` that calls a backend API:

```typescript
// Frontend service calls backend API
const response = await fetch(`${API_BASE_URL}/analytics/device/${deviceId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ startDate, endDate }),
});
```

### Backend BigQuery Integration
The backend API uses the BigQuery client library:

```javascript
// Backend service configuration
const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Dataset structure
DATASET_ID = 'fleet_analytics'
DEVICE_ANALYTICS_TABLE = 'device_daily_analytics'
DEVICE_EVENTS_TABLE = 'device_events'
```

### Data Schema
```typescript
interface DeviceAnalytics {
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
```

## Setup Instructions

### 1. Frontend Environment Variables
Add to your `.env.local` file:
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 2. Backend Setup
1. Create a backend API server (see `backend-api-example.js`)
2. Install required dependencies:
   ```bash
   npm install express @google-cloud/bigquery cors
   ```
3. Set environment variables:
   ```env
   GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
   PORT=3001
   ```

### 3. Service Account
Ensure your service account JSON file has BigQuery permissions.

### 4. BigQuery Dataset
Create the following tables in your BigQuery dataset:

#### device_daily_analytics
```sql
CREATE TABLE `fleet_analytics.device_daily_analytics` (
  device_id STRING NOT NULL,
  date DATE NOT NULL,
  total_uptime_hours FLOAT64,
  average_battery_level FLOAT64,
  total_heartbeats INT64,
  location_updates INT64,
  network_connections INT64,
  screen_on_time_minutes FLOAT64,
  app_usage ARRAY<STRUCT<
    app_name STRING,
    package_name STRING,
    usage_time FLOAT64
  >>,
  performance_metrics STRUCT<
    average_memory_usage FLOAT64,
    average_cpu_usage FLOAT64,
    storage_usage FLOAT64
  >,
  alerts ARRAY<STRUCT<
    type STRING,
    timestamp TIMESTAMP,
    message STRING
  >>
);
```

#### device_events
```sql
CREATE TABLE `fleet_analytics.device_events` (
  event_id STRING NOT NULL,
  device_id STRING NOT NULL,
  event_type STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  event_data JSON,
  severity STRING
);
```

## Usage

### Accessing Device Analytics
1. Navigate to the `/devices` page
2. Click on any device row or the analytics button
3. Select your desired time range
4. Explore the different analytics tabs
5. Use the refresh button to get the latest data

### Interpreting Data
- **Green indicators**: Good performance
- **Yellow indicators**: Moderate issues
- **Red indicators**: Critical problems requiring attention
- **Trends**: Look for patterns over time to identify issues

## Troubleshooting

### No Data Showing
- Check BigQuery connection and permissions
- Verify service account key file exists
- Ensure environment variables are set correctly
- Check browser console for error messages

### Mock Data
If BigQuery is not available, the system automatically falls back to mock data for development and testing purposes.

## Future Enhancements
- Real-time data streaming
- Custom date range selection
- Export analytics to PDF/CSV
- Alert notifications
- Comparative analysis between devices
- Predictive analytics and forecasting
