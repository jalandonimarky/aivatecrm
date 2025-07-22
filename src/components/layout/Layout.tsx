import { useState, useEffect } from "react";
import { AppSidebar } from "./Sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"; // Import SidebarTrigger
import { Outlet } from "react-router-dom";
import { UserProfileCard } from "@/components/UserProfileCard";
import { useCRMData } from "@/hooks/useCRMData";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "./NotificationBell";
import { Button } from "@/components/ui/button"; // Import Button
import { Menu } from "lucide-react"; // Import Menu icon

export function Layout() {
  const { profiles } = useCRMData();
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profile = profiles.find(p => p.id === user.id);
        setCurrentUserProfile(profile);
      }
    };
    fetchUser();
  }, [profiles]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center px-6 justify-between">
            <div className="flex items-center">
              <SidebarTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-4">
                  <Menu className="h-5 w-5" />
                </Button>
              </SidebarTrigger>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              {currentUserProfile && <UserProfileCard profile={currentUserProfile} />}
            </div>
          </header>
          <main className="flex-1 p-6 bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}