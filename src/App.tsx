import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Contacts } from "./pages/Contacts";
import { Deals } from "./pages/Deals";
import { Tasks } from "./pages/Tasks";
import { Analytics } from "./pages/Analytics"; // Import the new Analytics component
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          <Route path="/contacts" element={
            <Layout>
              <Contacts />
            </Layout>
          } />
          <Route path="/deals" element={
            <Layout>
              <Deals />
            </Layout>
          } />
          <Route path="/tasks" element={
            <Layout>
              <Tasks />
            </Layout>
          } />
          <Route path="/analytics" element={
            <Layout>
              <Analytics /> {/* Render the Analytics component */}
            </Layout>
          } />
          <Route path="/settings" element={
            <Layout>
              <div className="text-center py-8">
                <h1 className="text-2xl font-bold">Settings Page</h1>
                <p className="text-muted-foreground">Coming soon...</p>
              </div>
            </Layout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;