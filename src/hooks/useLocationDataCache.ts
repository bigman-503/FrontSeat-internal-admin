import { useState, useEffect, useCallback, useMemo } from 'react';

interface LocationData {
  locations: any[];
  totalPoints: number;
  dateRange: {
    start: string;
    end: string;
  };
}

interface CacheEntry {
  data: LocationData;
  timestamp: number;
  expiresAt: number;
}

interface LocationDataCache {
  [key: string]: CacheEntry;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Maximum number of cached entries

export function useLocationDataCache() {
  const [cache, setCache] = useState<LocationDataCache>({});
  const [loading, setLoading] = useState<Set<string>>(new Set());

  // Generate cache key from parameters
  const getCacheKey = useCallback((deviceId: string, timeRange: string, selectedDate?: string) => {
    return `${deviceId}-${timeRange}-${selectedDate || 'all'}`;
  }, []);

  // Check if cache entry is valid
  const isCacheValid = useCallback((entry: CacheEntry) => {
    return Date.now() < entry.expiresAt;
  }, []);

  // Clean up expired entries
  const cleanupCache = useCallback(() => {
    setCache(prevCache => {
      const now = Date.now();
      const cleaned = Object.fromEntries(
        Object.entries(prevCache).filter(([_, entry]) => now < entry.expiresAt)
      );
      
      // If still too many entries, remove oldest ones
      if (Object.keys(cleaned).length > MAX_CACHE_SIZE) {
        const sorted = Object.entries(cleaned).sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toKeep = sorted.slice(-MAX_CACHE_SIZE);
        return Object.fromEntries(toKeep);
      }
      
      return cleaned;
    });
  }, []);

  // Fetch data with caching
  const fetchData = useCallback(async (
    deviceId: string, 
    timeRange: string, 
    selectedDate?: string
  ): Promise<LocationData | null> => {
    const cacheKey = getCacheKey(deviceId, timeRange, selectedDate);
    
    // Check if already loading
    if (loading.has(cacheKey)) {
      console.log('🔄 Data already loading for:', cacheKey);
      return null;
    }

    // Check cache first
    const cachedEntry = cache[cacheKey];
    if (cachedEntry && isCacheValid(cachedEntry)) {
      console.log('✅ Using cached data for:', cacheKey);
      return cachedEntry.data;
    }

    // Set loading state
    setLoading(prev => new Set(prev).add(cacheKey));

    try {
      console.log('🌐 Fetching fresh data for:', cacheKey);
      
      // Build URL
      let url = `/api/analytics/device/${deviceId}/locations?deviceId=${deviceId}&timeRange=${timeRange}`;
      if (selectedDate) {
        url += `&selectedDate=${selectedDate}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch location data: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the data
      const now = Date.now();
      setCache(prevCache => ({
        ...prevCache,
        [cacheKey]: {
          data,
          timestamp: now,
          expiresAt: now + CACHE_DURATION
        }
      }));

      console.log('💾 Data cached for:', cacheKey);
      return data;
    } catch (error) {
      console.error('❌ Error fetching location data:', error);
      throw error;
    } finally {
      setLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(cacheKey);
        return newSet;
      });
    }
  }, [cache, loading, getCacheKey, isCacheValid]);

  // Get cached data without fetching
  const getCachedData = useCallback((deviceId: string, timeRange: string, selectedDate?: string) => {
    const cacheKey = getCacheKey(deviceId, timeRange, selectedDate);
    const cachedEntry = cache[cacheKey];
    
    if (cachedEntry && isCacheValid(cachedEntry)) {
      return cachedEntry.data;
    }
    
    return null;
  }, [cache, getCacheKey, isCacheValid]);

  // Prefetch data for adjacent days
  const prefetchAdjacentDays = useCallback(async (
    deviceId: string, 
    timeRange: string, 
    currentDate: string
  ) => {
    if (timeRange !== '7d') return;

    const current = new Date(currentDate);
    const dates = [
      new Date(current.getTime() - 24 * 60 * 60 * 1000), // Previous day
      new Date(current.getTime() + 24 * 60 * 60 * 1000), // Next day
    ];

    for (const date of dates) {
      const dateStr = date.toISOString().split('T')[0];
      const cacheKey = getCacheKey(deviceId, timeRange, dateStr);
      
      // Only prefetch if not already cached or loading
      if (!cache[cacheKey] && !loading.has(cacheKey)) {
        console.log('🔮 Prefetching data for:', dateStr);
        fetchData(deviceId, timeRange, dateStr).catch(console.error);
      }
    }
  }, [cache, loading, getCacheKey, fetchData]);

  // Cleanup expired entries periodically
  useEffect(() => {
    const interval = setInterval(cleanupCache, 60000); // Clean up every minute
    return () => clearInterval(interval);
  }, [cleanupCache]);

  return {
    fetchData,
    getCachedData,
    prefetchAdjacentDays,
    isLoading: (deviceId: string, timeRange: string, selectedDate?: string) => {
      const cacheKey = getCacheKey(deviceId, timeRange, selectedDate);
      return loading.has(cacheKey);
    },
    cacheStats: {
      size: Object.keys(cache).length,
      maxSize: MAX_CACHE_SIZE,
      duration: CACHE_DURATION
    }
  };
}
