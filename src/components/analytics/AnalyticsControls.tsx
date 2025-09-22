import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { TIME_RANGES } from '@/types/chart';

interface AnalyticsControlsProps {
  timeRange: string;
  onTimeRangeChange: (timeRange: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onScrollLeft: () => void;
  onScrollRight: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  loading: boolean;
}

export function AnalyticsControls({
  timeRange,
  onTimeRangeChange,
  onZoomIn,
  onZoomOut,
  onReset,
  onScrollLeft,
  onScrollRight,
  canZoomIn,
  canZoomOut,
  canScrollLeft,
  canScrollRight,
  loading
}: AnalyticsControlsProps) {
  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Time Range:</span>
            <Select value={timeRange} onValueChange={onTimeRangeChange} disabled={loading}>
              <SelectTrigger className="w-[160px]">
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
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomOut}
              disabled={!canZoomOut || loading}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomIn}
              disabled={!canZoomIn || loading}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Scroll Controls */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onScrollLeft}
              disabled={!canScrollLeft || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onScrollRight}
              disabled={!canScrollRight || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
