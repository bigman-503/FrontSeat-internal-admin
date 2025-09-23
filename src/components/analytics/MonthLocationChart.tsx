import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Route, Navigation } from 'lucide-react';
import { formatDatePST } from '@/lib/dateUtils';

interface DayLocationData {
  date: string;
  dayOfMonth: number;
  locationCount: number;
  totalDistance: number;
  avgAccuracy: number;
  timeSpan: number;
  hasData: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface MonthLocationChartProps {
  device: any;
  currentMonth: string;
  onDayClick?: (date: string) => void;
  onPreviousMonth?: () => void;
  onNextMonth?: () => void;
  selectedDate?: string;
}

export function MonthLocationChart({ 
  device, 
  currentMonth, 
  onDayClick, 
  onPreviousMonth, 
  onNextMonth, 
  selectedDate 
}: MonthLocationChartProps) {
  const [monthData, setMonthData] = useState<DayLocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!device?.deviceId) return;

    const fetchMonthLocationData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/analytics/device/${device.deviceId}/locations/month`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch month location data: ${response.statusText}`);
        }

        const data = await response.json();
        setMonthData(data.days || []);
      } catch (err) {
        console.error('Error fetching month location data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch month location data');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthLocationData();
  }, [device?.deviceId, currentMonth]);

  const getDistanceColor = (distance: number) => {
    if (distance >= 50) return 'bg-green-500';
    if (distance >= 20) return 'bg-yellow-500';
    if (distance >= 5) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getDistanceIntensity = (distance: number) => {
    if (distance >= 50) return 'opacity-100';
    if (distance >= 20) return 'opacity-80';
    if (distance >= 5) return 'opacity-60';
    return 'opacity-40';
  };

  // Group data by week
  const weeks = [];
  for (let i = 0; i < monthData.length; i += 7) {
    weeks.push(monthData.slice(i, i + 7));
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Location Overview
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
            Monthly Location Overview
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

  const currentMonthData = monthData.filter(day => day.isCurrentMonth);
  const totalDistance = currentMonthData.reduce((sum, day) => sum + day.totalDistance, 0);
  const totalLocations = currentMonthData.reduce((sum, day) => sum + day.locationCount, 0);
  const avgAccuracy = currentMonthData.length > 0 
    ? currentMonthData.reduce((sum, day) => sum + day.avgAccuracy, 0) / currentMonthData.length 
    : 0;
  const activeDays = currentMonthData.filter(day => day.hasData).length;

  return (
    <div className="space-y-6">
      {/* Month Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Distance</p>
                <p className="text-2xl font-bold text-blue-900">{totalDistance.toFixed(1)} km</p>
              </div>
              <Route className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Locations</p>
                <p className="text-2xl font-bold text-green-900">{totalLocations.toLocaleString()}</p>
              </div>
              <MapPin className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Avg Accuracy</p>
                <p className="text-2xl font-bold text-purple-900">{avgAccuracy.toFixed(1)}m</p>
              </div>
              <Navigation className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Active Days</p>
                <p className="text-2xl font-bold text-orange-900">{activeDays}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {currentMonth}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  Click on any day to view detailed location path
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPreviousMonth}
                className="p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNextMonth}
                className="p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded-md">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {weeks.map((week, weekIndex) => (
              <React.Fragment key={weekIndex}>
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`h-20 p-2 rounded-xl border-2 transition-all duration-300 cursor-pointer group ${
                      day.hasData 
                        ? selectedDate === day.date
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50 border-gray-200'
                        : 'opacity-30 border-gray-100'
                    }`}
                    onClick={() => day.hasData && onDayClick?.(day.date)}
                  >
                    <div className="flex flex-col justify-between h-full">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          day.isToday ? 'text-blue-600 font-bold' : 'text-gray-700'
                        }`}>
                          {day.dayOfMonth}
                        </span>
                        {day.hasData && (
                          <div className={`w-2 h-2 rounded-full ${getDistanceColor(day.totalDistance)} ${getDistanceIntensity(day.totalDistance)}`} />
                        )}
                      </div>
                      
                      {day.hasData && (
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-900">
                            {day.totalDistance.toFixed(1)} km
                          </div>
                          <div className="text-xs text-gray-600">
                            {day.locationCount} pts
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Activity Legend</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-600">High Activity (50+ km)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-gray-600">Moderate Activity (20-50 km)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-xs text-gray-600">Low Activity (5-20 km)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-600">Minimal Activity (&lt;5 km)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
