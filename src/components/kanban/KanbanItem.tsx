import React, { useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserProfileCard } from "@/components/UserProfileCard";
import { Badge } from "@/components/ui/badge";
import { format, parse, parseISO, formatDistanceToNowStrict } from "date-fns"; // Import parseISO and formatDistanceToNowStrict
import { cn } from "@/lib/utils";
import type { KanbanItem as KanbanItemType } from "@/types/crm";
import { KanbanPriorityBadge } from "./KanbanPriorityBadge";
import { useNavigate } from "react-router-dom";

interface KanbanItemProps {
  item: KanbanItemType;
  index: number;
}

export function KanbanItem({ item, index }: KanbanItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const getItemBorderColorClass = (columnName?: string) => {
    if (!columnName) return "border-l-4 border-transparent";

    const lowerCaseName = columnName.toLowerCase();
    if (lowerCaseName.includes("backlog")) return "border-l-4 border-primary";
    if (lowerCaseName.includes("in progress")) return "border-l-4 border-accent";
    if (lowerCaseName.includes("on hold")) return "border-l-4 border-warning";
    if (lowerCaseName.includes("done")) return "border-l-4 border-success";
    return "border-l-4 border-muted-foreground";
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-radix-popper-content-wrapper]')) {
      return;
    }

    if (isExpanded) {
      navigate(`/kanban/items/${item.id}`);
    } else {
      setIsExpanded(true);
    }
  };

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => {
        const { onClick: onDragClick, ...restDragHandleProps } = provided.dragHandleProps;

        return (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...restDragHandleProps}
            onClick={(e) => {
              if (onDragClick) {
                onDragClick(e);
              }
              handleCardClick(e);
            }}
            className={cn(
              "relative bg-gradient-card border-border/50 shadow-sm transition-all duration-200 ease-in-out cursor-pointer",
              getItemBorderColorClass(item.column?.name),
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
                {/* Removed item.category badge */}
              </div>

              {/* SLA Timer - Always visible */}
              {item.created_at && (
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
                  <span>{formatDistanceToNowStrict(parseISO(item.created_at), { addSuffix: true })}</span>
                </div>
              )}

              {isExpanded && (
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