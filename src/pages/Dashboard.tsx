import React from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Smartphone,
  Wifi,
  Battery,
  TrendingUp,
  Activity,
  MapPin,
  Plus,
  Play,
  Pause,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useDevices } from "@/hooks/useDevices";
import { Device } from "@/types/device";
import { GoogleMap } from "@/components/GoogleMap";

// Helper function to create metrics array
const createMetrics = (fleetMetrics: any) => [
  {
    title: "Total Devices",
    value: fleetMetrics.totalDevices.toString(),
    change: "All devices in fleet",
    changeType: "neutral" as const,
    icon: <Smartphone className="h-5 w-5" />,
    variant: "primary" as const,
  },
  {
    title: "Online Devices",
    value: `${fleetMetrics.onlineDevices}/${fleetMetrics.totalDevices}`,
    change: `${Math.round((fleetMetrics.onlineDevices / Math.max(fleetMetrics.totalDevices, 1)) * 100)}% online`,
    changeType: "positive" as const,
    icon: <Wifi className="h-5 w-5" />,
    variant: "success" as const,
  },
  {
    title: "Average Battery",
    value: `${fleetMetrics.averageBatteryLevel.toFixed(1)}%`,
    change: `${fleetMetrics.lowBatteryDevices} devices need charging`,
    changeType: fleetMetrics.averageBatteryLevel < 30 ? "negative" as const : "positive" as const,
    icon: <Battery className="h-5 w-5" />,
    variant: fleetMetrics.averageBatteryLevel < 30 ? "destructive" as const : "info" as const,
  },
  {
    title: "Average Uptime",
    value: `${fleetMetrics.averageUptime.toFixed(1)}h`,
    change: "Last 24 hours",
    changeType: "positive" as const,
    icon: <Activity className="h-5 w-5" />,
    variant: "warning" as const,
  },
];

const getStatusBadge = (device: Device) => {
  const statusConfig = {
    online: { variant: "default" as const, label: "Online", icon: <CheckCircle className="h-3 w-3" /> },
    offline: { variant: "destructive" as const, label: "Offline", icon: <XCircle className="h-3 w-3" /> },
    low_battery: { variant: "secondary" as const, label: "Low Battery", icon: <AlertTriangle className="h-3 w-3" /> },
    error: { variant: "destructive" as const, label: "Error", icon: <XCircle className="h-3 w-3" /> },
    maintenance: { variant: "outline" as const, label: "Maintenance", icon: <AlertTriangle className="h-3 w-3" /> },
  };
  
  const config = statusConfig[device.status] || statusConfig.offline;
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
};

const getBatteryColor = (level: number) => {
  if (level > 50) return "text-green-500";
  if (level > 20) return "text-yellow-500";
  return "text-red-500";
};

