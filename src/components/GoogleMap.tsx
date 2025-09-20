import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Device } from '@/types/device';
import { formatDateTimePST } from '@/lib/dateUtils';

interface GoogleMapProps {
  devices: Device[];
  selectedDevice: Device | null;
  onDeviceSelect: (device: Device | null) => void;
  center: { lat: number; lng: number };
  zoom: number;
  height: string;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({
  devices,
  selectedDevice,
  onDeviceSelect,
  center,
  zoom,
  height,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places'],
    });

    loader.load().then(() => {
      if (mapRef.current) {
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapId: 'DEMO_MAP_ID', // Replace with your actual Map ID if using Cloud-based styling
        });

        infoWindowRef.current = new google.maps.InfoWindow();

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        devices.forEach((device) => {
          const marker = new google.maps.Marker({
            position: { lat: device.location.latitude, lng: device.location.longitude },
            map: mapInstance.current,
            title: device.deviceName,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: device.online ? '#10B981' : '#EF4444', // Green for online, Red for offline
              fillOpacity: 0.9,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              scale: 7,
            },
          });

          marker.addListener('click', () => {
            onDeviceSelect(device);
            if (infoWindowRef.current && mapInstance.current) {
              infoWindowRef.current.setContent(`
                <div style="padding: 8px;">
                  <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #333;">${device.deviceName}</h3>
                  <p style="margin: 0; font-size: 12px; color: #666;">Status: <strong>${device.online ? 'Online' : 'Offline'}</strong></p>
                  <p style="margin: 0; font-size: 12px; color: #666;">Battery: ${device.batteryLevel}% ${device.charging ? '⚡' : ''}</p>
                  <p style="margin: 0; font-size: 12px; color: #666;">Last Seen: ${formatDateTimePST(device.lastSeen)}</p>
                </div>
              `);
              infoWindowRef.current.open(mapInstance.current, marker);
            }
          });
          markersRef.current.push(marker);
        });
      }
    }).catch((e) => {
      console.error('Error loading Google Maps API: ', e);
    });

    return () => {
      // Cleanup markers and info window
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
    };
  }, [devices, center, zoom, onDeviceSelect]);

  useEffect(() => {
    if (selectedDevice && infoWindowRef.current && mapInstance.current) {
      const marker = markersRef.current.find(m => m.getTitle() === selectedDevice.deviceName);
      if (marker) {
        mapInstance.current.setCenter(marker.getPosition() as google.maps.LatLng);
        infoWindowRef.current.setContent(`
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #333;">${selectedDevice.deviceName}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">Status: <strong>${selectedDevice.online ? 'Online' : 'Offline'}</strong></p>
            <p style="margin: 0; font-size: 12px; color: #666;">Battery: ${selectedDevice.batteryLevel}% ${selectedDevice.charging ? '⚡' : ''}</p>
            <p style="margin: 0; font-size: 12px; color: #666;">Last Seen: ${formatDateTimePST(selectedDevice.lastSeen)}</p>
          </div>
        `);
        infoWindowRef.current.open(mapInstance.current, marker);
      }
    } else if (!selectedDevice && infoWindowRef.current) {
      infoWindowRef.current.close();
    }
  }, [selectedDevice]);

  return <div ref={mapRef} style={{ height, width: '100%', borderRadius: '0.75rem' }} />;
};
