import { ChartConfig } from '@/types/chart';

/**
 * Default chart configuration
 */
export const DEFAULT_CHART_CONFIG: ChartConfig = {
  responsive: true,
  margin: {
    top: 20,
    right: 30,
    left: 20,
    bottom: 80
  },
  colors: {
    online: '#10b981',
    offline: '#ef4444',
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    grid: '#f0f0f0'
  },
  stroke: {
    width: 6,
    dashArray: '1 3'
  },
  dots: {
    radius: 8,
    strokeWidth: 3
  }
};

/**
 * Uptime chart specific configuration
 */
export const UPTIME_CHART_CONFIG: ChartConfig = {
  ...DEFAULT_CHART_CONFIG,
  margin: {
    top: 20,
    right: 30,
    left: 20,
    bottom: 100
  },
  colors: {
    ...DEFAULT_CHART_CONFIG.colors,
    online: '#10b981',
    offline: '#ef4444'
  }
};

/**
 * Location chart specific configuration
 */
export const LOCATION_CHART_CONFIG: ChartConfig = {
  ...DEFAULT_CHART_CONFIG,
  margin: {
    top: 20,
    right: 30,
    left: 20,
    bottom: 20
  },
  colors: {
    ...DEFAULT_CHART_CONFIG.colors,
    primary: '#8884d8'
  }
};

/**
 * Performance chart specific configuration
 */
export const PERFORMANCE_CHART_CONFIG: ChartConfig = {
  ...DEFAULT_CHART_CONFIG,
  margin: {
    top: 20,
    right: 30,
    left: 20,
    bottom: 40
  }
};

/**
 * Tooltip styling configuration
 */
export const TOOLTIP_STYLES = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  fontSize: '14px',
  padding: '12px'
};

/**
 * Grid styling configuration
 */
export const GRID_STYLES = {
  strokeDasharray: '1 3',
  stroke: '#f0f0f0',
  strokeOpacity: 0.5
};

/**
 * Axis styling configuration
 */
export const AXIS_STYLES = {
  fontSize: 10,
  fill: '#666',
  axisLine: { stroke: '#e0e0e0' },
  tickLine: { stroke: '#e0e0e0' }
};

/**
 * Y-axis specific styling for uptime chart
 */
export const UPTIME_Y_AXIS_STYLES = {
  fontSize: 12,
  fontWeight: 'bold',
  axisLine: { stroke: '#e0e0e0' },
  tickLine: { stroke: '#e0e0e0' }
};
