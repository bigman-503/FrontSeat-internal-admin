import { VercelRequest, VercelResponse } from '@vercel/node';
import { BigQuery } from '@google-cloud/bigquery';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Types
interface HeartbeatData {
  last_seen: string | { value: string };
  device_id?: string;
  device_name?: string;
  battery_level?: number;
  cpu_usage?: number;
  heartbeat_count?: number;
  is_charging?: boolean;
  latitude?: number;
  longitude?: number;
  location_accuracy?: number;
  location_timestamp?: string | { value: string };
}

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { deviceId } = req.query;
    const { 
      startDate, 
      endDate, 
      timeInterval = 5, 
      timeRange = '24h' 
    } = req.body as { 
      startDate: string; 
      endDate: string; 
      timeInterval?: number; 
      timeRange?: string; 
    };

    console.log(`📊 Processing uptime data for device ${deviceId} from ${startDate} to ${endDate}`);
    console.log('📅 Date range details:', {
      startDate,
      endDate,
      startDateUTC: new Date(startDate).toISOString(),
      endDateUTC: new Date(endDate).toISOString(),
      startDatePST: new Date(startDate).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
      endDatePST: new Date(endDate).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
    });

    // Initialize BigQuery client
    let bigqueryConfig: any = {
      projectId: 'frontseat-admin',
    };

    // Try to read credentials from file
    try {
      const fs = await import('fs');
      const path = await import('path');
      const credentialsPath = path.join(process.cwd(), 'frontseat-service-account.json');
      const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
      const credentials = JSON.parse(credentialsContent);
      bigqueryConfig.credentials = credentials;
      console.log('✅ Using credentials from file:', credentialsPath);
    } catch (error) {
      console.log('⚠️ Failed to read credentials file:', error);
      return res.status(500).json({ error: 'BigQuery credentials not found' });
    }

    const bigquery = new BigQuery(bigqueryConfig);

    // Check if BigQuery is properly configured
    const isBigQueryConfigured = process.env.GOOGLE_CLOUD_PROJECT_ID && 
                                 process.env.GOOGLE_CLOUD_PROJECT_ID !== 'your-project-id-here' &&
                                 bigqueryConfig.credentials;

    if (!isBigQueryConfigured) {
      console.log(`⚠️ BigQuery not configured.`);
      return res.status(500).json({ 
        error: 'BigQuery not configured. Please check your environment variables and credentials.',
        deviceId: deviceId as string,
        timeRange,
        timeInterval
      });
    }

    try {
      // Test BigQuery connection
      const [datasets] = await bigquery.getDatasets();
      console.log('✅ BigQuery connection successful!');

      // Find the correct dataset and table
      let targetDataset = null;
      let targetTable = null;
      
      for (const dataset of datasets) {
        try {
          const [tables] = await dataset.getTables();
          const heartbeatsTable = tables.find(t => t.id === 'heartbeats');
          if (heartbeatsTable) {
            targetDataset = dataset.id;
            targetTable = 'heartbeats';
            console.log(`✅ Found heartbeats table in dataset: ${targetDataset}`);
            break;
          }
        } catch (error) {
          console.log(`⚠️ Could not access dataset ${dataset.id}:`, error);
        }
      }
      
      if (!targetDataset || !targetTable) {
        throw new Error(`Heartbeats table not found in any dataset.`);
      }

      // Query raw heartbeat data using location_timestamp (UTC) and convert to PST
      const query = `
        SELECT
          last_seen,
          device_id,
          device_name,
          battery_level,
          cpu_usage,
          heartbeat_count,
          is_charging,
          latitude,
          longitude,
          location_accuracy,
          location_timestamp
        FROM
          \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${targetDataset}.${targetTable}\`
        WHERE
          (device_id = @deviceId OR device_name = @deviceId)
          AND location_timestamp >= PARSE_TIMESTAMP('%Y-%m-%d %H:%M:%S %Z', CONCAT(@startDate, ' 00:00:00 America/Los_Angeles'))
          AND location_timestamp < PARSE_TIMESTAMP('%Y-%m-%d %H:%M:%S %Z', CONCAT(FORMAT_DATE('%Y-%m-%d', DATE_ADD(PARSE_DATE('%Y-%m-%d', @endDate), INTERVAL 1 DAY)), ' 00:00:00 America/Los_Angeles'))
        ORDER BY
          location_timestamp ASC
      `;

      const options = {
        query,
        params: {
          deviceId,
          startDate,
          endDate,
        },
      };

      console.log(`📊 Executing BigQuery query for raw heartbeats...`);
      const [job] = await bigquery.createQueryJob(options);
      const [rows] = await job.getQueryResults();
      console.log(`📈 Retrieved ${rows.length} heartbeat records`);
      
      // Log sample data for debugging
      if (rows.length > 0) {
        console.log('📊 Sample heartbeat data:', {
          firstRecord: {
            device_id: rows[0].device_id,
            location_timestamp: rows[0].location_timestamp,
            last_seen: rows[0].last_seen,
            battery_level: rows[0].battery_level,
            cpu_usage: rows[0].cpu_usage
          },
          lastRecord: {
            device_id: rows[rows.length - 1].device_id,
            location_timestamp: rows[rows.length - 1].location_timestamp,
            last_seen: rows[rows.length - 1].last_seen,
            battery_level: rows[rows.length - 1].battery_level,
            cpu_usage: rows[rows.length - 1].cpu_usage
          }
        });
        
        // Test timezone conversion for first record
        const firstParsed = parseTimestamp(rows[0].location_timestamp);
        console.log('🕐 First record timezone conversion test:', {
          original: rows[0].location_timestamp,
          parsed: firstParsed?.toISOString(),
          parsedLocal: firstParsed?.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
        });
      } else {
        console.log('❌ No heartbeat data found in BigQuery for the specified date range');
        console.log('🔍 Query parameters:', { deviceId, startDate, endDate, timeRange });
      }

      // Process the data server-side
      const heartbeatData: HeartbeatData[] = rows;
      const uptimeData = processUptimeData(heartbeatData, timeRange, timeInterval, startDate, endDate);
      const stats = calculateUptimeStats(uptimeData, timeInterval);
      const patterns = analyzeDevicePatterns(uptimeData, timeInterval);
      const dateRange = getDateRange(uptimeData, timeRange);

      const response: UptimeResponse = {
        deviceId: deviceId as string,
        timeRange,
        timeInterval,
        uptimeData,
        stats,
        patterns,
        dateRange,
        isMockData: false,
        dataSource: 'bigquery'
      };

      console.log(`✅ Successfully processed uptime data: ${uptimeData.length} points`);
      res.json(response);

    } catch (error: any) {
      console.error('❌ BigQuery query failed:', error.message);
      console.error('Full error:', error);
      
      return res.status(500).json({ 
        error: `BigQuery query failed: ${error.message}`,
        deviceId: deviceId as string,
        timeRange,
        timeInterval,
        details: error.toString()
      });
    }

  } catch (error) {
    console.error('Error processing uptime data:', error);
    res.status(500).json({ error: 'Failed to process uptime data' });
  }
}

