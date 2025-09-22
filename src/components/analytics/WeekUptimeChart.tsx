import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Calendar, Clock, TrendingUp, Zap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface DayData {
  date: string;
  dayName: string;
  uptime: number;
  onlinePeriods: number;
  offlinePeriods: number;
  totalHeartbeats: number;
  isOnline: boolean;
  peakActivity?: string;
}

interface WeekUptimeChartProps {
  data: DayData[];
  onDayClick?: (date: string) => void;
  selectedDate?: string;
}

export function WeekUptimeChart({ data, onDayClick, selectedDate }: WeekUptimeChartProps) {
  console.log('📊 WeekUptimeChart render:', {
    dataLength: data?.length || 0,
    sampleData: data?.slice(0, 2) || [],
    onDayClick: !!onDayClick,
    selectedDate
  });

  const getUptimeColor = (uptime: number) => {
    return 'from-blue-400 to-blue-600';
  };

  const getUptimeLabel = (uptime: number) => {
    if (uptime >= 80) return 'Excellent';
    if (uptime >= 60) return 'Good';
    if (uptime >= 40) return 'Fair';
    return 'Poor';
  };

  const getUptimeIcon = (uptime: number) => {
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getStatusGradient = (isOnline: boolean, uptime: number) => {
    return 'from-gray-50 to-gray-100 border-gray-200';
  };

  // Generate empty data for missing days if needed
  const generateEmptyWeekData = () => {
    const emptyData = [];
    
    // Get current time in PST to match backend data
    const now = new Date();
    const nowPST = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    
    // Generate 7 days going back from today (PST)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(nowPST);
      date.setDate(nowPST.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      emptyData.push({
        date: dateStr,
        dayName: dayName,
        uptime: 0,
        isOnline: false,
        totalHeartbeats: 0,
        onlinePeriods: 0,
        offlinePeriods: 96, // 24 hours * 4 (15-minute intervals)
        peakActivityHour: 0,
        averageBatteryLevel: 0
      });
    }
    
    return emptyData;
  };

  // Use empty data if no data is available
  const displayData = data.length > 0 ? data : generateEmptyWeekData();

  const averageUptime = displayData.length > 0 ? displayData.reduce((sum, day) => sum + day.uptime, 0) / displayData.length : 0;

  return (
    <div className="space-y-6">
      {/* Week Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 border-blue-300 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-blue-700">Average Uptime</p>
                </div>
                <p className="text-3xl font-bold text-blue-900">{averageUptime.toFixed(1)}%</p>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    averageUptime >= 80 ? 'bg-green-500' :
                    averageUptime >= 60 ? 'bg-yellow-500' :
                    averageUptime >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-blue-600 font-medium">
                    {averageUptime >= 80 ? 'Excellent' :
                     averageUptime >= 60 ? 'Good' :
                     averageUptime >= 40 ? 'Fair' : 'Poor'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-purple-700">Total Heartbeats</p>
                </div>
                <p className="text-3xl font-bold text-purple-900">
                  {displayData.reduce((sum, day) => sum + day.totalHeartbeats, 0).toLocaleString()}
                </p>
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-purple-600" />
                  <span className="text-xs text-purple-600 font-medium">
                    Device activity
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week Timeline */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  7-Day Uptime Overview
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  Click on any day to view detailed 24-hour timeline
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-gray-500">Week Trend</p>
                <div className="flex items-center gap-1">
                  {averageUptime >= 80 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : averageUptime >= 60 ? (
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                  )}
                  <span className={`text-sm font-semibold ${
                    averageUptime >= 80 ? 'text-green-600' :
                    averageUptime >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {averageUptime >= 60 ? 'Stable' : 'Needs Attention'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Day Cards */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 min-w-max lg:min-w-0 pb-2">
              {displayData.map((day, index) => (
                        <div
                          key={day.date}
                          onClick={() => {
                            console.log('🖱️ Day clicked:', day.date);
                            onDayClick?.(day.date);
                          }}
                          className={`
                    relative group p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1
                    bg-gradient-to-br ${getStatusGradient(day.isOnline, day.uptime)}
                    ${selectedDate === day.date 
                      ? 'border-blue-500 shadow-lg scale-105 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-400'
                    }
                    animate-in fade-in-0 slide-in-from-bottom-2 duration-500
                    min-h-[180px] w-full
                  `}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Day Header with Status Icon */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <p className="text-xs font-bold text-gray-900">{day.dayName}</p>
                        <p className="text-[10px] text-gray-600">{day.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getUptimeIcon(day.uptime)}
                      <Badge 
                        variant="secondary"
                        className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-500 text-white shadow-sm"
                      >
                        {day.isOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                  </div>

                  {/* Uptime Progress Circle */}
                  <div className="flex items-center justify-center mb-3">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-200"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={`${getUptimeColor(day.uptime)}`}
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          fill="none"
                          strokeDasharray={`${day.uptime}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-900">{day.uptime.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>


                  {/* Heartbeats Only */}
                  <div className="flex items-center justify-center gap-1 bg-white/50 rounded-lg p-1.5">
                    <Activity className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-blue-700 font-medium">
                      {day.totalHeartbeats.toLocaleString()}
                    </span>
                  </div>

                  {/* Hover Effect Indicator */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  </div>

                  {/* Selection Indicator */}
                  {selectedDate === day.date && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
