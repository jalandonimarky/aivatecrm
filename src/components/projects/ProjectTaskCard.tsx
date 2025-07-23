import React from "react";
import { Draggable } from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card";
import { UserProfileCard } from "@/components/UserProfileCard";
import { ProjectTaskStatusBadge } from "./ProjectTaskStatusBadge";
import { ProjectTaskPriorityBadge } from "./ProjectTaskPriorityBadge";
import { format, parseISO } from "date-fns";
import { Calendar, Lock } from "lucide-react"; // Import Lock icon
import { cn } from "@/lib/utils";
import type { ProjectTask } from "@/types/crm";

interface ProjectTaskCardProps {
  task: ProjectTask;
  index: number;
  onOpenDetail: (task: ProjectTask) => void; // New prop
}

export function ProjectTaskCard({ task, index, onOpenDetail }: ProjectTaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "bg-card border-border/50 shadow-sm hover:shadow-medium transition-shadow cursor-pointer relative", // Added relative for absolute positioning of lock icon
            snapshot.isDragging && "shadow-lg ring-2 ring-primary",
            task.is_blocked && "border-l-4 border-destructive" // Visual cue for blocked tasks
          )}
          onClick={() => onOpenDetail(task)} // Added onClick handler
        >
          <CardContent className="p-3 space-y-2">
            <p className="font-semibold text-sm">{task.title}</p>
            <div className="flex flex-wrap items-center gap-2">
              <ProjectTaskStatusBadge status={task.status} />
              <ProjectTaskPriorityBadge priority={task.priority} />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {task.due_date && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{format(parseISO(task.due_date), "MMM dd")}</span>
                </div>
              )}
              {task.assignee && <UserProfileCard profile={task.assignee} />}
            </div>
          </CardContent>
          {task.is_blocked && (
            <div className="absolute top-2 right-2 text-destructive" title="Blocked by dependencies">
              <Lock className="w-4 h-4" />
            </div>
          )}
        </Card>
      )}
    </Draggable>
  );
}