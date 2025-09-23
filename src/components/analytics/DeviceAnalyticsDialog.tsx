import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Activity, Clock, MapPin, BarChart3, Battery, XCircle } from 'lucide-react';
import { Device } from '@/types/device';
import { formatDatePST, getCurrentTimePST } from '@/lib/dateUtils';

// Hooks
import { useUptimeData } from '@/hooks/useUptimeData';

// Components
import { SimpleUptimeChart } from './SimpleUptimeChart';
import { WeekUptimeChart } from './WeekUptimeChart';
import { MonthUptimeChart } from './MonthUptimeChart';
import { LocationTrackingSimple } from './LocationTrackingSimple';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';

// Utils
import { aggregateToDailySummaries, aggregateToMonthView, getCurrentMonthName } from '@/utils/analytics/dataAggregators';

interface DeviceAnalyticsDialogProps {
  device: Device | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeviceAnalyticsDialog({ device, open, onOpenChange }: DeviceAnalyticsDialogProps) {
  // Simple chart controls
  const [timeRange, setTimeRange] = React.useState<string>('24h');
  const [selectedDate, setSelectedDate] = React.useState<string | undefined>(undefined);

  // Tab state to prevent automatic switching
  const [activeTab, setActiveTab] = React.useState<string>('uptime');

  // Month navigation state
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

  // Month navigation functions
  const handlePreviousMonth = React.useCallback(() => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  }, []);

