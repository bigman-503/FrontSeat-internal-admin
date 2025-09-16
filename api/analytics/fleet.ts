import { VercelRequest, VercelResponse } from '@vercel/node';

interface FleetAnalytics {
  date: string;
  total_devices: number;
  avg_uptime: number;
  avg_battery: number;
  total_heartbeats: number;
  total_alerts: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { startDate, endDate } = req.body as { startDate: string; endDate: string };

    console.log(`🚀 Fetching fleet analytics from ${startDate} to ${endDate}`);

    // For now, return mock data
    const mockFleetData = generateMockFleetAnalytics(startDate, endDate);
    res.json(mockFleetData);

  } catch (error) {
    console.error('Error fetching fleet analytics:', error);
    res.status(500).json({ error: 'Failed to fetch fleet analytics' });
  }
}

// Helper function to generate mock fleet analytics
function generateMockFleetAnalytics(startDate: string, endDate: string): FleetAnalytics[] {
  const fleetData: FleetAnalytics[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    
    fleetData.push({
      date: date.toISOString().split('T')[0]!,
      total_devices: Math.floor(Math.random() * 50) + 20,
      avg_uptime: Math.random() * 20 + 4,
      avg_battery: Math.random() * 40 + 40,
      total_heartbeats: Math.floor(Math.random() * 10000) + 5000,
      total_alerts: Math.floor(Math.random() * 10)
    });
  }

  return fleetData;
}
