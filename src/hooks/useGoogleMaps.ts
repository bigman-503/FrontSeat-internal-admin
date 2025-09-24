import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface GoogleMapsState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  map: google.maps.Map | null;
  infoWindow: google.maps.InfoWindow | null;
}

let globalLoader: Loader | null = null;
let globalMapsLoaded = false;

export function useGoogleMaps() {
  const [state, setState] = useState<GoogleMapsState>({
    isLoaded: false,
    isLoading: false,
    error: null,
    map: null,
    infoWindow: null
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<(google.maps.marker.AdvancedMarkerElement | google.maps.Marker)[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // Initialize Google Maps API
  const initializeMaps = useCallback(async () => {
    if (globalMapsLoaded) {
      setState(prev => ({ ...prev, isLoaded: true, isLoading: false }));
      return;
    }

    setState(prev => {
      if (prev.isLoading) return prev;
      return { ...prev, isLoading: true, error: null };
    });

    try {
      if (!globalLoader) {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error('Google Maps API key not found');
        }

        globalLoader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['geometry', 'places', 'marker']
        });
      }

      await globalLoader.load();
      globalMapsLoaded = true;
      
      setState(prev => ({ 
        ...prev, 
        isLoaded: true, 
        isLoading: false,
        error: null 
      }));

      console.log('✅ Google Maps API loaded successfully');
    } catch (error) {
      console.error('❌ Error loading Google Maps API:', error);
      setState(prev => ({ 
        ...prev, 
        isLoaded: false, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load Google Maps API'
      }));
    }
  }, []);

  // Create map instance
  const createMap = useCallback((center: { lat: number; lng: number }, zoom: number = 15) => {
    console.log('🗺️ createMap called:', { isLoaded: state.isLoaded, hasMapRef: !!mapRef.current, center, zoom });
    
    if (!state.isLoaded) {
      console.log('❌ Maps not loaded yet');
      return null;
    }
    
    if (!mapRef.current) {
      console.log('❌ Map ref is null, retrying in next tick');
      // Retry after a short delay to allow ref to be set
      setTimeout(() => {
        if (mapRef.current) {
          createMap(center, zoom);
        }
      }, 100);
      return null;
    }

    // Clean up existing map
    if (state.map) {
      console.log('🧹 Cleaning up existing map');
      state.map.unbindAll();
    }

    try {
      console.log('🚀 Creating new map instance...');
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapId: 'DEMO_MAP_ID', // Required for Advanced Markers
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      console.log('✅ Map instance created successfully');

      const infoWindow = new google.maps.InfoWindow();
      console.log('💬 Info window created');

      setState(prev => ({ ...prev, map, infoWindow }));
      
      // Return the map instance directly for immediate use
      return map;
    } catch (error) {
      console.error('❌ Error creating map:', error);
      return null;
    }
  }, [state.isLoaded]);

  // Clear all markers and polylines
  const clearMap = useCallback(() => {
    markersRef.current.forEach(marker => {
      if ('map' in marker) {
        // AdvancedMarkerElement
        marker.map = null;
      } else {
        // Regular Marker
        marker.setMap(null);
      }
    });
    markersRef.current = [];
    
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    polylinesRef.current = [];
  }, []);

  // Add location markers
  const addMarkers = useCallback((locations: any[], onMarkerClick?: (location: any) => void) => {
    console.log('📍 addMarkers called:', { hasMap: !!state.map, hasInfoWindow: !!state.infoWindow, locationCount: locations.length });
    
    if (!state.map || !state.infoWindow) {
      console.log('❌ Map or info window not available');
      return;
    }

    clearMap();

    locations.forEach((location, index) => {
      try {
        let marker;
        
        // Try to use AdvancedMarkerElement if available, otherwise fall back to Marker
        if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
          marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat: location.latitude, lng: location.longitude },
            map: state.map,
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
            map: state.map,
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

        if (onMarkerClick) {
          marker.addListener('click', () => onMarkerClick(location));
        }

        markersRef.current.push(marker);
        console.log(`✅ Marker ${index + 1} added at:`, location.latitude, location.longitude);
      } catch (error) {
        console.error(`❌ Error adding marker ${index + 1}:`, error);
      }
    });
    
    console.log(`✅ Added ${markersRef.current.length} markers total`);
  }, [state.map, state.infoWindow]);

  // Add route polyline
  const addRoute = useCallback((locations: any[]) => {
    console.log('🛣️ addRoute called:', { hasMap: !!state.map, locationCount: locations.length });
    
    if (!state.map || locations.length < 2) {
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

      polyline.setMap(state.map);
      polylinesRef.current.push(polyline);
      console.log('✅ Route polyline added successfully');
    } catch (error) {
      console.error('❌ Error adding route polyline:', error);
    }
  }, [state.map]);

  // Calculate total distance
  const calculateDistance = useCallback((locations: any[]) => {
    if (!state.isLoaded || locations.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(prev.latitude, prev.longitude),
        new google.maps.LatLng(curr.latitude, curr.longitude)
      );
      
      totalDistance += distance;
    }

    return totalDistance / 1000; // Convert to kilometers
  }, [state.isLoaded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearMap();
      if (state.map) {
        state.map.unbindAll();
      }
    };
  }, [clearMap, state.map]);

  return {
    ...state,
    mapRef,
    initializeMaps,
    createMap,
    clearMap,
    addMarkers,
    addRoute,
    calculateDistance
  };
}
