import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Activity, TrendingUp, Clock } from 'lucide-react';

interface DayData {
  date: string;
  dayOfMonth: number;
  uptime: number;
  onlinePeriods: number;
  offlinePeriods: number;
  totalHeartbeats: number;
  isOnline: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface MonthUptimeChartProps {
  data: DayData[];
  currentMonth: string;
  onDayClick?: (date: string) => void;
  onPreviousMonth?: () => void;
  onNextMonth?: () => void;
  selectedDate?: string;
}

export function MonthUptimeChart({ 
  data, 
  currentMonth, 
  onDayClick, 
  onPreviousMonth, 
  onNextMonth, 
  selectedDate 
}: MonthUptimeChartProps) {
  console.log('📅 MonthUptimeChart render:', {
    dataLength: data?.length || 0,
    sampleData: data?.slice(0, 3) || [],
    allData: data,
    currentMonth,
    onDayClick: !!onDayClick,
    selectedDate
  });

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 80) return 'bg-green-500';
    if (uptime >= 60) return 'bg-yellow-500';
    if (uptime >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getUptimeIntensity = (uptime: number) => {
    if (uptime >= 80) return 'opacity-100';
    if (uptime >= 60) return 'opacity-80';
    if (uptime >= 40) return 'opacity-60';
    return 'opacity-40';
  };

  // Handle empty data
  if (data.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">No Data Available</h3>
                <p className="text-gray-500">No uptime data found for the selected 30-day period.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate month statistics
  const currentMonthData = data.filter(day => day.isCurrentMonth);
  const averageUptime = currentMonthData.length > 0 
    ? currentMonthData.reduce((sum, day) => sum + day.uptime, 0) / currentMonthData.length 
    : 0;
  const totalOnlinePeriods = currentMonthData.reduce((sum, day) => sum + day.onlinePeriods, 0);
  const totalOfflinePeriods = currentMonthData.reduce((sum, day) => sum + day.offlinePeriods, 0);
  const totalHeartbeats = currentMonthData.reduce((sum, day) => sum + day.totalHeartbeats, 0);

  // Group data by week
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Month Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Monthly Average</p>
                <p className="text-2xl font-bold text-blue-900">{averageUptime.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Online Days</p>
                <p className="text-2xl font-bold text-green-900">
                  {currentMonthData.filter(day => day.isOnline).length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Offline Days</p>
                <p className="text-2xl font-bold text-red-900">
                  {currentMonthData.filter(day => !day.isOnline).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Heartbeats</p>
                <p className="text-2xl font-bold text-purple-900">{totalHeartbeats.toLocaleString()}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {currentMonth}
              </CardTitle>
              <CardDescription>
                Click on any day to view detailed 24-hour timeline
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPreviousMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNextMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1">
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="space-y-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      onClick={() => {
                        if (day.isCurrentMonth) {
                          console.log('🖱️ Month day clicked:', day.date);
                          onDayClick?.(day.date);
                        }
                      }}
                      className={`
                        relative p-2 h-16 rounded-lg border transition-all duration-200 cursor-pointer
                        ${day.isCurrentMonth 
                          ? selectedDate === day.date
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                        }
                        ${day.isToday ? 'ring-2 ring-blue-300' : ''}
                      `}
                    >
                      {/* Day Number */}
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${
                          day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {day.dayOfMonth}
                        </span>
                        <div className="flex items-center gap-1">
                          {selectedDate === day.date && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                          )}
                          {day.isToday && selectedDate !== day.date && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      </div>

                      {/* Uptime Indicator */}
                      {day.isCurrentMonth && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">
                              {day.uptime.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full transition-all duration-300 ${getUptimeColor(day.uptime)} ${getUptimeIntensity(day.uptime)}`}
                              style={{ width: `${Math.min(100, day.uptime)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-green-600">↑{day.onlinePeriods}</span>
                            <span className="text-red-600">↓{day.offlinePeriods}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Excellent (80%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-600">Good (60-79%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span className="text-sm text-gray-600">Fair (40-59%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">Poor (&lt;40%)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