// Data processing functions (moved from frontend)
function parseTimestamp(timestamp: any): Date | null {
  if (!timestamp) return null;
  
  let timestampStr = timestamp;
  if (timestamp && typeof timestamp === 'object' && timestamp.value) {
    timestampStr = timestamp.value;
  }
  
  // Parse the UTC timestamp from location_timestamp
  const utcDate = new Date(timestampStr);
  if (isNaN(utcDate.getTime())) return null;
  
  // Convert UTC to Pacific timezone (automatically handles PST/PDT)
  const pacificTimeString = utcDate.toLocaleString("en-US", {
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
  
  // Create a date string in Pacific timezone and parse it
  const pacificDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
  
  // Create a date object that represents the Pacific time
  // The key is to create a date in local timezone that matches the Pacific time
  const pacificDate = new Date();
  pacificDate.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
  pacificDate.setHours(parseInt(hour), parseInt(minute), parseInt(second), 0);
  
  console.log('🕐 Timezone conversion:', {
    original: timestampStr,
    utc: utcDate.toISOString(),
    pacificTimeString,
    pacificDate: pacificDate.toISOString()
  });
  
  return pacificDate;
}

function processUptimeData(
  heartbeatData: HeartbeatData[],
  timeRange: string,
  timeInterval: number,
  startDate?: string,
  endDate?: string
): UptimeDataPoint[] {
  console.log('🔄 Processing uptime data:', { 
    timeRange, 
    heartbeatDataLength: heartbeatData.length,
    timeInterval,
    startDate,
    endDate
  });
  
  // For 24h view, always generate full 24-hour range even with no data
  if (timeRange === '24h' && !heartbeatData.length) {
    return generateEmpty24HourData(timeInterval);
  }
  
  if (!heartbeatData.length) {
    return [];
  }

  // Filter out invalid timestamps and sort by location_timestamp (converted to PST)
  const sortedData = [...heartbeatData]
    .map(hb => ({ ...hb, parsedTime: parseTimestamp(hb.location_timestamp || hb.last_seen) }))
    .filter(hb => hb.parsedTime !== null)
    .sort((a, b) => {
      if (!a.parsedTime || !b.parsedTime) return 0;
      return a.parsedTime.getTime() - b.parsedTime.getTime();
    });

  if (!sortedData.length) {
    return [];
  }

  // Determine time range
  const { startTime, endTime } = getTimeRange(timeRange, sortedData, timeInterval, startDate, endDate);
  
  // Generate intervals
  const intervals = generateTimeIntervals(startTime, endTime, timeInterval);
  
  console.log('⏰ Generated intervals:', {
    totalIntervals: intervals.length,
    firstInterval: intervals[0]?.toISOString(),
    lastInterval: intervals[intervals.length - 1]?.toISOString(),
    sampleIntervals: intervals.slice(0, 5).map(i => i.toISOString())
  });
  
  // Process uptime data
  return processUptimeIntervals(intervals, sortedData, timeInterval);
}

function generateEmpty24HourData(timeInterval: number): UptimeDataPoint[] {
  const intervals = [];
  const today = new Date();
  
  // Use proper timezone handling for Pacific timezone
  const pacificTimeString = today.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const [datePart, timePart] = pacificTimeString.split(', ');
  const [month, day, year] = datePart.split('/');
  const [hour, minute, second] = timePart.split(':');
  
  const todayPacific = new Date(
    parseInt(year), 
    parseInt(month) - 1, 
    parseInt(day), 
    0, 0, 0
  );
  
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += timeInterval) {
      const time = new Date(todayPacific);
      time.setHours(hour, minute, 0, 0);
      intervals.push(time);
    }
  }
  
  return intervals.map((intervalStart, i) => ({
    time: intervalStart.toISOString(),
    displayTime: intervalStart.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Los_Angeles'
    }),
    isOnline: 0,
    prevIsOnline: i > 0 ? 0 : null,
    batteryLevel: 0,
    cpuUsage: 0,
    heartbeatCount: 0
  }));
}

