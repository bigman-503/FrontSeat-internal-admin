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

  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                <p className="text-muted-foreground">Loading analytics data...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4 max-w-md">
                <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Error Loading Analytics</h3>
                  <p className="text-muted-foreground text-sm">{error}</p>
                </div>
                <Button variant="outline" onClick={fetchAnalytics}>
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {analyticsData && !loading && (
            <>

              {/* Analytics Tabs */}
              <Tabs defaultValue="uptime" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="uptime">Device Uptime</TabsTrigger>
                  <TabsTrigger value="location">Location Path</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="battery">Battery</TabsTrigger>
                </TabsList>

                <TabsContent value="uptime" className="space-y-4">
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
                                </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[500px]">
                                {processUptimeDataWithZoom.length > 0 ? (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={processUptimeDataWithZoom} key={`uptime-${heartbeatData.length}-${zoomLevel}-${timeInterval}`} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
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
                                strokeWidth={4}
                                dot={(props) => {
                                  const { payload, cx, cy, index } = props;
                                  if (!payload) return null;
                                  
                                  // Only show dots at state changes
                                  const isStateChange = payload.isOnline !== payload.prevIsOnline;
                                  if (!isStateChange) return null;
                                  
                                  return (
                                    <circle
                                      key={`dot-${index}-${payload.time}`}
                                      cx={cx}
                                      cy={cy}
                                      r={6}
                                      fill={payload.isOnline === 1 ? '#10b981' : '#ef4444'}
                                      stroke="#ffffff"
                                      strokeWidth={2}
                                    />
                                  );
                                }}
                                activeDot={{ 
                                  r: 8, 
                                  fill: '#10b981', 
                                  stroke: '#ffffff', 
                                  strokeWidth: 3,
                                  style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }
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
