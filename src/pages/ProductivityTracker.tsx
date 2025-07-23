import React from "react";
import { useCRMData } from "@/hooks/useCRMData";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function ProductivityTracker() {
  const { loading } = useCRMData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Productivity Tracker
          </h1>
          <p className="text-muted-foreground">
            Manage your projects, tasks, and sub-tasks in one place.
          </p>
        </div>
        <Button
          className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>
      <div className="p-4 border rounded-lg bg-gradient-card">
        <p className="text-center text-muted-foreground">
          Productivity tracker functionality will be built here.
        </p>
      </div>
    </div>
  );
}