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
  Scatter // Added Scatter for markers
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

      // Ensure expected close date is not before created date
      if (dealExpectedCloseDate < dealCreatedAt) {
        dealExpectedCloseDate = addDays(dealCreatedAt, 1); // At least 1 day duration
      }

      const totalDurationDays = differenceInDays(dealExpectedCloseDate, dealCreatedAt) + 1;
      const totalDurationMs = totalDurationDays * (24 * 60 * 60 * 1000);

      const progressDays = Math.max(0, differenceInDays(today, dealCreatedAt) + 1);
      const actualProgressDays = Math.min(progressDays, totalDurationDays);
      const progressDurationMs = actualProgressDays * (24 * 60 * 60 * 1000);

      // If total duration is zero or negative, it's not a valid timeline to display
      if (totalDurationDays <= 0) {
        return null;
      }

      return {
        id: deal.id,
        name: deal.title,
        // Data for the bars
        barStartX: dealCreatedAt.getTime(), // X-position for the start of both bars
        totalDuration: totalDurationMs, // Width of the total duration bar
        progressDuration: progressDurationMs, // Width of the progress bar

        // Data for scatter markers
        creationMarkerX: dealCreatedAt.getTime(),
        expectedCloseMarkerX: dealExpectedCloseDate.getTime(),
        
        // Other deal data for tooltip and sorting
        stage: deal.stage,
        value: deal.value,
        contactName: deal.contact?.name || "N/A",
        assignedTo: deal.assigned_user ? getFullName(deal.assigned_user) : "Unassigned",
        actualCreatedAt: dealCreatedAt, // For tooltip
        actualExpectedCloseDate: dealExpectedCloseDate, // For tooltip
        color: getStageColor(deal.stage),
      };
    })
    .filter(Boolean) // Remove null entries (deals filtered out due to invalid duration)
    .sort((a, b) => {
      // Sort by stage first, then by creation date
      const stageOrder = ['lead', 'discovery_call', 'in_development', 'proposal', 'paid', 'done_completed', 'cancelled'];
      const stageA = stageOrder.indexOf(a.stage);
      const stageB = stageOrder.indexOf(b.stage);
      if (stageA !== stageB) {
        return stageA - stageB;
      }
      return a.barStartX - b.barStartX;
    });

  // Recalculate min/max dates for the X-axis domain based on all relevant dates
  const allDates = chartData.flatMap(d => [d.creationMarkerX, d.expectedCloseMarkerX]);
  const minChartDate = allDates.length > 0 ? Math.min(...allDates) : today.getTime();
  const maxChartDate = allDates.length > 0 ? Math.max(...allDates) : addDays(today, 60).getTime(); // Default to 60 days from today if no data

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

  const CustomBarShape = (props: any) => {
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
            No deals to display in the timeline.
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
                domain={[minChartDate, maxChartDate + (24 * 60 * 60 * 1000)]} // Extend domain slightly
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
                x="barStartX" // Start X position for the bar
                fill="hsl(var(--muted) / 0.5)" // Make it semi-transparent
                barSize={25}
                shape={<CustomBarShape />}
                name="Total Duration"
              />

              {/* Progress bar overlaid on top */}
              <Bar
                dataKey="progressDuration"
                x="barStartX" // Start X position for the bar
                barSize={25}
                shape={<CustomBarShape />}
                name="Progress"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-progress-${index}`} fill={entry.color} /> // Use stage color for progress
                ))}
              </Bar>

              {/* Scatter for creation date marker */}
              <Scatter
                dataKey="creationMarkerX"
                fill="hsl(var(--foreground))" // Changed to foreground (black) to match image
                shape="circle"
                radius={4}
                name="Created"
              />

              {/* Scatter for expected close date marker */}
              <Scatter
                dataKey="expectedCloseMarkerX"
                fill="hsl(var(--destructive))"
                shape="star" // Using a star shape for expected close
                radius={5}
                name="Expected Close"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}