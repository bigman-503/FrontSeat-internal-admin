import { formatDatePST, getCurrentTimePST } from '@/lib/dateUtils';
import { UptimeDataPoint, LocationDataPoint } from '@/types/analytics';
import { ChartTooltipFormatter, ChartLabelFormatter } from '@/types/chart';

/**
 * Format tooltip for uptime chart
 */
export const formatUptimeTooltip: ChartTooltipFormatter = (value, name, props) => {
  const data = (props as any).payload?.[0];
  
  if (!data) {
    // No data for this time point - device was offline
    const status = '🔴 Offline';
    const battery = 'Battery: N/A';
    const heartbeats = 'Heartbeats: 0';
    const cpuUsage = 'CPU: N/A';
    
    const tooltipText = `${status}\n${battery}\n${cpuUsage}\n${heartbeats}`.replace(/\n\n+/g, '\n').trim();
    
    return [tooltipText, 'Status'];
  }
  
  const status = value === 1 ? '🟢 Online' : '🔴 Offline';
  const battery = data.batteryLevel ? `Battery: ${data.batteryLevel.toFixed(1)}%` : 'Battery: N/A';
  const heartbeats = data.heartbeatCount ? `Heartbeats: ${data.heartbeatCount}` : 'Heartbeats: 0';
  const cpuUsage = data.cpuUsage ? `CPU: ${data.cpuUsage.toFixed(1)}%` : 'CPU: N/A';
  
  const tooltipText = `${status}\n${battery}\n${cpuUsage}\n${heartbeats}`.replace(/\n\n+/g, '\n').trim();
  
  return [tooltipText, 'Status'];
};

/**
 * Format label for uptime chart tooltip
 */
export const formatUptimeTooltipLabel: ChartLabelFormatter = (value, props) => {
  const data = (props as any).payload?.[0];
  
  if (data && data.time) {
    const date = new Date(data.time);
    return `${formatDatePST(date)} at ${data.displayTime}`;
  } else {
    // Fallback: use the current date and the hovered time
    const today = getCurrentTimePST();
    return `${formatDatePST(today)} at ${value}`;
  }
};

/**
 * Format tooltip for location chart
 */
export const formatLocationTooltip: ChartTooltipFormatter = (value, name, props) => {
  const data = (props as any).payload?.[0];
  if (!data) return ['', ''];
  return [
    `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`,
    'Coordinates'
  ];
};

/**
 * Format label for location chart tooltip
 */
export const formatLocationTooltipLabel: ChartLabelFormatter = (value, props) => {
  const data = (props as any).payload?.[0];
  if (!data || !data.timestamp) return 'Time: N/A';
  return `Time: ${formatDatePST(data.timestamp)}`;
};

/**
 * Format X-axis tick for uptime chart
 */
export const formatUptimeXAxisTick = (
  value: string,
  index: number,
  timeRange: string,
  totalTicks: number
): string => {
  // For 24h view, show every hour (every 4th tick for 15min intervals)
  if (timeRange === '24h') {
    return index % 4 === 0 ? value : '';
  }
  // For other views, show every 2nd or 3rd tick to reduce clutter
  const showEvery = Math.max(1, Math.floor(totalTicks / 8));
  return index % showEvery === 0 ? value : '';
};

/**
 * Format Y-axis tick for uptime chart
 */
export const formatUptimeYAxisTick = (value: number): string => {
  return value === 1 ? '🟢 Online' : '🔴 Offline';
};

/**
 * Generate CSV export data
 */
export const generateCSVData = (uptimeData: UptimeDataPoint[]): string => {
  const csvData = uptimeData.map(point => ({
    time: point.displayTime,
    status: point.isOnline === 1 ? 'Online' : 'Offline',
    battery: point.batteryLevel,
    cpu: point.cpuUsage,
    heartbeats: point.heartbeatCount
  }));
  
  const csvContent = [
    'Time,Status,Battery Level,CPU Usage,Heartbeats',
    ...csvData.map(row => `${row.time},${row.status},${row.battery},${row.cpu},${row.heartbeats}`)
  ].join('\n');
  
  return csvContent;
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Calculate zoom window for chart
 */
export const calculateZoomWindow = (
  clickedIndex: number,
  totalPoints: number,
  zoomFactor: number = 4
): { start: number; end: number } => {
  const zoomWindow = Math.floor(totalPoints / zoomFactor);
  const start = Math.max(0, clickedIndex - Math.floor(zoomWindow / 2));
  const end = Math.min(totalPoints, start + zoomWindow);
  
  return { start, end };
};

/**
 * Calculate scroll position limits
 */
export const calculateScrollLimits = (
  dataLength: number,
  visiblePoints: number = 20,
  pointWidth: number = 20
): { maxScroll: number; progress: number } => {
  const maxScroll = Math.max(0, (dataLength - visiblePoints) * pointWidth);
  return { maxScroll, progress: 0 };
};