const formatLastSeen = (lastSeen: string) => {
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

export default function Dashboard() {
  const { devices, fleetMetrics, loading, error, refetch } = useDevices();
  
  // Create metrics array from real-time data
  const metrics = createMetrics(fleetMetrics);
  
  // Get recent devices (first 4)
  const recentDevices = devices.slice(0, 4);
  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8 relative">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-muted-foreground">Loading fleet data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-8 relative">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
            <p className="text-muted-foreground">Failed to load fleet data</p>
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-100/20 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between relative">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
            Fleet Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Fleet management overview - Monitor your tablet devices in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={refetch} 
            variant="outline" 
            size="sm"
            className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-6 py-3 rounded-xl">
            <Plus className="h-5 w-5 mr-2" />
            Add Device
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            changeType={metric.changeType}
            icon={metric.icon}
            variant={metric.variant}
          />
        ))}
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Status Chart */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                <BarChart className="h-5 w-5" />
              </div>
              Fleet Status Overview
            </CardTitle>
            <CardDescription className="text-base">
              Device status and battery levels across your fleet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Device Status Distribution */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Device Status Distribution
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">Online</span>
                    </div>
                    <span className="font-bold text-green-600">{fleetMetrics.onlineDevices}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium">Offline</span>
                    </div>
                    <span className="font-bold text-red-600">{fleetMetrics.offlineDevices}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm font-medium">Low Battery</span>
                    </div>
                    <span className="font-bold text-yellow-600">{fleetMetrics.lowBatteryDevices}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium">Total</span>
                    </div>
                    <span className="font-bold text-blue-600">{fleetMetrics.totalDevices}</span>
                  </div>
                </div>
              </div>

              {/* Battery Level Chart */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Battery className="h-4 w-4" />
                  Battery Levels
                </h4>
                <div className="space-y-2">
                  {devices.map((device) => (
                    <div key={device.deviceId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{device.deviceName}</span>
                        <span className={`font-bold ${getBatteryColor(device.batteryLevel)}`}>
                          {device.batteryLevel}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            device.batteryLevel > 50 
                              ? 'bg-gradient-to-r from-green-400 to-green-500' 
                              : device.batteryLevel > 20 
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                              : 'bg-gradient-to-r from-red-400 to-red-500'
                          }`}
                          style={{ width: `${device.batteryLevel}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Network Status */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Network Connectivity
                </h4>
                <div className="space-y-2">
                  {devices.map((device) => (
                    <div key={device.deviceId} className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${device.networkStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-medium">{device.deviceName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground capitalize">{device.networkStatus.type}</span>
                        {device.networkStatus.signalStrength && (
                          <span className="text-xs text-muted-foreground">
                            {device.networkStatus.signalStrength}dBm
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Locations */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white">
                <MapPin className="h-5 w-5" />
              </div>
              Device Locations
            </CardTitle>
            <CardDescription className="text-base">
              Current locations of your fleet devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Map Container */}
              <div className="h-64 rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
                {devices.length > 0 ? (
                  <GoogleMap
                    devices={devices}
                    selectedDevice={null}
                    onDeviceSelect={() => {}}
                    center={{
                      lat: devices[0]?.location?.latitude || 49.2630,
                      lng: devices[0]?.location?.longitude || -123.1327
                    }}
                    zoom={12}
                    height="100%"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
                    <div className="text-center space-y-2">
                      <MapPin className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">No devices with location data</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Device List */}
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground text-sm">Device Details</h4>
                {devices.slice(0, 3).map((device, index) => (
                  <div key={device.deviceId} className="group flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 hover:from-gray-100/70 hover:to-gray-200/70 dark:hover:from-gray-700/70 dark:hover:to-gray-800/70 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${device.online ? 'bg-green-500' : 'bg-red-500'} ${device.online ? 'animate-pulse' : ''}`}></div>
                      <div>
                        <p className="font-semibold text-foreground group-hover:text-blue-600 transition-colors text-sm">{device.deviceName}</p>
                        <p className="text-xs text-muted-foreground">
                          {device.location.latitude.toFixed(4)}, {device.location.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${device.online ? 'bg-green-500' : 'bg-red-500'} text-white border-0 shadow-lg text-xs`}>
                        {device.online ? 'Online' : 'Offline'}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {device.batteryLevel}%
                      </div>
                    </div>
                  </div>
                ))}
                {devices.length > 3 && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      +{devices.length - 3} more devices
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Device Activity */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
              <Smartphone className="h-5 w-5" />
            </div>
            Recent Device Activity
          </CardTitle>
          <CardDescription className="text-base">
            Latest device status updates and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <Table>
              <TableHeader className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-900/80">
                <TableRow className="border-gray-200/50 dark:border-gray-700/50">
                  <TableHead className="font-semibold text-foreground">Device Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground">Battery</TableHead>
                  <TableHead className="font-semibold text-foreground">Network</TableHead>
                  <TableHead className="font-semibold text-foreground">Last Seen</TableHead>
                  <TableHead className="font-semibold text-foreground">Uptime</TableHead>
                  <TableHead className="w-[100px] font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDevices.map((device, index) => (
                  <TableRow key={device.deviceId} className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 transition-all duration-300 border-gray-200/50 dark:border-gray-700/50">
                    <TableCell className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                      {device.deviceName}
                    </TableCell>
                    <TableCell>{getStatusBadge(device)}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Battery className="h-4 w-4" />
                        <span className={`${getBatteryColor(device.batteryLevel)}`}>
                          {device.batteryLevel}%
                        </span>
                        {device.charging && <span className="text-green-500">⚡</span>}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium capitalize">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        {device.networkStatus.type}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{formatLastSeen(device.lastSeen)}</TableCell>
                    <TableCell className="font-medium text-foreground">{device.uptime || 0}h</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors">
                          {device.online ? (
                            <Pause className="h-4 w-4 text-red-500" />
                          ) : (
                            <Play className="h-4 w-4 text-emerald-500" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}