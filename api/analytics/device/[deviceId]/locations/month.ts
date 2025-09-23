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
    const { month, year } = req.query;

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    console.log('🗺️ Month location data request:', { deviceId, month, year });

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

    // Determine the month to query
    let targetMonth: Date;
    if (month && year) {
      targetMonth = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    } else {
      targetMonth = new Date();
    }

    // Get start and end of the month in PST
    const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
    
    const startOfMonthPSTString = startOfMonth.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [smMonth, smDay, smYear] = startOfMonthPSTString.split('/');
    const startDate = `${smYear}-${smMonth}-${smDay}`;
    
    const endOfMonthPSTString = endOfMonth.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [emMonth, emDay, emYear] = endOfMonthPSTString.split('/');
    const endDate = `${emYear}-${emMonth}-${emDay}`;

    const targetDataset = 'frontseat_analytics';
    const targetTable = 'heartbeats';
    const projectId = 'frontseat-admin';

    // Build BigQuery query for monthly location data aggregated by day
    const query = `
      SELECT
        DATE(location_timestamp, "America/Los_Angeles") as date,
        COUNT(*) as location_count,
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

    console.log('🔍 BigQuery month location query:', {
      startDate,
      endDate,
      deviceId,
      targetMonth: targetMonth.toISOString()
    });

    const [rows] = await bigquery.query(options);

    console.log('📍 Month location data fetched:', {
      totalDays: rows.length,
      sampleDay: rows[0]
    });

    // Generate calendar data for the month
    const days = [];
    const today = new Date();
    const currentMonth = targetMonth.getMonth();
    const currentYear = targetMonth.getFullYear();
    
    // Get first day of month and calculate offset
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      const emptyDate = new Date(firstDayOfMonth);
      emptyDate.setDate(emptyDate.getDate() - (firstDayOfWeek - i));
      
      const dateStr = emptyDate.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [month, day, year] = dateStr.split('/');
      const formattedDate = `${year}-${month}-${day}`;
      
      days.push({
        date: formattedDate,
        dayOfMonth: emptyDate.getDate(),
        locationCount: 0,
        totalDistance: 0,
        avgAccuracy: 0,
        timeSpan: 0,
        hasData: false,
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const dayData = rows.find((row: any) => row.date === dateStr);
      const isToday = today.getFullYear() === currentYear && 
                     today.getMonth() === currentMonth && 
                     today.getDate() === day;
      
      if (dayData) {
        const timeSpan = new Date(dayData.last_location).getTime() - new Date(dayData.first_location).getTime();
        const timeSpanHours = timeSpan / (1000 * 60 * 60);
        
        days.push({
          date: dateStr,
          dayOfMonth: day,
          locationCount: parseInt(dayData.location_count),
          totalDistance: Math.max(0, dayData.location_count * 0.1), // Simplified distance calculation
          avgAccuracy: parseFloat(dayData.avg_accuracy) || 0,
          timeSpan: timeSpanHours,
          hasData: true,
          isCurrentMonth: true,
          isToday
        });
      } else {
        days.push({
          date: dateStr,
          dayOfMonth: day,
          locationCount: 0,
          totalDistance: 0,
          avgAccuracy: 0,
          timeSpan: 0,
          hasData: false,
          isCurrentMonth: true,
          isToday
        });
      }
    }
    
    // Add empty cells for days after the last day of the month to complete the grid
    const remainingCells = 42 - days.length; // 6 weeks * 7 days = 42 cells
    for (let i = 0; i < remainingCells; i++) {
      const nextDate = new Date(lastDayOfMonth);
      nextDate.setDate(nextDate.getDate() + i + 1);
      
      const dateStr = nextDate.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [month, day, year] = dateStr.split('/');
      const formattedDate = `${year}-${month}-${day}`;
      
      days.push({
        date: formattedDate,
        dayOfMonth: nextDate.getDate(),
        locationCount: 0,
        totalDistance: 0,
        avgAccuracy: 0,
        timeSpan: 0,
        hasData: false,
        isCurrentMonth: false,
        isToday: false
      });
    }

    console.log('✅ Processed month location data:', {
      totalDays: days.length,
      daysInMonth: days.filter(d => d.isCurrentMonth).length,
      daysWithData: days.filter(d => d.hasData).length,
      sampleDay: days.find(d => d.isCurrentMonth)
    });

    return res.status(200).json({
      days,
      totalDays: days.length,
      daysInMonth: days.filter(d => d.isCurrentMonth).length,
      activeDays: days.filter(d => d.hasData).length,
      month: currentMonth + 1,
      year: currentYear,
      monthName: targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      dateRange: {
        start: startDate,
        end: endDate
      }
    });

  } catch (error) {
    console.error('❌ Month location data error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch month location data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
