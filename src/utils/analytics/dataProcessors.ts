import { UptimeDataPoint, LocationDataPoint, HeartbeatData, UptimeStats, DevicePatterns } from '@/types/analytics';
import { getCurrentTimePST, formatDatePST } from '@/lib/dateUtils';

/**
 * Safely parse timestamps from various formats (including BigQuery)
 */
export const parseTimestamp = (timestamp: any): Date | null => {
  if (!timestamp) {
    console.log('❌ parseTimestamp: No timestamp provided');
    return null;
  }
  
  let timestampStr = timestamp;
  // Handle BigQuery timestamp format
  if (timestamp && typeof timestamp === 'object' && timestamp.value) {
    timestampStr = timestamp.value;
  }
  
  console.log('🕐 parseTimestamp input:', { timestamp, timestampStr });
  
  // Parse the UTC timestamp
  const utcDate = new Date(timestampStr);
  if (isNaN(utcDate.getTime())) {
    console.log('❌ parseTimestamp: Invalid timestamp', { timestampStr, utcDate });
    return null;
  }
  
  // Convert UTC to PST (UTC-8)
  const pstDate = new Date(utcDate.getTime() - (8 * 60 * 60 * 1000));
  
  console.log('🕐 parseTimestamp result:', {
    original: timestampStr,
    utc: utcDate.toISOString(),
    pst: pstDate.toISOString()
  });
  
  return pstDate;
};

/**
 * Process heartbeat data for uptime visualization
 */
export const processUptimeData = (
  heartbeatData: HeartbeatData[],
  timeRange: string,
  timeInterval: number
): UptimeDataPoint[] => {
  console.log('🔄 processUptimeData called:', { 
    timeRange, 
    heartbeatDataLength: heartbeatData.length,
    heartbeatDataSample: heartbeatData.slice(0, 3)
  });
  
  // For 24h view, always generate full 24-hour range even with no data
  if (timeRange === '24h' && !heartbeatData.length) {
    console.log('📊 Generating empty 24h data for timeRange:', timeRange);
    const emptyData = generateEmpty24HourData(timeInterval);
    console.log('📊 Generated empty data:', { length: emptyData.length, sample: emptyData.slice(0, 3) });
    return emptyData;
  }
  
  if (!heartbeatData.length) {
    console.log('📊 No heartbeat data, returning empty array');
    return [];
  }

  console.log('📊 Processing real heartbeat data:', {
    heartbeatDataLength: heartbeatData.length,
    timeRange,
    timeInterval,
    sampleHeartbeat: heartbeatData[0]
  });

  // Filter out invalid timestamps and sort by timestamp
  const sortedData = [...heartbeatData]
    .map(hb => ({ ...hb, parsedTime: parseTimestamp(hb.last_seen) }))
    .filter(hb => hb.parsedTime !== null)
    .sort((a, b) => {
      if (!a.parsedTime || !b.parsedTime) return 0;
      return a.parsedTime.getTime() - b.parsedTime.getTime();
    });

  console.log('📊 After parsing and sorting:', {
    originalLength: heartbeatData.length,
    sortedLength: sortedData.length,
    firstParsed: sortedData[0]?.parsedTime,
    lastParsed: sortedData[sortedData.length - 1]?.parsedTime,
    sampleParsed: sortedData.slice(0, 3).map(hb => ({
      last_seen: hb.last_seen,
      parsedTime: hb.parsedTime,
      battery_level: hb.battery_level
    }))
  });

  if (!sortedData.length) {
    console.log('❌ No valid heartbeat data after parsing');
    return [];
  }

  // Determine time range
  const { startTime, endTime } = getTimeRange(timeRange, sortedData, timeInterval);
  
  // Generate intervals
  const intervals = generateTimeIntervals(startTime, endTime, timeInterval);
  
  // Process uptime data
  const result = processUptimeIntervals(intervals, sortedData, timeInterval);
  
  console.log('📊 Final processed data:', {
    resultLength: result.length,
    sampleResult: result.slice(0, 3),
    onlineCount: result.filter(p => p.isOnline === 1).length,
    offlineCount: result.filter(p => p.isOnline === 0).length
  });
  
  return result;
};

