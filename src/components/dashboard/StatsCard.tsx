import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    trend: "up" | "down";
  };
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, change, className = "" }: StatsCardProps) {
  return (
    <Card className={`relative overflow-hidden bg-gradient-card border-border/50 hover:shadow-medium transition-smooth ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change && (
              <div className="flex items-center space-x-1">
                <span className={`text-xs font-medium ${
                  change.trend === "up" ? "text-success" : "text-destructive"
                }`}>
                  {change.trend === "up" ? "+" : ""}{change.value}%
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-xl shadow-glow">
            <Icon className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}