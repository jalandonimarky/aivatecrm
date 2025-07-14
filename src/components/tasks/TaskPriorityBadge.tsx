import React from "react";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types/crm";

interface TaskPriorityBadgeProps {
  priority: Task['priority'];
}

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  let className = "";
  let text = "";

  switch (priority) {
    case "low":
      className = "bg-secondary text-secondary-foreground border-secondary";
      text = "Low";
      break;
    case "medium":
      className = "bg-accent text-accent-foreground border-accent";
      text = "Medium";
      break;
    case "high":
      className = "bg-warning text-warning-foreground border-warning";
      text = "High";
      break;
    case "urgent":
      className = "bg-destructive text-destructive-foreground border-destructive";
      text = "Urgent";
      break;
    default:
      // Fallback for unexpected priority values
      className = "bg-muted text-muted-foreground border-border";
      text = String(priority).charAt(0).toUpperCase() + String(priority).slice(1);
  }

  return (
    <Badge className={className}>
      {text}
    </Badge>
  );
}