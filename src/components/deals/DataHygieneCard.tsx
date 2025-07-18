import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle, Users, Briefcase, Calendar, ListTodo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { DataHygieneInsights } from "@/types/crm";

interface DataHygieneCardProps {
  insights: DataHygieneInsights;
}

export function DataHygieneCard({ insights }: DataHygieneCardProps) {
  const {
    dealsMissingContact,
    dealsMissingAssignedUser,
    dealsMissingCloseDate,
    tasksMissingDueDate,
    tasksMissingAssignedUser,
    totalIssues,
  } = insights;

  const issues = [
    {
      label: "Deals Missing Contact",
      count: dealsMissingContact,
      icon: Users, // Icon for contacts
      color: "destructive",
      actionText: "Add contacts to deals",
      actionLink: "/deals", // Link to deals page to edit
    },
    {
      label: "Deals Missing Assigned User",
      count: dealsMissingAssignedUser,
      icon: Briefcase, // Icon for assigned user (deals)
      color: "destructive",
      actionText: "Assign users to deals",
      actionLink: "/deals",
    },
    {
      label: "Deals Missing Close Date",
      count: dealsMissingCloseDate,
      icon: Calendar, // Icon for calendar/date
      color: "destructive",
      actionText: "Set close dates for deals",
      actionLink: "/deals",
    },
    {
      label: "Tasks Missing Due Date",
      count: tasksMissingDueDate,
      icon: Calendar, // Icon for calendar/date
      color: "destructive",
      actionText: "Add due dates to tasks",
      actionLink: "/tasks", // Link to tasks page to edit
    },
    {
      label: "Tasks Missing Assigned User",
      count: tasksMissingAssignedUser,
      icon: ListTodo, // Icon for assigned user (tasks)
      color: "destructive",
      actionText: "Assign users to tasks",
      actionLink: "/tasks",
    },
  ];

  const nextBestActions = issues.filter(issue => issue.count > 0);

  return (
    <Card className="bg-gradient-card border-border/50 shadow-medium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-warning" />
          <span>Data Hygiene Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium text-muted-foreground">Total Issues Found</p>
          <Badge
            className={`text-sm px-3 py-1 rounded-full ${
              totalIssues === 0
                ? "bg-success text-success-foreground"
                : "bg-destructive text-destructive-foreground"
            }`}
          >
            {totalIssues}
          </Badge>
        </div>
        
        <Separator />

        <div className="space-y-3">
          {issues.map((issue, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                {issue.count > 0 ? (
                  <issue.icon className={`w-4 h-4 text-${issue.color}`} />
                ) : (
                  <CheckCircle className="w-4 h-4 text-success" />
                )}
                <span className={`${issue.count > 0 ? `text-${issue.color} font-medium` : "text-muted-foreground"}`}>
                  {issue.label}
                </span>
              </div>
              <span className={`font-semibold ${issue.count > 0 ? `text-${issue.color}` : "text-muted-foreground"}`}>
                {issue.count}
              </span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="pt-2">
          <h3 className="text-base font-semibold mb-3">Next Best Actions</h3>
          {totalIssues === 0 ? (
            <div className="flex items-center space-x-2 text-success text-sm font-medium">
              <CheckCircle className="w-5 h-5" />
              <span>Your CRM data is looking clean! Keep up the great work.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {nextBestActions.map((action, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  className="w-full justify-start text-left h-auto py-2 px-3 bg-muted/30 hover:bg-muted/50 transition-smooth"
                  asChild
                >
                  <a href={action.actionLink}>
                    <XCircle className="w-4 h-4 text-destructive mr-2 flex-shrink-0" />
                    <span className="flex-1">{action.actionText} ({action.count} issues)</span>
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}