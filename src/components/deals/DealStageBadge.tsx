import React from "react";
import { Badge } from "@/components/ui/badge";
import type { Deal } from "@/types/crm";

interface DealStageBadgeProps {
  stage: Deal['stage'];
}

export function DealStageBadge({ stage }: DealStageBadgeProps) {
  let className = "";
  let text = "";

  switch (stage) {
    case "lead":
      className = "bg-muted text-muted-foreground border-muted";
      text = "Lead";
      break;
    case "discovery_call":
      className = "bg-warning text-warning-foreground border-warning";
      text = "Discovery Call";
      break;
    case "in_development":
      className = "bg-accent text-accent-foreground border-accent";
      text = "In Development";
      break;
    case "demo":
      className = "bg-primary text-primary-foreground border-primary";
      text = "Demo";
      break;
    case "paid":
      className = "bg-success text-success-foreground border-success";
      text = "Paid";
      break;
    case "completed":
      className = "bg-success text-success-foreground border-success"; // Changed to success
      text = "Completed";
      break;
    case "cancelled":
      className = "bg-destructive text-destructive-foreground border-destructive"; // Changed to destructive
      text = "Cancelled";
      break;
    default:
      className = "bg-muted text-muted-foreground border-border";
      text = String(stage).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return (
    <Badge className={className}>
      {text}
    </Badge>
  );
}