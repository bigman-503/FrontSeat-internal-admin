import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Route, Navigation } from 'lucide-react';
import { formatDatePST } from '@/lib/dateUtils';

interface DayLocationData {
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
  onDayClick?: (date: string) => void;
  selectedDate?: string;
}

export function WeekLocationChart({ device, onDayClick, selectedDate }: WeekLocationChartProps) {
  const [weekData, setWeekData] = useState<DayLocationData[]>([]);
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

  const getDistanceColor = (distance: number) => {
    if (distance >= 50) return 'from-green-400 to-green-600';
    if (distance >= 20) return 'from-yellow-400 to-yellow-600';
    if (distance >= 5) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const getDistanceLabel = (distance: number) => {
    if (distance >= 50) return 'High Activity';
    if (distance >= 20) return 'Moderate Activity';
    if (distance >= 5) return 'Low Activity';
    return 'Minimal Activity';
  };

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

  const totalDistance = weekData.reduce((sum, day) => sum + day.totalDistance, 0);
  const totalLocations = weekData.reduce((sum, day) => sum + day.locationCount, 0);
  const avgAccuracy = weekData.length > 0 
    ? weekData.reduce((sum, day) => sum + day.avgAccuracy, 0) / weekData.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Week Summary Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{totalLocations}</div>
          <div className="text-sm text-blue-700">Total Locations</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{totalDistance.toFixed(1)} km</div>
          <div className="text-sm text-green-700">Total Distance</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">{avgAccuracy.toFixed(1)}m</div>
          <div className="text-sm text-purple-700">Avg Accuracy</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">{weekData.filter(d => d.hasData).length}</div>
          <div className="text-sm text-orange-700">Active Days</div>
        </div>
      </div>

      {/* Week Timeline */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-4">
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  7-Day Location Overview
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  Click on any day to view detailed location path
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-3">
            {weekData.map((day, index) => (
              <Card
                key={day.date}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedDate === day.date 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                } ${!day.hasData ? 'opacity-50' : ''}`}
                onClick={() => day.hasData && onDayClick?.(day.date)}
              >
                <CardContent className="p-4 text-center">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-600">
                      {day.dayName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDatePST(new Date(day.date), { month: 'short', day: 'numeric' })}
                    </div>
                    
                    {day.hasData ? (
                      <>
                        <div className={`w-full h-2 rounded-full bg-gradient-to-r ${getDistanceColor(day.totalDistance)}`} />
                        <div className="text-lg font-bold text-gray-900">
                          {day.totalDistance.toFixed(1)} km
                        </div>
                        <div className="text-xs text-gray-600">
                          {day.locationCount} points
                        </div>
                        <div className="text-xs text-gray-500">
                          {day.timeSpan.toFixed(1)}h span
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-400">
                        No data
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
