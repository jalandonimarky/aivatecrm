import React from "react";
import { Badge } from "@/components/ui/badge";
import type { ProjectTask } from "@/types/crm";

interface ProjectTaskStatusBadgeProps {
  status: ProjectTask['status'];
}

export function ProjectTaskStatusBadge({ status }: ProjectTaskStatusBadgeProps) {
  let className = "";
  switch (status) {
    case "On Track":
      className = "bg-success text-success-foreground border-success";
      break;
    case "At Risk":
      className = "bg-warning text-warning-foreground border-warning";
      break;
    case "Off Track":
      className = "bg-destructive text-destructive-foreground border-destructive";
      break;
    default:
      className = "bg-muted text-muted-foreground border-border";
  }

  return <Badge className={className}>{status}</Badge>;
}