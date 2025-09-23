import { NextApiRequest, NextApiResponse } from 'next';
import { BigQuery } from '@google-cloud/bigquery';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { deviceId } = req.query;

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    console.log('🗺️ Week location data request:', { deviceId });

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

    // Get last 7 days date range
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekAgoPSTString = weekAgo.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [wMonth, wDay, wYear] = weekAgoPSTString.split('/');
    const startDate = `${wYear}-${wMonth}-${wDay}`;
    
    const todayPSTString = now.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [tMonth, tDay, tYear] = todayPSTString.split('/');
    const endDate = `${tYear}-${tMonth}-${tDay}`;

    const targetDataset = 'frontseat_analytics';
    const targetTable = 'heartbeats';
    const projectId = 'frontseat-admin';

    // Build BigQuery query for weekly location data aggregated by day
    const query = `
      SELECT
        DATE(location_timestamp, "America/Los_Angeles") as date,
        COUNT(*) as location_count,
        COUNT(DISTINCT DATE(location_timestamp, "America/Los_Angeles")) as active_days,
        AVG(location_accuracy) as avg_accuracy,
        FORMAT_DATETIME('%Y-%m-%dT%H:%M:%S', DATETIME(MIN(location_timestamp), "America/Los_Angeles")) as first_location,
        FORMAT_DATETIME('%Y-%m-%dT%H:%M:%S', DATETIME(MAX(location_timestamp), "America/Los_Angeles")) as last_location
      FROM
        \`${projectId}.${targetDataset}.${targetTable}\`
      WHERE
        (device_id = @deviceId OR device_name = @deviceId)
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND location_timestamp >= PARSE_TIMESTAMP('%Y-%m-%d %H:%M:%S %Z', CONCAT(@startDate, ' 00:00:00 America/Los_Angeles'))
        AND location_timestamp < PARSE_TIMESTAMP('%Y-%m-%d %H:%M:%S %Z', CONCAT(FORMAT_DATE('%Y-%m-%d', DATE_ADD(PARSE_DATE('%Y-%m-%d', @endDate), INTERVAL 1 DAY)), ' 00:00:00 America/Los_Angeles'))
      GROUP BY
        DATE(location_timestamp, "America/Los_Angeles")
      ORDER BY
        date ASC
    `;

    const options = {
      query,
      params: {
        deviceId: deviceId as string,
        startDate,
        endDate,
      },
    };

    console.log('🔍 BigQuery week location query:', {
      startDate,
      endDate,
      deviceId
    });

    const [rows] = await bigquery.query(options);

    console.log('📍 Week location data fetched:', {
      totalDays: rows.length,
      sampleDay: rows[0]
    });

    // Generate 7 days of data (including days with no data)
    const days = [];
    const currentDate = new Date(weekAgo);
    
    for (let i = 0; i < 7; i++) {
      const dateStr = currentDate.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [month, day, year] = dateStr.split('/');
      const formattedDate = `${year}-${month}-${day}`;
      
      const dayData = rows.find((row: any) => row.date === formattedDate);
      
      if (dayData) {
        // Calculate distance for the day (simplified - would need actual coordinate data)
        const timeSpan = new Date(dayData.last_location).getTime() - new Date(dayData.first_location).getTime();
        const timeSpanHours = timeSpan / (1000 * 60 * 60);
        
        days.push({
          date: formattedDate,
          dayName: currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            timeZone: 'America/Los_Angeles' 
          }),
          locationCount: parseInt(dayData.location_count),
          totalDistance: Math.max(0, dayData.location_count * 0.1), // Simplified distance calculation
          avgAccuracy: parseFloat(dayData.avg_accuracy) || 0,
          timeSpan: timeSpanHours,
          hasData: true
        });
      } else {
        days.push({
          date: formattedDate,
          dayName: currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            timeZone: 'America/Los_Angeles' 
          }),
          locationCount: 0,
          totalDistance: 0,
          avgAccuracy: 0,
          timeSpan: 0,
          hasData: false
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('✅ Processed week location data:', {
      totalDays: days.length,
      daysWithData: days.filter(d => d.hasData).length,
      sampleDay: days[0]
    });

    return res.status(200).json({
      days,
      totalDays: days.length,
      activeDays: days.filter(d => d.hasData).length,
      dateRange: {
        start: startDate,
        end: endDate
      }
    });

  } catch (error) {
    console.error('❌ Week location data error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch week location data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
