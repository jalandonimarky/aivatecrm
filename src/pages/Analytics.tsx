import { useMemo } from "react";
import { useCRMData } from "@/hooks/useCRMData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import type { Deal, Task } from "@/types/crm";

export function Analytics() {
  const { deals, contacts, tasks, loading } = useCRMData(); // Destructure all needed properties

  // Helper functions for colors (consistent with existing design)
  const getStageColor = (stage: Deal['stage']) => {
    switch (stage) {
      case 'paid': return "hsl(var(--success))";
      case 'completed': return "hsl(var(--destructive))"; // Changed from 'done_completed'
      case 'lead': return "hsl(var(--muted-foreground))";
      case 'in_development': return "hsl(var(--accent))";
      case 'demo': return "hsl(var(--primary))"; // Changed from 'proposal'
      case 'discovery_call': return "hsl(var(--warning))";
      case 'cancelled': return "hsl(var(--secondary))"; // New color for cancelled deals
      default: return "hsl(var(--foreground))";
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return "hsl(var(--success))";
      case 'pending': return "hsl(var(--warning))";
      case 'in_progress': return "hsl(var(--accent))";
      case 'cancelled': return "hsl(var(--destructive))";
      default: return "hsl(var(--foreground))";
    }
  };

  // Data processing for charts
  const revenueOverTimeData = useMemo(() => {
    if (!deals.length) return [];
    const monthlyRevenue: { [key: string]: number } = {};

    deals.forEach(deal => {
      if (deal.stage === 'paid' && deal.created_at) {
        const date = parseISO(deal.created_at);
        const monthYear = format(startOfMonth(date), 'MMM yyyy');
        monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + deal.value;
      }
    });

    // Sort by date
    return Object.keys(monthlyRevenue)
      .map(key => ({ name: key, revenue: monthlyRevenue[key] }))
      .sort((a, b) => parseISO(a.name).getTime() - parseISO(b.name).getTime());
  }, [deals]);

  const dealsByStageData = useMemo(() => {
    if (!deals.length) return [];
    const stageCounts: { [key: string]: number } = {};
    deals.forEach(deal => {
      // Ensure deal.stage is a string, provide a fallback if null/undefined
      const currentStage = (deal.stage || 'unknown_stage') as Deal['stage'];
      stageCounts[currentStage] = (stageCounts[currentStage] || 0) + 1;
    });
    return Object.keys(stageCounts).map(stageKey => {
      const stage = stageKey as Deal['stage']; // Cast to Deal['stage'] for type safety
      return {
        name: stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: stageCounts[stage],
        color: getStageColor(stage)
      };
    });
  }, [deals]);

  const tasksByStatusData = useMemo(() => {
    if (!tasks.length) return [];
    const statusCounts: { [key: string]: number } = {};
    tasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });
    return Object.keys(statusCounts).map(status => ({
      name: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: statusCounts[status],
      color: getStatusColor(status as Task['status'])
    }));
  }, [tasks]);

  const contactsGrowthData = useMemo(() => {
    if (!contacts.length) return [];
    const monthlyContacts: { [key: string]: number } = {};
    contacts.forEach(contact => {
      if (contact.created_at) {
        const date = parseISO(contact.created_at);
        const monthYear = format(startOfMonth(date), 'MMM yyyy');
        monthlyContacts[monthYear] = (monthlyContacts[monthYear] || 0) + 1;
      }
    });
    return Object.keys(monthlyContacts)
      .map(key => ({ name: key, contacts: monthlyContacts[key] }))
      .sort((a, b) => parseISO(a.name).getTime() - parseISO(b.name).getTime());
  }, [contacts]);

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-medium">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            {data.name}: {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-accent">
            Reporting
          </h1>
          <p className="text-muted-foreground">
            Gain insights into your CRM data.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-accent">
          Reporting
        </h1>
        <p className="text-muted-foreground">
          Gain insights into your CRM data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-accent">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} name="Won Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deals by Stage */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Deals by Stage</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dealsByStageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="count" name="Number of Deals">
                  {dealsByStageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks by Status */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tasksByStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {tasksByStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Contacts Growth */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">New Contacts Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={contactsGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="contacts" stroke="hsl(var(--accent))" activeDot={{ r: 8 }} name="New Contacts" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}