/**
 * Generate empty 24-hour data when no heartbeat data is available
 */
const generateEmpty24HourData = (timeInterval: number): UptimeDataPoint[] => {
  const intervals = [];
  
  // Use the existing getCurrentTimePST function for consistency
  const today = getCurrentTimePST();
  today.setHours(0, 0, 0, 0); // Set to start of day
  
  if (isNaN(today.getTime())) {
    console.error('❌ Invalid PST date created:', { today });
    return [];
  }
  
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += timeInterval) {
      const time = new Date(today);
      time.setHours(hour, minute, 0, 0);
      
      if (isNaN(time.getTime())) {
        console.error('❌ Invalid time created:', { hour, minute, time });
        continue;
      }
      
      intervals.push(time);
    }
  }
  
  console.log('📊 Generated empty 24h data:', {
    intervalsLength: intervals.length,
    timeInterval,
    firstInterval: intervals[0],
    lastInterval: intervals[intervals.length - 1]
  });
  
  return intervals.map((intervalStart, i) => ({
    time: intervalStart.toISOString(),
    displayTime: intervalStart.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Los_Angeles'
    }),
    isOnline: 0,
    prevIsOnline: i > 0 ? 0 : null,
    batteryLevel: 0,
    cpuUsage: 0,
    heartbeatCount: 0
  }));
};

/**
 * Get time range based on timeRange setting
 */
const getTimeRange = (timeRange: string, sortedData: any[], timeInterval: number) => {
  let startTime: Date, endTime: Date;
  
  if (timeRange === '24h') {
    // Use today's PST date for 24h view
    const now = new Date();
    const pstOffset = -8 * 60; // PST is UTC-8 (in minutes)
    const todayPST = new Date(now.getTime() + (pstOffset * 60 * 1000));
    
    startTime = new Date(todayPST);
    startTime.setHours(0, 0, 0, 0); // 00:00:00 PST
    
    endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + 1); // Next day 00:00
  } else {
    // For other ranges, use actual data range
    startTime = sortedData[0].parsedTime!;
    endTime = sortedData[sortedData.length - 1].parsedTime!;
    
    // Round to nearest interval
    const roundedStart = new Date(startTime);
    roundedStart.setMinutes(Math.floor(roundedStart.getMinutes() / timeInterval) * timeInterval, 0, 0);
    
    const roundedEnd = new Date(endTime);
    roundedEnd.setMinutes(Math.ceil(roundedEnd.getMinutes() / timeInterval) * timeInterval, 0, 0);
    
    startTime = roundedStart;
    endTime = roundedEnd;
  }
  
  return { startTime, endTime };
};

/**
 * Generate time intervals between start and end time
 */
const generateTimeIntervals = (startTime: Date, endTime: Date, timeInterval: number): Date[] => {
  const intervals = [];
  const current = new Date(startTime);
  while (current < endTime) {
    intervals.push(new Date(current));
    current.setMinutes(current.getMinutes() + timeInterval);
  }
  return intervals;
};

/**
 * Process uptime intervals to determine online/offline status
 */