function getTimeRange(timeRange: string, sortedData: any[], timeInterval: number, startDate?: string, endDate?: string) {
  let startTime: Date, endTime: Date;
  
  if (timeRange === '24h') {
    // For 24h view, create a 24-hour window from current Pacific time going back 24 hours
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
    
    const [datePart, timePart] = pacificTimeString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    
    const nowPacific = new Date(
      parseInt(year), 
      parseInt(month) - 1, 
      parseInt(day), 
      parseInt(hour), 
      parseInt(minute), 
      parseInt(second)
    );
    
    // End time is current Pacific time
    endTime = new Date(nowPacific);
    
    // Start time is 24 hours ago from current Pacific time
    startTime = new Date(nowPacific);
    startTime.setHours(nowPacific.getHours() - 24, nowPacific.getMinutes(), nowPacific.getSeconds(), 0);
    
    // Round to nearest 15-minute interval for cleaner display
    const roundedStart = new Date(startTime);
    roundedStart.setMinutes(Math.floor(roundedStart.getMinutes() / timeInterval) * timeInterval, 0, 0);
    
    const roundedEnd = new Date(endTime);
    roundedEnd.setMinutes(Math.ceil(roundedEnd.getMinutes() / timeInterval) * timeInterval, 0, 0);
    
    startTime = roundedStart;
    endTime = roundedEnd;
  } else if (startDate && endDate) {
    // For 7d and 30d views, use the requested date range to ensure we include the full period
    startTime = new Date(startDate + 'T00:00:00');
    endTime = new Date(endDate + 'T23:59:59');
    
    // Round to nearest 15-minute interval for cleaner display
    const roundedStart = new Date(startTime);
    roundedStart.setMinutes(Math.floor(roundedStart.getMinutes() / timeInterval) * timeInterval, 0, 0);
    
    const roundedEnd = new Date(endTime);
    roundedEnd.setMinutes(Math.ceil(roundedEnd.getMinutes() / timeInterval) * timeInterval, 0, 0);
    
    startTime = roundedStart;
    endTime = roundedEnd;
  } else {
    // Fallback to data range if no dates provided
    startTime = sortedData[0].parsedTime!;
    endTime = sortedData[sortedData.length - 1].parsedTime!;
    
    const roundedStart = new Date(startTime);
    roundedStart.setMinutes(Math.floor(roundedStart.getMinutes() / timeInterval) * timeInterval, 0, 0);
    
    const roundedEnd = new Date(endTime);
    roundedEnd.setMinutes(Math.ceil(roundedEnd.getMinutes() / timeInterval) * timeInterval, 0, 0);
    
    startTime = roundedStart;
    endTime = roundedEnd;
  }
  
  console.log('📅 Time range:', {
    timeRange,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    startTimePST: startTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
    endTimePST: endTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
    requestedStartDate: startDate,
    requestedEndDate: endDate
  });
  
  return { startTime, endTime };
}

