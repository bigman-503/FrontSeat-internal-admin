import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, RefreshCw, BarChart3, Activity } from 'lucide-react';
import { ChartControls } from '@/types/analytics';
import { TIME_RANGES, TIME_INTERVALS } from '@/types/chart';

interface AnalyticsControlsProps {
  controls: ChartControls;
  onTimeRangeChange: (timeRange: string) => void;
  onCustomDatesChange: (startDate: string, endDate: string) => void;
  onUseCustomRangeChange: (useCustomRange: boolean) => void;
  onTimeIntervalChange: (timeInterval: number) => void;
  onRefresh: () => void;
  onExport: () => void;
  onResetZoom: () => void;
  onScrollLeft: () => void;
  onScrollRight: () => void;
  onZoomChange: (zoomLevel: number) => void;
  loading: boolean;
  dataPointsCount: number;
  totalDataPoints: number;
}

export function AnalyticsControls({
  controls,
  onTimeRangeChange,
  onCustomDatesChange,
  onUseCustomRangeChange,
  onTimeIntervalChange,
  onRefresh,
  onExport,
  onResetZoom,
  onScrollLeft,
  onScrollRight,
  onZoomChange,
  loading,
  dataPointsCount,
  totalDataPoints
}: AnalyticsControlsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={controls.timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
            
          {controls.useCustomRange && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={controls.customStartDate}
                onChange={(e) => onCustomDatesChange(e.target.value, controls.customEndDate)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <span className="text-sm text-gray-500">to</span>
              <input
                type="date"
                value={controls.customEndDate}
                onChange={(e) => onCustomDatesChange(controls.customStartDate, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          )}
        </div>
          
        <div className="flex items-center gap-2">
          <Button 
            variant={controls.useCustomRange ? "default" : "outline"} 
            size="sm"
            onClick={() => onUseCustomRangeChange(!controls.useCustomRange)}
          >
            Custom Range
          </Button>
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
            
          <Button 
            variant="outline" 
            onClick={onExport} 
            disabled={loading || totalDataPoints === 0}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Export CSV'}
          </Button>
            
          <Button 
            variant="outline" 
            onClick={onResetZoom}
            disabled={controls.zoomLevel === 1}
          >
            <Activity className="h-4 w-4 mr-2" />
            Reset View
          </Button>
        </div>
      </div>
      
      {/* Zoom and Time Interval Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Zoom:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onZoomChange(Math.max(1, controls.zoomLevel - 1))}
            disabled={controls.zoomLevel <= 1}
          >
            -
          </Button>
          <span className="text-sm w-8 text-center">{controls.zoomLevel}x</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onZoomChange(Math.min(10, controls.zoomLevel + 1))}
            disabled={controls.zoomLevel >= 10}
          >
            +
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onZoomChange(1)}
          >
            Reset
          </Button>
        </div>
        
        {/* Scroll controls - only show when zoomed in */}
        {controls.zoomLevel > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Scroll:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onScrollLeft}
              disabled={!controls.canScrollLeft}
            >
              ←
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onScrollRight}
              disabled={!controls.canScrollRight}
            >
              →
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {Math.round((controls.scrollPosition / Math.max(1, (dataPointsCount - 20) * 20)) * 100)}%
              </span>
              <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-200"
                  style={{ 
                    width: `${Math.min(100, (controls.scrollPosition / Math.max(1, (dataPointsCount - 20) * 20)) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Time Interval:</span>
          <Select value={controls.timeInterval.toString()} onValueChange={(value) => onTimeIntervalChange(parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_INTERVALS.map(interval => (
                <SelectItem key={interval.value} value={interval.value.toString()}>
                  {interval.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-gray-500">
          Showing {dataPointsCount} of {totalDataPoints} data points
        </div>
      </div>
    </div>
  );
}