const processUptimeIntervals = (
  intervals: Date[],
  sortedData: any[],
  timeInterval: number
): UptimeDataPoint[] => {
  const uptimeData: UptimeDataPoint[] = [];
  const maxGapMinutes = 3; // Consider device off if gap > 3 minutes

  for (let i = 0; i < intervals.length; i++) {
    const intervalStart = intervals[i];
    const intervalEnd = new Date(intervalStart.getTime() + timeInterval * 60 * 1000);
    
    // Find heartbeats within this interval
    const heartbeatsInInterval = sortedData.filter(hb => {
      if (!hb.parsedTime) return false;
      return hb.parsedTime >= intervalStart && hb.parsedTime < intervalEnd;
    });

    // Check if device was online during this interval
    let isOnline = false;
    let avgBatteryLevel = 0;
    let avgCpuUsage = 0;
    let totalHeartbeats = heartbeatsInInterval.length;

    if (heartbeatsInInterval.length > 0) {
      isOnline = true;
      avgBatteryLevel = heartbeatsInInterval.reduce((sum, hb) => sum + (hb.battery_level || 0), 0) / heartbeatsInInterval.length;
      avgCpuUsage = heartbeatsInInterval.reduce((sum, hb) => sum + (hb.cpu_usage || 0), 0) / heartbeatsInInterval.length;
    } else if (i > 0) {
      // Check if there was a recent heartbeat (within 3 minutes before this interval)
      const prevIntervalEnd = new Date(intervals[i - 1].getTime() + timeInterval * 60 * 1000);
      const recentHeartbeats = sortedData.filter(hb => {
        if (!hb.parsedTime) return false;
        return hb.parsedTime >= prevIntervalEnd && hb.parsedTime < intervalStart;
      });
      
      if (recentHeartbeats.length > 0) {
        const lastHeartbeat = recentHeartbeats[recentHeartbeats.length - 1];
        if (lastHeartbeat.parsedTime) {
          const gapMinutes = (intervalStart.getTime() - lastHeartbeat.parsedTime.getTime()) / (1000 * 60);
          isOnline = gapMinutes <= maxGapMinutes;
        }
      }
    }

    uptimeData.push({
      time: intervalStart.toISOString(),
      displayTime: intervalStart.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Los_Angeles'
      }),
      isOnline: isOnline ? 1 : 0,
      prevIsOnline: i > 0 ? uptimeData[i - 1].isOnline : null,
      batteryLevel: avgBatteryLevel,
      cpuUsage: avgCpuUsage,
      heartbeatCount: totalHeartbeats
    });
  }

  return uptimeData;
};

/**
 * Process heartbeat data for location path visualization
 */
