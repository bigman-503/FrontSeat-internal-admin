import { BigQuery } from '@google-cloud/bigquery';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default async function handler(req: any, res: any) {
  console.log('🚀 Location API handler called:', {
    method: req.method,
    url: req.url,
    query: req.query
  });

  if (req.method !== 'GET') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { deviceId } = req.query;
    const { timeRange, selectedDate } = req.query;

    console.log('📋 Request parameters:', {
      deviceId,
      timeRange,
      selectedDate,
      hasDeviceId: !!deviceId
    });

    if (!deviceId) {
      console.log('❌ No device ID provided');
      return res.status(400).json({ error: 'Device ID is required' });
    }

    console.log('🗺️ Location tracking request:', {
      deviceId,
      timeRange,
      selectedDate
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

    // Get date range based on time range
    const dateRange = getDateRangeForLocation(timeRange as string, selectedDate as string);
    console.log('📅 Date range calculated:', {
      timeRange,
      selectedDate,
      dateRange,
      currentTime: new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
    });
    
    const targetDataset = 'frontseat_analytics';
    const targetTable = 'heartbeats';
    const projectId = 'frontseat-admin';

    console.log('🔧 BigQuery configuration:', {
      projectId,
      targetDataset,
      targetTable,
      hasProjectId: !!projectId
    });

    // Build BigQuery query for location data
    let query = '';
    
    if (timeRange === '24h') {
      // For 24h view, use the full day range to capture rolling 24-hour window
      query = `
        SELECT
          latitude,
          longitude,
          FORMAT_DATETIME('%Y-%m-%dT%H:%M:%S', DATETIME(location_timestamp, "America/Los_Angeles")) as location_timestamp,
          location_accuracy,
          battery_level,
          device_id,
          device_name
        FROM
          \`${projectId}.${targetDataset}.${targetTable}\`
        WHERE
          (device_id = @deviceId OR device_name = @deviceId)
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND location_timestamp >= PARSE_TIMESTAMP('%Y-%m-%d %H:%M:%S %Z', CONCAT(@startDate, ' 00:00:00 America/Los_Angeles'))
          AND location_timestamp <= PARSE_TIMESTAMP('%Y-%m-%d %H:%M:%S %Z', CONCAT(@endDate, ' 23:59:59 America/Los_Angeles'))
        ORDER BY
          location_timestamp ASC
      `;
    } else {
      // For 7d and 30d views, use the standard day boundary approach
      query = `
        SELECT
          latitude,
          longitude,
          FORMAT_DATETIME('%Y-%m-%dT%H:%M:%S', DATETIME(location_timestamp, "America/Los_Angeles")) as location_timestamp,
          location_accuracy,
          battery_level,
          device_id,
          device_name
        FROM
          \`${projectId}.${targetDataset}.${targetTable}\`
        WHERE
          (device_id = @deviceId OR device_name = @deviceId)
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND location_timestamp >= PARSE_TIMESTAMP('%Y-%m-%d %H:%M:%S %Z', CONCAT(@startDate, ' 00:00:00 America/Los_Angeles'))
          AND location_timestamp < PARSE_TIMESTAMP('%Y-%m-%d %H:%M:%S %Z', CONCAT(FORMAT_DATE('%Y-%m-%d', DATE_ADD(PARSE_DATE('%Y-%m-%d', @endDate), INTERVAL 1 DAY)), ' 00:00:00 America/Los_Angeles'))
        ORDER BY
          location_timestamp ASC
      `;
    }

    const options = {
      query,
      params: {
        deviceId: deviceId as string,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
    };

    console.log('🔍 BigQuery location query:', {
      timeRange,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      deviceId,
      queryType: timeRange === '24h' ? 'rolling-24h' : 'standard-day-boundary',
      query: query.substring(0, 200) + '...'
    });

    console.log('🚀 Executing BigQuery...');
    const [rows] = await bigquery.query(options);
    console.log('✅ BigQuery query completed');

    console.log('📍 Location data fetched:', {
      totalRecords: rows.length,
      sampleRecord: rows[0],
      allRecords: rows.slice(0, 3) // Show first 3 records for debugging
    });

    // Process location data
    console.log('🔄 Processing location data...');
    const locations = rows.map((row: any, index: number) => {
      const processed = {
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        timestamp: row.location_timestamp,
        accuracy: row.location_accuracy ? parseFloat(row.location_accuracy) : null,
        battery_level: row.battery_level ? parseFloat(row.battery_level) : null,
      };
      
      if (index < 3) {
        console.log(`📍 Processed location ${index + 1}:`, {
          original: row,
          processed
        });
      }
      
      return processed;
    });

    // Filter out invalid coordinates
    console.log('🔍 Filtering invalid coordinates...');
    const validLocations = locations.filter(loc => {
      const isValid = loc.latitude >= -90 && loc.latitude <= 90 &&
                     loc.longitude >= -180 && loc.longitude <= 180;
      if (!isValid) {
        console.log('❌ Invalid coordinates filtered out:', loc);
      }
      return isValid;
    });

    console.log('✅ Processed location data:', {
      originalCount: locations.length,
      validCount: validLocations.length,
      sampleLocation: validLocations[0],
      allValidLocations: validLocations.slice(0, 3)
    });

    const response = {
      locations: validLocations,
      totalPoints: validLocations.length,
      dateRange: {
        start: dateRange.startDate,
        end: dateRange.endDate
      }
    };

    console.log('📤 Sending response:', {
      totalPoints: response.totalPoints,
      dateRange: response.dateRange,
      sampleLocation: response.locations[0]
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('💥 Location tracking error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return res.status(500).json({ 
      error: 'Failed to fetch location data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function getDateRangeForLocation(timeRange: string, selectedDate?: string): { startDate: string; endDate: string; startTime?: string; endTime?: string } {
  const now = new Date();
  
  switch (timeRange) {
    case '24h':
      // For 24h view, use rolling 24-hour window from current time
      const yesterday24h = new Date(now);
      yesterday24h.setDate(yesterday24h.getDate() - 1);
      
      const yesterday24hPSTString = yesterday24h.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [yMonth, yDay, yYear] = yesterday24hPSTString.split('/');
      const startDate24h = `${yYear}-${yMonth}-${yDay}`;
      
      const today24hPSTString = now.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [tMonth, tDay, tYear] = today24hPSTString.split('/');
      const endDate24h = `${tYear}-${tMonth}-${tDay}`;
      
      // For 24h view, we need to include both days to capture the rolling window
      return { 
        startDate: startDate24h, 
        endDate: endDate24h,
        startTime: '00:00:00',
        endTime: '23:59:59'
      };

    case '7d':
      // Last 7 days
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const weekAgoPSTString = weekAgo.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [wMonth, wDay, wYear] = weekAgoPSTString.split('/');
      const startDate7d = `${wYear}-${wMonth}-${wDay}`;
      
      const today7dPSTString = now.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [t7Month, t7Day, t7Year] = today7dPSTString.split('/');
      const endDate7d = `${t7Year}-${t7Month}-${t7Day}`;
      
      return { startDate: startDate7d, endDate: endDate7d };

    case '30d':
      // Last 30 days
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      
      const monthAgoPSTString = monthAgo.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [mMonth, mDay, mYear] = monthAgoPSTString.split('/');
      const startDate30d = `${mYear}-${mMonth}-${mDay}`;
      
      const today30dPSTString = now.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [t30Month, t30Day, t30Year] = today30dPSTString.split('/');
      const endDate30d = `${t30Year}-${t30Month}-${t30Day}`;
      
      return { startDate: startDate30d, endDate: endDate30d };

    default:
      // Default to last 24 hours
      const defaultYesterday = new Date(now);
      defaultYesterday.setDate(defaultYesterday.getDate() - 1);
      
      const defaultYesterdayPSTString = defaultYesterday.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [dMonth, dDay, dYear] = defaultYesterdayPSTString.split('/');
      const defaultStartDate = `${dYear}-${dMonth}-${dDay}`;
      
      const defaultTodayPSTString = now.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [dtMonth, dtDay, dtYear] = defaultTodayPSTString.split('/');
      const defaultEndDate = `${dtYear}-${dtMonth}-${dtDay}`;
      
      return { startDate: defaultStartDate, endDate: defaultEndDate };
  }
}
