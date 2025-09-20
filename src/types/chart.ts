import { ReactNode } from 'react';

export interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export interface ChartTooltipFormatter {
  (value: any, name: string, props: any): [string, string];
}

export interface ChartLabelFormatter {
  (value: string, props: any): string;
}

export interface ChartDotProps {
  cx?: number;
  cy?: number;
  payload?: any;
  index?: number;
}

export interface ChartConfig {
  responsive: boolean;
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
    grid: string;
  };
  stroke: {
    width: number;
    dashArray: string;
  };
  dots: {
    radius: number;
    strokeWidth: number;
  };
}

export interface ZoomControls {
  level: number;
  maxLevel: number;
  minLevel: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  canReset: boolean;
}

export interface ScrollControls {
  position: number;
  maxPosition: number;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  progress: number;
}

export interface TimeInterval {
  value: number;
  label: string;
  minutes: number;
}

export const TIME_INTERVALS: TimeInterval[] = [
  { value: 5, label: '5 minutes', minutes: 5 },
  { value: 15, label: '15 minutes', minutes: 15 },
  { value: 30, label: '30 minutes', minutes: 30 },
  { value: 60, label: '1 hour', minutes: 60 },
  { value: 120, label: '2 hours', minutes: 120 },
];

export interface TimeRange {
  value: string;
  label: string;
  days?: number;
  hours?: number;
}

export const TIME_RANGES: TimeRange[] = [
  { value: '24h', label: 'Last 24 hours', hours: 24 },
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
  { value: '1y', label: 'Last year', days: 365 },
];
