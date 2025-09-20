import React from 'react';
import { UptimeDataPoint } from '../../types/analytics';

interface SimpleUptimeChartProps {
  data: UptimeDataPoint[];
  timeRange: string;
  timeInterval: number;
  dateRange: { startDate: string; endDate: string };
}

export function SimpleUptimeChart({ 
  data, 
  timeRange, 
  timeInterval, 
  dateRange 
}: SimpleUptimeChartProps) {
  console.log('🎯 SimpleUptimeChart render:', {
    dataLength: data.length,
    sampleData: data.slice(0, 3),
    onlineCount: data.filter(d => d.isOnline === 1).length,
    offlineCount: data.filter(d => d.isOnline === 0).length
  });

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm mt-2">No heartbeat data found for this period</p>
        </div>
      </div>
    );
  }

  const onlineCount = data.filter(d => d.isOnline === 1).length;
  const offlineCount = data.filter(d => d.isOnline === 0).length;
  const totalCount = data.length;
  const uptimePercentage = ((onlineCount / totalCount) * 100).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-50 p-3 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{onlineCount}</div>
          <div className="text-sm text-green-700">Online Periods</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">{offlineCount}</div>
          <div className="text-sm text-red-700">Offline Periods</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{uptimePercentage}%</div>
          <div className="text-sm text-blue-700">Uptime</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg border">
          <div className="text-2xl font-bold text-gray-600">{totalCount}</div>
          <div className="text-sm text-gray-700">Total Periods</div>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Device Status Timeline</h3>
        <div className="space-y-2">
          {/* Time labels - Dynamic rolling 24-hour window with 3-hour intervals */}
          <div className="relative">
            {/* Time markers with connecting lines */}
            <div className="flex justify-between text-xs text-gray-500 mb-2 relative">
              {(() => {
                // Get current time in PST
                const now = new Date();
                const nowPST = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
                
                // Generate 8 time markers: 24h ago, 21h ago, 18h ago, 15h ago, 12h ago, 9h ago, 6h ago, 3h ago, now
                const timeMarkers = [];
                for (let i = 0; i < 9; i++) {
                  const time = new Date(nowPST);
                  time.setHours(nowPST.getHours() - (24 - (i * 3)), 0, 0, 0);
                  
                  // Format time with AM/PM
                  const timeStr = time.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  });
                  
                  // Add date for 00:00 (midnight) markers
                  const isMidnight = time.getHours() === 0;
                  const dateStr = time.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric' 
                  });
                  
                  timeMarkers.push({
                    time: timeStr,
                    date: isMidnight ? dateStr : null,
                    isMidnight: isMidnight
                  });
                }
                
                return timeMarkers.map((marker, index) => (
                  <div key={index} className="text-center relative">
                    {marker.isMidnight && (
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        {marker.date}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {marker.time}
                    </div>
                    {/* Vertical line connecting to timeline */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-px h-2 bg-gray-300"></div>
                  </div>
                ));
              })()}
            </div>
          </div>
          
          {/* Status bars with grid lines */}
          <div className="relative">
            {/* Grid lines for better alignment */}
            <div className="absolute inset-0 flex justify-between pointer-events-none">
              {(() => {
                const gridLines = [];
                for (let i = 0; i < 9; i++) {
                  gridLines.push(
                    <div 
                      key={i} 
                      className="w-px h-full bg-gray-100"
                      style={{ marginLeft: i === 0 ? '0' : `${(100/8) * i}%` }}
                    ></div>
                  );
                }
                return gridLines;
              })()}
            </div>
            
            {/* Status bars */}
            <div className="flex gap-1 h-8 relative z-10">
              {data.map((point, index) => {
              // Convert displayTime to AM/PM format and add date
              const timeStr = point.displayTime;
              const [time, period] = timeStr.split(' ');
              const [hours, minutes] = time.split(':');
              const hour24 = parseInt(hours);
              const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
              const ampm = hour24 < 12 ? 'AM' : 'PM';
              const time12Hour = `${hour12}:${minutes} ${ampm}`;
              
              // Get the date for this interval
              const intervalDate = new Date(point.timestamp || new Date());
              const dateStr = intervalDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              });
              
              return (
                <div
                  key={index}
                  className={`flex-1 rounded-sm ${
                    point.isOnline === 1 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`}
                  title={`${dateStr} at ${time12Hour}: ${point.isOnline === 1 ? 'Online' : 'Offline'}`}
                />
              );
            })}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Offline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Period List */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Period Details</h3>
        <div className="max-h-64 overflow-y-auto">
          <div className="space-y-1">
            {data.map((point, index) => {
              // Convert displayTime to AM/PM format
              const timeStr = point.displayTime;
              const [time, period] = timeStr.split(' ');
              const [hours, minutes] = time.split(':');
              const hour24 = parseInt(hours);
              const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
              const ampm = hour24 < 12 ? 'AM' : 'PM';
              const time12Hour = `${hour12}:${minutes} ${ampm}`;
              
              // Get the date for this interval
              const intervalDate = new Date(point.timestamp || new Date());
              const dateStr = intervalDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
              });
              
              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded ${
                    point.isOnline === 1 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      point.isOnline === 1 ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div className="flex flex-col">
                      <span className="font-mono text-sm">{time12Hour}</span>
                      <span className="text-xs text-gray-500">{dateStr}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {point.isOnline === 1 ? 'Online' : 'Offline'}
                    {point.batteryLevel > 0 && (
                      <span className="ml-2">({point.batteryLevel}% battery)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
