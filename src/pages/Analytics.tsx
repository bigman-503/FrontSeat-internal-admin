import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { MetricCard } from "@/components/ui/metric-card";
import {
  BarChart3,
  Download,
  Eye,
  MousePointer,
  QrCode,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Clock,
  MapPin,
} from "lucide-react";

// Mock analytics data
const reachMetrics = [
  {
    title: "Total Impressions",
    value: "847,932",
    change: "+18.2% vs last period",
    changeType: "positive" as const,
    icon: <Eye className="h-5 w-5" />,
  },
  {
    title: "Unique Riders",
    value: "68,429",
    change: "+12.5% vs last period",
    changeType: "positive" as const,
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Avg. Ride Duration",
    value: "18.5 min",
    change: "+2.1 min vs last period",
    changeType: "positive" as const,
    icon: <Clock className="h-5 w-5" />,
  },
  {
    title: "Geographic Reach",
    value: "23 Areas",
    change: "5 new areas",
    changeType: "positive" as const,
    icon: <MapPin className="h-5 w-5" />,
  },
];

const engagementMetrics = [
  {
    title: "Total Engagements",
    value: "29,847",
    change: "+22.7% vs last period",
    changeType: "positive" as const,
    icon: <MousePointer className="h-5 w-5" />,
  },
  {
    title: "QR Code Scans",
    value: "12,395",
    change: "+31.4% vs last period",
    changeType: "positive" as const,
    icon: <QrCode className="h-5 w-5" />,
  },
  {
    title: "Interaction Rate",
    value: "3.53%",
    change: "+0.29% vs last period",
    changeType: "positive" as const,
    icon: <Target className="h-5 w-5" />,
  },
  {
    title: "Avg. Engagement Time",
    value: "45.2s",
    change: "+8.3s vs last period",
    changeType: "positive" as const,
    icon: <Clock className="h-5 w-5" />,
  },
];

const conversionMetrics = [
  {
    title: "Total Conversions",
    value: "4,729",
    change: "+15.8% vs last period",
    changeType: "positive" as const,
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    title: "Promo Redemptions",
    value: "3,142",
    change: "+18.2% vs last period",
    changeType: "positive" as const,
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    title: "Conversion Rate",
    value: "5.6%",
    change: "+0.4% vs last period",
    changeType: "positive" as const,
    icon: <Target className="h-5 w-5" />,
  },
  {
    title: "Revenue Attributed",
    value: "$47,293",
    change: "+$6,847 vs last period",
    changeType: "positive" as const,
    icon: <DollarSign className="h-5 w-5" />,
  },
];

const efficiencyMetrics = [
  {
    title: "CPM (Cost per 1000)",
    value: "$2.98",
    change: "-$0.23 vs last period",
    changeType: "positive" as const,
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    title: "CPE (Cost per Engagement)",
    value: "$0.84",
    change: "-$0.11 vs last period",
    changeType: "positive" as const,
    icon: <MousePointer className="h-5 w-5" />,
  },
  {
    title: "ROAS",
    value: "4.2x",
    change: "+0.7x vs last period",
    changeType: "positive" as const,
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    title: "Cost per Conversion",
    value: "$5.32",
    change: "-$0.98 vs last period",
    changeType: "positive" as const,
    icon: <Target className="h-5 w-5" />,
  },
];

const topPerformingCampaigns = [
  { name: "Summer Coffee Special", impressions: "245,123", engagements: "8,947", ctr: "3.65%", roas: "5.2x" },
  { name: "New Menu Launch", impressions: "189,456", engagements: "7,234", ctr: "3.82%", roas: "4.8x" },
  { name: "Happy Hour Promotion", impressions: "134,789", engagements: "5,123", ctr: "3.80%", roas: "4.1x" },
  { name: "Weekend Brunch Special", impressions: "98,234", engagements: "3,456", ctr: "3.52%", roas: "3.9x" },
];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [compareMode, setCompareMode] = useState("previous-period");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Detailed performance insights and campaign analytics.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={compareMode} onValueChange={setCompareMode}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous-period">vs Previous Period</SelectItem>
              <SelectItem value="year-over-year">vs Same Period Last Year</SelectItem>
              <SelectItem value="no-comparison">No Comparison</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="reach" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reach">Reach & Exposure</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
        </TabsList>

        <TabsContent value="reach" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reachMetrics.map((metric, index) => (
              <MetricCard
                key={index}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                changeType={metric.changeType}
                icon={metric.icon}
              />
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Impressions Over Time</CardTitle>
                <CardDescription>Daily impression trends for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Impressions chart would go here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Impressions by location and ride routes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Geographic map would go here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {engagementMetrics.map((metric, index) => (
              <MetricCard
                key={index}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                changeType={metric.changeType}
                icon={metric.icon}
              />
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Engagement Patterns</CardTitle>
              <CardDescription>When and how riders interact with your ads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Engagement patterns chart would go here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {conversionMetrics.map((metric, index) => (
              <MetricCard
                key={index}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                changeType={metric.changeType}
                icon={metric.icon}
              />
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Journey from impression to conversion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Conversion funnel would go here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {efficiencyMetrics.map((metric, index) => (
              <MetricCard
                key={index}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                changeType={metric.changeType}
                icon={metric.icon}
              />
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Cost Efficiency Trends</CardTitle>
              <CardDescription>How your costs and returns are trending over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Efficiency trends chart would go here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top Performing Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Campaigns</CardTitle>
          <CardDescription>
            Your best campaigns for the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformingCampaigns.map((campaign, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex-1">
                  <h4 className="font-medium">{campaign.name}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{campaign.impressions} impressions</span>
                    <span>{campaign.engagements} engagements</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium">{campaign.ctr}</p>
                    <p className="text-xs text-muted-foreground">CTR</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{campaign.roas}</p>
                    <p className="text-xs text-muted-foreground">ROAS</p>
                  </div>
                  <Badge className="bg-dashboard-success text-dashboard-success-foreground">
                    #{index + 1}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}