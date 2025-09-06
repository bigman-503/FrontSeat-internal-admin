import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Edit,
  Filter,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

// Mock campaign data
const campaigns = [
  {
    id: 1,
    name: "Summer Coffee Special",
    description: "Promote our new iced coffee collection",
    status: "Active",
    startDate: "2024-01-15",
    endDate: "2024-02-15",
    budget: "$2,500",
    spent: "$1,300",
    impressions: "45,234",
    engagements: "1,847",
    ctr: "4.1%",
    targeting: "Downtown, Morning Commuters",
  },
  {
    id: 2,
    name: "Happy Hour Promotion",
    description: "Drive traffic during slow hours",
    status: "Paused",
    startDate: "2024-01-10",
    endDate: "2024-02-28",
    budget: "$1,800",
    spent: "$1,350",
    impressions: "23,891",
    engagements: "892",
    ctr: "3.7%",
    targeting: "Business District, Evening",
  },
  {
    id: 3,
    name: "New Menu Launch",
    description: "Introduce our seasonal dishes",
    status: "Active",
    startDate: "2024-01-20",
    endDate: "2024-03-01",
    budget: "$3,200",
    spent: "$2,400",
    impressions: "67,123",
    engagements: "2,934",
    ctr: "4.4%",
    targeting: "University Area, All Day",
  },
  {
    id: 4,
    name: "Weekend Brunch Special",
    description: "Weekend-focused campaign for brunch items",
    status: "Completed",
    startDate: "2023-12-01",
    endDate: "2023-12-31",
    budget: "$1,500",
    spent: "$1,500",
    impressions: "34,567",
    engagements: "1,234",
    ctr: "3.6%",
    targeting: "Residential Areas, Weekends",
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

export default function Campaigns() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Create, manage, and monitor your advertising campaigns.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-dashboard-primary hover:bg-dashboard-primary/90 text-dashboard-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new advertising campaign to reach riders in your area.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input id="name" placeholder="Enter campaign name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe your campaign" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input id="start-date" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input id="end-date" type="date" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="budget">Budget ($)</Label>
                <Input id="budget" type="number" placeholder="2500" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targeting">Targeting</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="downtown">Downtown</SelectItem>
                    <SelectItem value="university">University District</SelectItem>
                    <SelectItem value="business">Business District</SelectItem>
                    <SelectItem value="residential">Residential Areas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Creative Upload</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your creative here, or click to browse
                  </p>
                  <Button variant="outline" className="mt-2">
                    Choose File
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-dashboard-primary hover:bg-dashboard-primary/90 text-dashboard-primary-foreground"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            Manage your campaigns and track their performance metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{campaign.targeting}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{campaign.startDate}</p>
                      <p className="text-muted-foreground">to {campaign.endDate}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{campaign.spent} / {campaign.budget}</p>
                      <p className="text-muted-foreground">
                        {Math.round((parseInt(campaign.spent.replace('$', '').replace(',', '')) / 
                                   parseInt(campaign.budget.replace('$', '').replace(',', ''))) * 100)}% used
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{campaign.impressions} impressions</p>
                      <p className="text-muted-foreground">{campaign.engagements} engagements</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{campaign.ctr}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          {campaign.status === "Active" ? (
                            <>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Resume
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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