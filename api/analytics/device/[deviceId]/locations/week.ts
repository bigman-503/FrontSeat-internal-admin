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

    // Get last 7 days date range (including current day)
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 6); // 6 days ago + today = 7 days total
    
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

    // Build BigQuery query for raw location data (same as main locations endpoint)
    const query = `
      SELECT
        latitude,
        longitude,
        FORMAT_DATETIME('%Y-%m-%dT%H:%M:%S', DATETIME(location_timestamp, "America/Los_Angeles")) as timestamp,
        location_accuracy,
        battery_level
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
      deviceId,
      currentTime: new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
      queryType: 'raw-data-aggregation'
    });

    const [rows] = await bigquery.query(options);

    console.log('📍 Week location data fetched:', {
      totalLocations: rows.length,
      sampleLocation: rows[0]
    });

    // Group raw data by day
    const dayGroups: { [key: string]: any[] } = {};
    rows.forEach((location: any) => {
      const date = location.timestamp.split('T')[0]; // Extract date from timestamp
      if (!dayGroups[date]) {
        dayGroups[date] = [];
      }
      dayGroups[date].push(location);
    });

    console.log('📊 Day groups created:', {
      groupCount: Object.keys(dayGroups).length,
      groupKeys: Object.keys(dayGroups),
      sampleGroup: Object.keys(dayGroups).length > 0 ? {
        date: Object.keys(dayGroups)[0],
        count: dayGroups[Object.keys(dayGroups)[0]].length
      } : null
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
      
      const dayLocations = dayGroups[formattedDate] || [];
      
      if (dayLocations.length > 0) {
        // Calculate statistics for the day
        const firstLocation = dayLocations[0];
        const lastLocation = dayLocations[dayLocations.length - 1];
        const timeSpan = new Date(lastLocation.timestamp).getTime() - new Date(firstLocation.timestamp).getTime();
        const timeSpanHours = timeSpan / (1000 * 60 * 60);
        const avgAccuracy = dayLocations.reduce((sum, loc) => sum + (loc.location_accuracy || 0), 0) / dayLocations.length;
        
        // Calculate total distance (simplified - would need proper distance calculation)
        const totalDistance = Math.max(0, dayLocations.length * 0.1);
        
        days.push({
          date: formattedDate,
          dayName: currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            timeZone: 'America/Los_Angeles' 
          }),
          locationCount: dayLocations.length,
          totalDistance: totalDistance,
          avgAccuracy: avgAccuracy,
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
      sampleDay: days[0],
      allProcessedDays: days.map(day => ({
        date: day.date,
        dayName: day.dayName,
        locationCount: day.locationCount,
        hasData: day.hasData
      }))
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
