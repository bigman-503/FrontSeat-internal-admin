import React, { useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Activity, Clock, MapPin, BarChart3, Battery } from 'lucide-react';
import { Device } from '@/types/device';
import { formatDatePST, getCurrentTimePST } from '@/lib/dateUtils';
import { generateCSVData, downloadCSV, calculateZoomWindow } from '@/utils/analytics/chartFormatters';

// Hooks
import { useDeviceAnalytics } from '@/hooks/useDeviceAnalytics';
import { useChartControls } from '@/hooks/useChartControls';
import { useUptimeData } from '@/hooks/useUptimeData';
import { useLocationData } from '@/hooks/useLocationData';

// Components
import { AnalyticsControls } from './AnalyticsControls';
import { UptimeStats } from './UptimeStats';
import { SimpleUptimeChart } from './SimpleUptimeChart';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';

interface DeviceAnalyticsDialogProps {
  device: Device | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeviceAnalyticsDialog({ device, open, onOpenChange }: DeviceAnalyticsDialogProps) {
  // Chart controls
  const {
    controls,
    setTimeRange,
    setCustomDates,
    setUseCustomRange,
    setTimeInterval,
    scrollLeft,
    scrollRight,
    resetZoom,
    onZoomChange
  } = useChartControls();


  // Data fetching - now using simplified uptime data hook
  const {
    uptimeData,
    uptimeDataWithZoom,
    uptimeStats,
    devicePatterns,
    dateRange,
    loading,
    error,
    refreshData,
    isMockData,
    dataSource
  } = useUptimeData({
    device,
    timeRange: controls.timeRange,
    timeInterval: controls.timeInterval,
    useCustomRange: controls.useCustomRange,
    customStartDate: controls.customStartDate,
    customEndDate: controls.customEndDate
  });

  // Debug logging
  console.log('🔍 DeviceAnalyticsDialog data:', {
    uptimeDataLength: uptimeData.length,
    uptimeDataWithZoomLength: uptimeDataWithZoom.length,
    timeRange: controls.timeRange,
    timeInterval: controls.timeInterval,
    zoomLevel: controls.zoomLevel,
    sampleUptimeData: uptimeData.slice(0, 3),
    sampleUptimeDataWithZoom: uptimeDataWithZoom.slice(0, 3),
    isMockData,
    dataSource
  });

  // Export functionality
  const handleExport = useCallback(async () => {
    if (!uptimeData.length) return;
    
    try {
      const csvContent = generateCSVData(uptimeData);
      const filename = `device-uptime-${device?.deviceId}-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, [uptimeData, device?.deviceId]);

  // Chart click handler
  const handleChartClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedIndex = data.activePayload[0].payload.index;
      const { start, end } = calculateZoomWindow(clickedIndex, uptimeData.length);
      onZoomChange(2); // Set zoom level
    }
  }, [uptimeData.length, onZoomChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (controls.zoomLevel > 1) {
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
  }, [open, controls.zoomLevel, scrollLeft, scrollRight]);

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
            {controls.timeRange === '24h' && (
              <span className="block mt-2 text-sm font-medium text-blue-600">
                📅 Viewing: {formatDatePST(getCurrentTimePST(), { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} (24-hour period)
              </span>
            )}
            {controls.timeRange === '7d' && (
              <span className="block mt-2 text-sm font-medium text-blue-600">
                📅 Viewing: Last 7 days (7-day period)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controls */}
          <AnalyticsControls
            controls={controls}
            onTimeRangeChange={setTimeRange}
            onCustomDatesChange={setCustomDates}
            onUseCustomRangeChange={setUseCustomRange}
            onTimeIntervalChange={setTimeInterval}
            onRefresh={refreshData}
            onExport={handleExport}
            onResetZoom={resetZoom}
            onScrollLeft={scrollLeft}
            onScrollRight={scrollRight}
            onZoomChange={onZoomChange}
            loading={loading}
            dataPointsCount={uptimeDataWithZoom.length}
            totalDataPoints={uptimeData.length}
          />

          {/* Loading State */}
          {loading && <LoadingState />}

          {/* Error State */}
          {error && (
            <ErrorState
              error={error}
              onRetry={refreshData}
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
                  {/* Uptime Statistics */}
                  <UptimeStats stats={uptimeStats} />

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
                          • Time intervals: {controls.timeInterval} minutes
                          • Data points: {uptimeData.length} of {uptimeData.length}
                          • Each bar represents a {controls.timeInterval}-minute period
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SimpleUptimeChart
                        data={uptimeData}
                        timeRange={controls.timeRange}
                        timeInterval={controls.timeInterval}
                        dateRange={dateRange}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

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
