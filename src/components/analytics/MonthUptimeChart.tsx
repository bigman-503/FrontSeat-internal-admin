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
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                {currentMonth}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Click on any day to view detailed 24-hour timeline
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPreviousMonth}
                className="h-10 w-10 p-0 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNextMonth}
                className="h-10 w-10 p-0 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map(day => (
                <div key={day} className="p-3 text-center text-sm font-bold text-gray-600 bg-gray-50 rounded-lg">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-2">
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
                        relative p-3 h-20 rounded-xl border-2 transition-all duration-300 cursor-pointer group
                        ${day.isCurrentMonth 
                          ? selectedDate === day.date
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg scale-105'
                            : 'border-gray-200 hover:border-gray-400 bg-white hover:shadow-md hover:scale-102'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                        }
                        ${day.isToday ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
                      `}
                    >
                      {/* Day Number and Status */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold ${
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

                      {/* Uptime Visual Indicator */}
                      {day.isCurrentMonth && (
                        <div className="space-y-2">
                          {/* Large Uptime Percentage */}
                          <div className="text-center">
                            <span className={`text-lg font-bold ${
                              day.uptime >= 80 ? 'text-green-600' :
                              day.uptime >= 60 ? 'text-yellow-600' :
                              day.uptime >= 40 ? 'text-orange-600' :
                              'text-red-600'
                            }`}>
                              {day.uptime.toFixed(0)}%
                            </span>
                          </div>
                          
                          {/* Visual Status Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                day.uptime >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                day.uptime >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                day.uptime >= 40 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                                'bg-gradient-to-r from-red-400 to-red-600'
                              }`}
                              style={{ width: `${Math.min(100, day.uptime)}%` }}
                            />
                          </div>
                          
                          {/* Activity Summary */}
                          <div className="flex justify-center items-center gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-green-600 font-medium">{day.onlinePeriods}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-red-600 font-medium">{day.offlinePeriods}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-8 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Excellent (80%+)</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"></div>
                <span className="text-sm font-medium text-yellow-700">Good (60-79%)</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 rounded-lg border border-orange-200">
                <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"></div>
                <span className="text-sm font-medium text-orange-700">Fair (40-59%)</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-red-50 rounded-lg border border-red-200">
                <div className="w-4 h-4 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
                <span className="text-sm font-medium text-red-700">Poor (&lt;40%)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
