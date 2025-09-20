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
import { Smartphone, Activity, Clock, MapPin, BarChart3, Battery } from 'lucide-react';
import { Device } from '@/types/device';
import { formatDatePST, getCurrentTimePST } from '@/lib/dateUtils';

// Hooks
import { useUptimeData } from '@/hooks/useUptimeData';

// Components
import { AnalyticsControls } from './AnalyticsControls';
import { SimpleUptimeChart } from './SimpleUptimeChart';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';

interface DeviceAnalyticsDialogProps {
  device: Device | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeviceAnalyticsDialog({ device, open, onOpenChange }: DeviceAnalyticsDialogProps) {
  // Data fetching - now using simplified uptime data hook
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
    timeRange: '24h', // Fixed to 24 hours
    timeInterval: 15, // Fixed to 15 minutes
    useCustomRange: false,
    customStartDate: '',
    customEndDate: ''
  });

  // Debug logging
  console.log('🔍 DeviceAnalyticsDialog data:', {
    uptimeDataLength: uptimeData.length,
    timeRange: '24h',
    timeInterval: 15,
    sampleUptimeData: uptimeData.slice(0, 3),
    isMockData,
    dataSource
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
            loading={loading}
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
