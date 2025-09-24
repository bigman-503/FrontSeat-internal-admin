import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Route, Navigation, Calendar, Clock, Activity } from 'lucide-react';
import { formatDateTimePST } from '@/lib/dateUtils';
import { WeekLocationChart } from './WeekLocationChart';
import { MonthLocationChart } from './MonthLocationChart';
import { useLocationDataCache } from '@/hooks/useLocationDataCache';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  battery_level?: number;
}

interface LocationTrackingFixedProps {
  device: any;
  timeRange: string;
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
}

export function LocationTrackingFixed({ 
  device, 
  timeRange, 
  selectedDate, 
  onDateSelect 
}: LocationTrackingFixedProps) {
  // Reduced logging for production performance
  // console.log('🎯 LocationTrackingFixed render:', {
  //   timeRange,
  //   selectedDate,
  //   hasOnDateSelect: !!onDateSelect,
  //   deviceId: device?.deviceId
  // });
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Month navigation state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Month navigation functions
  const handlePreviousMonth = React.useCallback(() => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  }, []);

  const handleNextMonth = React.useCallback(() => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  }, []);
  
  // Use optimized hooks
  const { fetchData, getCachedData, prefetchAdjacentDays } = useLocationDataCache();
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

  // Helper functions to work directly with map instance
  const addMarkersToMap = (mapInstance: google.maps.Map, locations: LocationData[]) => {
    console.log('📍 addMarkersToMap called:', { hasMap: !!mapInstance, locationCount: locations.length });
    
    if (!mapInstance) {
      console.log('❌ Map instance not available');
      return;
    }

    locations.forEach((location, index) => {
      try {
        let marker;
        
        // Try to use AdvancedMarkerElement if available, otherwise fall back to Marker
        if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
          marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat: location.latitude, lng: location.longitude },
            map: mapInstance,
            title: `Location ${index + 1}`,
            content: document.createElement('div'),
          });
          
          // Set custom marker content
          const markerContent = marker.content as HTMLElement;
          markerContent.innerHTML = `
            <div style="
              width: 24px; 
              height: 24px; 
              background: #3B82F6; 
              border: 2px solid white; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">
              <div style="
                width: 8px; 
                height: 8px; 
                background: white; 
                border-radius: 50%;
              "></div>
            </div>
          `;
        } else {
          // Fallback to regular Marker
          marker = new google.maps.Marker({
            position: { lat: location.latitude, lng: location.longitude },
            map: mapInstance,
            title: `Location ${index + 1}`,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(24, 24),
              anchor: new google.maps.Point(12, 12)
            }
          });
        }

        marker.addListener('click', () => {
          console.log('📍 Marker clicked:', location);
        });

        console.log(`✅ Marker ${index + 1} added at:`, location.latitude, location.longitude);
      } catch (error) {
        console.error(`❌ Error adding marker ${index + 1}:`, error);
      }
    });
    
    console.log(`✅ Added ${locations.length} markers total`);
  };

  const addRouteToMap = (mapInstance: google.maps.Map, locations: LocationData[]) => {
    console.log('🛣️ addRouteToMap called:', { hasMap: !!mapInstance, locationCount: locations.length });
    
    if (!mapInstance || locations.length < 2) {
      console.log('❌ Cannot add route - no map or insufficient locations');
      return;
    }

    try {
      const path = locations.map(loc => ({
        lat: loc.latitude,
        lng: loc.longitude
      }));

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.8,
        strokeWeight: 3
      });

      polyline.setMap(mapInstance);
      console.log('✅ Route polyline added successfully');
    } catch (error) {
      console.error('❌ Error adding route polyline:', error);
    }
  };

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

  // Load data function
  const loadLocationData = async () => {
    if (!device?.deviceId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = getCachedData(device.deviceId, timeRange, selectedDate);
      if (cachedData) {
        console.log('✅ Using cached location data');
        setLocationData(cachedData.locations || []);
        setIsLoading(false);
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
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize maps on mount
  useEffect(() => {
    initializeMaps();
  }, []);

  // Load data when parameters change
  useEffect(() => {
    loadLocationData();
  }, [device?.deviceId, timeRange, selectedDate]);

  // Update map when data changes
  useEffect(() => {
    if (mapsLoaded) {
      clearMap();
      
      // Calculate center from data or use default
      const center = filteredLocationData.length > 0 
        ? {
            lat: filteredLocationData[0].latitude,
            lng: filteredLocationData[0].longitude
          }
        : { lat: 49.2827, lng: -123.1207 }; // Default to Vancouver
      
      console.log('🗺️ Creating map with center:', center, 'data points:', filteredLocationData.length);
      const mapInstance = createMap(center);
      
      if (mapInstance && filteredLocationData.length > 0) {
        // Use the map instance directly instead of waiting for state update
        console.log('📍 Adding markers and route to map instance');
        console.log('📍 Sample location data:', filteredLocationData.slice(0, 3));
        addMarkersToMap(mapInstance, filteredLocationData);
        addRouteToMap(mapInstance, filteredLocationData);
      } else if (mapInstance) {
        console.log('🗺️ Map created but no location data to display');
      }
    }
  }, [mapsLoaded, filteredLocationData]);

  // Render loading state only for data loading, not map loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading location data...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || mapsError) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <MapPin className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-red-600 font-medium">Failed to load location data</p>
          <p className="text-red-500 text-sm mt-2">{error || mapsError}</p>
        </div>
      </div>
    );
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

  // Month overview
  if (timeRange === '30d' && !selectedDate) {
    console.log('📅 Rendering month overview:', {
      deviceId: device?.deviceId,
      currentMonth: currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      hasOnDateSelect: !!onDateSelect,
      selectedDate
    });
    return (
      <div className="space-y-4">
        <MonthLocationChart 
          device={device}
          currentMonth={currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          onDayClick={onDateSelect}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          selectedDate={selectedDate}
        />
      </div>
    );
  }

  // Day detail view for week
  if (timeRange === '7d' && selectedDate) {
    return (
      <div className="space-y-4">
        <WeekLocationChart 
          device={device}
          onDayClick={onDateSelect}
          selectedDate={selectedDate}
        />
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
                {mapsLoading && !mapsLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                )}
                <div 
                  ref={mapRef} 
                  className="w-full h-96 rounded-lg border border-gray-200"
                  style={{ minHeight: '400px' }}
                />
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
      </div>
    );
  }

  // Day detail view for month
  if (timeRange === '30d' && selectedDate) {
    return (
      <div className="space-y-4">
        <MonthLocationChart 
          device={device}
          currentMonth={currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          onDayClick={onDateSelect}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          selectedDate={selectedDate}
        />
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
                {mapsLoading && !mapsLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                )}
                <div 
                  ref={mapRef} 
                  className="w-full h-96 rounded-lg border border-gray-200"
                  style={{ minHeight: '400px' }}
                />
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
      </div>
    );
  }

  // Main map view (24h)
  return (
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
            {mapsLoading && !mapsLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
            <div 
              ref={mapRef} 
              className="w-full h-96 rounded-lg border border-gray-200"
              style={{ minHeight: '400px' }}
            />
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
  );
}
