import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // Fixed import syntax
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Contacts } from "./pages/Contacts";
import { ContactDetails } from "./pages/ContactDetails";
import { Deals } from "./pages/Deals";
import { DealDetails } from "./pages/DealDetails";
import { Tasks } from "./pages/Tasks";
import { TaskDetails } from "./pages/TaskDetails";
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";
import { Kanban } from "./pages/Kanban";
import { KanbanItemDetails } from "./pages/KanbanItemDetails"; // Import new KanbanItemDetails page
import { WebApplications } from "./pages/WebApplications";
import { AuthPage } from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {session ? (
              // Authenticated routes
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/kanban" element={<Kanban />} />
                <Route path="/kanban/items/:id" element={<KanbanItemDetails />} /> {/* New route for Kanban item details */}
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/contacts/:id" element={<ContactDetails />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/deals/:id" element={<DealDetails />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/tasks/:id" element={<TaskDetails />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/web-applications" element={<WebApplications />} />
                <Route path="/settings" element={<Settings />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Route>
            ) : (
              // Unauthenticated route
              <Route path="*" element={<AuthPage />} />
            )}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;