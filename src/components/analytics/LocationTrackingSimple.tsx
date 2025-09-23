import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Route, Navigation } from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';
import { formatDateTimePST } from '@/lib/dateUtils';
import { WeekLocationChart } from './WeekLocationChart';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  battery_level?: number;
}

interface LocationTrackingSimpleProps {
  device: any;
  timeRange: string;
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
}

export function LocationTrackingSimple({ device, timeRange, selectedDate, onDateSelect }: LocationTrackingSimpleProps) {
  console.log('🎯 LocationTrackingSimple component rendered:', {
    device: device ? { deviceId: device.deviceId, name: device.deviceName } : null,
    timeRange,
    selectedDate,
    hasOnDateSelect: !!onDateSelect
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Filter location data for the selected day
  const getFilteredLocationData = () => {
    if (!selectedDate || timeRange === '24h') {
      return locationData;
    }

    // For day detail view, filter to only show data from the selected date
    const selectedDateObj = new Date(selectedDate + 'T00:00:00-07:00'); // Start of day in Pacific time
    const nextDayObj = new Date(selectedDate + 'T23:59:59.999-07:00'); // End of day in Pacific time

    console.log('🔍 Filtering location data for selected day:', {
      selectedDate,
      selectedDateObj: selectedDateObj.toISOString(),
      nextDayObj: nextDayObj.toISOString(),
      totalLocations: locationData.length
    });

    const filteredData = locationData.filter(location => {
      const locationDate = new Date(location.timestamp);
      const isInRange = locationDate >= selectedDateObj && locationDate <= nextDayObj;
      
      if (isInRange) {
        console.log('✅ Found location for selected day:', {
          timestamp: location.timestamp,
          locationDate: locationDate.toISOString(),
          lat: location.latitude,
          lng: location.longitude
        });
      }
      
      return isInRange;
    });

    console.log('📊 Location filtering result:', {
      originalCount: locationData.length,
      filteredCount: filteredData.length,
      selectedDate
    });

    return filteredData;
  };

  const filteredLocationData = getFilteredLocationData();

  // Fetch location data based on time range
  useEffect(() => {
    console.log('🔍 LocationTrackingSimple useEffect triggered:', {
      deviceId: device?.deviceId,
      timeRange,
      selectedDate,
      hasDevice: !!device
    });

    if (!device?.deviceId) {
      console.log('❌ No device ID, skipping location data fetch');
      return;
    }

    const fetchLocationData = async () => {
      console.log('🚀 Starting location data fetch...');
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          deviceId: device.deviceId,
          timeRange: timeRange
        });

        if (selectedDate) {
          params.append('selectedDate', selectedDate);
        }

        const url = `/api/analytics/device/${device.deviceId}/locations?${params.toString()}`;
        console.log('🗺️ Fetching location data:', {
          deviceId: device.deviceId,
          timeRange,
          selectedDate,
          url,
          params: params.toString()
        });

        const response = await fetch(url);
        console.log('📡 Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch location data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📍 Location data received:', {
          totalLocations: data.locations?.length || 0,
          sampleLocation: data.locations?.[0],
          dateRange: data.dateRange,
          fullResponse: data
        });

        if (data.locations && Array.isArray(data.locations)) {
          setLocationData(data.locations);
          console.log('✅ Location data set successfully');
        } else {
          console.log('⚠️ No location data in response');
          setLocationData([]);
        }
      } catch (err) {
        console.error('❌ Error fetching location data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch location data');
        setLocationData([]);
      } finally {
        setLoading(false);
        console.log('🏁 Location data fetch completed');
      }
    };

    fetchLocationData();
  }, [device?.deviceId, timeRange, selectedDate]);

  // Initialize Google Maps
  useEffect(() => {
    console.log('🗺️ Google Maps useEffect triggered:', {
      hasMapRef: !!mapRef.current,
      locationDataLength: filteredLocationData.length,
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing'
    });

    if (!mapRef.current || filteredLocationData.length === 0) {
      console.log('❌ No map ref, skipping map initialization');
      return;
    }

    const initializeMap = async () => {
      try {
        console.log('🚀 Starting Google Maps loader...');
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['geometry']
        });

        await loader.load();
        console.log('✅ Google Maps API loaded successfully');
        setGoogleMapsLoaded(true);

        // Calculate map center from filtered location data
        const center = filteredLocationData.length > 0 
          ? {
              lat: filteredLocationData.reduce((sum, loc) => sum + loc.latitude, 0) / filteredLocationData.length,
              lng: filteredLocationData.reduce((sum, loc) => sum + loc.longitude, 0) / filteredLocationData.length
            }
          : { lat: 49.2827, lng: -123.1207 }; // Default to Vancouver

        console.log('📍 Map center calculated:', center);

        // Create map instance
        mapInstance.current = new (window as any).google.maps.Map(mapRef.current, {
          center,
          zoom: 15,
          mapId: 'DEMO_MAP_ID'
        });

        console.log('🗺️ Google Map instance created successfully');

        // Create info window
        infoWindowRef.current = new (window as any).google.maps.InfoWindow();
        console.log('💬 Info window created');

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        console.log('🧹 Existing markers cleared');

        // Add markers and route
        console.log('📍 Adding markers and route for', filteredLocationData.length, 'locations');
        await addLocationMarkers();
        await addRoutePolyline();

        console.log('✅ Markers and route added successfully');
      } catch (error) {
        console.error('❌ Error initializing Google Maps:', error);
        setError('Failed to initialize Google Maps');
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up Google Maps...');
      if (markersRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [filteredLocationData, googleMapsLoaded]);

  const addLocationMarkers = async () => {
    if (!mapInstance.current || !filteredLocationData.length) return;

    console.log('📍 Adding location markers:', {
      mapExists: !!mapInstance.current,
      locationsCount: filteredLocationData.length,
      sampleLocation: filteredLocationData[0]
    });

    filteredLocationData.forEach((location, index) => {
      console.log(`📍 Creating marker ${index + 1}:`, {
        lat: location.latitude,
        lng: location.longitude,
        timestamp: location.timestamp
      });

      const marker = new (window as any).google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map: mapInstance.current,
        title: `Location ${index + 1}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="8" fill="${index === 0 ? '#10B981' : index === filteredLocationData.length - 1 ? '#EF4444' : '#3B82F6'}" stroke="white" stroke-width="2"/>
            </svg>
          `),
          scaledSize: new (window as any).google.maps.Size(20, 20)
        }
      });

      // Add click listener
      marker.addListener('click', () => {
        const content = `
          <div class="p-2">
            <h3 class="font-semibold text-sm">Location ${index + 1}</h3>
            <p class="text-xs text-gray-600">${formatDateTimePST(new Date(location.timestamp))}</p>
            <p class="text-xs font-mono">${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}</p>
            ${location.accuracy ? `<p class="text-xs text-gray-500">±${location.accuracy.toFixed(1)}m</p>` : ''}
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapInstance.current, marker);
      });

      markersRef.current.push(marker);
    });

    console.log('✅ All markers added successfully');
  };

  const addRoutePolyline = async () => {
    if (!mapInstance.current || !filteredLocationData.length || filteredLocationData.length < 2) return;

    console.log('🛣️ Adding route polyline:', {
      mapExists: !!mapInstance.current,
      locationsCount: filteredLocationData.length,
      canCreatePolyline: filteredLocationData.length >= 2
    });

    const path = filteredLocationData.map(location => ({
      lat: location.latitude,
      lng: location.longitude
    }));

    console.log('🛣️ Creating polyline with path:', path.slice(0, 3), '...');

    polylineRef.current = new (window as any).google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#3B82F6',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map: mapInstance.current
    });

    console.log('✅ Polyline added successfully');
  };

  const calculateTotalDistance = () => {
    if (!googleMapsLoaded || !(window as any).google?.maps?.geometry?.spherical || filteredLocationData.length < 2) {
      console.log('⚠️ Google Maps API not loaded yet, skipping distance calculation');
      return 0;
    }

    let totalDistance = 0;
    for (let i = 0; i < filteredLocationData.length - 1; i++) {
      const from = new (window as any).google.maps.LatLng(filteredLocationData[i].latitude, filteredLocationData[i].longitude);
      const to = new (window as any).google.maps.LatLng(filteredLocationData[i + 1].latitude, filteredLocationData[i + 1].longitude);
      const distance = (window as any).google.maps.geometry.spherical.computeDistanceBetween(from, to);
      totalDistance += distance;
    }

    return totalDistance / 1000; // Convert to kilometers
  };

  const getTimeRangeDescription = () => {
    switch (timeRange) {
      case '24h':
        return 'Last 24 hours';
      case '7d':
        return 'Last 7 days';
      case '30d':
        return 'Last 30 days';
      default:
        return 'Custom range';
    }
  };

  const getLocationStats = () => {
    if (filteredLocationData.length === 0) return null;

    const totalDistance = calculateTotalDistance();
    const avgAccuracy = filteredLocationData.reduce((sum, loc) => sum + (loc.accuracy || 0), 0) / filteredLocationData.length;
    const timeSpan = filteredLocationData.length > 1 
      ? new Date(filteredLocationData[filteredLocationData.length - 1].timestamp).getTime() - new Date(filteredLocationData[0].timestamp).getTime()
      : 0;

    return {
      totalPoints: filteredLocationData.length,
      totalDistance,
      avgAccuracy,
      timeSpan: timeSpan / (1000 * 60 * 60), // Convert to hours
      googleMapsLoaded
    };
  };

  const stats = getLocationStats();

  // Define renderMainMapView function before it's used
  const renderMainMapView = () => {
    return (
      <div className="space-y-4">
        {/* Location Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-blue-50">
              <CardContent className="p-3">
                <div className="text-2xl font-bold text-blue-600">{stats.totalPoints}</div>
                <div className="text-sm text-blue-700">Location Points</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="p-3">
                <div className="text-2xl font-bold text-green-600">{stats.totalDistance.toFixed(1)} km</div>
                <div className="text-sm text-green-700">Total Distance</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50">
              <CardContent className="p-3">
                <div className="text-2xl font-bold text-purple-600">{stats.avgAccuracy.toFixed(1)}m</div>
                <div className="text-sm text-purple-700">Avg Accuracy</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50">
              <CardContent className="p-3">
                <div className="text-2xl font-bold text-orange-600">{stats.timeSpan.toFixed(1)}h</div>
                <div className="text-sm text-orange-700">Time Span</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Route Map - {getTimeRangeDescription()}
              {selectedDate && (
                <span className="text-sm text-gray-600 ml-2">
                  ({formatDateTimePST(new Date(selectedDate + 'T00:00:00-07:00'), { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric', 
                    timeZone: 'America/Los_Angeles' 
                  })})
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {filteredLocationData.length > 0 
                ? `Showing ${filteredLocationData.length} location points${selectedDate ? ` for ${selectedDate}` : ` from ${getTimeRangeDescription().toLowerCase()}`}`
                : 'No location data available for the selected time range'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={mapRef} 
              className="w-full h-96 rounded-lg border border-gray-200"
              style={{ minHeight: '400px' }}
            />
            
            {/* Location History */}
            {filteredLocationData.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Location History ({filteredLocationData.length} points)
                </h4>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  console.log('🎨 Render state:', {
    loading,
    error,
    locationDataLength: locationData.length,
    filteredLocationDataLength: filteredLocationData.length,
    hasMapRef: !!mapRef.current,
    googleMapsLoaded,
    timeRange,
    selectedDate
  });

  if (loading) {
    console.log('⏳ Rendering loading state');
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Loading Location Data
          </CardTitle>
          <CardDescription>Fetching location information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.log('❌ Rendering error state:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <MapPin className="h-5 w-5" />
            Error Loading Location Data
          </CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Failed to load location data</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine which view to render
  const shouldShowWeekOverview = timeRange === '7d' && !selectedDate;
  const shouldShowDayDetail = selectedDate && (timeRange === '7d' || timeRange === '30d');

  console.log('🎨 Determining render view:', {
    timeRange,
    selectedDate,
    shouldShowWeekOverview,
    shouldShowDayDetail
  });

  // Show week overview for 7d view without selected date
  if (shouldShowWeekOverview) {
    console.log('📅 Rendering week overview');
    return (
      <WeekLocationChart
        device={device}
        onDayClick={onDateSelect || (() => {})}
        selectedDate={selectedDate}
      />
    );
  }

  // Show day detail view when a specific day is selected
  if (shouldShowDayDetail) {
    console.log('📅 Rendering day detail view for:', selectedDate);
    return (
      <div className="space-y-4">
        {/* Week Overview at the top - always visible for easy day switching */}
        <WeekLocationChart
          device={device}
          onDayClick={onDateSelect || (() => {})}
          selectedDate={selectedDate}
        />

        {/* Day Detail Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Day Detail - {(() => {
                    if (!selectedDate) return '';
                    const date = new Date(selectedDate + 'T00:00:00-07:00');
                    return date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'America/Los_Angeles'
                    });
                  })()}
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Detailed location data for {(() => {
                    if (!selectedDate) return '';
                    const date = new Date(selectedDate + 'T00:00:00-07:00');
                    return date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'America/Los_Angeles'
                    });
                  })()}
                </CardDescription>
              </div>
              <button
                onClick={() => onDateSelect?.(undefined)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="Close day detail"
              >
                <Navigation className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
        </Card>

        {/* Day Detail Content - Same as main view but filtered for selected date */}
        {renderMainMapView()}
      </div>
    );
  }

  console.log('🗺️ Rendering main map view with data:', {
    stats,
    locationDataLength: locationData.length,
    filteredLocationDataLength: filteredLocationData.length,
    hasMapRef: !!mapRef.current
  });

  return renderMainMapView();
}