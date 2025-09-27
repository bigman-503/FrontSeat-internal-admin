import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Battery,
  Activity,
  MapPin,
  Wifi,
  Clock,
  AlertTriangle,
  TrendingUp,
  Smartphone,
  BarChart3,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { Device } from '@/types/device';
import { AnalyticsService, DeviceHistoricalData } from '@/services/analyticsService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';

interface DeviceAnalyticsDialogProps {
  device: Device | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function DeviceAnalyticsDialog({ device, open, onOpenChange }: DeviceAnalyticsDialogProps) {
  const [timeRange, setTimeRange] = useState('24h');
  const [analyticsData, setAnalyticsData] = useState<DeviceHistoricalData | null>(null);
  const [heartbeatData, setHeartbeatData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state for detailed time range controls
  const [customStartDate, setCustomStartDate] = useState<string>('2025-09-16');
  const [customEndDate, setCustomEndDate] = useState<string>('2025-09-16');
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [timeInterval, setTimeInterval] = useState<number>(15); // minutes
  const [selectedTimeRange, setSelectedTimeRange] = useState<{start: number, end: number} | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (device && open) {
      fetchAnalytics();
      fetchHeartbeatData();
    }
  }, [device, open, timeRange, useCustomRange, customStartDate, customEndDate, timeInterval]);

