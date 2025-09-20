import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { UptimeStats as UptimeStatsType } from '@/types/analytics';

interface UptimeStatsProps {
  stats: UptimeStatsType;
}

export function UptimeStats({ stats }: UptimeStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Uptime</p>
              <p className="text-2xl font-bold text-green-800">{stats.uptimePercentage}%</p>
              <p className="text-xs text-green-600">{stats.totalUptime} min total</p>
            </div>
            <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
              <Activity className="h-6 w-6 text-green-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Sessions</p>
              <p className="text-2xl font-bold text-blue-800">{stats.totalSessions}</p>
              <p className="text-xs text-blue-600">Avg: {stats.averageSessionLength} min</p>
            </div>
            <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Longest Online</p>
              <p className="text-2xl font-bold text-purple-800">{stats.longestSession} min</p>
              <p className="text-xs text-purple-600">Best session</p>
            </div>
            <div className="h-12 w-12 bg-purple-200 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Longest Offline</p>
              <p className="text-2xl font-bold text-orange-800">{stats.longestOffline} min</p>
              <p className="text-xs text-orange-600">Worst gap</p>
            </div>
            <div className="h-12 w-12 bg-orange-200 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-700" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
