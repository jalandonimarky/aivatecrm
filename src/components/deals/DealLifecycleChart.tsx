import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  ReferenceLine // Import ReferenceLine for "Today" marker
} from "recharts";
import { format, parseISO, differenceInDays, addDays, startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Deal, Profile } from "@/types/crm"; // Import Deal type
import { useCRMData } from "@/hooks/useCRMData";

interface DealLifecycleChartProps {
  deals: Deal[]; // Now takes an array of deals
  profiles: Profile[]; // Still need profiles for assigned user names
}

// Helper to get stage color (consistent with DealDetails badge)
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
  const { getFullName } = useCRMData(); // Access getFullName from the hook

  const today = startOfDay(new Date());

  const chartData = deals
    .filter(deal => deal.created_at) // Only include deals with a creation date
    .map((deal) => {
      const dealCreatedAt = parseISO(deal.created_at);
      let dealExpectedCloseDate = deal.expected_close_date ? parseISO(deal.expected_close_date) : addDays(dealCreatedAt, 30);

      // Ensure expected close date is not before created date
      if (dealExpectedCloseDate < dealCreatedAt) {
        dealExpectedCloseDate = addDays(dealCreatedAt, 1); // At least 1 day duration
      }

      // The start of the bar on the chart should be today, or the deal's creation date if it's in the future
      const chartBarStart = Math.max(dealCreatedAt.getTime(), today.getTime());
      
      // The end of the bar on the chart should be the expected close date
      const chartBarEnd = dealExpectedCloseDate.getTime();

      // Filter out deals that have already passed their expected close date relative to today's start.
      // Or deals where the calculated duration is zero or negative.
      if (chartBarEnd < today.getTime() || differenceInDays(new Date(chartBarEnd), new Date(chartBarStart)) < 0) {
          return null; 
      }

      // Calculate duration from chartBarStart to chartBarEnd
      const duration = differenceInDays(new Date(chartBarEnd), new Date(chartBarStart)) + 1;
      if (duration <= 0) return null; // Don't show zero or negative duration bars

      return {
        id: deal.id,
        name: deal.title,
        startDate: chartBarStart, // This is the X position
        duration: duration * (24 * 60 * 60 * 1000), // Duration for the bar width in milliseconds
        stage: deal.stage,
        value: deal.value,
        contactName: deal.contact?.name || "N/A",
        assignedTo: deal.assigned_user ? getFullName(deal.assigned_user) : "Unassigned",
        actualStartDate: new Date(chartBarStart), // For tooltip
        actualEndDate: new Date(chartBarEnd), // For tooltip
        color: getStageColor(deal.stage),
      };
    })
    .filter(Boolean) // Remove null entries (deals filtered out)
    .sort((a, b) => {
      // Sort by stage first, then by start date
      const stageOrder = ['lead', 'discovery_call', 'in_development', 'proposal', 'paid', 'done_completed', 'cancelled'];
      const stageA = stageOrder.indexOf(a.stage);
      const stageB = stageOrder.indexOf(b.stage);
      if (stageA !== stageB) {
        return stageA - stageB;
      }
      return a.startDate - b.startDate;
    });

  // Recalculate min/max dates for the X-axis domain based on the filtered data
  const allDatesForFutureChart = chartData.flatMap(d => [d.startDate, d.actualEndDate.getTime()]);
  const minChartDate = allDatesForFutureChart.length > 0 ? Math.min(...allDatesForFutureChart) : today.getTime();
  const maxChartDate = allDatesForFutureChart.length > 0 ? Math.max(...allDatesForFutureChart) : addDays(today, 60).getTime(); // Default to 60 days from today if no data

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Access the actual data object
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
            Start: {format(data.actualStartDate, "MMM dd, yyyy")}
          </p>
          <p className="text-sm text-muted-foreground">
            Expected End: {format(data.actualEndDate, "MMM dd, yyyy")}
          </p>
          <p className="text-sm text-muted-foreground">
            Duration: {data.duration / (24 * 60 * 60 * 1000)} days
          </p>
        </Card>
      );
    }
    return null;
  };

  // Custom Bar for Gantt simulation
  const CustomBar = (props: any) => {
    const { x, y, width, height, fill } = props;
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={4} // Slightly larger rounded corners
        ry={4}
      />
    );
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Deal Lifecycle Timeline</CardTitle>
      </CardHeader>
      <CardContent className="h-96">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No active deals to display in the timeline from today onwards.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="1 1" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis
                type="number"
                dataKey="startDate" // This will be the start of the bar
                domain={[minChartDate, maxChartDate + (24 * 60 * 60 * 1000)]} // Extend domain slightly to ensure last date is visible
                tickFormatter={(tick) => format(new Date(tick), "MMM yy")}
                stroke="hsl(var(--muted-foreground))"
                tickCount={5}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                width={150} // Increased width for deal names
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

              <Bar
                dataKey="duration" // This will be the length of the bar
                fill="hsl(var(--primary))"
                barSize={25} // Increased bar size
                shape={<CustomBar />}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}