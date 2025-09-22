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
import { useAdvancedChartControls } from '@/hooks/useAdvancedChartControls';

// Components
import { AnalyticsControls } from './AnalyticsControls';
import { SimpleUptimeChart } from './SimpleUptimeChart';
import { WeekUptimeChart } from './WeekUptimeChart';
import { MonthUptimeChart } from './MonthUptimeChart';
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
  // Advanced chart controls
  const {
    controls,
    setTimeRange,
    zoomIn,
    zoomOut,
    reset,
    scrollLeft,
    scrollRight,
    setSelectedDate,
    canZoomIn,
    canZoomOut,
    canScrollLeft,
    canScrollRight
  } = useAdvancedChartControls();

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
    timeRange: controls.timeRange,
    timeInterval: 15,
    useCustomRange: false,
    customStartDate: '',
    customEndDate: ''
  });

  // Process data for different views
  const dailySummaries = React.useMemo(() => {
    if (controls.timeRange === '7d' || controls.timeRange === '30d') {
      console.log('🔄 Aggregating daily summaries:', {
        uptimeDataLength: uptimeData.length,
        sampleUptimeData: uptimeData.slice(0, 2),
        timeRange: controls.timeRange
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
  }, [uptimeData, controls.timeRange]);

  const monthData = React.useMemo(() => {
    if (controls.timeRange === '30d') {
      console.log('🔄 Aggregating month data:', {
        dailySummariesLength: dailySummaries.length,
        sampleDailySummary: dailySummaries[0]
      });
      const monthView = aggregateToMonthView(dailySummaries, new Date());
      console.log('📅 Month view result:', {
        monthDataLength: monthView.length,
        sampleMonthData: monthView[0],
        allMonthData: monthView
      });
      return monthView;
    }
    return [];
  }, [dailySummaries, controls.timeRange]);

  // Helper function to filter uptime data for a specific day
  const getFilteredDayData = React.useCallback((data: any[], selectedDate: string) => {
    if (!selectedDate || !data) return [];
    
    const targetDate = new Date(selectedDate);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    return data.filter(point => {
      const pointDate = new Date(point.time);
      return pointDate >= startOfDay && pointDate <= endOfDay;
    });
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
    timeRange: controls.timeRange,
    timeInterval: 15,
    sampleUptimeData: uptimeData.slice(0, 3),
    isMockData,
    dataSource,
    viewMode: controls.viewMode,
    selectedDate: controls.selectedDate,
    dailySummariesLength: dailySummaries.length,
    monthDataLength: monthData.length,
    filteredDayDataLength: controls.selectedDate ? 'calculating...' : 0
  });


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
          {/* Controls */}
          <AnalyticsControls
            timeRange={controls.timeRange}
            onTimeRangeChange={setTimeRange}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={reset}
            onScrollLeft={scrollLeft}
            onScrollRight={scrollRight}
            canZoomIn={canZoomIn}
            canZoomOut={canZoomOut}
            canScrollLeft={canScrollLeft}
            canScrollRight={canScrollRight}
            loading={loading}
          />

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
              <Tabs defaultValue="uptime" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="uptime">Device Uptime</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="location">Location Path</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="battery">Battery</TabsTrigger>
                </TabsList>

                <TabsContent value="uptime" className="space-y-4">
                  {/* Dynamic View Based on Time Range */}
                  {controls.timeRange === '24h' && (
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

                  {controls.timeRange === '7d' && (
                    <WeekUptimeChart
                      data={dailySummaries}
                      onDayClick={setSelectedDate}
                      selectedDate={controls.selectedDate}
                    />
                  )}

                  {controls.timeRange === '30d' && (
                    <MonthUptimeChart
                      data={monthData}
                      currentMonth={getCurrentMonthName()}
                      onDayClick={setSelectedDate}
                      selectedDate={controls.selectedDate}
                    />
                  )}
                </TabsContent>

                {/* Selected Day Detail View - Outside of time range conditions */}
                {controls.selectedDate && (
                  <>
                    {console.log('🎯 Rendering Day Detail for:', controls.selectedDate)}
                    <Card className="mt-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-blue-600" />
                          <CardTitle className="text-blue-900">
                            Day Detail - {controls.selectedDate}
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
                        Detailed 24-hour view for {controls.selectedDate}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SimpleUptimeChart
                        data={getFilteredDayData(uptimeData, controls.selectedDate)}
                        timeRange="24h"
                        timeInterval={15}
                        dateRange={getDayDateRange(controls.selectedDate)}
                        isHistoricalView={true}
                        selectedDate={controls.selectedDate}
                      />
                    </CardContent>
                  </Card>
                  </>
                )}


                <TabsContent value="timeline" className="space-y-4">
                  {/* Timeline content would go here */}
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
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Timeline view coming soon...</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="location" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Device Location Path
                      </CardTitle>
                      <CardDescription>Device movement over time based on GPS coordinates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Location map coming soon...</p>
                      </div>
                    </CardContent>
                  </Card>
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
