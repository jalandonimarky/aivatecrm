import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, differenceInDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { Deal } from "@/types/crm";

interface DealTimelineProps {
  deal: Deal;
}

const getStageBadgeClass = (stage: string) => {
  switch (stage) {
    case 'paid': return "bg-success text-success-foreground";
    case 'done_completed': return "bg-destructive text-destructive-foreground";
    case 'lead': return "bg-muted text-muted-foreground";
    case 'in_development': return "bg-accent text-accent-foreground";
    case 'proposal': return "bg-primary text-primary-foreground";
    case 'discovery_call': return "bg-warning text-warning-foreground";
    case 'cancelled': return "bg-secondary text-secondary-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

export function DealTimeline({ deal }: DealTimelineProps) {
  const createdAt = deal.created_at ? parseISO(deal.created_at) : null;
  const expectedCloseDate = deal.expected_close_date ? parseISO(deal.expected_close_date) : null;
  const today = startOfDay(new Date());

  let progressPercentage = 0;
  let daysRemainingText = "N/A";
  let totalDurationText = "N/A";

  if (createdAt && expectedCloseDate) {
    const totalDurationDays = differenceInDays(expectedCloseDate, createdAt);
    const elapsedDurationDays = differenceInDays(today, createdAt);

    if (totalDurationDays > 0) {
      progressPercentage = Math.min(100, Math.max(0, (elapsedDurationDays / totalDurationDays) * 100));
      totalDurationText = `${totalDurationDays} days`;
    } else if (totalDurationDays === 0) { // Deal created and expected to close on the same day
      progressPercentage = elapsedDurationDays >= 0 ? 100 : 0;
      totalDurationText = "1 day";
    }

    const remainingDays = differenceInDays(expectedCloseDate, today);
    if (remainingDays >= 0) {
      daysRemainingText = `${remainingDays} days remaining`;
    } else {
      daysRemainingText = `${Math.abs(remainingDays)} days overdue`;
    }
  } else if (createdAt) {
    // If no expected close date, just show created date and ongoing status
    daysRemainingText = "No end date set";
    totalDurationText = "Ongoing";
  }

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Project Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Start: {createdAt ? format(createdAt, "MMM dd, yyyy") : "N/A"}</span>
          <span>End: {expectedCloseDate ? format(expectedCloseDate, "MMM dd, yyyy") : "N/A"}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-foreground">Progress</p>
            <Badge className={getStageBadgeClass(deal.stage)}>
              {deal.stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {progressPercentage.toFixed(0)}% complete ({daysRemainingText})
          </p>
        </div>
      </CardContent>
    </Card>
  );
}