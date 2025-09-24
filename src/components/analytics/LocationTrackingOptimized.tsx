import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Route, Navigation, Calendar, Clock, Activity } from 'lucide-react';
import { formatDateTimePST } from '@/lib/dateUtils';
import { WeekLocationChart } from './WeekLocationChart';
import { useLocationDataCache } from '@/hooks/useLocationDataCache';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  battery_level?: number;
}

interface LocationTrackingOptimizedProps {
  device: any;
  timeRange: string;
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
}

export function LocationTrackingOptimized({ 
  device, 
  timeRange, 
  selectedDate, 
  onDateSelect 
}: LocationTrackingOptimizedProps) {
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Use optimized hooks
  const { fetchData, getCachedData, prefetchAdjacentDays, isLoading } = useLocationDataCache();
  const { 
    isLoaded: mapsLoaded, 
    isLoading: mapsLoading, 
    error: mapsError,
    mapRef,
    initializeMaps,
    createMap,
    clearMap,
    addMarkers,
    addRoute,
    calculateDistance
  } = useGoogleMaps();

  // Memoized filtered data
  const filteredLocationData = useMemo(() => {
    if (!selectedDate || timeRange === '24h') {
      return locationData;
    }

    const selectedDateObj = new Date(selectedDate + 'T00:00:00-07:00');
    const nextDayObj = new Date(selectedDateObj);
    nextDayObj.setDate(nextDayObj.getDate() + 1);

    return locationData.filter(location => {
      const locationDate = new Date(location.timestamp);
      return locationDate >= selectedDateObj && locationDate < nextDayObj;
    });
  }, [locationData, selectedDate, timeRange]);

  // Memoized statistics
  const stats = useMemo(() => {
    const data = filteredLocationData;
    if (data.length === 0) {
      return {
        totalPoints: 0,
        totalDistance: 0,
        avgAccuracy: 0,
        timeSpan: 0
      };
    }

    const totalDistance = mapsLoaded ? calculateDistance(data) : data.length * 0.1;
    const avgAccuracy = data.reduce((sum, loc) => sum + (loc.accuracy || 0), 0) / data.length;
    
    const firstTime = new Date(data[0].timestamp).getTime();
    const lastTime = new Date(data[data.length - 1].timestamp).getTime();
    const timeSpan = (lastTime - firstTime) / (1000 * 60 * 60); // hours

    return {
      totalPoints: data.length,
      totalDistance,
      avgAccuracy,
      timeSpan
    };
  }, [filteredLocationData, mapsLoaded, calculateDistance]);

  // Load data with caching
  const loadLocationData = useCallback(async () => {
    if (!device?.deviceId) return;

    try {
      setError(null);
      
      // Check cache first
      const cachedData = getCachedData(device.deviceId, timeRange, selectedDate);
      if (cachedData) {
        console.log('✅ Using cached location data');
        setLocationData(cachedData.locations || []);
        return;
      }

      // Fetch fresh data
      const data = await fetchData(device.deviceId, timeRange, selectedDate);
      if (data) {
        setLocationData(data.locations || []);
        
        // Prefetch adjacent days for 7d view
        if (timeRange === '7d' && selectedDate) {
          prefetchAdjacentDays(device.deviceId, timeRange, selectedDate);
        }
      }
    } catch (err) {
      console.error('Error loading location data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load location data');
    }
  }, [device?.deviceId, timeRange, selectedDate]);

  // Initialize maps on mount
  useEffect(() => {
    initializeMaps();
  }, [initializeMaps]);

  // Load data when parameters change
  useEffect(() => {
    loadLocationData();
  }, [loadLocationData]);

  // Update map when data changes
  useEffect(() => {
    if (mapsLoaded && filteredLocationData.length > 0) {
      clearMap();
      
      const center = {
        lat: filteredLocationData[0].latitude,
        lng: filteredLocationData[0].longitude
      };
      
      createMap(center);
      addMarkers(filteredLocationData, (location) => {
        console.log('📍 Marker clicked:', location);
      });
      addRoute(filteredLocationData);
    }
  }, [mapsLoaded, filteredLocationData, clearMap, createMap, addMarkers, addRoute]);

  // Memoized render functions
  const renderLoadingState = useCallback(() => (
    <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading location data...</p>
      </div>
    </div>
  ), []);

  const renderErrorState = useCallback(() => (
    <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg">
      <div className="text-center">
        <div className="text-red-500 mb-4">
          <MapPin className="h-12 w-12 mx-auto" />
        </div>
        <p className="text-red-600 font-medium">Failed to load location data</p>
        <p className="text-red-500 text-sm mt-2">{error}</p>
      </div>
    </div>
  ), [error]);

  const renderMapView = useCallback(() => (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Location Points</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Route className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Distance</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalDistance.toFixed(1)} km</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Accuracy</p>
                <p className="text-2xl font-bold text-purple-600">{stats.avgAccuracy.toFixed(0)}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Time Span</p>
                <p className="text-2xl font-bold text-orange-600">{stats.timeSpan.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Route Map - {timeRange === '24h' ? 'Last 24 hours' : 
                        timeRange === '7d' ? 'Last 7 days' : 
                        timeRange === '30d' ? 'Last 30 days' : timeRange}
            {selectedDate && ` (${selectedDate})`}
          </CardTitle>
          <CardDescription>
            Showing {filteredLocationData.length} location points
            {selectedDate && ` for ${selectedDate}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {mapsLoading ? (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            ) : mapsError ? (
              <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg">
                <div className="text-center">
                  <p className="text-red-600">Failed to load map: {mapsError}</p>
                </div>
              </div>
            ) : (
              <div 
                ref={mapRef} 
                className="w-full h-96 rounded-lg border border-gray-200"
                style={{ minHeight: '400px' }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location History */}
      {filteredLocationData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Location History ({filteredLocationData.length} points)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2 bg-gray-50">
              {filteredLocationData.map((location, index) => (
                <div key={index} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    <span className="font-mono text-gray-700">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </span>
                  </div>
                  <div className="text-gray-500 text-right">
                    {formatDateTimePST(new Date(location.timestamp))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  ), [stats, timeRange, selectedDate, filteredLocationData, mapsLoading, mapsError, mapRef]);

  // Determine what to render
  if (error) {
    return renderErrorState();
  }

  if (isLoading(device?.deviceId, timeRange, selectedDate) || locationData.length === 0) {
    return renderLoadingState();
  }

  // Week overview
  if (timeRange === '7d' && !selectedDate) {
    return (
      <div className="space-y-4">
        <WeekLocationChart 
          device={device}
          onDayClick={onDateSelect}
          selectedDate={selectedDate}
        />
      </div>
    );
  }

  // Day detail view
  if (timeRange === '7d' && selectedDate) {
    return (
      <div className="space-y-4">
        <WeekLocationChart 
          device={device}
          onDayClick={onDateSelect}
          selectedDate={selectedDate}
        />
        {renderMapView()}
      </div>
    );
  }

  // Main map view (24h, 30d)
  return renderMapView();
}
