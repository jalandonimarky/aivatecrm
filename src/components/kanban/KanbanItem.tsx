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
}

export function KanbanItem({ item, index }: KanbanItemProps) {
  const [isExpanded, setIsExpanded] = useState(false); // New state for expansion
  const navigate = useNavigate();

  // Function to get the item's left border color based on its column name
  const getItemBorderColorClass = (columnName?: string) => {
    if (!columnName) return "border-l-4 border-transparent"; // Fallback

    const lowerCaseName = columnName.toLowerCase();
    if (lowerCaseName.includes("backlog")) return "border-l-4 border-primary"; // Mint
    if (lowerCaseName.includes("in progress")) return "border-l-4 border-accent"; // Purple
    if (lowerCaseName.includes("on hold")) return "border-l-4 border-warning"; // Orange
    if (lowerCaseName.includes("done")) return "border-l-4 border-success"; // Green
    return "border-l-4 border-muted-foreground"; // Default grey
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if an interactive element within the card is clicked
    // We remove data-rbd-draggable-context-id here because we're handling dragHandleProps.onClick explicitly
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-radix-popper-content-wrapper]')) {
      return;
    }

    if (isExpanded) {
      // If already expanded, navigate to details page
      navigate(`/kanban/items/${item.id}`);
    } else {
      // If not expanded, expand it
      setIsExpanded(true);
    }
  };

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => {
        // Extract onClick from dragHandleProps to combine it
        const { onClick: onDragClick, ...restDragHandleProps } = provided.dragHandleProps;

        return (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...restDragHandleProps} // Spread all other dragHandleProps
            onClick={(e) => {
              // Call the original drag handler's click if it exists
              if (onDragClick) {
                onDragClick(e);
              }
              // Then call our custom handler
              handleCardClick(e);
            }}
            className={cn(
              "relative bg-gradient-card border-border/50 shadow-sm transition-all duration-200 ease-in-out cursor-pointer",
              getItemBorderColorClass(item.column?.name), // Use the new function to set border color
              snapshot.isDragging
                ? "z-50 shadow-lg ring-2 ring-primary"
                : "hover:z-40 hover:-translate-y-1",
              isExpanded ? "z-30" : ""
            )}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-semibold text-foreground text-sm flex-1 min-w-0 pr-2 break-words">
                  {item.title}
                </h4>
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

              {isExpanded && ( // Conditionally render expanded details
                <>
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
                </>
              )}
            </CardContent>
          </Card>
        );
      }}
    </Draggable>
  );
}