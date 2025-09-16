import React, { useState, useEffect } from 'react';
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface DeviceAnalyticsDialogProps {
  device: Device | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function DeviceAnalyticsDialog({ device, open, onOpenChange }: DeviceAnalyticsDialogProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState<DeviceHistoricalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (device && open) {
      fetchAnalytics();
    }
  }, [device, open, timeRange]);

  const fetchAnalytics = async () => {
    if (!device) return;

    setLoading(true);
    setError(null);

    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const data = await AnalyticsService.getDeviceAnalytics(
        device.deviceId,
        startDate.toISOString().split('T')[0],
        endDate
      );

      setAnalyticsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

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
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
                <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Analytics Not Available</h3>
                  <p className="text-muted-foreground text-sm">
                    {error.includes('BigQuery integration is not configured')
                      ? 'Historical analytics data requires BigQuery integration to be configured. Real device data is not available.'
                      : error.includes('Only mock data is currently available')
                      ? 'Only mock data is currently available. Real device analytics require BigQuery integration.'
                      : error.includes('not available')
                      ? 'Historical analytics data requires a backend API to be running. Please set up the backend service to view device analytics.'
                      : error
                    }
                  </p>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>To enable real analytics data:</p>
                  <ol className="list-decimal list-inside space-y-1 text-left">
                    <li>Configure BigQuery credentials in your environment</li>
                    <li>Set GOOGLE_CLOUD_PROJECT_ID in your .env.local file</li>
                    <li>Set GOOGLE_APPLICATION_CREDENTIALS to your service account key</li>
                    <li>Ensure your BigQuery dataset and tables are set up</li>
                  </ol>
                </div>
                <Button variant="outline" onClick={fetchAnalytics}>
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {analyticsData && !loading && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Days</p>
                        <p className="text-2xl font-bold">{analyticsData.summary.totalDays}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg. Uptime</p>
                        <p className="text-2xl font-bold">{analyticsData.summary.averageUptime.toFixed(1)}h</p>
                      </div>
                      <Clock className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
                        <p className="text-2xl font-bold">{analyticsData.summary.totalAlerts}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Battery Health</p>
                        <Badge className={`${getBatteryHealthBadge(analyticsData.summary.batteryHealth)}`}>
                          {analyticsData.summary.batteryHealth}
                        </Badge>
                      </div>
                      <Battery className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Analytics Tabs */}
              <Tabs defaultValue="performance" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="battery">Battery</TabsTrigger>
                  <TabsTrigger value="usage">App Usage</TabsTrigger>
                  <TabsTrigger value="alerts">Alerts</TabsTrigger>
                </TabsList>

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
