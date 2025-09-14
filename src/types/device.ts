export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface NetworkStatus {
  connected: boolean;
  signalStrength?: number;
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  online: boolean;
}

export interface ScreenStatus {
  isScreenOn: boolean;
  currentApp: string;
  appPackageName: string;
}

export interface Device {
  deviceId: string;
  deviceName: string;
  platform: 'android' | 'ios' | 'windows' | 'linux' | 'unknown';
  model: string;
  osVersion: string;
  appVersion: string;
  batteryLevel: number;
  charging: boolean;
  location: DeviceLocation;
  networkStatus: NetworkStatus;
  online: boolean;
  storageUsage: number;
  timestamp: string;
  uptime: number;
  screenStatus: ScreenStatus;
  memoryUsage: number;
  heartbeatCount: number;
  lastSeen: string;
  status: 'online' | 'offline' | 'low_battery' | 'error' | 'maintenance';
  carId?: string;
  driverId?: string;
  lastMaintenance?: string;
}

export interface FleetMetrics {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  lowBatteryDevices: number;
  averageBatteryLevel: number;
  devicesNeedingMaintenance: number;
  averageUptime: number;
  lastUpdated: string;
}

export interface DeviceStatusFilter {
  status?: Device['status'];
  platform?: Device['platform'];
  batteryLevel?: {
    min?: number;
    max?: number;
  };
  isOnline?: boolean;
  isCharging?: boolean;
}


