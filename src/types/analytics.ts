export interface UptimeDataPoint {
  time: string;
  displayTime: string;
  isOnline: number;
  prevIsOnline: number | null;
  batteryLevel: number;
  cpuUsage: number;
  heartbeatCount: number;
}

export interface LocationDataPoint {
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  batteryLevel: number;
  sequence: number;
}

export interface UptimeStats {
  totalUptime: number;
  uptimePercentage: number;
  totalSessions: number;
  averageSessionLength: number;
  longestSession: number;
  longestOffline: number;
  firstOnline: string | null;
  lastOnline: string | null;
}

export interface DevicePatterns {
  mostActiveHour: string | null;
  leastActiveHour: string | null;
  averageSessionLength: number;
  offlineFrequency: number;
  reliabilityScore: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ChartControls {
  timeRange: string;
  customStartDate: string;
  customEndDate: string;
  useCustomRange: boolean;
  zoomLevel: number;
  timeInterval: number;
  scrollPosition: number;
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

export interface HeartbeatData {
  last_seen: string | { value: string };
  latitude?: number;
  longitude?: number;
  battery_level?: number;
  cpu_usage?: number;
  location_accuracy?: number;
}

export interface AnalyticsState {
  analyticsData: any | null;
  heartbeatData: HeartbeatData[];
  loading: boolean;
  error: string | null;
  isExporting: boolean;
}

export interface ChartConfig {
  width: string;
  height: string;
  margin: {
    top: number;
    right: number;
    left: number;
    bottom: number;
  };
  colors: {
    online: string;
    offline: string;
    primary: string;
    secondary: string;
  };
}

export interface ExportData {
  time: string;
  status: string;
  battery: number;
  cpu: number;
  heartbeats: number;
}
