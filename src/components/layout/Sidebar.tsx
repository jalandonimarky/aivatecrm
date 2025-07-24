import { useState, useEffect } from "react";
import { 
  Home, 
  Users, 
  Briefcase, 
  CheckSquare, 
  BarChart3,
  Settings,
  LogOut,
  KanbanSquare // Import KanbanSquare icon
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCRMData } from "@/hooks/useCRMData";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Project Management", url: "/kanban", icon: KanbanSquare }, // New Kanban item
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Deals", url: "/deals", icon: Briefcase },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const bottomNavItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, setState, isPinned } = useSidebar();
  const location = useLocation();
  const { toast } = useToast();
  const { profiles } = useCRMData();
  const currentPath = location.pathname;

  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } = {} } = await supabase.auth.getUser(); // Destructure with default empty object
      if (user) {
        const profile = profiles.find(p => p.id === user.id); // Changed from p.user_id to p.id
        setCurrentUserProfile(profile);
      }
    };
    fetchUser();
  }, [profiles]);

  const handleMouseEnter = () => {
    if (!isPinned) {
      setState('expanded');
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setState('collapsed');
    }
  };

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavClasses = (active: boolean) =>
    active 
      ? "bg-gradient-primary text-primary-foreground font-medium shadow-glow" 
      : "hover:bg-sidebar-accent hover:text-sidebar-foreground transition-smooth"; // Changed hover styles

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogoClick = () => {
    window.location.reload(); // Force a full page reload
  };

  return (
    <>
      {!isPinned && (
        <div
          onMouseEnter={handleMouseEnter}
          className="fixed top-0 left-0 h-full w-4 z-30"
        />
      )}
      <Sidebar
        onMouseLeave={handleMouseLeave}
        className={cn(
          "w-64 bg-gradient-card border-r border-border/50 transition-transform duration-300 ease-in-out",
          "fixed top-0 left-0 h-full z-40",
          state === "collapsed" ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <SidebarContent className="p-4">
          {/* Logo */}
          <div className="mb-8">
            <a href="/" onClick={handleLogoClick} className="flex items-center space-x-2 cursor-pointer">
              <img 
                src="https://cdn.shopify.com/s/files/1/0636/9768/2537/files/AIVATE_2.png?v=1752900464" 
                alt="AiVate CRM Logo" 
                className="w-12 h-12 object-contain"
              />
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                AiVate CRM
              </span>
            </a>
          </div>

          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel>
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${getNavClasses(isActive(item.url))}`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Bottom Navigation */}
          <div className="mt-auto space-y-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {bottomNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${getNavClasses(isActive(item.url))}`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  
                  <SidebarMenuItem>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-start space-x-3 px-3 py-2 h-auto text-left hover:bg-destructive/10 hover:text-destructive transition-smooth"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </Button>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </SidebarContent>
      </Sidebar>
    </>
  );
}