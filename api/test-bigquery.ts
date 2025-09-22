import { VercelRequest, VercelResponse } from '@vercel/node';
import { BigQuery } from '@google-cloud/bigquery';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    // Test BigQuery connection
    const [datasets] = await bigquery.getDatasets();
    console.log('✅ BigQuery connection successful!');

    // Find the correct dataset and table
    let targetDataset = null;
    let targetTable = null;
    
    for (const dataset of datasets) {
      if (dataset.id === 'frontseat_analytics') {
        targetDataset = dataset.id;
        console.log('✅ Found dataset:', targetDataset);
        
        const [tables] = await dataset.getTables();
        for (const table of tables) {
          if (table.id === 'heartbeats') {
            targetTable = table.id;
            console.log('✅ Found table:', targetTable);
            break;
          }
        }
        break;
      }
    }

    if (!targetDataset || !targetTable) {
      return res.status(500).json({ 
        error: 'Dataset or table not found',
        availableDatasets: datasets.map(d => d.id)
      });
    }

    // Test query to see what data exists
    const testQuery = `
      SELECT
        device_id,
        location_timestamp,
        last_seen,
        COUNT(*) as count
      FROM
        \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${targetDataset}.${targetTable}\`
      WHERE
        device_id = 'a45bf34bff4d8e66'
      GROUP BY
        device_id, location_timestamp, last_seen
      ORDER BY
        location_timestamp DESC
      LIMIT 10
    `;

    console.log('🔍 Testing BigQuery query...');
    const [job] = await bigquery.createQueryJob({ query: testQuery });
    const [rows] = await job.getQueryResults();
    
    console.log(`📈 Found ${rows.length} records`);

    // Also test a broader query to see what device IDs exist
    const deviceQuery = `
      SELECT
        device_id,
        COUNT(*) as count
      FROM
        \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${targetDataset}.${targetTable}\`
      GROUP BY
        device_id
      ORDER BY
        count DESC
      LIMIT 10
    `;

    const [deviceJob] = await bigquery.createQueryJob({ query: deviceQuery });
    const [deviceRows] = await deviceJob.getQueryResults();

    res.json({
      success: true,
      targetDataset,
      targetTable,
      heartbeatRecords: rows,
      deviceIds: deviceRows,
      totalHeartbeatRecords: rows.length,
      totalDeviceIds: deviceRows.length
    });

  } catch (error) {
    console.error('❌ BigQuery test failed:', error.message);
    res.status(500).json({ 
      error: `BigQuery test failed: ${error.message}`,
      details: error.toString()
    });
  }
}
