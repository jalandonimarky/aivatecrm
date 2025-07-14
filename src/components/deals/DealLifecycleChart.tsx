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

  const chartData = deals
    .filter(deal => deal.created_at) // Only include deals with a creation date
    .map((deal) => {
      const startDate = parseISO(deal.created_at);
      // Use expected_close_date as end, or fallback to created_at + 30 days if not set
      let endDate = deal.expected_close_date ? parseISO(deal.expected_close_date) : addDays(startDate, 30);

      // Ensure end date is not before start date
      if (endDate < startDate) {
        endDate = addDays(startDate, 1); // At least 1 day duration
      }

      const duration = differenceInDays(endDate, startDate) + 1; // +1 to include both start and end day

      return {
        id: deal.id,
        name: deal.title,
        startDate: startDate.getTime(), // Numeric value for X-axis position
        duration: duration * (24 * 60 * 60 * 1000), // Duration in milliseconds for Recharts bar width
        stage: deal.stage,
        value: deal.value,
        contactName: deal.contact?.name || "N/A",
        assignedTo: deal.assigned_user ? getFullName(deal.assigned_user) : "Unassigned",
        actualStartDate: startDate,
        actualEndDate: endDate,
        color: getStageColor(deal.stage),
      };
    })
    .sort((a, b) => a.startDate - b.startDate); // Sort by start date

  // Calculate min and max dates for the X-axis domain
  const allDates = chartData.flatMap(d => [d.startDate, d.actualEndDate.getTime()]);
  const minChartDate = allDates.length > 0 ? Math.min(...allDates) : new Date().getTime();
  const maxChartDate = allDates.length > 0 ? Math.max(...allDates) : addDays(new Date(), 30).getTime();

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
        {deals.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No deals to display in the timeline.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis
                type="number"
                dataKey="startDate" // This will be the start of the bar
                domain={[minChartDate, maxChartDate + (24 * 60 * 60 * 1000)]} // Extend domain slightly
                tickFormatter={(tick) => format(new Date(tick), "MMM dd")}
                stroke="hsl(var(--muted-foreground))"
                tickCount={5}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                width={150} // Increased width for deal names
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} // Adjusted font size
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Reference line for "Today" */}
              <ReferenceLine
                x={startOfDay(new Date()).getTime()}
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