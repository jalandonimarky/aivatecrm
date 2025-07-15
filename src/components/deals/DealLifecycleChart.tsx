import React from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  ReferenceLine,
} from "recharts";
import { format, parseISO, differenceInDays, addDays, startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Deal, Profile } from "@/types/crm";
import { useCRMData } from "@/hooks/useCRMData";

interface DealLifecycleChartProps {
  deals: Deal[];
  profiles: Profile[];
}

const getStageColor = (stage: Deal['stage']) => {
  switch (stage) {
    case 'paid': return "hsl(var(--success))";
    case 'done_completed': return "hsl(var(--destructive))";
    case 'lead': return "hsl(var(--muted-foreground))";
    case 'in_development': return "hsl(var(--accent))";
    case 'proposal': return "hsl(var(--primary))";
    case 'discovery_call': return "hsl(var(--warning))";
    case 'cancelled': return "hsl(var(--secondary))";
    default: return "hsl(var(--foreground))";
  }
};

export function DealLifecycleChart({ deals, profiles }: DealLifecycleChartProps) {
  const { getFullName } = useCRMData();

  const today = startOfDay(new Date());

  const chartData = deals
    .filter(deal => deal.created_at)
    .map((deal) => {
      const dealCreatedAt = parseISO(deal.created_at);
      let dealExpectedCloseDate = deal.expected_close_date ? parseISO(deal.expected_close_date) : addDays(dealCreatedAt, 30);

      if (dealExpectedCloseDate < dealCreatedAt) {
        dealExpectedCloseDate = addDays(dealCreatedAt, 1);
      }

      const totalDurationDays = differenceInDays(dealExpectedCloseDate, dealCreatedAt) + 1;
      const totalDurationMs = totalDurationDays * (24 * 60 * 60 * 1000);

      const progressDays = Math.max(0, differenceInDays(today, dealCreatedAt) + 1);
      const actualProgressDays = Math.min(progressDays, totalDurationDays);
      const progressDurationMs = actualProgressDays * (24 * 60 * 60 * 1000);

      if (totalDurationDays <= 0) {
        return null;
      }

      return {
        id: deal.id,
        name: deal.title,
        startDate: dealCreatedAt.getTime(), // Absolute start of the deal
        totalDuration: totalDurationMs, // Total length of the bar
        progressDuration: progressDurationMs, // Filled portion of the bar
        stage: deal.stage,
        value: deal.value,
        contactName: deal.contact?.name || "N/A",
        assignedTo: deal.assigned_user ? getFullName(deal.assigned_user) : "Unassigned",
        actualCreatedAt: dealCreatedAt, // For tooltip
        actualExpectedCloseDate: dealExpectedCloseDate, // For tooltip
        color: getStageColor(deal.stage),
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const stageOrder = ['lead', 'discovery_call', 'in_development', 'proposal', 'paid', 'done_completed', 'cancelled'];
      const stageA = stageOrder.indexOf(a.stage);
      const stageB = stageOrder.indexOf(b.stage);
      if (stageA !== stageB) {
        return stageA - stageB;
      }
      return a.startDate - b.startDate;
    });

  const allDates = chartData.flatMap(d => [d.startDate, d.actualExpectedCloseDate.getTime()]);
  const minChartDate = allDates.length > 0 ? Math.min(...allDates) : today.getTime();
  const maxChartDate = allDates.length > 0 ? Math.max(...allDates) : addDays(today, 60).getTime();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card className="p-3 border border-border rounded-lg shadow-medium">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Stage: <span style={{ color: getStageColor(data.stage) }}>{data.stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Value: ${data.value.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            Contact: {data.contactName}
          </p>
          <p className="text-sm text-muted-foreground">
            Assigned To: {data.assignedTo}
          </p>
          <p className="text-sm text-muted-foreground">
            Created: {format(data.actualCreatedAt, "MMM dd, yyyy")}
          </p>
          <p className="text-sm text-muted-foreground">
            Expected End: {format(data.actualExpectedCloseDate, "MMM dd, yyyy")}
          </p>
          <p className="text-sm text-muted-foreground">
            Total Duration: {data.totalDuration / (24 * 60 * 60 * 1000)} days
          </p>
          <p className="text-sm text-muted-foreground">
            Progress: {data.progressDuration / (24 * 60 * 60 * 1000)} days
          </p>
        </Card>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { x, y, width, height, fill } = props;
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={4}
        ry={4}
      />
    );
  };

  const getXAxisTickFormatter = (minDate: number, maxDate: number) => {
    const diffDays = differenceInDays(new Date(maxDate), new Date(minDate));
    if (diffDays <= 30) {
      return (tick: number) => format(new Date(tick), "MMM dd");
    } else if (diffDays <= 365) {
      return (tick: number) => format(new Date(tick), "MMM yy");
    } else {
      return (tick: number) => format(new Date(tick), "yyyy");
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Deal Lifecycle Timeline</CardTitle>
      </CardHeader>
      <CardContent className="h-96">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No active deals to display in the timeline.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="1 1" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis
                type="number"
                dataKey="startDate"
                domain={[minChartDate, maxChartDate + (24 * 60 * 60 * 1000)]}
                tickFormatter={getXAxisTickFormatter(minChartDate, maxChartDate)}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                width={150}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Reference line for "Today" */}
              <ReferenceLine
                x={today.getTime()}
                stroke="hsl(var(--primary))"
                strokeDasharray="3 3"
                label={{ value: "Today", position: "top", fill: "hsl(var(--primary))", fontSize: 12 }}
              />

              {/* Background bar for total duration */}
              <Bar
                dataKey="totalDuration"
                fill="hsl(var(--muted))" // Muted background color
                barSize={25}
                shape={<CustomBar />}
              />

              {/* Progress bar overlaid on top */}
              <Bar
                dataKey="progressDuration"
                barSize={25}
                shape={<CustomBar />}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-progress-${index}`} fill={entry.color} /> // Use stage color for progress
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}