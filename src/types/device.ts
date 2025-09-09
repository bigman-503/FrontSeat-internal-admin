export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface NetworkStatus {
  connected: boolean;
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  signalStrength?: number;
}

export interface Device {
  deviceId: string;
  deviceName: string;
  platform: 'android' | 'ios' | 'windows' | 'linux' | 'unknown';
  model: string;
  osVersion: string;
  appVersion: string;
  batteryLevel: number;
  isCharging: boolean;
  location: DeviceLocation;
  networkStatus: NetworkStatus;
  isOnline: boolean;
  lastSeen: string;
  timestamp: string;
  status: 'online' | 'offline' | 'low_battery' | 'error' | 'maintenance';
  carId?: string;
  driverId?: string;
  lastMaintenance?: string;
  uptime?: number; // in hours
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


