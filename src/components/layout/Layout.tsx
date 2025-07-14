import { useState, useEffect } from "react";
import { AppSidebar } from "./Sidebar";
import { SidebarProvider, useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { UserProfileCard } from "@/components/UserProfileCard";
import { useCRMData } from "@/hooks/useCRMData";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"; // Import DrawerTrigger

export function Layout() {
  const { profiles } = useCRMData();
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const isMobile = useIsMobile();

  // Fetch current user profile
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profile = profiles.find(p => p.user_id === user.id);
        setCurrentUserProfile(profile);
      }
    };
    fetchUser();
  }, [profiles]);

  // useSidebar must be called unconditionally within the component
  const { setSidebarState, state: sidebarState } = useSidebar(); // Destructure setSidebarState
  const isSidebarOpen = sidebarState === "expanded";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Desktop Sidebar - always rendered, its width changes based on state */}
        {!isMobile && <AppSidebar />}

        {/* Main content area */}
        <div className={`flex-1 flex flex-col 
          ${!isMobile ? (isSidebarOpen ? 'ml-64' : 'ml-14') : ''} 
          transition-all duration-300 ease-in-out`}>
          <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center px-6 justify-between">
            <div className="flex items-center">
              {isMobile && ( // Mobile menu button and Drawer
                <Drawer open={isSidebarOpen} onOpenChange={(open) => setSidebarState(open ? "expanded" : "collapsed")}>
                  <DrawerTrigger asChild>
                    {/* Using SidebarTrigger here */}
                    <SidebarTrigger className="mr-4">
                      <Menu className="h-5 w-5" />
                    </SidebarTrigger>
                  </DrawerTrigger>
                  <DrawerContent side="left" className="w-64 h-full">
                    <AppSidebar />
                  </DrawerContent>
                </Drawer>
              )}
            </div>
            {currentUserProfile && <UserProfileCard profile={currentUserProfile} />}
          </header>
          <main className="flex-1 p-6 bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}