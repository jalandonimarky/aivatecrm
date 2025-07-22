import { useState, useEffect } from "react";
import { AppSidebar } from "./Sidebar";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { UserProfileCard } from "@/components/UserProfileCard";
import { useCRMData } from "@/hooks/useCRMData";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "./NotificationBell";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

function LayoutContent() {
  const { profiles } = useCRMData();
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const { state, isPinned } = useSidebar();

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
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        state === 'expanded' && isPinned ? 'ml-64' : 'ml-0'
      )}>
        <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center px-6 justify-between">
          <div className="flex items-center">
            <SidebarTrigger variant="ghost" size="icon" className="mr-4">
              <Menu className="h-5 w-5" />
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
  );
}

export function Layout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}