function generateTimeIntervals(startTime: Date, endTime: Date, timeInterval: number): Date[] {
  const intervals = [];
  const current = new Date(startTime);
  while (current < endTime) {
    intervals.push(new Date(current));
    current.setMinutes(current.getMinutes() + timeInterval);
  }
  return intervals;
}

function processUptimeIntervals(
  intervals: Date[],
  sortedData: any[],
  timeInterval: number
): UptimeDataPoint[] {
  const uptimeData: UptimeDataPoint[] = [];
  const maxGapMinutes = 3;

  console.log('🔄 Processing intervals:', {
    totalIntervals: intervals.length,
    totalHeartbeats: sortedData.length,
    firstInterval: intervals[0]?.toISOString(),
    lastInterval: intervals[intervals.length - 1]?.toISOString(),
    firstHeartbeat: sortedData[0]?.parsedTime?.toISOString(),
    lastHeartbeat: sortedData[sortedData.length - 1]?.parsedTime?.toISOString()
  });
  
  // Log all parsed heartbeats for debugging
  console.log('📊 All parsed heartbeats:', sortedData.map((hb, index) => ({
    index,
    original: hb.location_timestamp || hb.last_seen,
    parsed: hb.parsedTime?.toISOString(),
    parsedLocal: hb.parsedTime?.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
    parsedHours: hb.parsedTime?.getHours(),
    parsedMinutes: hb.parsedTime?.getMinutes()
  })));
  
  // Test specific heartbeat matching
  if (sortedData.length > 0) {
    const testHeartbeat = sortedData[0];
    const testInterval = intervals[0];
    const testIntervalEnd = new Date(testInterval.getTime() + timeInterval * 60 * 1000);
    
    console.log('🧪 Testing heartbeat matching:', {
      heartbeat: {
        original: testHeartbeat.location_timestamp || testHeartbeat.last_seen,
        parsed: testHeartbeat.parsedTime?.toISOString(),
        hours: testHeartbeat.parsedTime?.getHours(),
        minutes: testHeartbeat.parsedTime?.getMinutes()
      },
      interval: {
        start: testInterval.toISOString(),
        end: testIntervalEnd.toISOString(),
        startHours: testInterval.getHours(),
        startMinutes: testInterval.getMinutes()
      },
      isInInterval: testHeartbeat.parsedTime && testHeartbeat.parsedTime >= testInterval && testHeartbeat.parsedTime < testIntervalEnd
    });
  }

  for (let i = 0; i < intervals.length; i++) {
    const intervalStart = intervals[i];
    const intervalEnd = new Date(intervalStart.getTime() + timeInterval * 60 * 1000);
    
    // Look for heartbeats within the interval OR within a reasonable window before/after
    // This makes the detection more lenient - if there's any heartbeat activity around this time,
    // we consider the device online for this interval
    const windowMinutes = 5; // 5-minute window before and after the interval
    const windowStart = new Date(intervalStart.getTime() - windowMinutes * 60 * 1000);
    const windowEnd = new Date(intervalEnd.getTime() + windowMinutes * 60 * 1000);
    
    const heartbeatsInWindow = sortedData.filter(hb => {
      if (!hb.parsedTime) return false;
      return hb.parsedTime >= windowStart && hb.parsedTime <= windowEnd;
    });

    // Also check for heartbeats in the exact interval
    const heartbeatsInInterval = sortedData.filter(hb => {
      if (!hb.parsedTime) return false;
      return hb.parsedTime >= intervalStart && hb.parsedTime < intervalEnd;
    });

    let isOnline = false;
    let avgBatteryLevel = 0;
    let avgCpuUsage = 0;
    let totalHeartbeats = heartbeatsInInterval.length;

    // If there are heartbeats in the window (including the interval), consider it online
    if (heartbeatsInWindow.length > 0) {
      isOnline = true;
      
      // Use heartbeats in the exact interval for averages, or fall back to window heartbeats
      const heartbeatsForAvg = heartbeatsInInterval.length > 0 ? heartbeatsInInterval : heartbeatsInWindow;
      avgBatteryLevel = heartbeatsForAvg.reduce((sum, hb) => sum + (hb.battery_level || 0), 0) / heartbeatsForAvg.length;
      avgCpuUsage = heartbeatsForAvg.reduce((sum, hb) => sum + (hb.cpu_usage || 0), 0) / heartbeatsForAvg.length;
      totalHeartbeats = heartbeatsInWindow.length;
      
      // Debug logging for online detection
      if (i < 20 || isOnline) { // Log first 20 intervals and any online periods
        console.log('🟢 Online interval:', {
          interval: i,
          time: intervalStart.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' }),
          heartbeatsInInterval: heartbeatsInInterval.length,
          heartbeatsInWindow: heartbeatsInWindow.length,
          windowStart: windowStart.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' }),
          windowEnd: windowEnd.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' }),
          isOnline: isOnline
        });
      }
    } else {
      // Debug logging for offline intervals
      if (i < 10) { // Log first 10 offline intervals
        console.log('🔴 Offline interval:', {
          interval: i,
          time: intervalStart.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' }),
          heartbeatsInInterval: heartbeatsInInterval.length,
          heartbeatsInWindow: heartbeatsInWindow.length,
          isOnline: isOnline
        });
      }
    }

    uptimeData.push({
      time: intervalStart.toISOString(),
      displayTime: intervalStart.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Los_Angeles'
      }),
      isOnline: isOnline ? 1 : 0,
      prevIsOnline: i > 0 ? uptimeData[i - 1].isOnline : null,
      batteryLevel: avgBatteryLevel,
      cpuUsage: avgCpuUsage,
      heartbeatCount: totalHeartbeats
    });
  }

  return uptimeData;
}

