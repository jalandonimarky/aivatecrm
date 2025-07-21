import React from "react";
import { Draggable } from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { UserProfileCard } from "@/components/UserProfileCard";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { KanbanItem as KanbanItemType } from "@/types/crm";

interface KanbanItemProps {
  item: KanbanItemType;
  index: number;
  onEdit: (item: KanbanItemType) => void;
  onDelete: (itemId: string) => void;
}

export function KanbanItem({ item, index, onEdit, onDelete }: KanbanItemProps) {
  const getCategoryColorClass = (category?: KanbanItemType['category']) => {
    switch (category) {
      case 'design': return "border-l-4 border-primary"; // Mint
      case 'development': return "border-l-4 border-accent"; // Purple
      case 'marketing': return "border-l-4 border-warning"; // Orange
      case 'business': return "border-l-4 border-success"; // Green
      case 'other': return "border-l-4 border-muted-foreground"; // Grey
      default: return "border-l-4 border-transparent"; // No border or default
    }
  };

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "mb-3 bg-gradient-card border-border/50 shadow-sm transition-all duration-200 ease-in-out",
            getCategoryColorClass(item.category), // Apply category color border
            snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-foreground text-sm flex-1 min-w-0 break-words pr-2">
                {item.title}
              </h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {item.description && (
              <p className="text-muted-foreground text-xs mb-3 line-clamp-2">
                {item.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {item.category && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </Badge>
              )}
              {item.assigned_user && (
                <UserProfileCard profile={item.assigned_user} />
              )}
              {item.due_date && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {format(new Date(item.due_date), "MMM dd")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}