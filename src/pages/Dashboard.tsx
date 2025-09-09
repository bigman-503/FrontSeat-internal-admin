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
} from "lucide-react";
import { mockDevices, mockFleetMetrics } from "@/data/mockDevices";
import { Device } from "@/types/device";

// Fleet metrics for demonstration
const metrics = [
  {
    title: "Total Devices",
    value: mockFleetMetrics.totalDevices.toString(),
    change: "All devices in fleet",
    changeType: "neutral" as const,
    icon: <Smartphone className="h-5 w-5" />,
    variant: "primary" as const,
  },
  {
    title: "Online Devices",
    value: `${mockFleetMetrics.onlineDevices}/${mockFleetMetrics.totalDevices}`,
    change: `${Math.round((mockFleetMetrics.onlineDevices / mockFleetMetrics.totalDevices) * 100)}% online`,
    changeType: "positive" as const,
    icon: <Wifi className="h-5 w-5" />,
    variant: "success" as const,
  },
  {
    title: "Average Battery",
    value: `${mockFleetMetrics.averageBatteryLevel.toFixed(1)}%`,
    change: `${mockFleetMetrics.lowBatteryDevices} devices need charging`,
    changeType: mockFleetMetrics.averageBatteryLevel < 30 ? "negative" as const : "positive" as const,
    icon: <Battery className="h-5 w-5" />,
    variant: mockFleetMetrics.averageBatteryLevel < 30 ? "destructive" as const : "info" as const,
  },
  {
    title: "Average Uptime",
    value: `${mockFleetMetrics.averageUptime.toFixed(1)}h`,
    change: "Last 24 hours",
    changeType: "positive" as const,
    icon: <Activity className="h-5 w-5" />,
    variant: "warning" as const,
  },
];

// Recent device activity
const recentDevices = mockDevices.slice(0, 4);

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
        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-6 py-3 rounded-xl">
          <Plus className="h-5 w-5 mr-2" />
          Add Device
        </Button>
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
            <div className="h-64 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl flex items-center justify-center relative overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="absolute top-8 right-8 w-1 h-1 bg-purple-500 rounded-full animate-pulse delay-100"></div>
                <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse delay-200"></div>
                <div className="absolute bottom-4 right-4 w-1 h-1 bg-emerald-500 rounded-full animate-pulse delay-300"></div>
              </div>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                  <BarChart className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-muted-foreground font-medium">Fleet Analytics Coming Soon</p>
                <p className="text-sm text-muted-foreground/70">Real-time device monitoring</p>
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
              {mockDevices.slice(0, 4).map((device, index) => (
                <div key={device.deviceId} className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 hover:from-gray-100/70 hover:to-gray-200/70 dark:hover:from-gray-700/70 dark:hover:to-gray-800/70 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${device.isOnline ? 'bg-green-500' : 'bg-red-500'} ${device.isOnline ? 'animate-pulse' : ''}`}></div>
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">{device.deviceName}</p>
                      <p className="text-sm text-muted-foreground">
                        {device.location.latitude.toFixed(4)}, {device.location.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${device.isOnline ? 'bg-green-500' : 'bg-red-500'} text-white border-0 shadow-lg`}>
                      {device.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                    <div className={`w-2 h-2 rounded-full ${device.isOnline ? 'bg-emerald-500' : 'bg-red-500'} ${device.isOnline ? 'animate-pulse' : ''}`}></div>
                  </div>
                </div>
              ))}
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
                        {device.isCharging && <span className="text-green-500">⚡</span>}
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
                          {device.isOnline ? (
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