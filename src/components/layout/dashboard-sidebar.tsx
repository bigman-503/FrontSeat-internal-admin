import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Megaphone,
  PieChart,
  Settings,
  Target,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
  },
  {
    title: "Campaigns",
    url: "/campaigns",
    icon: Megaphone,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: PieChart,
  },
  {
    title: "Audience",
    url: "/audience",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const getNavClasses = (path: string) => {
    const baseClasses = "w-full justify-start transition-colors";
    if (isActive(path)) {
      return `${baseClasses} bg-dashboard-primary text-dashboard-primary-foreground`;
    }
    return `${baseClasses} hover:bg-muted`;
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r border-border">
        <div className="p-4">
          <div className="group flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-blue-500 to-primary rounded-xl flex items-center justify-center shadow-2xl group-hover:shadow-primary/30 transition-all duration-500 group-hover:scale-110">
                <span className="text-white font-bold text-lg">FS</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/30 to-blue-500/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            {!collapsed && (
              <div>
                <span className="font-bold text-xl md:text-2xl bg-gradient-to-r from-white via-white to-blue-200 bg-clip-text text-transparent group-hover:from-primary group-hover:to-blue-400 transition-all duration-500">
                  FrontSeat
                </span>
                <p className="text-xs text-muted-foreground">Advertiser Portal</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClasses(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}