import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KanbanItem } from "@/types/crm";

interface KanbanStatusBadgeProps {
  status: KanbanItem['status'];
}

export function KanbanStatusBadge({ status }: KanbanStatusBadgeProps) {
  if (!status) return null;

  let className = "";
  switch (status) {
    case "Backlog":
      className = "bg-muted text-muted-foreground border-border";
      break;
    case "To Do":
      className = "bg-secondary text-secondary-foreground border-secondary";
      break;
    case "In Progress":
      className = "bg-warning text-warning-foreground border-warning";
      break;
    case "In Review":
      className = "bg-warning text-warning-foreground border-warning";
      break;
    case "Done":
      className = "bg-success text-success-foreground border-success";
      break;
    default:
      className = "bg-muted text-muted-foreground border-border";
  }

  return (
    <Badge className={cn("text-xs px-2 py-1", className)}>
      {status}
    </Badge>
  );
}