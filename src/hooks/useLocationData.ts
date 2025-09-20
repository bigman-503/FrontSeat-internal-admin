import { useMemo } from 'react';
import { HeartbeatData, LocationDataPoint } from '@/types/analytics';
import { processLocationData } from '@/utils/analytics/dataProcessors';

interface UseLocationDataProps {
  heartbeatData: HeartbeatData[];
  zoomLevel: number;
}

export const useLocationData = ({ heartbeatData, zoomLevel }: UseLocationDataProps) => {
  // Process raw location data
  const processLocationDataRaw = useMemo(() => {
    return processLocationData(heartbeatData);
  }, [heartbeatData]);

  // Apply zoom to location data
  const processLocationDataWithZoom = useMemo(() => {
    if (zoomLevel === 1) return processLocationDataRaw;
    
    // Apply zoom by showing only a subset of data
    const totalPoints = processLocationDataRaw.length;
    const visiblePoints = Math.max(5, Math.floor(totalPoints / zoomLevel));
    const startIndex = Math.floor((totalPoints - visiblePoints) / 2);
    
    return processLocationDataRaw.slice(startIndex, startIndex + visiblePoints);
  }, [processLocationDataRaw, zoomLevel]);

  return {
    locationData: processLocationDataRaw,
    locationDataWithZoom: processLocationDataWithZoom
  };
};