  const handleNextMonth = React.useCallback(() => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  }, []);

  // Data fetching - now using dynamic time range
  const {
    uptimeData,
    devicePatterns,
    dateRange,
    loading,
    error,
    isMockData,
    dataSource
  } = useUptimeData({
    device,
    timeRange: timeRange,
    timeInterval: 15,
    useCustomRange: false,
    customStartDate: '',
    customEndDate: ''
  });

  // Process data for different views
  const dailySummaries = React.useMemo(() => {
    if (timeRange === '7d' || timeRange === '30d') {
      console.log('🔄 Aggregating daily summaries:', {
        uptimeDataLength: uptimeData.length,
        sampleUptimeData: uptimeData.slice(0, 2),
        timeRange: timeRange
      });
      const summaries = aggregateToDailySummaries(uptimeData);
      console.log('📊 Daily summaries result:', {
        summariesLength: summaries.length,
        sampleSummary: summaries[0],
        allSummaries: summaries
      });
      return summaries;
    }
    return [];
  }, [uptimeData, timeRange]);

  const monthData = React.useMemo(() => {
    if (timeRange === '30d') {
      console.log('🔄 Aggregating month data:', {
        dailySummariesLength: dailySummaries.length,
        sampleDailySummary: dailySummaries[0]
      });
      const monthView = aggregateToMonthView(dailySummaries, currentMonth);
      console.log('📅 Month view result:', {
        monthDataLength: monthView.length,
        sampleMonthData: monthView[0],
        allMonthData: monthView
      });
      return monthView;
    }
    return [];
  }, [dailySummaries, timeRange, currentMonth]);

  // Helper function to filter uptime data for a specific day
  const getFilteredDayData = React.useCallback((data: any[], selectedDate: string) => {
    if (!selectedDate || !data) return [];
    
    // selectedDate is in YYYY-MM-DD format (Pacific date)
    // We need to find data points that fall within this Pacific day
    
    // Create start and end of day in Pacific timezone (PDT = UTC-7)
    const startOfDayPacific = new Date(selectedDate + 'T00:00:00-07:00');
    const endOfDayPacific = new Date(selectedDate + 'T23:59:59.999-07:00');
    
    // These Date objects already represent the correct UTC timestamps
    const utcStart = startOfDayPacific;
    const utcEnd = endOfDayPacific;
    
    console.log('🔍 Filtering day data (corrected):', {
      selectedDate,
      startOfDayPacific: startOfDayPacific.toISOString(),
      endOfDayPacific: endOfDayPacific.toISOString(),
      utcStart: utcStart.toISOString(),
      utcEnd: utcEnd.toISOString(),
      dataLength: data.length
    });
    
    const filteredData = data.filter(point => {
      const pointDate = new Date(point.time);
      const isInRange = pointDate >= utcStart && pointDate <= utcEnd;
      
      if (isInRange) {
        console.log('✅ Found matching point:', {
          pointTime: point.time,
          pointDate: pointDate.toISOString(),
          isOnline: point.isOnline,
          heartbeatCount: point.heartbeatCount
        });
      }
      
      return isInRange;
    });
    
    console.log('📊 Filtered day data result:', {
      originalLength: data.length,
      filteredLength: filteredData.length,
      onlineCount: filteredData.filter(p => p.isOnline === 1).length
    });
    
    return filteredData;
  }, []);

  // Helper function to get date range for a specific day
  const getDayDateRange = React.useCallback((selectedDate: string) => {
    if (!selectedDate) return { start: '', end: '' };
    
    const targetDate = new Date(selectedDate);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    return {
      start: startOfDay.toISOString(),
      end: endOfDay.toISOString()
    };
  }, []);

  // Debug logging
  console.log('🔍 DeviceAnalyticsDialog data:', {
    uptimeDataLength: uptimeData.length,
    timeRange: timeRange,
    timeInterval: 15,
    sampleUptimeData: uptimeData.slice(0, 3),
    isMockData,
    dataSource,
    viewMode: 'overview',
    selectedDate: selectedDate,
    dailySummariesLength: dailySummaries.length,
    monthDataLength: monthData.length,
    filteredDayDataLength: selectedDate ? 'calculating...' : 0
  });


  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto w-[95vw] sm:w-full p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Smartphone className="h-6 w-6" />
            Device Analytics - {device.deviceName}
          </DialogTitle>
          <DialogDescription>
            Historical performance data and analytics for device {device.deviceId}
            <span className="block mt-2 text-sm font-medium text-blue-600">
              📅 Viewing: {formatDatePST(getCurrentTimePST(), { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} (24-hour period)
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">

          {/* Loading State */}
          {loading && <LoadingState />}

          {/* Error State */}
          {error && (
            <ErrorState
              error={error}
            />
          )}

          {/* Analytics Content */}
          {!loading && !error && (
            <>

              {/* Analytics Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="uptime">Device Uptime</TabsTrigger>
                  <TabsTrigger value="location">Location Path</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="battery">Battery</TabsTrigger>
                </TabsList>

                <TabsContent value="uptime" className="space-y-4">
                  {/* Time Range Selector */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium">Time Range:</label>
                      <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Dynamic View Based on Time Range */}
                  {timeRange === '24h' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          Device Uptime Timeline
                        </CardTitle>
                        <CardDescription>
                          24-hour device status monitoring with color-coded bars showing online/offline status. 
                          Green bars indicate device is online, red bars indicate offline periods.
                          <br />
                          <span className="text-sm text-muted-foreground">
                            • Gaps &gt; 3 minutes without heartbeats indicate device was off
                            • Time intervals: 15 minutes
                            • Data points: {uptimeData.length} of {uptimeData.length}
                            • Each bar represents a 15-minute period
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <SimpleUptimeChart
                          data={uptimeData}
                          timeRange="24h"
                          timeInterval={15}
                          dateRange={dateRange}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {timeRange === '7d' && (
                    <WeekUptimeChart
                      data={dailySummaries}
                      onDayClick={setSelectedDate}
                      selectedDate={selectedDate}
                    />
                  )}

                  {timeRange === '30d' && (
                    <MonthUptimeChart
                      data={monthData}
                      currentMonth={currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      onDayClick={setSelectedDate}
                      onPreviousMonth={handlePreviousMonth}
                      onNextMonth={handleNextMonth}
                      selectedDate={selectedDate}
                    />
                  )}

                {/* Selected Day Detail View - Inside uptime tab */}
                {selectedDate && (
                  <Card className="mt-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-blue-600" />
                          <CardTitle className="text-blue-900">
                            {(() => {
                              if (!selectedDate) return 'Day Detail';
                              const date = new Date(selectedDate + 'T00:00:00-07:00');
                              return date.toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                timeZone: 'America/Los_Angeles'
                              });
                            })()}
                          </CardTitle>
                        </div>
                        <button
                          onClick={() => setSelectedDate(undefined)}
                          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                          title="Close day detail"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                      <CardDescription className="text-blue-700">
                        Detailed 24-hour view for {(() => {
                          if (!selectedDate) return '';
                          const date = new Date(selectedDate + 'T00:00:00-07:00');
                          return date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'America/Los_Angeles'
                          });
                        })()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SimpleUptimeChart
                        data={getFilteredDayData(uptimeData, selectedDate)}
                        timeRange="24h"
                        timeInterval={15}
                        dateRange={getDayDateRange(selectedDate)}
                        isHistoricalView={true}
                        selectedDate={selectedDate}
                      />
                    </CardContent>
                  </Card>
                )}
                </TabsContent>

                <TabsContent value="location" className="space-y-4">
                  {/* Time Range Selector for Location */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium">Time Range:</label>
                      <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Location Tracking Component */}
                  <LocationTrackingSimple
                    device={device}
                    timeRange={timeRange}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                  />
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Performance Metrics
                      </CardTitle>
                      <CardDescription>Device performance over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Performance charts coming soon...</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="battery" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Battery className="h-5 w-5" />
                        Battery Analysis
                      </CardTitle>
                      <CardDescription>Battery usage patterns and health</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <Battery className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Battery analysis coming soon...</p>
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
