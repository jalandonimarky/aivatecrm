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
  Cell // Import Cell here
} from "recharts";
import { format, parseISO, differenceInDays, addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Task } from "@/types/crm";
import { useCRMData } from "@/hooks/useCRMData"; // Import the hook to access getFullName

interface DealGanttChartProps {
  tasks: Task[];
  profiles: any[]; // Pass profiles to resolve assigned_user names
}

// Helper to get status color (consistent with TaskStatusBadge)
const getStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'completed': return "hsl(var(--success))";
    case 'pending': return "hsl(var(--warning))";
    case 'in_progress': return "hsl(var(--accent))";
    case 'cancelled': return "hsl(var(--destructive))";
    default: return "hsl(var(--muted-foreground))";
  }
};

export function DealGanttChart({ tasks, profiles }: DealGanttChartProps) {
  // Destructure getFullName from useCRMData inside the component
  const { getFullName } = useCRMData();

  // Prepare data for the Gantt chart
  const chartData = tasks
    .filter(task => task.created_at) // Only include tasks with a creation date
    .map((task) => {
      const startDate = parseISO(task.created_at);
      let endDate = task.due_date ? parseISO(task.due_date) : addDays(startDate, 7); // Default 7 days if no due date

      // Ensure end date is not before start date
      if (endDate < startDate) {
        endDate = addDays(startDate, 1); // At least 1 day duration
      }

      const duration = differenceInDays(endDate, startDate) + 1; // +1 to include both start and end day

      return {
        id: task.id,
        name: task.title,
        startDate: startDate.getTime(), // Numeric value for X-axis position
        duration: duration * (24 * 60 * 60 * 1000), // Duration in milliseconds for Recharts bar width
        status: task.status,
        priority: task.priority,
        assignedTo: task.assigned_user ? getFullName(task.assigned_user) : "Unassigned",
        actualStartDate: startDate,
        actualEndDate: endDate,
        color: getStatusColor(task.status),
      };
    })
    .sort((a, b) => a.startDate - b.startDate); // Sort by start date

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Access the actual data object
      return (
        <Card className="p-3 border border-border rounded-lg shadow-medium">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Status: <span style={{ color: getStatusColor(data.status) }}>{data.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Priority: {data.priority.charAt(0).toUpperCase() + data.priority.slice(1)}
          </p>
          <p className="text-sm text-muted-foreground">
            Assigned To: {data.assignedTo}
          </p>
          <p className="text-sm text-muted-foreground">
            Start: {format(data.actualStartDate, "MMM dd, yyyy")}
          </p>
          <p className="text-sm text-muted-foreground">
            End: {format(data.actualEndDate, "MMM dd, yyyy")}
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
    const { x, y, width, height, fill, payload } = props;
    const { startDate, duration } = payload;

    // Calculate the actual start X position based on the earliest date in the dataset
    // This is crucial for the "offset" logic
    const minStartDate = chartData.length > 0 ? Math.min(...chartData.map(d => d.startDate)) : 0;
    const chartWidth = props.containerWidth - props.margin.left - props.margin.right;
    const scaleX = (value: number) => (value - minStartDate) / (Math.max(...chartData.map(d => d.startDate + d.duration)) - minStartDate) * chartWidth;

    const barStartX = x; // This 'x' is the start of the bar as calculated by Recharts for the 'duration'
    const barWidth = width;

    return (
      <rect
        x={barStartX}
        y={y}
        width={barWidth}
        height={height}
        fill={fill}
        rx={3} // Rounded corners for bars
        ry={3}
      />
    );
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Task Timeline</CardTitle>
      </CardHeader>
      <CardContent className="h-96">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No tasks to display in the timeline.
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
                dataKey="startDate"
                domain={['dataMin', 'dataMax + 86400000']} // Extend domain slightly to show full last bar
                tickFormatter={(tick) => format(new Date(tick), "MMM dd")}
                stroke="hsl(var(--muted-foreground))"
                tickCount={5} // Adjust tick count as needed
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                width={120} // Adjust width for task names
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="duration"
                fill="hsl(var(--primary))"
                barSize={20}
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