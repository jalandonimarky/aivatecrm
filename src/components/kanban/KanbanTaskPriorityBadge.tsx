import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KanbanItem } from "@/types/crm";

interface KanbanTaskPriorityBadgeProps {
  priority: KanbanItem['priority'];
}

export function KanbanTaskPriorityBadge({ priority }: KanbanTaskPriorityBadgeProps) {
  if (!priority) return null;

  let className = "";
  switch (priority) {
    case "Low":
      className = "bg-secondary text-secondary-foreground border-secondary";
      break;
    case "Medium":
      className = "bg-accent text-accent-foreground border-accent";
      break;
    case "High":
      className = "bg-warning text-warning-foreground border-warning";
      break;
    case "Critical":
      className = "bg-destructive text-destructive-foreground border-destructive";
      break;
    default:
      className = "bg-muted text-muted-foreground border-border";
  }

  return (
    <Badge className={cn("text-xs px-2 py-1", className)}>
      {priority}
    </Badge>
  );
}