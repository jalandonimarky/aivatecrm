import React from "react";
import { Badge } from "@/components/ui/badge";
import type { Deal } from "@/types/crm";

interface DealTierBadgeProps {
  tier: Deal['tier'];
}

export function DealTierBadge({ tier }: DealTierBadgeProps) {
  let className = "";
  let text = tier || "N/A";

  if (tier?.startsWith("1-OFF Projects")) {
    className = "bg-secondary text-secondary-foreground border-secondary";
  } else if (tier?.startsWith("System Development")) {
    className = "bg-accent text-accent-foreground border-accent";
  } else {
    className = "bg-muted text-muted-foreground border-border";
  }

  return (
    <Badge className={className}>
      {text}
    </Badge>
  );
}