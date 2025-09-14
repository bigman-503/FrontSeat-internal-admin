import React, { useEffect, useRef, useState } from 'react';
import { Device } from '@/types/device';

interface GoogleMapProps {
  devices: Device[];
  selectedDevice?: Device | null;
  onDeviceSelect: (device: Device) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
}

interface MapMarker {
  device: Device;
  marker: google.maps.Marker;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({
  devices,
  selectedDevice,
  onDeviceSelect,
  center = { lat: 49.2630205, lng: -123.1327271 }, // Default to Vancouver
  zoom = 12,
  height = '400px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<MapMarker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
          setIsLoaded(true);
          return;
        }

        // Load Google Maps API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          setIsLoaded(true);
        };
        
        script.onerror = () => {
          setError('Failed to load Google Maps API');
        };
        
        document.head.appendChild(script);
      } catch (err) {
        setError('Failed to load Google Maps API');
      }
    };

    loadGoogleMaps();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    try {
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = map;
    } catch (err) {
      setError('Failed to initialize map');
    }
  }, [isLoaded, center, zoom]);

  // Update markers when devices change
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(({ marker }) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // Add new markers
    devices.forEach((device) => {
      if (!device.location.latitude || !device.location.longitude) return;

      const marker = new google.maps.Marker({
        position: {
          lat: device.location.latitude,
          lng: device.location.longitude
        },
        map: mapInstanceRef.current,
        title: device.deviceName,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: device.online ? '#10B981' : '#EF4444',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        },
        animation: device.online ? google.maps.Animation.BOUNCE : undefined
      });

      // Add click listener
      marker.addListener('click', () => {
        onDeviceSelect(device);
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-sm">${device.deviceName}</h3>
            <p class="text-xs text-gray-600">${device.deviceId}</p>
            <p class="text-xs">Status: ${device.status}</p>
            <p class="text-xs">Battery: ${device.batteryLevel}%</p>
            <p class="text-xs">Network: ${device.networkStatus.type}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push({ device, marker });
    });

    // Center map on selected device
    if (selectedDevice && selectedDevice.location.latitude && selectedDevice.location.longitude) {
      const selectedMarker = markersRef.current.find(m => m.device.deviceId === selectedDevice.deviceId);
      if (selectedMarker) {
        mapInstanceRef.current?.setCenter({
          lat: selectedDevice.location.latitude,
          lng: selectedDevice.location.longitude
        });
        mapInstanceRef.current?.setZoom(15);
      }
    }
  }, [devices, selectedDevice, isLoaded, onDeviceSelect]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load map</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
      />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 12) + 1);
            }
          }}
          className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 12) - 1);
            }
          }}
          className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium mb-2">Device Status</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs">Online ({devices.filter(d => d.online).length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs">Offline ({devices.filter(d => !d.online).length})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
