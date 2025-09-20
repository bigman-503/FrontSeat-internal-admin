import React, { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

// Simplified types - data comes pre-processed from backend
interface UptimeDataPoint {
  time: string;
  displayTime: string;
  isOnline: number;
  prevIsOnline: number | null;
  batteryLevel: number;
  cpuUsage: number;
  heartbeatCount: number;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

interface UptimeChartProps {
  data: UptimeDataPoint[];
  timeRange: string;
  timeInterval: number;
  dateRange: DateRange;
  onChartClick?: (data: any) => void;
  scrollPosition: number;
}

export function UptimeChart({ 
  data, 
  timeRange, 
  timeInterval, 
  dateRange, 
  onChartClick,
  scrollPosition 
}: UptimeChartProps) {
  console.log('🎯 UptimeChart render:', {
    dataLength: data.length,
    timeRange,
    timeInterval,
    dateRange,
    sampleData: data.slice(0, 3),
    hasData: data.length > 0,
    firstDataPoint: data[0],
    lastDataPoint: data[data.length - 1],
    dataStructure: data[0] ? Object.keys(data[0]) : []
  });

  const handleChartClick = useCallback((clickData: any) => {
    if (onChartClick && clickData && clickData.activePayload && clickData.activePayload[0]) {
      onChartClick(clickData);
    }
  }, [onChartClick]);

  const renderDot = useCallback((props: any) => {
    const { payload, cx, cy, index } = props;
    if (!payload) return null;
    
    // Only show dots at state changes
    const isStateChange = payload.isOnline !== payload.prevIsOnline;
    if (!isStateChange) return null;
    
    const isOnline = payload.isOnline === 1;
    const color = isOnline ? '#10b981' : '#ef4444';
    const shadowColor = isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
    
    return (
      <g key={`dot-${index}-${payload.time}`}>
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill={color}
          stroke="#ffffff"
          strokeWidth={2}
          style={{ filter: `drop-shadow(0 2px 6px ${shadowColor})` }}
        />
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill="#ffffff"
          opacity={0.8}
        />
      </g>
    );
  }, []);

  // Show empty state if no data
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No data available for this period</p>
          <p className="text-sm mt-2">
            No heartbeat data found for the selected time range
          </p>
        </div>
      </div>
    );
  }

  console.log('🎯 About to render chart with data:', data.length, 'points');
  
  // Simple test visualization if chart fails
  const hasValidData = data.length > 0 && data.every(point => 
    typeof point.isOnline === 'number' && 
    typeof point.displayTime === 'string'
  );
  
  if (!hasValidData) {
    console.error('❌ Invalid chart data structure:', data.slice(0, 3));
  }
  
  return (
    <div className="h-[500px] relative">
      {/* Debug info */}
      <div className="absolute top-2 left-2 z-20 bg-blue-500 text-white px-2 py-1 rounded text-xs">
        Chart Data: {data.length} points | Valid: {hasValidData ? 'Yes' : 'No'}
      </div>
      
      {/* Date labels for left and right sides */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md border border-gray-200 shadow-sm">
          <span className="text-xs font-medium text-gray-600">
            {dateRange.startDate || 'Start Date'}
          </span>
        </div>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md border border-gray-200 shadow-sm">
          <span className="text-xs font-medium text-gray-600">
            {dateRange.endDate || 'End Date'}
          </span>
        </div>
      </div>
      
      {/* Scrollable chart container */}
      <div 
        className="overflow-x-auto overflow-y-hidden h-full"
        style={{ 
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin'
        }}
        ref={(el) => {
          if (el) {
            el.scrollLeft = scrollPosition;
          }
        }}
      >
        <div 
          style={{ 
            width: '100%',
            minWidth: '100%'
          }}
        >
          {console.log('🎯 Chart data being passed to LineChart:', data.slice(0, 5))}
          
          {/* Fallback simple visualization if chart fails */}
          {!hasValidData ? (
            <div className="flex items-center justify-center h-full text-red-500">
              <div className="text-center">
                <p className="text-lg font-medium">Chart Data Invalid</p>
                <p className="text-sm mt-2">Check console for details</p>
                <pre className="text-xs mt-4 bg-gray-100 p-2 rounded">
                  {JSON.stringify(data.slice(0, 3), null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={data} 
                key={`uptime-${timeInterval}`} 
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="displayTime" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 10, fill: '#666' }}
              />
              <YAxis 
                domain={[0, 1]}
                ticks={[0, 1]}
                tickFormatter={(value) => value === 1 ? 'Online' : 'Offline'}
                tick={{ fontSize: 12, fontWeight: 'bold' }}
                width={60}
              />
              <Tooltip 
                formatter={(value: any, name: string, props: any) => {
                  const data = props.payload;
                  return [
                    <div key="tooltip" className="text-sm">
                      <div className="font-medium">{data.displayTime}</div>
                      <div className="text-gray-600">
                        Status: {data.isOnline === 1 ? 'Online' : 'Offline'}
                      </div>
                      {data.batteryLevel > 0 && (
                        <div className="text-gray-600">
                          Battery: {Math.round(data.batteryLevel)}%
                        </div>
                      )}
                      {data.heartbeatCount > 0 && (
                        <div className="text-gray-600">
                          Heartbeats: {data.heartbeatCount}
                        </div>
                      )}
                    </div>
                  ];
                }}
              />
              <Line 
                type="monotone" 
                dataKey="isOnline" 
                stroke="#10b981"
                strokeWidth={3}
                dot={renderDot}
                onClick={handleChartClick}
                connectNulls={false}
              />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>Online</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>Offline</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span>State Change</span>
        </div>
      </div>
    </div>
  );
}
