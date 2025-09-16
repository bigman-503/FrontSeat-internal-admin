import { VercelRequest, VercelResponse } from '@vercel/node';
import { BigQuery } from '@google-cloud/bigquery';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { deviceId } = req.query;
    const { startDate, endDate } = req.body as { startDate: string; endDate: string };

    console.log(`📊 Fetching heartbeat data for device ${deviceId} from ${startDate} to ${endDate}`);

    // Initialize BigQuery client
    let bigqueryConfig: any = {
      projectId: 'frontseat-admin',
    };

    // Try to read credentials from file directly
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

    // Query for raw heartbeat data
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
        location_accuracy
      FROM
        \`frontseat-admin.frontseat_analytics.heartbeats\`
      WHERE
        (device_id = @deviceId OR device_name = @deviceId)
        AND DATE(last_seen) BETWEEN @startDate AND @endDate
      ORDER BY
        last_seen ASC
    `;

    const options = {
      query,
      params: {
        deviceId,
        startDate,
        endDate,
      },
    };

    const [job] = await bigquery.createQueryJob(options);
    console.log(`📊 Executing BigQuery query for heartbeats...`);
    console.log(`✅ BigQuery job ${job.id} started`);

    const [rows] = await job.getQueryResults();
    console.log(`📈 Retrieved ${rows.length} heartbeat records`);

    res.json({
      deviceId,
      startDate,
      endDate,
      heartbeats: rows,
      dataSource: 'bigquery',
      isMockData: false
    });

  } catch (error: any) {
    console.error('Error fetching heartbeat data:', error);
    res.status(500).json({ error: 'Failed to fetch heartbeat data' });
  }
}
