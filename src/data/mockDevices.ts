import { Device, FleetMetrics } from '@/types/device';

export const mockDevices: Device[] = [
  {
    deviceId: "device_1234567890_abc123",
    deviceName: "Tablet 1234567890",
    platform: "android",
    model: "Samsung Galaxy Tab A8",
    osVersion: "Android 11",
    appVersion: "1.0.0",
    batteryLevel: 85,
    isCharging: true,
    location: {
      latitude: 49.2630205,
      longitude: -123.1327271,
      accuracy: 45.664
    },
    networkStatus: {
      connected: true,
      type: "wifi",
      signalStrength: 85
    },
    isOnline: true,
    lastSeen: "2025-01-08T23:49:30.000Z",
    timestamp: "2025-01-08T23:49:30.000Z",
    status: "online",
    carId: "car_001",
    driverId: "driver_001",
    uptime: 120
  },
  {
    deviceId: "device_2345678901_def456",
    deviceName: "Tablet 2345678901",
    platform: "android",
    model: "Samsung Galaxy Tab A8",
    osVersion: "Android 11",
    appVersion: "1.0.0",
    batteryLevel: 23,
    isCharging: false,
    location: {
      latitude: 49.2827291,
      longitude: -123.1207375,
      accuracy: 32.1
    },
    networkStatus: {
      connected: true,
      type: "cellular",
      signalStrength: 65
    },
    isOnline: true,
    lastSeen: "2025-01-08T23:45:15.000Z",
    timestamp: "2025-01-08T23:45:15.000Z",
    status: "low_battery",
    carId: "car_002",
    driverId: "driver_002",
    uptime: 95
  },
  {
    deviceId: "device_3456789012_ghi789",
    deviceName: "Tablet 3456789012",
    platform: "android",
    model: "Samsung Galaxy Tab A8",
    osVersion: "Android 11",
    appVersion: "1.0.0",
    batteryLevel: 0,
    isCharging: false,
    location: {
      latitude: 49.2568,
      longitude: -123.1142,
      accuracy: 50.0
    },
    networkStatus: {
      connected: false,
      type: "unknown"
    },
    isOnline: false,
    lastSeen: "2025-01-08T20:30:00.000Z",
    timestamp: "2025-01-08T20:30:00.000Z",
    status: "offline",
    carId: "car_003",
    driverId: "driver_003",
    uptime: 0
  },
  {
    deviceId: "device_4567890123_jkl012",
    deviceName: "Tablet 4567890123",
    platform: "android",
    model: "Samsung Galaxy Tab A8",
    osVersion: "Android 11",
    appVersion: "1.0.0",
    batteryLevel: 67,
    isCharging: true,
    location: {
      latitude: 49.2747,
      longitude: -123.1213,
      accuracy: 28.5
    },
    networkStatus: {
      connected: true,
      type: "wifi",
      signalStrength: 92
    },
    isOnline: true,
    lastSeen: "2025-01-08T23:50:45.000Z",
    timestamp: "2025-01-08T23:50:45.000Z",
    status: "online",
    carId: "car_004",
    driverId: "driver_004",
    uptime: 150
  },
  {
    deviceId: "device_5678901234_mno345",
    deviceName: "Tablet 5678901234",
    platform: "android",
    model: "Samsung Galaxy Tab A8",
    osVersion: "Android 11",
    appVersion: "1.0.0",
    batteryLevel: 45,
    isCharging: false,
    location: {
      latitude: 49.2611,
      longitude: -123.1139,
      accuracy: 35.2
    },
    networkStatus: {
      connected: true,
      type: "cellular",
      signalStrength: 45
    },
    isOnline: true,
    lastSeen: "2025-01-08T23:48:20.000Z",
    timestamp: "2025-01-08T23:48:20.000Z",
    status: "online",
    carId: "car_005",
    driverId: "driver_005",
    uptime: 88
  },
  {
    deviceId: "device_6789012345_pqr678",
    deviceName: "Tablet 6789012345",
    platform: "android",
    model: "Samsung Galaxy Tab A8",
    osVersion: "Android 11",
    appVersion: "1.0.0",
    batteryLevel: 12,
    isCharging: false,
    location: {
      latitude: 49.2500,
      longitude: -123.1000,
      accuracy: 40.0
    },
    networkStatus: {
      connected: true,
      type: "wifi",
      signalStrength: 78
    },
    isOnline: true,
    lastSeen: "2025-01-08T23:47:10.000Z",
    timestamp: "2025-01-08T23:47:10.000Z",
    status: "low_battery",
    carId: "car_006",
    driverId: "driver_006",
    uptime: 72
  }
];

export const mockFleetMetrics: FleetMetrics = {
  totalDevices: 6,
  onlineDevices: 4,
  offlineDevices: 1,
  lowBatteryDevices: 2,
  averageBatteryLevel: 38.5,
  devicesNeedingMaintenance: 1,
  averageUptime: 87.5,
  lastUpdated: "2025-01-08T23:50:45.000Z"
};


