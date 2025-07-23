import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ProjectManagement() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine the active tab based on the URL pathname
  const getActiveTab = () => {
    if (location.pathname.startsWith("/project-management/aivate")) {
      return "aivate";
    }
    return "buds-bonfire"; // Default to Buds & Bonfire
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/project-management/${value}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
        Project Management
      </h1>
      <p className="text-muted-foreground">
        Manage projects across different platforms.
      </p>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buds-bonfire">Buds & Bonfire</TabsTrigger>
          <TabsTrigger value="aivate">AiVate</TabsTrigger>
        </TabsList>
        <TabsContent value="buds-bonfire" className="mt-6">
          {/* Outlet will render nested routes for Buds & Bonfire */}
          <Outlet />
        </TabsContent>
        <TabsContent value="aivate" className="mt-6">
          {/* Outlet will render nested routes for AiVate */}
          <Outlet />
        </TabsContent>
      </Tabs>
    </div>
  );
}