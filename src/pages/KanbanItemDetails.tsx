import React, { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useCRMData } from "@/hooks/useCRMData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MoreHorizontal, Edit, Trash2, Calendar as CalendarIcon, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { UserProfileCard } from "@/components/UserProfileCard";
import { KanbanPriorityBadge } from "@/components/kanban/KanbanPriorityBadge";
import { Badge } from "@/components/ui/badge";
import { KanbanItemFormDrawer } from "@/components/kanban/KanbanItemFormDrawer"; // Import the form drawer
import type { KanbanItem } from "@/types/crm";

export function KanbanItemDetails() {
  const {
    kanbanItems,
    profiles,
    loading,
    updateKanbanItem,
    deleteKanbanItem,
    getFullName,
  } = useCRMData();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const item = kanbanItems.find((i) => i.id === id);

  const [isItemFormDrawerOpen, setIsItemFormDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && id && !kanbanItems.find((i) => i.id === id)) {
      navigate("/kanban"); // Redirect if item not found
    }
  }, [kanbanItems, id, loading, navigate]);

  const handleEditItemClick = () => {
    setIsItemFormDrawerOpen(true);
  };

  const handleUpdateItemSubmit = async (data: any) => {
    if (!item) return;
    await updateKanbanItem(item.id, data);
    setIsItemFormDrawerOpen(false); // Close drawer after update
  };

  const handleDeleteItem = async () => {
    if (confirm("Are you sure you want to delete this Kanban item? This action cannot be undone.")) {
      try {
        if (id) {
          await deleteKanbanItem(id);
          navigate("/kanban"); // Navigate back to Kanban boards after deletion
        }
      } catch (error) {
        // Error handled in useCRMData hook
      }
    }
  };

  const getCategoryColorClass = (category?: KanbanItem['category']) => {
    switch (category?.toLowerCase()) {
      case 'design': return "bg-primary/20 text-primary border-primary";
      case 'development': return "bg-accent/20 text-accent border-accent";
      case 'marketing': return "bg-warning/20 text-warning border-warning";
      case 'business': return "bg-success/20 text-success border-success";
      case 'other': return "bg-muted/20 text-muted-foreground border-muted";
      default: return "bg-secondary/20 text-secondary-foreground border-secondary";
    }
  };

  if (loading || !item) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate("/kanban")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Kanban
        </Button>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/kanban")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Kanban
      </Button>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold min-w-0 mr-2">
              {item.title}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 active:scale-95">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleEditItemClick}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Item
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteItem}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Item
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-muted-foreground text-sm">
            Created: {format(parseISO(item.created_at), "PPP")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Column</p>
              <p className="text-lg font-semibold">{item.column?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>
              {item.priority_level ? (
                <KanbanPriorityBadge priority={item.priority_level} />
              ) : (
                <p className="text-lg font-semibold">N/A</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              {item.category ? (
                <Badge variant="outline" className={cn("text-sm px-2 py-0.5", getCategoryColorClass(item.category))}>
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </Badge>
              ) : (
                <p className="text-lg font-semibold">N/A</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned To</p>
              {item.assigned_user ? (
                <UserProfileCard profile={item.assigned_user} />
              ) : (
                <p className="text-lg font-semibold">N/A</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="text-lg font-semibold">
                {item.due_date ? format(parseISO(item.due_date), "PPP") : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Event Time</p>
              <p className="text-lg font-semibold">
                {item.event_time ? format(parse(item.event_time, 'HH:mm:ss', new Date()), 'p') : "N/A"}
              </p>
            </div>
          </div>

          {item.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-foreground">{item.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Kanban Item Form Drawer for editing */}
      {item && (
        <KanbanItemFormDrawer
          isOpen={isItemFormDrawerOpen}
          onOpenChange={setIsItemFormDrawerOpen}
          initialData={item}
          columnId={item.column_id}
          onSubmit={handleUpdateItemSubmit}
          nextOrderIndex={item.order_index}
          profiles={profiles}
          getFullName={getFullName}
        />
      )}
    </div>
  );
}