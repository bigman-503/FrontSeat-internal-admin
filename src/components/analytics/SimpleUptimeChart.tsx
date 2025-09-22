import React from 'react';
import { UptimeDataPoint } from '../../types/analytics';

interface SimpleUptimeChartProps {
  data: UptimeDataPoint[];
  timeRange: string;
  timeInterval: number;
  dateRange: { startDate: string; endDate: string };
  isHistoricalView?: boolean; // New prop to indicate if this is historical data
  selectedDate?: string; // The specific date being viewed for historical data
}

export function SimpleUptimeChart({ 
  data, 
  timeRange, 
  timeInterval, 
  dateRange,
  isHistoricalView = false,
  selectedDate
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
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-6 text-gray-800">Device Status Timeline</h3>
        <div className="space-y-4">
          {/* Time labels positioned ABOVE the timeline */}
          <div className="relative h-12">
            {(() => {
              if (isHistoricalView && selectedDate) {
                // For historical data, calculate marker positions based on actual data
                const timeMarkers = [];
                
                // Calculate positions for 3-hour intervals based on actual data length
                const dataLength = data.length;
                const intervalHours = [0, 3, 6, 9, 12, 15, 18, 21, 24]; // Hours to mark
                
                for (let i = 0; i < intervalHours.length; i++) {
                  const hour = intervalHours[i];
                  const time = new Date(selectedDate + 'T00:00:00-07:00');
                  time.setHours(hour, 0, 0, 0);
                  
                  // Format time with AM/PM
                  const timeStr = time.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'America/Los_Angeles'
                  });
                  
                  // Add date for 00:00 (midnight) markers
                  const isMidnight = hour === 0;
                  const dateStr = time.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'America/Los_Angeles'
                  });
                  
                  // Calculate position based on data length (96 intervals for 24 hours = 4 per hour)
                  // Each hour has 4 intervals (15 minutes each), so 3-hour intervals have 12 intervals
                  const intervalsPerHour = dataLength / 24; // Should be 4 for 15-minute intervals
                  const intervalsPer3Hours = intervalsPerHour * 3; // 12 intervals per 3-hour mark
                  const position = (i * intervalsPer3Hours) / (dataLength - 1);
                  
                  timeMarkers.push({
                    time: timeStr,
                    date: isMidnight ? dateStr : null,
                    isMidnight: isMidnight,
                    position: Math.min(position, 1) // Cap at 1.0
                  });
                }
                
                return timeMarkers.map((marker, index) => (
                  <div 
                    key={index} 
                    className="absolute text-center transform -translate-x-1/2"
                    style={{ left: `${marker.position * 100}%` }}
                  >
                    {marker.isMidnight && (
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        {marker.date}
                      </div>
                    )}
                    <div className="text-xs text-gray-600 font-medium">
                      {marker.time}
                    </div>
                    {/* Vertical line connecting to timeline */}
                    <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-px h-4 ${
                      marker.position === 0 || marker.position === 1 ? 'bg-gray-400' : 'bg-gray-300'
                    }`}></div>
                  </div>
                ));
              } else {
                // For current data, show rolling 24-hour window
                const now = new Date();
                const nowPST = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
                
                // Generate 9 time markers: 24h ago, 21h ago, 18h ago, 15h ago, 12h ago, 9h ago, 6h ago, 3h ago, now
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
                    isMidnight: isMidnight,
                    position: i / 8 // Evenly distribute across 8 intervals
                  });
                }
                
                return timeMarkers.map((marker, index) => (
                  <div 
                    key={index} 
                    className="absolute text-center transform -translate-x-1/2"
                    style={{ left: `${marker.position * 100}%` }}
                  >
                    {marker.isMidnight && (
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        {marker.date}
                      </div>
                    )}
                    <div className="text-xs text-gray-600 font-medium">
                      {marker.time}
                    </div>
                    {/* Vertical line connecting to timeline */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-px h-4 bg-gray-300"></div>
                  </div>
                ));
              }
            })()}
          </div>
          
          {/* Status bars with grid lines */}
          <div className="relative mt-2">
            {/* Grid lines for better alignment */}
            <div className="absolute inset-0 pointer-events-none">
              {(() => {
                if (isHistoricalView && selectedDate) {
                  // For historical data, position grid lines at 3-hour intervals based on actual data
                  const dataLength = data.length;
                  const intervalHours = [0, 3, 6, 9, 12, 15, 18, 21, 24]; // Hours to mark
                  
                  return intervalHours.map((hour, index) => {
                    // Calculate position based on data length (96 intervals for 24 hours = 4 per hour)
                    const intervalsPerHour = dataLength / 24; // Should be 4 for 15-minute intervals
                    const intervalsPer3Hours = intervalsPerHour * 3; // 12 intervals per 3-hour mark
                    const position = (index * intervalsPer3Hours) / (dataLength - 1);
                    
                    return (
                      <div 
                        key={index} 
                        className={`absolute w-px h-full ${
                          hour === 0 || hour === 24 ? 'bg-gray-300' : 'bg-gray-200'
                        }`}
                        style={{ left: `${Math.min(position, 1) * 100}%` }}
                      ></div>
                    );
                  });
                } else {
                  // For current data, use equal spacing
                  const markerCount = 9;
                  const gridLines = [];
                  for (let i = 0; i < markerCount; i++) {
                    gridLines.push(
                      <div 
                        key={i} 
                        className="absolute w-px h-full bg-gray-100"
                        style={{ left: `${(100/(markerCount-1)) * i}%` }}
                      ></div>
                    );
                  }
                  return gridLines;
                }
              })()}
            </div>
            
            {/* Status bars */}
            <div className="flex gap-0.5 h-10 relative z-10">
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
              let intervalDate;
              if (isHistoricalView && selectedDate) {
                // For historical data, use the selected date with Pacific timezone
                intervalDate = new Date(selectedDate + 'T00:00:00-07:00');
              } else {
                // For current data, use the point timestamp
                intervalDate = new Date(point.timestamp || new Date());
              }
              const dateStr = intervalDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric',
                timeZone: 'America/Los_Angeles'
              });
              
              return (
                <div
                  key={index}
                  className={`flex-1 rounded-sm transition-all duration-200 hover:scale-y-110 hover:shadow-md cursor-pointer ${
                    point.isOnline === 1 
                      ? 'bg-gradient-to-b from-green-400 to-green-600 hover:from-green-300 hover:to-green-500' 
                      : 'bg-gradient-to-b from-red-400 to-red-600 hover:from-red-300 hover:to-red-500'
                  }`}
                  title={`${dateStr} at ${time12Hour}: ${point.isOnline === 1 ? 'Online' : 'Offline'} (${point.heartbeatCount || 0} heartbeats)`}
                />
              );
            })}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-8 mt-6 text-sm">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
              <div className="w-4 h-4 bg-gradient-to-b from-green-400 to-green-600 rounded"></div>
              <span className="font-medium text-green-700">Online</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
              <div className="w-4 h-4 bg-gradient-to-b from-red-400 to-red-600 rounded"></div>
              <span className="font-medium text-red-700">Offline</span>
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
              let intervalDate;
              if (isHistoricalView && selectedDate) {
                // For historical data, use the selected date
                intervalDate = new Date(selectedDate);
              } else {
                // For current data, use the point timestamp
                intervalDate = new Date(point.timestamp || new Date());
              }
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
                    <span className="ml-2">({point.heartbeatCount || 0} heartbeats)</span>
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
