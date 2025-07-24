import React, { useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserProfileCard } from "@/components/UserProfileCard";
import { Badge } from "@/components/ui/badge";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import type { KanbanItem as KanbanItemType } from "@/types/crm";
import { KanbanPriorityBadge } from "./KanbanPriorityBadge";
import { useNavigate } from "react-router-dom"; // Import useNavigate

interface KanbanItemProps {
  item: KanbanItemType;
  index: number;
  // Removed onEdit and onDelete props as they will be handled on the details page
}

export function KanbanItem({ item, index }: KanbanItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const getCategoryColorClass = (category?: KanbanItemType['category']) => {
    switch (category?.toLowerCase()) {
      case 'design': return "border-l-4 border-primary"; // Mint
      case 'development': return "border-l-4 border-accent"; // Purple
      case 'marketing': return "border-l-4 border-warning"; // Orange
      case 'business': return "border-l-4 border-success"; // Green
      case 'other': return "border-l-4 border-muted-foreground"; // Grey
      default: return category ? "border-l-4 border-secondary" : "border-l-4 border-transparent";
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if a dropdown menu or button within the card is clicked
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-radix-popper-content-wrapper]')) {
      return;
    }
    // Navigate to the details page
    navigate(`/kanban/items/${item.id}`);
  };

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "relative bg-gradient-card border-border/50 shadow-sm transition-all duration-200 ease-in-out cursor-pointer",
            getCategoryColorClass(item.category),
            snapshot.isDragging
              ? "z-50 shadow-lg ring-2 ring-primary"
              : "hover:z-40 hover:-translate-y-1",
            isExpanded ? "z-30" : ""
          )}
          onClick={handleCardClick} // Use the new click handler
        >
          <CardContent className="p-3">
            <div className="flex items-start justify-between mb-1">
              <h4 className="font-semibold text-foreground text-sm flex-1 min-w-0 pr-2 break-words">
                {item.title}
              </h4>
              {/* Dropdown menu for actions (Edit/Delete) is removed from here */}
              {/* These actions will now be on the KanbanItemDetails page */}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {item.priority_level && (
                <KanbanPriorityBadge priority={item.priority_level} />
              )}
              {item.category && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </Badge>
              )}
            </div>

            {/* Expanded details are now primarily on the details page, 
                but we can keep a brief description here if desired. 
                For now, I'll remove the isExpanded state and related logic 
                to simplify the card and direct users to the details page. */}
            {item.description && (
              <p className="text-muted-foreground text-xs mt-2 line-clamp-2">
                {item.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
              {item.assigned_user && (
                <UserProfileCard profile={item.assigned_user} />
              )}
              {item.due_date && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {format(new Date(item.due_date), "MMM dd")}
                </div>
              )}
              {item.event_time && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  {format(parse(item.event_time, 'HH:mm:ss', new Date()), 'p')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}