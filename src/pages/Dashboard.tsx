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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your campaigns.
          </p>
        </div>
        <Button className="bg-dashboard-primary hover:bg-dashboard-primary/90 text-dashboard-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Performance Trends
            </CardTitle>
            <CardDescription>
              Impressions and engagements over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Chart visualization would go here</p>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Reach */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geographic Reach
            </CardTitle>
            <CardDescription>
              Top performing neighborhoods and cities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { location: "Downtown", impressions: "89,234", engagement: "12.4%" },
                { location: "University District", impressions: "67,891", engagement: "9.8%" },
                { location: "Tech Corridor", impressions: "54,123", engagement: "15.2%" },
                { location: "Arts Quarter", impressions: "34,567", engagement: "8.9%" },
              ].map((area, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{area.location}</p>
                    <p className="text-sm text-muted-foreground">{area.impressions} impressions</p>
                  </div>
                  <Badge variant="outline">{area.engagement}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
          <CardDescription>
            Your latest campaign performance and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead>Engagements</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell>{campaign.impressions}</TableCell>
                  <TableCell>{campaign.engagement}</TableCell>
                  <TableCell>{campaign.budget}</TableCell>
                  <TableCell>{campaign.remaining}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        {campaign.status === "Active" ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}