export const processLocationData = (heartbeatData: HeartbeatData[]): LocationDataPoint[] => {
  if (!heartbeatData.length) {
    return [];
  }

  return heartbeatData
    .filter(hb => {
      let timestamp = hb.last_seen;
      if (timestamp && typeof timestamp === 'object' && timestamp.value) {
        timestamp = timestamp.value;
      }
      return hb.latitude && hb.longitude && timestamp && !isNaN(new Date(timestamp).getTime());
    })
    .map((hb, index) => {
      let timestamp = hb.last_seen;
      if (timestamp && typeof timestamp === 'object' && timestamp.value) {
        timestamp = timestamp.value;
      }
      return {
        timestamp: timestamp as string,
        latitude: parseFloat(hb.latitude!.toString()),
        longitude: parseFloat(hb.longitude!.toString()),
        accuracy: hb.location_accuracy || 0,
        batteryLevel: hb.battery_level || 0,
        sequence: index + 1
      };
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

/**
 * Calculate uptime statistics from processed data
 */
export const calculateUptimeStats = (
  uptimeData: UptimeDataPoint[],
  timeInterval: number
): UptimeStats => {
  if (!uptimeData.length) {
    return {
      totalUptime: 0,
      uptimePercentage: 0,
      totalSessions: 0,
      averageSessionLength: 0,
      longestSession: 0,
      longestOffline: 0,
      firstOnline: null,
      lastOnline: null
    };
  }

  let totalUptimeMinutes = 0;
  let totalSessions = 0;
  let currentSessionLength = 0;
  let longestSession = 0;
  let longestOffline = 0;
  let currentOfflineLength = 0;
  let firstOnline = null;
  let lastOnline = null;
  let wasOnline = false;

  for (let i = 0; i < uptimeData.length; i++) {
    const point = uptimeData[i];
    const isOnline = point.isOnline === 1;

    if (isOnline) {
      if (!wasOnline) {
        totalSessions++;
        currentSessionLength = 0;
        if (firstOnline === null) firstOnline = point.displayTime;
      }
      currentSessionLength++;
      totalUptimeMinutes++;
      lastOnline = point.displayTime;
      currentOfflineLength = 0;
    } else {
      if (wasOnline) {
        longestSession = Math.max(longestSession, currentSessionLength);
        currentSessionLength = 0;
      }
      currentOfflineLength++;
      longestOffline = Math.max(longestOffline, currentOfflineLength);
    }
    wasOnline = isOnline;
  }

  if (wasOnline) {
    longestSession = Math.max(longestSession, currentSessionLength);
  }

  const totalMinutes = uptimeData.length * timeInterval;
  const uptimePercentage = totalMinutes > 0 ? (totalUptimeMinutes / totalMinutes) * 100 : 0;
  const averageSessionLength = totalSessions > 0 ? totalUptimeMinutes / totalSessions : 0;

  return {
    totalUptime: totalUptimeMinutes,
    uptimePercentage: Math.round(uptimePercentage * 100) / 100,
    totalSessions,
    averageSessionLength: Math.round(averageSessionLength * 100) / 100,
    longestSession: longestSession * timeInterval,
    longestOffline: longestOffline * timeInterval,
    firstOnline,
    lastOnline
  };
};

/**
 * Analyze device patterns for behavior insights
 */
export const analyzeDevicePatterns = (
  uptimeData: UptimeDataPoint[],
  timeInterval: number
): DevicePatterns => {
  if (!uptimeData.length) {
    return {
      mostActiveHour: null,
      leastActiveHour: null,
      averageSessionLength: 0,
      offlineFrequency: 0,
      reliabilityScore: 0
    };
  }

  const patterns: DevicePatterns = {
    mostActiveHour: null,
    leastActiveHour: null,
    averageSessionLength: 0,
    offlineFrequency: 0,
    reliabilityScore: 0
  };

  // Analyze hourly patterns
  const hourlyActivity = new Map<number, number>();
  const sessions = [];
  let currentSession = { start: 0, end: 0, isOnline: false };

  for (let i = 0; i < uptimeData.length; i++) {
    const point = uptimeData[i];
    const hour = new Date(point.time).getHours();
    const isOnline = point.isOnline === 1;

    // Track hourly activity
    hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + (isOnline ? 1 : 0));

    // Track sessions
    if (isOnline && !currentSession.isOnline) {
      currentSession = { start: i, end: i, isOnline: true };
    } else if (!isOnline && currentSession.isOnline) {
      currentSession.end = i;
      sessions.push({ ...currentSession, length: currentSession.end - currentSession.start });
      currentSession = { start: i, end: i, isOnline: false };
    }
  }

  // Find most/least active hours
  let maxActivity = 0;
  let minActivity = Infinity;
  for (const [hour, activity] of hourlyActivity) {
    if (activity > maxActivity) {
      maxActivity = activity;
      patterns.mostActiveHour = `${hour.toString().padStart(2, '0')}:00`;
    }
    if (activity < minActivity) {
      minActivity = activity;
      patterns.leastActiveHour = `${hour.toString().padStart(2, '0')}:00`;
    }
  }

  // Calculate patterns
  patterns.averageSessionLength = sessions.length > 0 ? 
    sessions.reduce((sum, s) => sum + s.length, 0) / sessions.length * timeInterval : 0;
  patterns.offlineFrequency = sessions.length / (uptimeData.length * timeInterval / 60); // per hour
  patterns.reliabilityScore = Math.max(0, 100 - (patterns.offlineFrequency * 10));

  return patterns;
};

/**
 * Get date range for display
 */
export const getDateRange = (
  uptimeData: UptimeDataPoint[],
  timeRange: string
): { startDate: string; endDate: string } => {
  if (!uptimeData.length) return { startDate: '', endDate: '' };
  
  // For 24h view, always show today's date
  if (timeRange === '24h') {
    const today = getCurrentTimePST();
    const formatDate = (date: Date) => {
      return formatDatePST(date, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    };
    
    return {
      startDate: formatDate(today),
      endDate: formatDate(today)
    };
  }
  
  // For other time ranges, use the actual data range
  const firstPoint = uptimeData[0];
  const lastPoint = uptimeData[uptimeData.length - 1];
  
  const startDate = new Date(firstPoint.time);
  const endDate = new Date(lastPoint.time);
  
  const formatDate = (date: Date) => {
    return formatDatePST(date, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
};
