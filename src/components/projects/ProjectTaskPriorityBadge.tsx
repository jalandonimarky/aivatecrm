import React from "react";
import { Badge } from "@/components/ui/badge";
import type { ProjectTask } from "@/types/crm";

interface ProjectTaskPriorityBadgeProps {
  priority: ProjectTask['priority'];
}

export function ProjectTaskPriorityBadge({ priority }: ProjectTaskPriorityBadgeProps) {
  let className = "";
  switch (priority) {
    case "Low":
      className = "bg-secondary text-secondary-foreground border-secondary";
      break;
    case "Medium":
      className = "bg-accent text-accent-foreground border-accent";
      break;
    case "High":
      className = "bg-primary text-primary-foreground border-primary";
      break;
    default:
      className = "bg-muted text-muted-foreground border-border";
  }

  return <Badge className={className}>{priority}</Badge>;
}