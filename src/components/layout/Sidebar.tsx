import { useState, useEffect } from "react";
import { 
  Home, 
  Users, 
  Briefcase, 
  CheckSquare, 
  BarChart3,
  Settings,
  LogOut
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom"; // Fixed import syntax
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCRMData } from "@/hooks/useCRMData"; // Import useCRMData to get current user profile

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Deals", url: "/deals", icon: Briefcase },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const bottomNavItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { toast } = useToast();
  const { profiles } = useCRMData(); // Get profiles from useCRMData
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  // Find the current user's profile based on Supabase session
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profile = profiles.find(p => p.user_id === user.id);
        setCurrentUserProfile(profile);
      }
    };
    fetchUser();
  }, [profiles]); // Re-run when profiles data changes

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavClasses = (active: boolean) =>
    active 
      ? "bg-gradient-primary text-primary-foreground font-medium shadow-glow" 
      : "hover:bg-muted/50 transition-smooth";

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

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} transition-smooth bg-gradient-card border-r border-border/50`}
      collapsible="icon"
    >
      <SidebarContent className="p-4">
        {/* Logo */}
        <div className="mb-8 px-2">
          {!collapsed ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                CRM Pro
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
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
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Profile Initials (simplified) */}
        {currentUserProfile && (
          <div className="mt-6 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium mx-auto">
              {currentUserProfile.first_name.charAt(0)}{currentUserProfile.last_name.charAt(0)}
            </div>
          </div>
        )}

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
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className={`w-full justify-start space-x-3 px-3 py-2 h-auto text-left hover:bg-destructive/10 hover:text-destructive transition-smooth ${
                      collapsed ? "px-0 justify-center" : ""
                    }`}
                  >
                    <LogOut className="w-5 h-5" />
                    {!collapsed && <span>Sign Out</span>}
                  </Button>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}