function calculateUptimeStats(uptimeData: UptimeDataPoint[], timeInterval: number): UptimeStats {
  if (!uptimeData.length) {
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

  let totalUptimeMinutes = 0;
  let totalSessions = 0;
  let currentSessionLength = 0;
  let longestSession = 0;
  let longestOffline = 0;
  let currentOfflineLength = 0;
  let firstOnline = null;
  let lastOnline = null;
  let wasOnline = false;

  for (let i = 0; i < uptimeData.length; i++) {
    const point = uptimeData[i];
    const isOnline = point.isOnline === 1;

    if (isOnline) {
      if (!wasOnline) {
        totalSessions++;
        currentSessionLength = 0;
        if (firstOnline === null) firstOnline = point.displayTime;
      }
      currentSessionLength++;
      totalUptimeMinutes++;
      lastOnline = point.displayTime;
      currentOfflineLength = 0;
    } else {
      if (wasOnline) {
        longestSession = Math.max(longestSession, currentSessionLength);
        currentSessionLength = 0;
      }
      currentOfflineLength++;
      longestOffline = Math.max(longestOffline, currentOfflineLength);
    }
    wasOnline = isOnline;
  }

  if (wasOnline) {
    longestSession = Math.max(longestSession, currentSessionLength);
  }

  const totalMinutes = uptimeData.length * timeInterval;
  const uptimePercentage = totalMinutes > 0 ? (totalUptimeMinutes / totalMinutes) * 100 : 0;
  const averageSessionLength = totalSessions > 0 ? totalUptimeMinutes / totalSessions : 0;

  return {
    totalUptime: totalUptimeMinutes,
    uptimePercentage: Math.round(uptimePercentage * 100) / 100,
    totalSessions,
    averageSessionLength: Math.round(averageSessionLength * 100) / 100,
    longestSession: longestSession * timeInterval,
    longestOffline: longestOffline * timeInterval,
    firstOnline,
    lastOnline
  };
}

function analyzeDevicePatterns(uptimeData: UptimeDataPoint[], timeInterval: number): DevicePatterns {
  if (!uptimeData.length) {
    return {
      mostActiveHour: null,
      leastActiveHour: null,
      averageSessionLength: 0,
      offlineFrequency: 0,
      reliabilityScore: 0
    };
  }

  const patterns: DevicePatterns = {
    mostActiveHour: null,
    leastActiveHour: null,
    averageSessionLength: 0,
    offlineFrequency: 0,
    reliabilityScore: 0
  };

  const hourlyActivity = new Map<number, number>();
  const sessions = [];
  let currentSession = { start: 0, end: 0, isOnline: false };

  for (let i = 0; i < uptimeData.length; i++) {
    const point = uptimeData[i];
    const hour = new Date(point.time).getHours();
    const isOnline = point.isOnline === 1;

    hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + (isOnline ? 1 : 0));

    if (isOnline && !currentSession.isOnline) {
      currentSession = { start: i, end: i, isOnline: true };
    } else if (!isOnline && currentSession.isOnline) {
      currentSession.end = i;
      sessions.push({ ...currentSession, length: currentSession.end - currentSession.start });
      currentSession = { start: i, end: i, isOnline: false };
    }
  }

  let maxActivity = 0;
  let minActivity = Infinity;
  for (const [hour, activity] of Array.from(hourlyActivity.entries())) {
    if (activity > maxActivity) {
      maxActivity = activity;
      patterns.mostActiveHour = `${hour.toString().padStart(2, '0')}:00`;
    }
    if (activity < minActivity) {
      minActivity = activity;
      patterns.leastActiveHour = `${hour.toString().padStart(2, '0')}:00`;
    }
  }

  patterns.averageSessionLength = sessions.length > 0 ? 
    sessions.reduce((sum, s) => sum + s.length, 0) / sessions.length * timeInterval : 0;
  patterns.offlineFrequency = sessions.length / (uptimeData.length * timeInterval / 60);
  patterns.reliabilityScore = Math.max(0, 100 - (patterns.offlineFrequency * 10));

  return patterns;
}

function getDateRange(uptimeData: UptimeDataPoint[], timeRange: string): DateRange {
  if (!uptimeData.length) return { startDate: '', endDate: '' };
  
  if (timeRange === '24h') {
    const today = new Date();
    const pstOffset = -8 * 60;
    const todayPST = new Date(today.getTime() + (pstOffset * 60 * 1000));
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        timeZone: 'America/Los_Angeles'
      });
    };
    
    return {
      startDate: formatDate(todayPST),
      endDate: formatDate(todayPST)
    };
  }
  
  const firstPoint = uptimeData[0];
  const lastPoint = uptimeData[uptimeData.length - 1];
  
  const startDate = new Date(firstPoint.time);
  const endDate = new Date(lastPoint.time);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
}

