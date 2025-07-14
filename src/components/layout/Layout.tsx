import { useState, useEffect } from "react";
import { AppSidebar } from "./Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { UserProfileCard } from "@/components/UserProfileCard"; // Import UserProfileCard
import { useCRMData } from "@/hooks/useCRMData"; // Import useCRMData
import { supabase } from "@/integrations/supabase/client"; // Import supabase

export function Layout() {
  const { profiles } = useCRMData();
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
  }, [profiles]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center px-6 justify-between"> {/* Added justify-between */}
            <div className="flex items-center">
              {/* Removed SidebarTrigger */}
              <h1 className="text-lg font-semibold text-foreground">CRM Dashboard</h1>
            </div>
            {currentUserProfile && <UserProfileCard profile={currentUserProfile} />} {/* Display UserProfileCard */}
          </header>
          <main className="flex-1 p-6 bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}