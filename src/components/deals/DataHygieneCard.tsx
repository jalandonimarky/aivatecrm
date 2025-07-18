import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      icon: XCircle,
      color: "destructive",
    },
    {
      label: "Deals Missing Assigned User",
      count: dealsMissingAssignedUser,
      icon: XCircle,
      color: "destructive",
    },
    {
      label: "Deals Missing Close Date",
      count: dealsMissingCloseDate,
      icon: XCircle,
      color: "destructive",
    },
    {
      label: "Tasks Missing Due Date",
      count: tasksMissingDueDate,
      icon: XCircle,
      color: "destructive",
    },
    {
      label: "Tasks Missing Assigned User",
      count: tasksMissingAssignedUser,
      icon: XCircle,
      color: "destructive",
    },
  ];

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Data Hygiene Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Total Issues Found</p>
          <Badge
            className={`${
              totalIssues === 0
                ? "bg-success text-success-foreground"
                : "bg-destructive text-destructive-foreground"
            }`}
          >
            {totalIssues}
          </Badge>
        </div>
        <div className="space-y-3">
          {issues.map((issue, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                {issue.count > 0 ? (
                  <issue.icon className={`w-4 h-4 text-${issue.color}`} />
                ) : (
                  <CheckCircle className="w-4 h-4 text-success" />
                )}
                <span className={`${issue.count > 0 ? `text-${issue.color}` : "text-muted-foreground"}`}>
                  {issue.label}
                </span>
              </div>
              <span className={`font-medium ${issue.count > 0 ? `text-${issue.color}` : "text-muted-foreground"}`}>
                {issue.count}
              </span>
            </div>
          ))}
        </div>
        {totalIssues === 0 ? (
          <div className="flex items-center space-x-2 text-success text-sm font-medium mt-4">
            <CheckCircle className="w-5 h-5" />
            <span>Your CRM data is looking clean!</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-destructive text-sm font-medium mt-4">
            <AlertCircle className="w-5 h-5" />
            <span>Action required: Address the issues above to improve data quality.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}