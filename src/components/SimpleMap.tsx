import React from 'react';
import { Device } from '@/types/device';
import { MapPin } from 'lucide-react';

interface SimpleMapProps {
  devices: Device[];
  center?: { lat: number; lng: number };
  height?: string;
}

export const SimpleMap: React.FC<SimpleMapProps> = ({
  devices,
  center = { lat: 49.2630205, lng: -123.1327271 },
  height = '400px'
}) => {
  return (
    <div className="relative bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700" style={{ height }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-4 left-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="absolute top-8 right-8 w-1 h-1 bg-green-500 rounded-full animate-pulse delay-100"></div>
        <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse delay-200"></div>
        <div className="absolute bottom-4 right-4 w-1 h-1 bg-yellow-500 rounded-full animate-pulse delay-300"></div>
      </div>
      
      {/* Device Markers */}
      {devices.map((device, index) => {
        if (!device.location.latitude || !device.location.longitude) return null;
        
        // Simple positioning based on relative coordinates
        const x = 50 + (device.location.longitude - center.lng) * 1000; // Rough positioning
        const y = 50 + (device.location.latitude - center.lat) * 1000;
        
        return (
          <div
            key={device.deviceId}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${Math.max(10, Math.min(90, x))}%`,
              top: `${Math.max(10, Math.min(90, y))}%`
            }}
          >
            <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
              device.online ? 'bg-green-500' : 'bg-red-500'
            } ${device.online ? 'animate-pulse' : ''}`}>
              <div className="w-full h-full rounded-full bg-white opacity-30"></div>
            </div>
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap">
              {device.deviceName}
            </div>
          </div>
        );
      })}
      
      {/* Center Marker */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <MapPin className="w-6 h-6 text-blue-600" />
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
      
      {/* Fallback Message */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-xs text-muted-foreground">
          Simple Map View
        </div>
      </div>
    </div>
  );
};
