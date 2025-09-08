import React from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Eye,
  MousePointer,
  QrCode,
  TrendingUp,
  Users,
  MapPin,
  Plus,
  Play,
  Pause,
  MoreHorizontal,
} from "lucide-react";

// Mock data for demonstration
const metrics = [
  {
    title: "Total Impressions",
    value: "247,832",
    change: "+12.5% from last month",
    changeType: "positive" as const,
    icon: <Eye className="h-5 w-5" />,
    variant: "primary" as const,
  },
  {
    title: "Unique Riders Reached",
    value: "18,429",
    change: "+8.2% from last month",
    changeType: "positive" as const,
    icon: <Users className="h-5 w-5" />,
    variant: "success" as const,
  },
  {
    title: "Total Engagements",
    value: "9,847",
    change: "+15.7% from last month",
    changeType: "positive" as const,
    icon: <MousePointer className="h-5 w-5" />,
    variant: "info" as const,
  },
  {
    title: "Conversion Rate",
    value: "3.8%",
    change: "+0.3% from last month",
    changeType: "positive" as const,
    icon: <TrendingUp className="h-5 w-5" />,
    variant: "warning" as const,
  },
];

const recentCampaigns = [
  {
    id: 1,
    name: "Summer Coffee Special",
    status: "Active",
    impressions: "45,234",
    engagement: "1,847",
    budget: "$2,500",
    remaining: "$1,200",
  },
  {
    id: 2,
    name: "Happy Hour Promotion",
    status: "Paused",
    impressions: "23,891",
    engagement: "892",
    budget: "$1,800",
    remaining: "$450",
  },
  {
    id: 3,
    name: "New Menu Launch",
    status: "Active",
    impressions: "67,123",
    engagement: "2,934",
    budget: "$3,200",
    remaining: "$800",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Active":
      return <Badge className="bg-dashboard-success text-dashboard-success-foreground">Active</Badge>;
    case "Paused":
      return <Badge variant="secondary">Paused</Badge>;
    case "Completed":
      return <Badge variant="outline">Completed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function Dashboard() {
  return (
    <div className="space-y-8 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-100/20 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between relative">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Welcome back! Here's what's happening with your campaigns.
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-6 py-3 rounded-xl">
          <Plus className="h-5 w-5 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            changeType={metric.changeType}
            icon={metric.icon}
            variant={metric.variant}
          />
        ))}
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                <BarChart className="h-5 w-5" />
              </div>
              Performance Trends
            </CardTitle>
            <CardDescription className="text-base">
              Impressions and engagements over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl flex items-center justify-center relative overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="absolute top-8 right-8 w-1 h-1 bg-purple-500 rounded-full animate-pulse delay-100"></div>
                <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse delay-200"></div>
                <div className="absolute bottom-4 right-4 w-1 h-1 bg-emerald-500 rounded-full animate-pulse delay-300"></div>
              </div>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                  <BarChart className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-muted-foreground font-medium">Interactive Chart Coming Soon</p>
                <p className="text-sm text-muted-foreground/70">Real-time data visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Reach */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white">
                <MapPin className="h-5 w-5" />
              </div>
              Geographic Reach
            </CardTitle>
            <CardDescription className="text-base">
              Top performing neighborhoods and cities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { location: "Downtown", impressions: "89,234", engagement: "12.4%", color: "from-blue-500 to-blue-600" },
                { location: "University District", impressions: "67,891", engagement: "9.8%", color: "from-purple-500 to-purple-600" },
                { location: "Tech Corridor", impressions: "54,123", engagement: "15.2%", color: "from-cyan-500 to-cyan-600" },
                { location: "Arts Quarter", impressions: "34,567", engagement: "8.9%", color: "from-pink-500 to-pink-600" },
              ].map((area, index) => (
                <div key={index} className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 hover:from-gray-100/70 hover:to-gray-200/70 dark:hover:from-gray-700/70 dark:hover:to-gray-800/70 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${area.color}`}></div>
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">{area.location}</p>
                      <p className="text-sm text-muted-foreground">{area.impressions} impressions</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`bg-gradient-to-r ${area.color} text-white border-0 shadow-lg`}>
                      {area.engagement}
                    </Badge>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
              <QrCode className="h-5 w-5" />
            </div>
            Recent Campaigns
          </CardTitle>
          <CardDescription className="text-base">
            Your latest campaign performance and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <Table>
              <TableHeader className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-900/80">
                <TableRow className="border-gray-200/50 dark:border-gray-700/50">
                  <TableHead className="font-semibold text-foreground">Campaign Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground">Impressions</TableHead>
                  <TableHead className="font-semibold text-foreground">Engagements</TableHead>
                  <TableHead className="font-semibold text-foreground">Budget</TableHead>
                  <TableHead className="font-semibold text-foreground">Remaining</TableHead>
                  <TableHead className="w-[100px] font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCampaigns.map((campaign, index) => (
                  <TableRow key={campaign.id} className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 transition-all duration-300 border-gray-200/50 dark:border-gray-700/50">
                    <TableCell className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                      {campaign.name}
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell className="font-medium text-foreground">{campaign.impressions}</TableCell>
                    <TableCell className="font-medium text-foreground">{campaign.engagement}</TableCell>
                    <TableCell className="font-medium text-emerald-600">{campaign.budget}</TableCell>
                    <TableCell className="font-medium text-amber-600">{campaign.remaining}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors">
                          {campaign.status === "Active" ? (
                            <Pause className="h-4 w-4 text-red-500" />
                          ) : (
                            <Play className="h-4 w-4 text-emerald-500" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}