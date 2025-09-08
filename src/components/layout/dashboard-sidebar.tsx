import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Megaphone,
  PieChart,
  Settings,
  Target,
  Users,
  ChevronLeft,
  ChevronRight,
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
  const { state, setOpen, open } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const toggleSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Toggle clicked! Current state:', { open, collapsed, state });
    setOpen(!open);
  };

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

  const handleLogoClick = () => {
    if (collapsed) {
      setOpen(true);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800 border-r border-blue-700/50 shadow-2xl">
        {/* Header Section - Fixed Height */}
        <div className="h-16 border-b border-blue-700/30 flex items-center">
          <div className={`flex items-center w-full ${collapsed ? "justify-center" : "justify-between px-4"}`}>
            {!collapsed && (
              <div 
                className="group flex items-center cursor-pointer space-x-3"
                onClick={handleLogoClick}
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary via-blue-500 to-primary rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-105">
                    <span className="text-white font-bold text-sm">FS</span>
                  </div>
                </div>
                <div>
                  <span className="font-bold text-lg text-white">
                    FrontSeat
                  </span>
                  <p className="text-xs text-blue-200/80">Advertiser Portal</p>
                </div>
              </div>
            )}
            
            {/* Toggle Button */}
            {!collapsed && (
              <button
                onClick={(e) => toggleSidebar(e)}
                className="p-1.5 rounded-md hover:bg-blue-800/30 transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4 text-blue-200" />
              </button>
            )}
            
            {/* Toggle Button for Collapsed State */}
            {collapsed && (
              <button
                onClick={(e) => toggleSidebar(e)}
                className="p-1.5 rounded-md hover:bg-blue-800/30 transition-colors"
                title="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4 text-blue-200" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-4 py-4">
          <SidebarMenu className="space-y-1">
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className={`group relative w-full rounded-lg transition-all duration-200 ${
                    isActive(item.url)
                      ? "bg-blue-500/20 text-white border border-blue-400/30"
                      : "text-blue-100 hover:bg-blue-800/30 hover:text-white"
                  }`}
                >
                  <NavLink to={item.url} className={`flex items-center ${collapsed ? "justify-center px-3 py-2" : "px-3 py-2"}`}>
                    <div className={`${collapsed ? "flex items-center justify-center" : "flex items-center space-x-3"}`}>
                      <item.icon className={`h-4 w-4 ${isActive(item.url) ? "text-blue-300" : "text-blue-200"}`} />
                      {!collapsed && (
                        <span className="font-medium text-sm">{item.title}</span>
                      )}
                    </div>
                    {!collapsed && isActive(item.url) && (
                      <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full"></div>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}