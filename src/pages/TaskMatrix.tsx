import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TaskMatrix() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Task Matrix
        </h1>
        <p className="text-muted-foreground">
          Manage your projects and tasks in a structured matrix view.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The Task Matrix feature is under construction. Please check back later!</p>
        </CardContent>
      </Card>
    </div>
  );
}