import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  CheckSquare, 
  BarChart3, 
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Target,
  Database,
  Calendar,
  Menu,
  X
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Configurations", url: "/messaging", icon: MessageSquare },
  { title: "Master Table", url: "/master-table", icon: Database, special: true },
];

const secondaryItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: HelpCircle },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavClasses = (path: string) => {
    const baseClasses = "transition-all duration-200 hover:bg-accent/50";
    return isActive(path) 
      ? `${baseClasses} bg-primary/10 text-primary border-r-2 border-primary font-medium`
      : baseClasses;
  };

  return (
    <Sidebar 
      className={cn(
        "border-r border-border/40 bg-gradient-to-b from-card to-muted/30",
        isCollapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarContent className="py-6">
        {/* Logo Section */}
        <div className={cn(
          "flex items-center gap-3 px-6 mb-8",
          isCollapsed && "px-4 justify-center"
        )}>
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-soft">
            <Target className="w-4 h-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-foreground">OutreachCRM</h1>
              <p className="text-xs text-muted-foreground">Orchestration Hub</p>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <div className={cn(
          "flex mb-6",
          isCollapsed ? "justify-center px-4" : "justify-end px-6"
        )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-8 h-8 p-0 hover:bg-accent/80 transition-all duration-200"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <Menu className="w-5 h-5 transition-transform duration-200" />
            ) : (
              <X className="w-5 h-5 transition-transform duration-200" />
            )}
          </Button>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Main
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="px-3 space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={cn(
                        getNavClasses(item.url),
                        item.special && "glassmorphism-button"
                      )}
                    >
                      <item.icon className={cn(
                        "transition-colors",
                        isActive(item.url) ? "text-primary" : "text-muted-foreground",
                        isCollapsed ? "w-6 h-6 mx-auto" : "w-5 h-5 mr-3"
                      )} />
                      {!isCollapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Navigation */}
        <SidebarGroup className="mt-8">
          {!isCollapsed && (
            <SidebarGroupLabel className="px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Support
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="px-3 space-y-1">
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={getNavClasses(item.url)}
                    >
                      <item.icon className={cn(
                        "transition-colors",
                        isActive(item.url) ? "text-primary" : "text-muted-foreground",
                        isCollapsed ? "w-6 h-6 mx-auto" : "w-5 h-5 mr-3"
                      )} />
                      {!isCollapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
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