import React from "react";
import { Badge } from "@/components/ui/badge";
import type { KanbanItem } from "@/types/crm";

interface KanbanStatusBadgeProps {
  status: KanbanItem['status'];
}

export function KanbanStatusBadge({ status }: KanbanStatusBadgeProps) {
  if (!status) return null;

  let className = "";
  let text = "";

  switch (status) {
    case "new":
      className = "bg-primary text-primary-foreground border-primary";
      text = "New";
      break;
    case "in_progress":
      className = "bg-accent text-accent-foreground border-accent";
      text = "In Progress";
      break;
    case "closed":
      className = "bg-success text-success-foreground border-success";
      text = "Closed";
      break;
    default:
      className = "bg-muted text-muted-foreground border-border";
      text = String(status).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return (
    <Badge className={className}>
      {text}
    </Badge>
  );
}