  const fetchAnalytics = async () => {
    if (!device) return;

    setLoading(true);
    setError(null);

    try {
      // Use custom date range if enabled, otherwise use predefined ranges
      let startDate, endDate;
      
      if (useCustomRange) {
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        // Use 2025 dates to match BigQuery data
        endDate = '2025-09-16';
        startDate = '2025-09-16';
      
      switch (timeRange) {
          case '24h':
            // Same day for 24h view
            startDate = '2025-09-16';
            endDate = '2025-09-16';
            break;
        case '7d':
            startDate = '2025-09-10';
          break;
        case '30d':
            startDate = '2025-08-17';
          break;
        case '90d':
            startDate = '2025-06-18';
          break;
        case '1y':
            startDate = '2024-09-16';
          break;
        }
      }

      const data = await AnalyticsService.getDeviceAnalytics(
        device.deviceId,
        startDate,
        endDate
      );

      console.log('📊 Analytics data received:', { 
        dataSource: data.dataSource, 
        isMockData: data.isMockData, 
        analyticsLength: data.analytics?.length 
      });
      setAnalyticsData(data);
    } catch (err) {
      // Analytics service now always returns data (either real or mock)
      // This catch block should rarely be reached
      console.error('Unexpected error fetching analytics:', err);
      setError('Unexpected error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchHeartbeatData = async () => {
    if (!device) return;

    try {
      // Use custom date range if enabled, otherwise use predefined ranges
      let startDate, endDate;
      
      if (useCustomRange) {
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        // Use 2025 dates to match BigQuery data
        endDate = '2025-09-16';
        startDate = '2025-09-16';
        
        switch (timeRange) {
          case '24h':
            // Same day for 24h view
            startDate = '2025-09-16';
            endDate = '2025-09-16';
            break;
          case '7d':
            startDate = '2025-09-10';
            break;
          case '30d':
            startDate = '2025-08-17';
            break;
          case '90d':
            startDate = '2025-06-18';
            break;
          case '1y':
            startDate = '2024-09-16';
            break;
        }
      }

      const response = await fetch(`/api/analytics/device/${device.deviceId}/heartbeats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('💓 Heartbeat data received:', { 
          dataSource: data.dataSource, 
          isMockData: data.isMockData, 
          heartbeatsLength: data.heartbeats?.length 
        });
        setHeartbeatData(data.heartbeats || []);
      } else {
        console.error('Failed to fetch heartbeat data');
        setHeartbeatData([]);
      }
    } catch (error) {
      console.error('Error fetching heartbeat data:', error);
      setHeartbeatData([]);
    }
  };

  // Helper function to safely parse timestamps
  const parseTimestamp = useCallback((timestamp: any): Date | null => {
    if (!timestamp) return null;
    
    let timestampStr = timestamp;
    // Handle BigQuery timestamp format
    if (timestamp && typeof timestamp === 'object' && timestamp.value) {
      timestampStr = timestamp.value;
    }
    
    const date = new Date(timestampStr);
    return isNaN(date.getTime()) ? null : date;
  }, []);

          // Process heartbeat data for uptime visualization
          const processUptimeData = useMemo(() => {
            // For 24h view, always generate full 24-hour range even with no data
            if (timeRange === '24h' && !heartbeatData.length) {
              const intervals = [];
              const today = new Date('2025-09-16T00:00:00.000Z'); // Use the date from BigQuery data
              
              for (let hour = 0; hour < 24; hour++) {
                for (let minute = 0; minute < 60; minute += timeInterval) {
                  const time = new Date(today);
                  time.setHours(hour, minute, 0, 0);
                  intervals.push(time);
                }
              }
              
              // Generate empty data points for the full 24-hour range
              return intervals.map((intervalStart, i) => ({
                time: intervalStart.toISOString(),
                displayTime: intervalStart.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                }),
                isOnline: 0, // All offline since no data
                prevIsOnline: i > 0 ? 0 : null,
                batteryLevel: 0,
                cpuUsage: 0,
                heartbeatCount: 0
              }));
            }
            
            if (!heartbeatData.length) {
              return [];
            }

            // Filter out invalid timestamps and sort by timestamp
            const sortedData = [...heartbeatData]
              .map(hb => ({ ...hb, parsedTime: parseTimestamp(hb.last_seen) }))
              .filter(hb => hb.parsedTime !== null)
              .sort((a, b) => {
                if (!a.parsedTime || !b.parsedTime) return 0;
                return a.parsedTime.getTime() - b.parsedTime.getTime();
              });

            if (!sortedData.length) {
              return [];
            }

            // For 24h view, always show full 24-hour period (00:00 to 24:00)
            let startTime, endTime;
            
            if (timeRange === '24h') {
              // Use the date from the first heartbeat but set time to 00:00
              const firstHeartbeat = sortedData[0].parsedTime!;
              startTime = new Date(firstHeartbeat);
              startTime.setHours(0, 0, 0, 0); // 00:00:00
              
              // Set end time to 24:00 (next day 00:00)
              endTime = new Date(startTime);
              endTime.setDate(endTime.getDate() + 1); // Next day 00:00
            } else {
              // For other ranges, use actual data range
              startTime = sortedData[0].parsedTime!;
              endTime = sortedData[sortedData.length - 1].parsedTime!;
              
              // Round start time to nearest interval
              const roundedStart = new Date(startTime);
              roundedStart.setMinutes(Math.floor(roundedStart.getMinutes() / timeInterval) * timeInterval, 0, 0);
              
              // Round end time to nearest interval
              const roundedEnd = new Date(endTime);
              roundedEnd.setMinutes(Math.ceil(roundedEnd.getMinutes() / timeInterval) * timeInterval, 0, 0);
              
              startTime = roundedStart;
              endTime = roundedEnd;
            }

            // Generate intervals
            const intervals = [];
            const current = new Date(startTime);
            while (current < endTime) {
              intervals.push(new Date(current));
              current.setMinutes(current.getMinutes() + timeInterval);
            }

    const uptimeData = [];
    const maxGapMinutes = 3; // Consider device off if gap > 3 minutes

    // For each interval, determine if device was online
    for (let i = 0; i < intervals.length; i++) {
      const intervalStart = intervals[i];
      const intervalEnd = new Date(intervalStart.getTime() + timeInterval * 60 * 1000); // configurable minutes later
      
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
        // Device was online if we have heartbeats in this interval
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
        
        // If we have recent heartbeats and the gap is less than 3 minutes, consider online
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
          hour12: false 
        }),
        isOnline: isOnline ? 1 : 0, // Use 1/0 for cleaner Y-axis
        prevIsOnline: i > 0 ? uptimeData[i - 1].isOnline : null, // Track previous state for dot rendering
        batteryLevel: avgBatteryLevel,
        cpuUsage: avgCpuUsage,
        heartbeatCount: totalHeartbeats
      });
    }

            return uptimeData;
          }, [heartbeatData, timeInterval, parseTimestamp, timeRange]);

  // Process heartbeat data with zoom functionality
  const processUptimeDataWithZoom = useMemo(() => {
    if (zoomLevel === 1) return processUptimeData;
    
    // Apply zoom by showing only a subset of data
    const totalPoints = processUptimeData.length;
    const visiblePoints = Math.max(10, Math.floor(totalPoints / zoomLevel));
    const startIndex = Math.floor((totalPoints - visiblePoints) / 2);
    
    return processUptimeData.slice(startIndex, startIndex + visiblePoints);
  }, [processUptimeData, zoomLevel]);

  // Calculate uptime statistics
  const uptimeStats = useMemo(() => {
    if (!processUptimeData.length) {
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

    for (let i = 0; i < processUptimeData.length; i++) {
      const point = processUptimeData[i];
      const isOnline = point.isOnline === 1;

      if (isOnline) {
        if (!wasOnline) {
          // Starting a new online session
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
          // Ending an online session
          longestSession = Math.max(longestSession, currentSessionLength);
          currentSessionLength = 0;
        }
        currentOfflineLength++;
        longestOffline = Math.max(longestOffline, currentOfflineLength);
      }
      wasOnline = isOnline;
    }

    // Handle case where session ends at the last point
    if (wasOnline) {
      longestSession = Math.max(longestSession, currentSessionLength);
    }

    const totalMinutes = processUptimeData.length * timeInterval;
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
  }, [processUptimeData, timeInterval]);

  // Get date range for display
  const dateRange = useMemo(() => {
    if (!processUptimeData.length) return { startDate: '', endDate: '' };
    
    const firstPoint = processUptimeData[0];
    const lastPoint = processUptimeData[processUptimeData.length - 1];
    
    const startDate = new Date(firstPoint.time);
    const endDate = new Date(lastPoint.time);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    };
    
    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    };
  }, [processUptimeData]);

  // Pattern recognition for device behavior
  const devicePatterns = useMemo(() => {
    if (!processUptimeData.length) return null;

    const patterns = {
      mostActiveHour: null as string | null,
      leastActiveHour: null as string | null,
      averageSessionLength: 0,
      offlineFrequency: 0,
      reliabilityScore: 0
    };

    // Analyze hourly patterns
    const hourlyActivity = new Map<number, number>();
    const sessions = [];
    let currentSession = { start: 0, end: 0, isOnline: false };

    for (let i = 0; i < processUptimeData.length; i++) {
      const point = processUptimeData[i];
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
    patterns.offlineFrequency = sessions.length / (processUptimeData.length * timeInterval / 60); // per hour
    patterns.reliabilityScore = Math.max(0, 100 - (patterns.offlineFrequency * 10));

    return patterns;
  }, [processUptimeData, timeInterval]);

  // Process heartbeat data for location path visualization
  const processLocationData = useMemo(() => {
    if (!heartbeatData.length) {
      return [];
    }

    const locationData = heartbeatData
      .filter(hb => {
        let timestamp = hb.last_seen;
        // Handle BigQuery timestamp format
        if (timestamp && typeof timestamp === 'object' && timestamp.value) {
          timestamp = timestamp.value;
        }
        return hb.latitude && hb.longitude && timestamp && !isNaN(new Date(timestamp).getTime());
      })
      .map((hb, index) => {
        let timestamp = hb.last_seen;
        // Handle BigQuery timestamp format
        if (timestamp && typeof timestamp === 'object' && timestamp.value) {
          timestamp = timestamp.value;
        }
        return {
          timestamp: timestamp,
          latitude: parseFloat(hb.latitude),
          longitude: parseFloat(hb.longitude),
          accuracy: hb.location_accuracy || 0,
          batteryLevel: hb.battery_level || 0,
          sequence: index + 1
        };
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return locationData;
  }, [heartbeatData]);

  // Process location data with zoom functionality
  const processLocationDataWithZoom = useMemo(() => {
    if (zoomLevel === 1) return processLocationData;
    
    // Apply zoom by showing only a subset of data
    const totalPoints = processLocationData.length;
    const visiblePoints = Math.max(5, Math.floor(totalPoints / zoomLevel));
    const startIndex = Math.floor((totalPoints - visiblePoints) / 2);
    
    return processLocationData.slice(startIndex, startIndex + visiblePoints);
  }, [processLocationData, zoomLevel]);

  const getBatteryHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getBatteryHealthBadge = (health: string) => {
    switch (health) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Export functionality
  const exportChart = async (format: 'png' | 'csv') => {
    setIsExporting(true);
    try {
      if (format === 'csv') {
        const csvData = processUptimeData.map(point => ({
          time: point.displayTime,
          status: point.isOnline === 1 ? 'Online' : 'Offline',
          battery: point.batteryLevel,
          cpu: point.cpuUsage,
          heartbeats: point.heartbeatCount
        }));
        
        const csvContent = [
          'Time,Status,Battery Level,CPU Usage,Heartbeats',
          ...csvData.map(row => `${row.time},${row.status},${row.battery},${row.cpu},${row.heartbeats}`)
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `device-uptime-${device?.deviceId}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // For PNG export, we'd need to use a library like html2canvas
        // For now, we'll show a message
        alert('PNG export requires additional setup. CSV export is available.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Click to zoom functionality
  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedIndex = data.activePayload[0].payload.index;
      const totalPoints = processUptimeData.length;
      const zoomWindow = Math.floor(totalPoints / 4); // Zoom to 1/4 of the data
      const start = Math.max(0, clickedIndex - Math.floor(zoomWindow / 2));
      const end = Math.min(totalPoints, start + zoomWindow);
      
      setSelectedTimeRange({ start, end });
      setZoomLevel(2); // Set zoom level
      setScrollPosition(0); // Reset scroll position when zooming
    }
  };

  // Scroll functionality
  const scrollLeft = () => {
    if (scrollPosition > 0) {
      const newPosition = Math.max(0, scrollPosition - 100);
      setScrollPosition(newPosition);
    }
  };

  const scrollRight = () => {
    const maxScroll = Math.max(0, (processUptimeDataWithZoom.length - 20) * 20); // Approximate max scroll
    if (scrollPosition < maxScroll) {
      const newPosition = Math.min(maxScroll, scrollPosition + 100);
      setScrollPosition(newPosition);
    }
  };

  // Update scroll button states
  useEffect(() => {
    const maxScroll = Math.max(0, (processUptimeDataWithZoom.length - 20) * 20);
    setCanScrollLeft(scrollPosition > 0);
    setCanScrollRight(scrollPosition < maxScroll);
  }, [scrollPosition, processUptimeDataWithZoom.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (zoomLevel > 1) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          scrollLeft();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          scrollRight();
        }
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [zoomLevel, scrollPosition, processUptimeDataWithZoom.length]);

  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Smartphone className="h-6 w-6" />
            Device Analytics - {device.deviceName}
          </DialogTitle>
          <DialogDescription>
            Historical performance data and analytics for device {device.deviceId}
            {timeRange === '24h' && (
              <span className="block mt-2 text-sm font-medium text-blue-600">
                📅 Viewing: September 16, 2025 (24-hour period)
              </span>
            )}
            {timeRange === '7d' && (
              <span className="block mt-2 text-sm font-medium text-blue-600">
                📅 Viewing: September 10-16, 2025 (7-day period)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controls */}
          <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                        <Select value={timeRange} onValueChange={(value) => { 
                          setTimeRange(value); 
                          setUseCustomRange(value === 'custom'); 
                        }}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                            <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
                
                {useCustomRange && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <span className="text-sm text-gray-500">to</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
            </div>
                )}
            </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant={useCustomRange ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setUseCustomRange(!useCustomRange)}
                >
                  Custom Range
                </Button>
                <Button variant="outline" onClick={() => { fetchAnalytics(); fetchHeartbeatData(); }} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => exportChart('csv')} 
                  disabled={isExporting || !processUptimeData.length}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export CSV'}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setZoomLevel(1)}
                  disabled={zoomLevel === 1}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Reset View
            </Button>
              </div>
            </div>
            
            {/* Zoom and Time Interval Controls */}
            <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Zoom:</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setZoomLevel(Math.max(1, zoomLevel - 1))}
                          disabled={zoomLevel <= 1}
                        >
                          -
                        </Button>
                        <span className="text-sm w-8 text-center">{zoomLevel}x</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setZoomLevel(Math.min(10, zoomLevel + 1))}
                          disabled={zoomLevel >= 10}
                        >
                          +
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setZoomLevel(1)}
                        >
                          Reset
                        </Button>
                      </div>
                      
