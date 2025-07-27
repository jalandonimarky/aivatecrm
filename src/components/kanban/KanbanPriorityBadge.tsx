import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KanbanItem } from "@/types/crm";

interface KanbanPriorityBadgeProps {
  priority: KanbanItem['priority_level'];
}

export function KanbanPriorityBadge({ priority }: KanbanPriorityBadgeProps) {
  if (!priority) return null;

  let className = "";
  let text = "";

  switch (priority) {
    case "p0":
      className = "bg-destructive text-destructive-foreground border-destructive";
      text = "P0 - Urgent";
      break;
    case "p1":
      className = "bg-warning text-warning-foreground border-warning";
      text = "P1 - High";
      break;
    case "p2":
      className = "bg-accent text-accent-foreground border-accent";
      text = "P2 - Medium";
      break;
    case "p3":
      className = "bg-secondary text-secondary-foreground border-secondary";
      text = "P3 - Low";
      break;
    default:
      className = "bg-muted text-muted-foreground border-border";
      text = String(priority);
  }

  return (
    <Badge className={cn("text-xs px-2 py-0.5", className)}>
      {text}
    </Badge>
  );
}