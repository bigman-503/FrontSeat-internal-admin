import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Smartphone,
  Search,
  Filter,
  RefreshCw,
  Battery,
  Wifi,
  MapPin,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Play,
  Pause,
  Settings,
} from "lucide-react";
import { mockDevices } from "@/data/mockDevices";
import { Device, DeviceStatusFilter } from "@/types/device";

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

export default function Devices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [devices] = useState<Device[]>(mockDevices);

  const filteredDevices = devices.filter((device) => {
    const matchesSearch = device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.deviceId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || device.status === statusFilter;
    const matchesPlatform = platformFilter === "all" || device.platform === platformFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const onlineDevices = devices.filter(d => d.isOnline).length;
  const lowBatteryDevices = devices.filter(d => d.batteryLevel < 20).length;
  const offlineDevices = devices.filter(d => !d.isOnline).length;

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
            Device Management
          </h1>
          <p className="text-muted-foreground text-lg">
            Monitor and manage your fleet of tablet devices
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online Devices</p>
                <p className="text-2xl font-bold text-green-600">{onlineDevices}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Low Battery</p>
                <p className="text-2xl font-bold text-yellow-600">{lowBatteryDevices}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Offline Devices</p>
                <p className="text-2xl font-bold text-red-600">{offlineDevices}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="low_battery">Low Battery</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-[140px]">
                  <Smartphone className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="android">Android</SelectItem>
                  <SelectItem value="ios">iOS</SelectItem>
                  <SelectItem value="windows">Windows</SelectItem>
                  <SelectItem value="linux">Linux</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devices Table */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Smartphone className="h-5 w-5" />
            All Devices ({filteredDevices.length})
          </CardTitle>
          <CardDescription>
            Complete list of devices in your fleet with real-time status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <Table>
              <TableHeader className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-900/80">
                <TableRow className="border-gray-200/50 dark:border-gray-700/50">
                  <TableHead className="font-semibold text-foreground">Device</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground">Battery</TableHead>
                  <TableHead className="font-semibold text-foreground">Network</TableHead>
                  <TableHead className="font-semibold text-foreground">Location</TableHead>
                  <TableHead className="font-semibold text-foreground">Last Seen</TableHead>
                  <TableHead className="font-semibold text-foreground">Uptime</TableHead>
                  <TableHead className="w-[100px] font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((device) => (
                  <TableRow key={device.deviceId} className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 transition-all duration-300 border-gray-200/50 dark:border-gray-700/50">
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                          {device.deviceName}
                        </p>
                        <p className="text-sm text-muted-foreground">{device.deviceId}</p>
                        <p className="text-xs text-muted-foreground capitalize">{device.platform} • {device.model}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(device)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Battery className="h-4 w-4" />
                        <span className={`font-medium ${getBatteryColor(device.batteryLevel)}`}>
                          {device.batteryLevel}%
                        </span>
                        {device.isCharging && <span className="text-green-500">⚡</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        <span className="font-medium capitalize">{device.networkStatus.type}</span>
                        {device.networkStatus.signalStrength && (
                          <span className="text-xs text-muted-foreground">
                            ({device.networkStatus.signalStrength}%)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <p className="font-medium">{device.location.latitude.toFixed(4)}</p>
                          <p className="text-muted-foreground">{device.location.longitude.toFixed(4)}</p>
                        </div>
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


