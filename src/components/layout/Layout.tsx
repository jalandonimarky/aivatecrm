import { AppSidebar } from "./Sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom"; // Import Outlet

export function Layout() { // Removed LayoutProps and children prop
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center px-6">
            <SidebarTrigger className="hover:bg-muted/50 transition-smooth" />
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-foreground">CRM Dashboard</h1>
            </div>
          </header>
          <main className="flex-1 p-6 bg-background">
            <Outlet /> {/* Render Outlet here */}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}