import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Lightbulb, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { KanbanItem } from "@/types/crm";

interface KanbanDataHygieneInsights {
  missingFields: string[];
  suggestions: string[];
  criticalItemAlert: boolean;
}

interface KanbanDataHygieneCardProps {
  item: KanbanItem;
}

export function KanbanDataHygieneCard({ item }: KanbanDataHygieneCardProps) {
  const [insights, setInsights] = useState<KanbanDataHygieneInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDataHygiene = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: invokeError } = await supabase.functions.invoke('kanban-item-hygiene-checker', {
          body: { item },
        });

        if (invokeError) {
          throw new Error(invokeError.message);
        }

        if (data.error) {
          throw new Error(data.error);
        }
        
        setInsights(data as KanbanDataHygieneInsights);
      } catch (err: any) {
        console.error("Error fetching Kanban data hygiene insights:", err);
        setError(err.message || "Failed to load data hygiene insights.");
        toast({
          title: "Error",
          description: err.message || "Failed to load data hygiene insights.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (item) {
      fetchDataHygiene();
    }
  }, [item, toast]);

  if (loading) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Item Hygiene Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-destructive">Item Hygiene Check Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null; // Should not happen if loading and error are handled
  }

  const hasIssues = insights.missingFields.length > 0 || insights.suggestions.length > 0 || insights.criticalItemAlert;

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          Item Hygiene Check
          {insights.criticalItemAlert && (
            <Badge variant="destructive" className="ml-2">
              <AlertCircle className="w-3 h-3 mr-1" /> Critical Item Alert
            </Badge>
          )}
          {!hasIssues && (
            <Badge className="ml-2 bg-success text-success-foreground">
              <CheckCircle className="w-3 h-3 mr-1" /> All Good!
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.missingFields.length > 0 && (
          <div>
            <h3 className="font-medium text-warning flex items-center mb-2">
              <AlertCircle className="w-4 h-4 mr-2" /> Missing Information:
            </h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {insights.missingFields.map((field, index) => (
                <li key={index}>{field}</li>
              ))}
            </ul>
          </div>
        )}

        {insights.suggestions.length > 0 && (
          <div>
            <h3 className="font-medium text-primary flex items-center mb-2">
              <Lightbulb className="w-4 h-4 mr-2" /> Next Best Actions:
            </h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {insights.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {!hasIssues && (
          <p className="text-sm text-muted-foreground">
            Great job! All essential information for this Kanban item is complete, and there are no immediate suggestions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}