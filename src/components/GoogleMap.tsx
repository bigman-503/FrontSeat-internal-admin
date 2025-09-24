import React, { useEffect, useRef } from 'react';
import { Device } from '@/types/device';
import { formatDateTimePST } from '@/lib/dateUtils';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

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
  const markersRef = useRef<(google.maps.marker.AdvancedMarkerElement | google.maps.Marker)[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const { isLoaded, initializeMaps } = useGoogleMaps();

  useEffect(() => {
    initializeMaps();
  }, [initializeMaps]);

  useEffect(() => {
    if (isLoaded && mapRef.current) {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapId: 'DEMO_MAP_ID', // Replace with your actual Map ID if using Cloud-based styling
      });

      infoWindowRef.current = new google.maps.InfoWindow();

      // Clear existing markers
      markersRef.current.forEach(marker => {
        if ('map' in marker) {
          // AdvancedMarkerElement
          (marker as google.maps.marker.AdvancedMarkerElement).map = null;
        } else {
          // Regular Marker
          (marker as google.maps.Marker).setMap(null);
        }
      });
      markersRef.current = [];

      devices.forEach((device) => {
        let marker;
        
        // Try to use AdvancedMarkerElement if available, otherwise fall back to Marker
        if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
          marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat: device.location.latitude, lng: device.location.longitude },
            map: mapInstance.current,
            title: device.deviceName,
            content: document.createElement('div'),
          });
          
          // Set custom marker content
          const markerContent = marker.content as HTMLElement;
          markerContent.innerHTML = `
            <div style="
              width: 14px; 
              height: 14px; 
              background: ${device.online ? '#10B981' : '#EF4444'}; 
              border: 2px solid #FFFFFF; 
              border-radius: 50%; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            "></div>
          `;
        } else {
          // Fallback to regular Marker
          marker = new google.maps.Marker({
            position: { lat: device.location.latitude, lng: device.location.longitude },
            map: mapInstance.current,
            title: device.deviceName,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: device.online ? '#10B981' : '#EF4444',
              fillOpacity: 0.9,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              scale: 7,
            },
          });
        }

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

    return () => {
      // Cleanup markers and info window
      markersRef.current.forEach(marker => {
        if ('map' in marker) {
          // AdvancedMarkerElement
          (marker as google.maps.marker.AdvancedMarkerElement).map = null;
        } else {
          // Regular Marker
          (marker as google.maps.Marker).setMap(null);
        }
      });
      markersRef.current = [];
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
    };
  }, [isLoaded, devices, center, zoom, onDeviceSelect]);

  useEffect(() => {
    if (selectedDevice && infoWindowRef.current && mapInstance.current) {
      const marker = markersRef.current.find(m => {
        if ('title' in m) {
          return m.title === selectedDevice.deviceName;
        } else {
          return m.getTitle() === selectedDevice.deviceName;
        }
      });
      if (marker) {
        const position = 'position' in marker ? marker.position : (marker as google.maps.Marker).getPosition();
        mapInstance.current.setCenter(position as google.maps.LatLng);
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
