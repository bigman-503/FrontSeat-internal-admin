import { useState, useCallback, useMemo } from 'react';

export interface AdvancedChartControls {
  timeRange: string;
  zoomLevel: number;
  scrollPosition: number;
  selectedDate?: string;
  viewMode: 'overview' | 'day' | 'week' | 'month';
}

export interface AdvancedChartControlsReturn {
  controls: AdvancedChartControls;
  setTimeRange: (timeRange: string) => void;
  setZoomLevel: (level: number) => void;
  setScrollPosition: (position: number) => void;
  setSelectedDate: (date: string | undefined) => void;
  setViewMode: (mode: 'overview' | 'day' | 'week' | 'month') => void;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  scrollLeft: () => void;
  scrollRight: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  getMaxScrollPosition: () => number;
}

const MAX_ZOOM_LEVEL = 5;
const MIN_ZOOM_LEVEL = 1;
const SCROLL_STEP = 0.1;

export function useAdvancedChartControls(): AdvancedChartControlsReturn {
  const [controls, setControls] = useState<AdvancedChartControls>({
    timeRange: '24h',
    zoomLevel: 1,
    scrollPosition: 0,
    selectedDate: undefined,
    viewMode: 'overview'
  });

  const setTimeRange = useCallback((timeRange: string) => {
    setControls(prev => ({
      ...prev,
      timeRange,
      zoomLevel: 1,
      scrollPosition: 0,
      selectedDate: undefined,
      viewMode: 'overview'
    }));
  }, []);

  const setZoomLevel = useCallback((level: number) => {
    setControls(prev => ({
      ...prev,
      zoomLevel: Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, level))
    }));
  }, []);

  const setScrollPosition = useCallback((position: number) => {
    setControls(prev => ({
      ...prev,
      scrollPosition: Math.max(0, Math.min(1, position))
    }));
  }, []);

  const setSelectedDate = useCallback((date: string | undefined) => {
    setControls(prev => ({
      ...prev,
      selectedDate: date
      // Don't change viewMode or zoomLevel when selecting a day
    }));
  }, []);

  const setViewMode = useCallback((mode: 'overview' | 'day' | 'week' | 'month') => {
    setControls(prev => ({
      ...prev,
      viewMode: mode,
      zoomLevel: mode === 'day' ? 3 : mode === 'week' ? 2 : 1,
      scrollPosition: 0
    }));
  }, []);

  const zoomIn = useCallback(() => {
    setControls(prev => ({
      ...prev,
      zoomLevel: Math.min(MAX_ZOOM_LEVEL, prev.zoomLevel + 1)
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setControls(prev => ({
      ...prev,
      zoomLevel: Math.max(MIN_ZOOM_LEVEL, prev.zoomLevel - 1)
    }));
  }, []);

  const reset = useCallback(() => {
    setControls(prev => ({
      ...prev,
      zoomLevel: 1,
      scrollPosition: 0,
      selectedDate: undefined,
      viewMode: 'overview'
    }));
  }, []);

  const scrollLeft = useCallback(() => {
    setControls(prev => ({
      ...prev,
      scrollPosition: Math.max(0, prev.scrollPosition - SCROLL_STEP)
    }));
  }, []);

  const scrollRight = useCallback(() => {
    setControls(prev => ({
      ...prev,
      scrollPosition: Math.min(1, prev.scrollPosition + SCROLL_STEP)
    }));
  }, []);

  const canZoomIn = useMemo(() => controls.zoomLevel < MAX_ZOOM_LEVEL, [controls.zoomLevel]);
  const canZoomOut = useMemo(() => controls.zoomLevel > MIN_ZOOM_LEVEL, [controls.zoomLevel]);
  const canScrollLeft = useMemo(() => controls.scrollPosition > 0, [controls.scrollPosition]);
  const canScrollRight = useMemo(() => controls.scrollPosition < 1, [controls.scrollPosition]);

  const getMaxScrollPosition = useCallback(() => {
    // Calculate max scroll position based on zoom level and data
    return Math.max(0, 1 - (1 / controls.zoomLevel));
  }, [controls.zoomLevel]);

  return {
    controls,
    setTimeRange,
    setZoomLevel,
    setScrollPosition,
    setSelectedDate,
    setViewMode,
    zoomIn,
    zoomOut,
    reset,
    scrollLeft,
    scrollRight,
    canZoomIn,
    canZoomOut,
    canScrollLeft,
    canScrollRight,
    getMaxScrollPosition
  };
}
