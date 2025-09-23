import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Route, Navigation } from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';
import { formatDateTimePST } from '@/lib/dateUtils';

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
          timeRange,
          ...(selectedDate && { selectedDate })
        });

        const url = `/api/analytics/device/${device.deviceId}/locations?${params}`;
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
          const errorText = await response.text();
          console.error('❌ Response not OK:', {
            status: response.status,
            statusText: response.statusText,
            errorText
          });
          throw new Error(`Failed to fetch location data: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('📍 Location data received:', {
          totalLocations: data.locations?.length || 0,
          sampleLocation: data.locations?.[0],
          dateRange: data.dateRange,
          fullResponse: data
        });
        
        setLocationData(data.locations || []);
        console.log('✅ Location data set successfully');
      } catch (err) {
        console.error('💥 Error fetching location data:', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined
        });
        setError(err instanceof Error ? err.message : 'Failed to fetch location data');
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
      locationDataLength: locationData.length,
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing'
    });

    if (!mapRef.current) {
      console.log('❌ No map ref, skipping map initialization');
      return;
    }

    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['geometry'],
    });

    console.log('🚀 Starting Google Maps loader...');
    loader.load().then(() => {
      console.log('✅ Google Maps API loaded successfully');
      setGoogleMapsLoaded(true);
      if (mapRef.current) {
        // Calculate center point from location data or use default
        const center = locationData.length > 0 ? calculateCenter(locationData) : { lat: 37.7749, lng: -122.4194 };
        console.log('📍 Map center calculated:', center);

        mapInstance.current = new (window as any).google.maps.Map(mapRef.current, {
          center,
          zoom: 13,
          mapId: 'DEMO_MAP_ID',
        });
        console.log('🗺️ Google Map instance created successfully');

        infoWindowRef.current = new (window as any).google.maps.InfoWindow();
        console.log('💬 Info window created');

        // Clear existing markers and polylines
        clearMap();
        console.log('🧹 Existing markers cleared');

        // Add markers and route if we have data
        if (locationData.length > 0) {
          console.log('📍 Adding markers and route for', locationData.length, 'locations');
          addLocationMarkers(mapInstance.current, locationData);
          addRoutePolyline(mapInstance.current, locationData);
          console.log('✅ Markers and route added successfully');
        } else {
          console.log('ℹ️ No location data to display on map');
        }
      } else {
        console.log('❌ Map ref is null after API load');
      }
    }).catch((e) => {
      console.error('💥 Error loading Google Maps API:', {
        error: e,
        message: e.message,
        stack: e.stack
      });
      setError('Failed to load Google Maps API');
    });

    return () => {
      console.log('🧹 Cleaning up Google Maps...');
      // Cleanup markers and info window
      clearMap();
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
    };
  }, [locationData]);

  const calculateCenter = (locations: LocationData[]) => {
    if (locations.length === 0) return { lat: 37.7749, lng: -122.4194 }; // Default to SF

    const latSum = locations.reduce((sum, loc) => sum + loc.latitude, 0);
    const lngSum = locations.reduce((sum, loc) => sum + loc.longitude, 0);

    return {
      lat: latSum / locations.length,
      lng: lngSum / locations.length
    };
  };

  const addLocationMarkers = (map: any, locations: LocationData[]) => {
    console.log('📍 Adding location markers:', {
      mapExists: !!map,
      locationsCount: locations.length,
      sampleLocation: locations[0]
    });

    locations.forEach((location, index) => {
      console.log(`📍 Creating marker ${index + 1}:`, {
        lat: location.latitude,
        lng: location.longitude,
        timestamp: location.timestamp
      });

      const marker = new (window as any).google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map,
        title: `Location ${index + 1}`,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: index === 0 ? '#10B981' : index === locations.length - 1 ? '#EF4444' : '#3B82F6',
          fillOpacity: 0.9,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });

      marker.addListener('click', () => {
        console.log(`📍 Marker ${index + 1} clicked`);
        if (infoWindowRef.current && mapInstance.current) {
          infoWindowRef.current.setContent(`
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #333;">Location ${index + 1}</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">Time: ${formatDateTimePST(new Date(location.timestamp))}</p>
              <p style="margin: 0; font-size: 12px; color: #666;">Accuracy: ${location.accuracy?.toFixed(1) || 'N/A'}m</p>
              ${location.battery_level ? `<p style="margin: 0; font-size: 12px; color: #666;">Battery: ${location.battery_level}%</p>` : ''}
              <p style="margin: 0; font-size: 12px; color: #666;">Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}</p>
            </div>
          `);
          infoWindowRef.current.open(mapInstance.current, marker);
        }
      });

      markersRef.current.push(marker);
    });

    console.log('✅ All markers added successfully');
  };

  const addRoutePolyline = (map: any, locations: LocationData[]) => {
    console.log('🛣️ Adding route polyline:', {
      mapExists: !!map,
      locationsCount: locations.length,
      canCreatePolyline: locations.length >= 2
    });

    if (locations.length < 2) {
      console.log('❌ Not enough locations for polyline (need at least 2)');
      return;
    }

    const path = locations.map(loc => ({
      lat: loc.latitude,
      lng: loc.longitude
    }));

    console.log('🛣️ Creating polyline with path:', path.slice(0, 3), '...');

    const polyline = new (window as any).google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#EF4444',
      strokeOpacity: 0.8,
      strokeWeight: 4
    });

    polyline.setMap(map);
    polylineRef.current = polyline;
    console.log('✅ Polyline added successfully');
  };

  const clearMap = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
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
    if (locationData.length === 0) return null;

    const totalDistance = calculateTotalDistance(locationData);
    const avgAccuracy = locationData.reduce((sum, loc) => sum + (loc.accuracy || 0), 0) / locationData.length;
    const timeSpan = locationData.length > 1 
      ? new Date(locationData[locationData.length - 1].timestamp).getTime() - new Date(locationData[0].timestamp).getTime()
      : 0;

    return {
      totalPoints: locationData.length,
      totalDistance: totalDistance / 1000, // Convert to km
      avgAccuracy: avgAccuracy,
      timeSpan: timeSpan / (1000 * 60 * 60), // Convert to hours
      googleMapsLoaded // Include this to trigger re-render when Google Maps loads
    };
  };

  const calculateTotalDistance = (locations: LocationData[]) => {
    if (locations.length < 2) return 0;
    
    // Check if Google Maps API is loaded
    if (!(window as any).google?.maps?.geometry?.spherical) {
      console.log('⚠️ Google Maps API not loaded yet, skipping distance calculation');
      return 0;
    }

    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      
      const distance = (window as any).google.maps.geometry.spherical.computeDistanceBetween(
        new (window as any).google.maps.LatLng(prev.latitude, prev.longitude),
        new (window as any).google.maps.LatLng(curr.latitude, curr.longitude)
      );
      
      totalDistance += distance;
    }

    return totalDistance;
  };

  const stats = getLocationStats();

  console.log('🎨 Render state:', {
    loading,
    error,
    locationDataLength: locationData.length,
    hasMapRef: !!mapRef.current,
    googleMapsLoaded
  });

  if (loading) {
    console.log('⏳ Rendering loading state');
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Device Location Path
          </CardTitle>
          <CardDescription>Loading location data...</CardDescription>
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
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Device Location Path
          </CardTitle>
          <CardDescription>Error loading location data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message when no location data is available
  if (!loading && !error && locationData.length === 0) {
    console.log('📭 Rendering no data state');
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Device Location Path - {getTimeRangeDescription()}
          </CardTitle>
          <CardDescription>No location data available for the selected time range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No GPS coordinates found for this device in the selected time period.</p>
            <p className="text-sm mt-2">Try selecting a different time range or check if the device has location services enabled.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log('🗺️ Rendering main map view with data:', {
    stats,
    locationDataLength: locationData.length,
    hasMapRef: !!mapRef.current
  });

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
            Device movement path with GPS coordinates
            {locationData.length > 0 && (
              <span className="block text-xs text-gray-500 mt-1">
                • Green marker: Start point • Red marker: End point • Blue markers: Intermediate points
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            ref={mapRef} 
            style={{ height: '400px', width: '100%', borderRadius: '0.75rem' }}
          />
        </CardContent>
      </Card>

      {/* Location Details */}
      {locationData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Location History
            </CardTitle>
            <CardDescription>
              Chronological list of device locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {locationData.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-green-500' : 
                      index === locationData.length - 1 ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">
                        Point {index + 1}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDateTimePST(new Date(location.timestamp))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                    {location.accuracy && (
                      <p className="text-xs text-gray-600">
                        ±{location.accuracy.toFixed(1)}m
                      </p>
                    )}
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
