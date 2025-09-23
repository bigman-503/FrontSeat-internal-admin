import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, Navigation } from 'lucide-react';
import { formatDatePST } from '@/lib/dateUtils';

interface LocationDaySummary {
  date: string;
  dayName: string;
  locationCount: number;
  totalDistance: number;
  avgAccuracy: number;
  timeSpan: number;
  hasData: boolean;
}

interface WeekLocationChartProps {
  device: any;
  onDayClick: (date: string) => void;
  selectedDate?: string;
}

export function WeekLocationChart({ device, onDayClick, selectedDate }: WeekLocationChartProps) {
  const [weekData, setWeekData] = useState<LocationDaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!device?.deviceId) return;

    const fetchWeekLocationData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/analytics/device/${device.deviceId}/locations/week`);
        if (!response.ok) {
          throw new Error(`Failed to fetch week location data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📊 Week location data received:', {
          dataKeys: Object.keys(data),
          daysLength: data.days?.length,
          sampleDay: data.days?.[0]
        });
        setWeekData(data.days || []);
      } catch (err) {
        console.error('Error fetching week location data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch week location data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeekLocationData();
  }, [device?.deviceId]);

  const generateEmptyWeekData = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dateString = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        timeZone: 'America/Los_Angeles' 
      });
      
      days.push({
        date: dateString,
        dayName,
        locationCount: 0,
        totalDistance: 0,
        avgAccuracy: 0,
        timeSpan: 0,
        hasData: false
      });
    }
    
    return days;
  };

  const getDayData = () => {
    if (weekData.length === 0) {
      return generateEmptyWeekData();
    }

    // Merge with empty data to ensure we have all 7 days
    const emptyData = generateEmptyWeekData();
    const dataMap = new Map(weekData.map(item => [item.date, item]));
    
    return emptyData.map(emptyDay => {
      const actualData = dataMap.get(emptyDay.date);
      return actualData ? { ...emptyDay, ...actualData } : emptyDay;
    });
  };

  const dayData = getDayData();

  const getTotalStats = () => {
    const totalLocations = dayData.reduce((sum, day) => sum + day.locationCount, 0);
    const totalDistance = dayData.reduce((sum, day) => sum + day.totalDistance, 0);
    const avgAccuracy = dayData.reduce((sum, day) => sum + day.avgAccuracy, 0) / Math.max(dayData.length, 1);

    return {
      totalLocations,
      totalDistance: totalDistance.toFixed(1),
      avgAccuracy: avgAccuracy.toFixed(1)
    };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            7-Day Location Overview
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
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            7-Day Location Overview
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

  return (
    <div className="space-y-4">
      {/* Week Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="p-3">
            <div className="text-2xl font-bold text-blue-600">{stats.totalLocations}</div>
            <div className="text-sm text-blue-700">Total Locations</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-3">
            <div className="text-2xl font-bold text-green-600">{stats.totalDistance} km</div>
            <div className="text-sm text-green-700">Est. Distance</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-3">
            <div className="text-2xl font-bold text-purple-600">{stats.avgAccuracy}m</div>
            <div className="text-sm text-purple-700">Avg Accuracy</div>
          </CardContent>
        </Card>
      </div>

      {/* Week Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            7-Day Location Overview
          </CardTitle>
          <CardDescription>Click on any day to view detailed location data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-3">
            {dayData.map((day, index) => {
              const isSelected = selectedDate === day.date;
              const hasData = day.locationCount > 0;
              
              return (
                <Card 
                  key={day.date}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : hasData 
                        ? 'hover:bg-gray-50' 
                        : 'opacity-60'
                  }`}
                  onClick={() => onDayClick(day.date)}
                >
                  <CardContent className="p-3 text-center">
                    <div className="space-y-2">
                      {/* Day Name */}
                      <div className="text-sm font-medium text-gray-700">
                        {day.dayName}
                      </div>
                      
                      {/* Date */}
                      <div className="text-xs text-gray-500">
                        {day.date.split('-').slice(1).join('/')}
                      </div>
                      
                      {/* Location Count */}
                      <div className="flex items-center justify-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-500" />
                        <span className="text-lg font-bold text-gray-800">
                          {day.locationCount}
                        </span>
                      </div>
                      
                      {/* Status */}
                      <div className="text-xs">
                        {hasData ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                            No Data
                          </span>
                        )}
                      </div>
                      
                      {/* Accuracy */}
                      {hasData && (
                        <div className="text-xs text-gray-500">
                          ±{day.avgAccuracy.toFixed(0)}m
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}