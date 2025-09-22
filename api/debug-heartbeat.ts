import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Test the timezone conversion with the specific heartbeat time
  const testTimestamp = '2025-09-22 00:06:24 UTC';
  const utcDate = new Date(testTimestamp);
  
  console.log('🧪 Testing heartbeat processing:', {
    original: testTimestamp,
    utcDate: utcDate.toISOString()
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
  
  // Create a date object that represents the Pacific time
  const pacificDate = new Date();
  pacificDate.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
  pacificDate.setHours(parseInt(hour), parseInt(minute), parseInt(second), 0);
  
  console.log('🕐 Pacific date result:', {
    pacificTimeString,
    pacificDate: pacificDate.toISOString(),
    pacificHours: pacificDate.getHours(),
    pacificMinutes: pacificDate.getMinutes()
  });

  // Test interval matching logic
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

  // Test the 5-minute window logic
  const windowMinutes = 5;
  const windowStart = new Date(intervalStart.getTime() - windowMinutes * 60 * 1000);
  const windowEnd = new Date(intervalEnd.getTime() + windowMinutes * 60 * 1000);
  
  const isInWindow = pacificDate >= windowStart && pacificDate <= windowEnd;
  
  console.log('🪟 Window test:', {
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    isInWindow
  });

  res.json({
    testTimestamp,
    utcDate: utcDate.toISOString(),
    pacificTimeString,
    pacificDate: pacificDate.toISOString(),
    pacificHours: pacificDate.getHours(),
    pacificMinutes: pacificDate.getMinutes(),
    intervalTest: {
      intervalStart: intervalStart.toISOString(),
      intervalEnd: intervalEnd.toISOString(),
      isInInterval
    },
    windowTest: {
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      isInWindow
    }
  });
}
