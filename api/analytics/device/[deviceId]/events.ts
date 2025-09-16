import { VercelRequest, VercelResponse } from '@vercel/node';

interface DeviceEvents {
  event_id: string;
  device_id: string;
  event_type: string;
  timestamp: string;
  event_data: Record<string, any>;
  severity: 'low' | 'medium' | 'high';
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

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { deviceId } = req.query;
    const limit = parseInt(req.query.limit as string) || 100;

    console.log(`📋 Fetching events for device ${deviceId}`);

    // For now, return mock data
    const mockEvents = generateMockEvents(deviceId as string, limit);
    res.json(mockEvents);

  } catch (error) {
    console.error('Error fetching device events:', error);
    res.status(500).json({ error: 'Failed to fetch device events' });
  }
}

// Helper function to generate mock events
function generateMockEvents(deviceId: string, limit: number): DeviceEvents[] {
  const events: DeviceEvents[] = [];
  const eventTypes = ['battery_low', 'location_update', 'network_change', 'app_launch', 'system_alert'];
  
  for (let i = 0; i < Math.min(limit, 20); i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]!;
    const timestamp = new Date();
    timestamp.setHours(timestamp.getHours() - Math.random() * 24 * 7); // Last week
    
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