                      {/* Scroll controls - only show when zoomed in */}
                      {zoomLevel > 1 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Scroll:</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={scrollLeft}
                            disabled={!canScrollLeft}
                          >
                            ←
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={scrollRight}
                            disabled={!canScrollRight}
                          >
                            →
                          </Button>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {Math.round((scrollPosition / Math.max(1, (processUptimeDataWithZoom.length - 20) * 20)) * 100)}%
                            </span>
                            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all duration-200"
                                style={{ 
                                  width: `${Math.min(100, (scrollPosition / Math.max(1, (processUptimeDataWithZoom.length - 20) * 20)) * 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Time Interval:</span>
                <Select value={timeInterval.toString()} onValueChange={(value) => setTimeInterval(parseInt(value))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
                      <div className="text-sm text-gray-500">
                        Showing {processUptimeDataWithZoom.length} of {processUptimeData.length} data points
                      </div>
            </div>
          </div>

          {loading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <div className="relative">
                          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-blue-600" />
                          <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-lg font-medium text-gray-900">Loading analytics data...</p>
                          <p className="text-sm text-muted-foreground">Fetching device heartbeat data from BigQuery</p>
                          <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto">
                            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                          </div>
                        </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-6 max-w-md">
                <div className="relative">
                  <AlertTriangle className="h-16 w-16 mx-auto text-red-500" />
                  <div className="absolute inset-0 rounded-full border-4 border-red-200"></div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">Error Loading Analytics</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{error}</p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-700">
                      💡 Try refreshing the data or check your BigQuery connection
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={fetchAnalytics}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Try Again
                  </Button>
                  <Button variant="outline" onClick={() => setError(null)}>
                    Dismiss
                </Button>
                </div>
              </div>
            </div>
          )}

          {analyticsData && !loading && (
            <>

              {/* Analytics Tabs */}
              <Tabs defaultValue="uptime" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="uptime">Device Uptime</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="location">Location Path</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="battery">Battery</TabsTrigger>
                </TabsList>

                        <TabsContent value="uptime" className="space-y-4">
                          {/* Uptime Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                                    <p className="text-sm font-medium text-green-700">Uptime</p>
                                    <p className="text-2xl font-bold text-green-800">{uptimeStats.uptimePercentage}%</p>
                                    <p className="text-xs text-green-600">{uptimeStats.totalUptime} min total</p>
                      </div>
                                  <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
                                    <Activity className="h-6 w-6 text-green-700" />
                  </div>
                    </div>
                  </CardContent>
                </Card>

                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                                    <p className="text-sm font-medium text-blue-700">Sessions</p>
                                    <p className="text-2xl font-bold text-blue-800">{uptimeStats.totalSessions}</p>
                                    <p className="text-xs text-blue-600">Avg: {uptimeStats.averageSessionLength} min</p>
                      </div>
                                  <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-blue-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                                    <p className="text-sm font-medium text-purple-700">Longest Online</p>
                                    <p className="text-2xl font-bold text-purple-800">{uptimeStats.longestSession} min</p>
                                    <p className="text-xs text-purple-600">Best session</p>
                      </div>
                                  <div className="h-12 w-12 bg-purple-200 rounded-full flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-purple-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                                    <p className="text-sm font-medium text-orange-700">Longest Offline</p>
                                    <p className="text-2xl font-bold text-orange-800">{uptimeStats.longestOffline} min</p>
                                    <p className="text-xs text-orange-600">Worst gap</p>
                      </div>
                                  <div className="h-12 w-12 bg-orange-200 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="h-6 w-6 text-orange-700" />
                                  </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Device Uptime Timeline
                              </CardTitle>
                              <CardDescription>
                                {timeRange === '24h' 
                                  ? '24-hour device status monitoring (00:00 - 24:00). Green line indicates device is online, red indicates offline. Full 24-hour range is always displayed.'
                                  : 'Real-time device status monitoring. Green line indicates device is online, red indicates offline.'
                                }
                                <br />
                                <span className="text-sm text-muted-foreground">
                                  • Gaps &gt; 3 minutes without heartbeats indicate device was off
                                  • Time intervals: {timeInterval} minutes
                                  • Data points: {processUptimeDataWithZoom.length} of {processUptimeData.length}
                                  {timeRange === '24h' && ' • X-axis shows full 24-hour range (00:00-24:00)'}
                                  {zoomLevel > 1 && ' • Use scroll buttons or arrow keys to explore time data'}
                                </span>
                              </CardDescription>
                    </CardHeader>
                    <CardContent>
                              <div className="h-[500px] relative">
                                {/* Date labels for left and right sides */}
                                <div className="absolute top-4 left-4 z-10">
                                  <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                                    <span className="text-xs font-medium text-gray-600">
                                      {dateRange.startDate || 'Start Date'}
                                    </span>
                                  </div>
                                </div>
                                <div className="absolute top-4 right-4 z-10">
                                  <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                                    <span className="text-xs font-medium text-gray-600">
                                      {dateRange.endDate || 'End Date'}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Scrollable chart container */}
                                <div 
                                  className="overflow-x-auto overflow-y-hidden h-full"
                                  style={{ 
                                    scrollBehavior: 'smooth',
                                    scrollbarWidth: 'thin'
                                  }}
                                  ref={(el) => {
                                    if (el) {
                                      el.scrollLeft = scrollPosition;
                                    }
                                  }}
                                >
                                  <div 
                                    style={{ 
                                      width: zoomLevel > 1 ? `${processUptimeDataWithZoom.length * 40}px` : '100%',
                                      minWidth: '100%'
                                    }}
                                  >
                                    {processUptimeDataWithZoom.length > 0 ? (
                                      <ResponsiveContainer width="100%" height="100%">
                                        <LineChart 
                                          data={processUptimeDataWithZoom} 
                                          key={`uptime-${heartbeatData.length}-${zoomLevel}-${timeInterval}-${scrollPosition}`} 
                                          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                                          onClick={handleChartClick}
                                          style={{ cursor: 'pointer' }}
                                        >
                              <CartesianGrid 
                                strokeDasharray="1 3" 
                                stroke="#f0f0f0" 
                                strokeOpacity={0.5}
                              />
                                      <XAxis 
                                        dataKey="displayTime" 
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                        interval="preserveStartEnd"
                                        tick={{ fontSize: 10, fill: '#666' }}
                                        axisLine={{ stroke: '#e0e0e0' }}
                                        tickLine={{ stroke: '#e0e0e0' }}
                                        tickFormatter={(value, index) => {
                                          // For 24h view, show every hour (every 4th tick for 15min intervals)
                                          if (timeRange === '24h') {
                                            return index % 4 === 0 ? value : '';
                                          }
                                          // For other views, show every 2nd or 3rd tick to reduce clutter
                                          const totalTicks = processUptimeDataWithZoom.length;
                                          const showEvery = Math.max(1, Math.floor(totalTicks / 8));
                                          return index % showEvery === 0 ? value : '';
                                        }}
                                        label={{
                                          value: timeRange === '24h' ? dateRange.startDate : 'Time Period',
                                          position: 'insideBottom',
                                          offset: -10,
                                          style: { textAnchor: 'middle', fontSize: '12px', fill: '#666' }
                                        }}
                                      />
                              <YAxis 
                                domain={[0, 1]}
                                ticks={[0, 1]}
                                tickFormatter={(value) => value === 1 ? '🟢 Online' : '🔴 Offline'}
                                tick={{ fontSize: 12, fontWeight: 'bold' }}
                                axisLine={{ stroke: '#e0e0e0' }}
                                tickLine={{ stroke: '#e0e0e0' }}
                              />
                                      <Tooltip 
                                        contentStyle={{
                                          backgroundColor: '#f8f9fa',
                                          border: '1px solid #e9ecef',
                                          borderRadius: '8px',
                                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                          fontSize: '14px',
                                          padding: '12px'
                                        }}
                                        labelFormatter={(value, props) => {
                                          // 'value' is the displayTime from the X-axis (e.g., "08:30")
                                          // Show the exact time data point being hovered
                                          const data = (props as any).payload?.[0];
                                          
                                          if (data && data.time) {
                                            const date = new Date(data.time);
                                            return `${date.toLocaleDateString()} at ${data.displayTime}`;
                                          } else {
                                            // Fallback: use the current date and the hovered time
                                            const today = new Date('2025-09-16'); // Use the date from BigQuery data
                                            return `${today.toLocaleDateString()} at ${value}`;
                                          }
                                        }}
                                        formatter={(value, name, props) => {
                                          const data = (props as any).payload?.[0];
                                          
                                          if (!data) {
                                            // No data for this time point - device was offline
                                            const status = '🔴 Offline';
                                            const battery = 'Battery: N/A';
                                            const heartbeats = 'Heartbeats: 0';
                                            const cpuUsage = 'CPU: N/A';
                                            
                                            const tooltipText = `${status}\n${battery}\n${cpuUsage}\n${heartbeats}`.replace(/\n\n+/g, '\n').trim();
                                            
                                            return [tooltipText, 'Status'];
                                          }
                                          
                                          const status = value === 1 ? '🟢 Online' : '🔴 Offline';
                                          const battery = data.batteryLevel ? `Battery: ${data.batteryLevel.toFixed(1)}%` : 'Battery: N/A';
                                          const heartbeats = data.heartbeatCount ? `Heartbeats: ${data.heartbeatCount}` : 'Heartbeats: 0';
                                          const cpuUsage = data.cpuUsage ? `CPU: ${data.cpuUsage.toFixed(1)}%` : 'CPU: N/A';
                                          
                                          const tooltipText = `${status}\n${battery}\n${cpuUsage}\n${heartbeats}`.replace(/\n\n+/g, '\n').trim();
                                          
                                          return [tooltipText, 'Status'];
                                        }}
                                      />
                              <Line 
                                type="stepAfter" 
                                dataKey="isOnline" 
                                stroke="#10b981"
                                strokeWidth={6}
                                dot={(props) => {
                                  const { payload, cx, cy, index } = props;
                                  if (!payload) return null;
                                  
                                  // Only show dots at state changes
                                  const isStateChange = payload.isOnline !== payload.prevIsOnline;
                                  if (!isStateChange) return null;
                                  
                                  const isOnline = payload.isOnline === 1;
                                  const color = isOnline ? '#10b981' : '#ef4444';
                                  const shadowColor = isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
                                  
                                  return (
                                    <g key={`dot-${index}-${payload.time}`}>
                                      <circle
                                        cx={cx}
                                        cy={cy}
                                        r={8}
                                        fill={color}
                                        stroke="#ffffff"
                                        strokeWidth={3}
                                        style={{ filter: `drop-shadow(0 2px 6px ${shadowColor})` }}
                                      />
                                      <circle
                                        cx={cx}
                                        cy={cy}
                                        r={4}
                                        fill="#ffffff"
                                        opacity={0.8}
                                      />
                                    </g>
                                  );
                                }}
                                activeDot={{ 
                                  r: 12, 
                                  fill: '#10b981', 
                                  stroke: '#ffffff', 
                                  strokeWidth: 4,
                                  style: { 
                                    filter: 'drop-shadow(0 4px 8px rgba(16, 185, 129, 0.4))',
                                    cursor: 'pointer'
                                  }
                                }}
                                connectNulls={false}
                              />
                              {/* No data indicator line */}
                              {processUptimeDataWithZoom.length === 0 && (
                                <Line
                                  type="monotone"
                                  dataKey={() => 0.5}
                                  stroke="#e5e7eb"
                                  strokeWidth={2}
                                  strokeDasharray="5 5"
                                  dot={false}
                                  connectNulls={true}
                                />
                              )}
                                        </LineChart>
                                      </ResponsiveContainer>
                                    ) : (
                                      <div className="flex items-center justify-center h-full text-muted-foreground">
                                        <div className="text-center">
                                          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                          <p className="text-lg font-medium">No data available for this period</p>
                                          <p className="text-sm mt-2">
                                            {timeRange === '24h' 
                                              ? 'No heartbeat data found for the last 24 hours'
                                              : 'No heartbeat data found for the selected time range'
                                            }
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                      
                      {/* Legend */}
                      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span>Online</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                          <span>Offline</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>State Change</span>
                    </div>
                    </div>
                  </CardContent>
                </Card>
                        </TabsContent>

                        <TabsContent value="timeline" className="space-y-4">
                          {/* Pattern Recognition */}
                          {devicePatterns && (
                            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-800">
                                  <TrendingUp className="h-5 w-5" />
                                  Device Behavior Patterns
                                </CardTitle>
                                <CardDescription className="text-blue-600">
                                  AI-powered insights into device usage patterns and reliability
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-600">Most Active Hour</p>
                                    <p className="text-lg font-bold text-blue-800">{devicePatterns.mostActiveHour || 'N/A'}</p>
                                  </div>
                                  <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-600">Reliability Score</p>
                                    <p className="text-lg font-bold text-blue-800">{Math.round(devicePatterns.reliabilityScore)}%</p>
                                  </div>
                                  <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-600">Avg Session Length</p>
                                    <p className="text-lg font-bold text-blue-800">{Math.round(devicePatterns.averageSessionLength)} min</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Detailed Timeline View
                              </CardTitle>
                              <CardDescription>
                                Chronological view of device status changes with exact timestamps and session details
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {processUptimeData.length > 0 ? (
                                  <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {processUptimeData
                                      .filter((point, index) => {
                                        // Only show state changes
                                        return index === 0 || point.isOnline !== processUptimeData[index - 1].isOnline;
                                      })
                                      .map((point, index) => {
                                        const isOnline = point.isOnline === 1;
                                        const nextPoint = processUptimeData.find((p, i) => i > processUptimeData.indexOf(point) && p.isOnline !== point.isOnline);
                                        const duration = nextPoint ? 
                                          Math.round((new Date(nextPoint.time).getTime() - new Date(point.time).getTime()) / (1000 * 60)) : 
                                          'Ongoing';
                                        
                                        return (
                                          <div 
                                            key={`timeline-${index}-${point.time}`}
                                            className={`flex items-center gap-4 p-3 rounded-lg border-l-4 ${
                                              isOnline 
                                                ? 'bg-green-50 border-green-400' 
                                                : 'bg-red-50 border-red-400'
                                            }`}
                                          >
                                            <div className={`w-3 h-3 rounded-full ${
                                              isOnline ? 'bg-green-500' : 'bg-red-500'
                                            }`}></div>
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">
                                                  {point.displayTime}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                  isOnline 
                                                    ? 'bg-green-200 text-green-800' 
                                                    : 'bg-red-200 text-red-800'
                                                }`}>
                                                  {isOnline ? '🟢 Online' : '🔴 Offline'}
                                                </span>
                                                {duration !== 'Ongoing' && (
                                                  <span className="text-xs text-gray-500">
                                                    Duration: {duration} min
                                                  </span>
                                                )}
                                              </div>
                                              {point.batteryLevel > 0 && (
                                                <div className="text-xs text-gray-600 mt-1">
                                                  Battery: {point.batteryLevel.toFixed(1)}% | 
                                                  CPU: {point.cpuUsage.toFixed(1)}% | 
                                                  Heartbeats: {point.heartbeatCount}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No timeline data available</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="location" className="space-y-4">
                <Card>
                    <CardHeader>
                      <CardTitle>Device Location Path</CardTitle>
                      <CardDescription>Device movement over time based on GPS coordinates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[500px]">
                                {processLocationDataWithZoom.length > 0 ? (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart data={processLocationDataWithZoom} key={`location-${heartbeatData.length}-${zoomLevel}`} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="longitude" 
                                name="Longitude"
                                type="number"
                                scale="linear"
                              />
                              <YAxis 
                                dataKey="latitude" 
                                name="Latitude"
                                type="number"
                                scale="linear"
                              />
                              <Tooltip 
                                cursor={{ strokeDasharray: '3 3' }}
                                formatter={(value, name, props) => {
                                  const data = (props as any).payload?.[0];
                                  if (!data) return ['', ''];
                                  return [
                                    `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`,
                                    'Coordinates'
                                  ];
                                }}
                                labelFormatter={(value, props) => {
                                  const data = (props as any).payload?.[0];
                                  if (!data || !data.timestamp) return '';
                                  return `Time: ${new Date(data.timestamp).toLocaleString()}`;
                                }}
                              />
                              <Scatter 
                                dataKey="batteryLevel" 
                                fill="#8884d8"
                                r={6}
                              />
                            </ScatterChart>
                          </ResponsiveContainer>
                                ) : (
                                  <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <div className="text-center">
                                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                      <p className="text-lg font-medium">No location data available</p>
                                      <p className="text-sm mt-2">
                                        {timeRange === '24h' 
                                          ? 'No GPS coordinates found for the last 24 hours'
                                          : 'No GPS coordinates found for the selected time range'
                                        }
                                      </p>
                      </div>
                    </div>
                                )}
                      </div>
                      <div className="mt-4 text-sm text-muted-foreground">
                        <p>• Purple dots represent device locations</p>
                        <p>• Dot size indicates battery level</p>
                        <p>• Path shows chronological movement</p>
                    </div>
                  </CardContent>
                </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Uptime Trend</CardTitle>
                        <CardDescription>Daily uptime over the selected period</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={analyticsData.analytics}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="totalUptime" stroke="#8884d8" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Network Activity</CardTitle>
                        <CardDescription>Network connections and location updates</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={analyticsData.analytics}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="networkConnections" fill="#8884d8" />
                            <Bar dataKey="locationUpdates" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="battery" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Battery Level Trend</CardTitle>
                      <CardDescription>Average battery level over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analyticsData.analytics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Line type="monotone" dataKey="averageBatteryLevel" stroke="#ffc658" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="usage" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>App Usage Distribution</CardTitle>
                      <CardDescription>Time spent in different applications</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          {analyticsData.summary.mostUsedApp !== 'None' && (
                            <div className="p-3 border rounded-lg">
                              <p className="font-medium">Most Used App</p>
                              <p className="text-sm text-muted-foreground">{analyticsData.summary.mostUsedApp}</p>
                            </div>
                          )}
                        </div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analyticsData.analytics[0]?.appUsage || []}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ appName, usageTime }) => `${appName}: ${usageTime.toFixed(0)}m`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="usageTime"
                              >
                                {(analyticsData.analytics[0]?.appUsage || []).map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="alerts" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Device Alerts</CardTitle>
                      <CardDescription>Recent alerts and issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analyticsData.analytics.some(day => day.alerts.length > 0) ? (
                          analyticsData.analytics
                            .filter(day => day.alerts.length > 0)
                            .map(day => 
                              day.alerts.map((alert, index) => (
                                <div key={`${day.date}-${index}`} className="p-3 border rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium capitalize">{alert.type.replace('_', ' ')}</p>
                                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                                      <p className="text-xs text-muted-foreground">{new Date(alert.timestamp).toLocaleString()}</p>
                                    </div>
                                    <Badge variant="destructive">Alert</Badge>
                                  </div>
                                </div>
                              ))
                            )
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No alerts in the selected period</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
