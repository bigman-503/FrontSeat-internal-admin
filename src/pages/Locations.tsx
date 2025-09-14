import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Search,
  Filter,
  RefreshCw,
  Battery,
  Wifi,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Navigation,
  Clock,
  Smartphone,
  AlertCircle,
} from "lucide-react";
import { useDevices } from "@/hooks/useDevices";
import { Device } from "@/types/device";
import { GoogleMap } from "@/components/GoogleMap";

const getStatusColor = (device: Device) => {
  if (device.online) return "text-green-500";
  if (device.status === 'low_battery') return "text-yellow-500";
  return "text-red-500";
};

const getStatusIcon = (device: Device) => {
  if (device.online) return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (device.status === 'low_battery') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
};

const formatDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
};

export default function Locations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { devices, loading, error, refetch } = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const filteredDevices = devices.filter((device) => {
    const matchesSearch = device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.deviceId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || device.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const onlineDevices = devices.filter(d => d.online);
  const offlineDevices = devices.filter(d => !d.online);

  // Calculate center point for map
  const centerLat = devices.length > 0 ? devices.reduce((sum, d) => sum + d.location.latitude, 0) / devices.length : 0;
  const centerLon = devices.length > 0 ? devices.reduce((sum, d) => sum + d.location.longitude, 0) / devices.length : 0;

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8 relative">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-muted-foreground">Loading device locations...</p>
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
            <p className="text-muted-foreground">Failed to load device locations</p>
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
            Device Locations
          </h1>
          <p className="text-muted-foreground text-lg">
            Track and monitor your fleet devices across the city
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <Navigation className="h-4 w-4 mr-2" />
            Navigation
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Devices</p>
                <p className="text-2xl font-bold text-blue-600">{devices.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online Devices</p>
                <p className="text-2xl font-bold text-green-600">{onlineDevices.length}</p>
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
                <p className="text-2xl font-bold text-red-600">{offlineDevices.length}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map and Device List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <Card className="lg:col-span-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <MapPin className="h-5 w-5" />
              Fleet Map
            </CardTitle>
            <CardDescription>
              Real-time device locations and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleMap
              devices={filteredDevices}
              selectedDevice={selectedDevice}
              onDeviceSelect={setSelectedDevice}
              center={{ lat: centerLat, lng: centerLon }}
              zoom={12}
              height="400px"
            />
          </CardContent>
        </Card>

        {/* Device List */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Activity className="h-5 w-5" />
              Device List
            </CardTitle>
            <CardDescription>
              Click on map markers or list items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search devices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="low_battery">Low Battery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Device List */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredDevices.map((device) => (
                  <div
                    key={device.deviceId}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedDevice?.deviceId === device.deviceId
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(device)}
                          <span className="font-medium text-sm">{device.deviceName}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{device.deviceId}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Battery className="h-3 w-3" />
                            {device.batteryLevel}%
                          </div>
                          <div className="flex items-center gap-1">
                            <Wifi className="h-3 w-3" />
                            {device.networkStatus.type}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Device Details */}
      {selectedDevice && (
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Smartphone className="h-5 w-5" />
              Device Details: {selectedDevice.deviceName}
            </CardTitle>
            <CardDescription>
              Detailed information for the selected device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Status</h4>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedDevice)}
                  <span className="text-sm capitalize">{selectedDevice.status}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Battery</h4>
                <div className="flex items-center gap-2">
                  <Battery className="h-4 w-4" />
                  <span className="text-sm">{selectedDevice.batteryLevel}%</span>
                  {selectedDevice.charging && <span className="text-green-500">⚡</span>}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Network</h4>
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm capitalize">{selectedDevice.networkStatus.type}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Uptime</h4>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{selectedDevice.uptime || 0}h</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Location</h4>
                <div className="text-sm text-muted-foreground">
                  <div>Lat: {selectedDevice.location.latitude.toFixed(6)}</div>
                  <div>Lon: {selectedDevice.location.longitude.toFixed(6)}</div>
                  <div>Accuracy: {selectedDevice.location.accuracy.toFixed(1)}m</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Last Seen</h4>
                <div className="text-sm text-muted-foreground">
                  {new Date(selectedDevice.lastSeen).toLocaleString()}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Platform</h4>
                <div className="text-sm text-muted-foreground">
                  <div>{selectedDevice.platform}</div>
                  <div>{selectedDevice.model}</div>
                  <div>OS: {selectedDevice.osVersion}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">App Version</h4>
                <div className="text-sm text-muted-foreground">
                  {selectedDevice.appVersion}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


