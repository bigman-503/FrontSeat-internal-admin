import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Test timezone conversion for the specific heartbeat time
  const testTimestamp = '2025-09-22 00:06:24 UTC';
  const utcDate = new Date(testTimestamp);
  
  console.log('🧪 Testing timezone conversion:', {
    original: testTimestamp,
    utcDate: utcDate.toISOString(),
    utcLocal: utcDate.toLocaleString('en-US', { timeZone: 'UTC' })
  });

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
  
  console.log('🌊 Pacific time string:', pacificTimeString);
  
  // Parse the Pacific time string back to a Date object
  const [datePart, timePart] = pacificTimeString.split(', ');
  const [month, day, year] = datePart.split('/');
  const [hour, minute, second] = timePart.split(':');
  
  // Create a date string in Pacific timezone and parse it
  const pacificDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
  
  // The correct approach: create a date that represents the Pacific time
  // by using the timezone offset. For September 2025, we're in PDT (UTC-7)
  const pacificDate = new Date(pacificDateString + '-07:00');
  
  // The issue is that toISOString() shows UTC time, but we want to see the Pacific time
  // Let's create a date that represents the Pacific time in local timezone
  const pacificDateLocal = new Date();
  pacificDateLocal.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
  pacificDateLocal.setHours(parseInt(hour), parseInt(minute), parseInt(second), 0);
  
  console.log('🕐 Pacific date result:', {
    pacificTimeString,
    pacificDateString,
    pacificDateStringWithOffset: pacificDateString + '-07:00',
    pacificDate: pacificDate.toISOString(),
    pacificDateLocal: pacificDateLocal.toISOString(),
    pacificLocal: pacificDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
    pacificHours: pacificDate.getHours(),
    pacificMinutes: pacificDate.getMinutes(),
    pacificUTCHours: pacificDate.getUTCHours(),
    pacificUTCMinutes: pacificDate.getUTCMinutes(),
    pacificDateLocalHours: pacificDateLocal.getHours(),
    pacificDateLocalMinutes: pacificDateLocal.getMinutes()
  });

  // Test if this would fall within a 17:00-17:15 interval
  const intervalStart = new Date(pacificDate);
  intervalStart.setHours(17, 0, 0, 0);
  const intervalEnd = new Date(pacificDate);
  intervalEnd.setHours(17, 15, 0, 0);
  
  const isInInterval = pacificDate >= intervalStart && pacificDate < intervalEnd;
  
  console.log('⏰ Interval test:', {
    pacificDate: pacificDate.toISOString(),
    intervalStart: intervalStart.toISOString(),
    intervalEnd: intervalEnd.toISOString(),
    isInInterval
  });

  res.json({
    testTimestamp,
    utcDate: utcDate.toISOString(),
    pacificTimeString,
    pacificDateString,
    pacificDateStringWithOffset: pacificDateString + '-07:00',
    pacificDate: pacificDate.toISOString(),
    pacificDateLocal: pacificDateLocal.toISOString(),
    pacificHours: pacificDate.getHours(),
    pacificMinutes: pacificDate.getMinutes(),
    pacificUTCHours: pacificDate.getUTCHours(),
    pacificUTCMinutes: pacificDate.getUTCMinutes(),
    pacificDateLocalHours: pacificDateLocal.getHours(),
    pacificDateLocalMinutes: pacificDateLocal.getMinutes(),
    intervalTest: {
      intervalStart: intervalStart.toISOString(),
      intervalEnd: intervalEnd.toISOString(),
      isInInterval
    }
  });
}
