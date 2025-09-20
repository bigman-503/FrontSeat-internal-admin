import { useState, useEffect, useCallback } from 'react';
import { ChartControls } from '@/types/analytics';
import { getTodayPST } from '@/lib/dateUtils';

export const useChartControls = () => {
  const today = getTodayPST();
  
  const [controls, setControls] = useState<ChartControls>({
    timeRange: '24h',
    customStartDate: today,
    customEndDate: today,
    useCustomRange: false,
    zoomLevel: 1,
    timeInterval: 15,
    scrollPosition: 0,
    canScrollLeft: false,
    canScrollRight: false
  });

  const setTimeRange = useCallback((timeRange: string) => {
    setControls(prev => ({ 
      ...prev, 
      timeRange,
      useCustomRange: timeRange === 'custom'
    }));
  }, []);

  const setCustomDates = useCallback((startDate: string, endDate: string) => {
    setControls(prev => ({ 
      ...prev, 
      customStartDate: startDate,
      customEndDate: endDate
    }));
  }, []);

  const setUseCustomRange = useCallback((useCustomRange: boolean) => {
    setControls(prev => ({ ...prev, useCustomRange }));
  }, []);

  const setZoomLevel = useCallback((zoomLevel: number) => {
    setControls(prev => ({ 
      ...prev, 
      zoomLevel: Math.max(1, Math.min(10, zoomLevel))
    }));
  }, []);

  const setTimeInterval = useCallback((timeInterval: number) => {
    setControls(prev => ({ ...prev, timeInterval }));
  }, []);

  const setScrollPosition = useCallback((scrollPosition: number) => {
    setControls(prev => ({ ...prev, scrollPosition }));
  }, []);

  const scrollLeft = useCallback(() => {
    setControls(prev => {
      if (prev.scrollPosition > 0) {
        const newPosition = Math.max(0, prev.scrollPosition - 100);
        return { ...prev, scrollPosition: newPosition };
      }
      return prev;
    });
  }, []);

  const scrollRight = useCallback((maxScroll: number) => {
    setControls(prev => {
      if (prev.scrollPosition < maxScroll) {
        const newPosition = Math.min(maxScroll, prev.scrollPosition + 100);
        return { ...prev, scrollPosition: newPosition };
      }
      return prev;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setControls(prev => ({ 
      ...prev, 
      zoomLevel: 1,
      scrollPosition: 0
    }));
  }, []);

  const resetScroll = useCallback(() => {
    setControls(prev => ({ ...prev, scrollPosition: 0 }));
  }, []);

  // Update scroll button states
  useEffect(() => {
    const maxScroll = Math.max(0, (controls.scrollPosition - 20) * 20);
    setControls(prev => ({
      ...prev,
      canScrollLeft: prev.scrollPosition > 0,
      canScrollRight: prev.scrollPosition < maxScroll
    }));
  }, [controls.scrollPosition]);

  return {
    controls,
    setTimeRange,
    setCustomDates,
    setUseCustomRange,
    setZoomLevel,
    setTimeInterval,
    setScrollPosition,
    scrollLeft,
    scrollRight,
    resetZoom,
    resetScroll
  };
};
