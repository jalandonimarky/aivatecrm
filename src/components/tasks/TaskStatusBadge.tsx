import React from "react";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types/crm";

interface TaskStatusBadgeProps {
  status: Task['status'];
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  let className = "";
  let text = "";

  switch (status) {
    case "Done":
      className = "bg-success text-success-foreground border-success";
      text = "Done";
      break;
    case "Backlog":
      className = "bg-muted text-muted-foreground border-border";
      text = "Backlog";
      break;
    case "To Do":
      className = "bg-secondary text-secondary-foreground border-secondary";
      text = "To Do";
      break;
    case "In Progress":
      className = "bg-accent text-accent-foreground border-accent";
      text = "In Progress";
      break;
    case "In Review":
      className = "bg-warning text-warning-foreground border-warning";
      text = "In Review";
      break;
    case "cancelled":
      className = "bg-destructive text-destructive-foreground border-destructive";
      text = "Cancelled";
      break;
    default:
      // Fallback for unexpected status values
      className = "bg-muted text-muted-foreground border-border";
      text = String(status).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return (
    <Badge className={className}>
      {text}
    </Badge>
  );
}