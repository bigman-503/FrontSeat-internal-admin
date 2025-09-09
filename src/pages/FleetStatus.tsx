import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Battery,
  Wifi,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Smartphone,
} from "lucide-react";
import { mockDevices, mockFleetMetrics } from "@/data/mockDevices";
import { Device } from "@/types/device";

const getStatusColor = (status: Device['status']) => {
  switch (status) {
    case 'online': return 'text-green-500';
    case 'offline': return 'text-red-500';
    case 'low_battery': return 'text-yellow-500';
    case 'error': return 'text-red-500';
    case 'maintenance': return 'text-blue-500';
    default: return 'text-gray-500';
  }
};

const getBatteryColor = (level: number) => {
  if (level > 50) return "text-green-500";
  if (level > 20) return "text-yellow-500";
  return "text-red-500";
};

const getBatteryProgressColor = (level: number) => {
  if (level > 50) return "bg-green-500";
  if (level > 20) return "bg-yellow-500";
  return "bg-red-500";
};

export default function FleetStatus() {
  const [devices] = useState<Device[]>(mockDevices);
  const [lastRefresh] = useState(new Date());

  const onlineDevices = devices.filter(d => d.isOnline);
  const offlineDevices = devices.filter(d => !d.isOnline);
  const lowBatteryDevices = devices.filter(d => d.batteryLevel < 20);
  const chargingDevices = devices.filter(d => d.isCharging);

  const averageBatteryLevel = devices.reduce((sum, d) => sum + d.batteryLevel, 0) / devices.length;
  const averageUptime = devices.reduce((sum, d) => sum + (d.uptime || 0), 0) / devices.length;

  const statusDistribution = {
    online: onlineDevices.length,
    offline: offlineDevices.length,
    lowBattery: lowBatteryDevices.length,
    charging: chargingDevices.length,
  };

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
            Fleet Status
          </h1>
          <p className="text-muted-foreground text-lg">
            Real-time overview of your entire device fleet
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online Devices</p>
                <p className="text-3xl font-bold text-green-600">{statusDistribution.online}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((statusDistribution.online / devices.length) * 100)}% of fleet
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offline Devices</p>
                <p className="text-3xl font-bold text-red-600">{statusDistribution.offline}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((statusDistribution.offline / devices.length) * 100)}% of fleet
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Battery</p>
                <p className="text-3xl font-bold text-yellow-600">{statusDistribution.lowBattery}</p>
                <p className="text-xs text-muted-foreground">
                  Need immediate attention
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                <Battery className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Charging</p>
                <p className="text-3xl font-bold text-blue-600">{statusDistribution.charging}</p>
                <p className="text-xs text-muted-foreground">
                  Currently charging
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Battery Health */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Battery className="h-5 w-5" />
              Battery Health Overview
            </CardTitle>
            <CardDescription>
              Average battery level across all devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {averageBatteryLevel.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Average battery level
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Battery Distribution</span>
                    <span>{devices.length} devices</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "High (50%+)", count: devices.filter(d => d.batteryLevel >= 50).length, color: "bg-green-500" },
                      { label: "Medium (20-49%)", count: devices.filter(d => d.batteryLevel >= 20 && d.batteryLevel < 50).length, color: "bg-yellow-500" },
                      { label: "Low (<20%)", count: devices.filter(d => d.batteryLevel < 20).length, color: "bg-red-500" },
                    ].map((range, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{range.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${range.color}`}
                              style={{ width: `${(range.count / devices.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{range.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Status */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Wifi className="h-5 w-5" />
              Network Connectivity
            </CardTitle>
            <CardDescription>
              Connection status and network types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { type: 'wifi', count: devices.filter(d => d.networkStatus.type === 'wifi').length, color: 'bg-blue-500' },
                  { type: 'cellular', count: devices.filter(d => d.networkStatus.type === 'cellular').length, color: 'bg-green-500' },
                  { type: 'ethernet', count: devices.filter(d => d.networkStatus.type === 'ethernet').length, color: 'bg-purple-500' },
                  { type: 'unknown', count: devices.filter(d => d.networkStatus.type === 'unknown').length, color: 'bg-gray-500' },
                ].map((network, index) => (
                  <div key={index} className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className={`w-3 h-3 rounded-full ${network.color} mx-auto mb-2`} />
                    <div className="text-2xl font-bold text-foreground">{network.count}</div>
                    <div className="text-sm text-muted-foreground capitalize">{network.type}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Connected Devices</span>
                  <span>{devices.filter(d => d.networkStatus.connected).length}/{devices.length}</span>
                </div>
                <Progress 
                  value={(devices.filter(d => d.networkStatus.connected).length / devices.length) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Status Details */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Activity className="h-5 w-5" />
            Device Status Details
          </CardTitle>
          <CardDescription>
            Individual device status and health metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <div key={device.deviceId} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{device.deviceName}</h3>
                    <p className="text-sm text-muted-foreground">{device.deviceId}</p>
                  </div>
                  <Badge 
                    variant={device.isOnline ? "default" : "destructive"}
                    className={`${getStatusColor(device.status)}`}
                  >
                    {device.status}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Battery</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${getBatteryColor(device.batteryLevel)}`}>
                        {device.batteryLevel}%
                      </span>
                      {device.isCharging && <span className="text-green-500">⚡</span>}
                    </div>
                  </div>
                  <Progress 
                    value={device.batteryLevel} 
                    className={`h-2 ${getBatteryProgressColor(device.batteryLevel)}`}
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Network</span>
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      <span className="text-sm capitalize">{device.networkStatus.type}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="text-sm font-medium">{device.uptime || 0}h</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Seen</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">
                        {new Date(device.lastSeen).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


