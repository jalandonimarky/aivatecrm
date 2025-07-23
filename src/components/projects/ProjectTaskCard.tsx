import React from "react";
import { Draggable } from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card";
import { UserProfileCard } from "@/components/UserProfileCard";
import { ProjectTaskStatusBadge } from "./ProjectTaskStatusBadge";
import { ProjectTaskPriorityBadge } from "./ProjectTaskPriorityBadge";
import { format, parseISO } from "date-fns";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectTask } from "@/types/crm";

interface ProjectTaskCardProps {
  task: ProjectTask;
  index: number;
}

export function ProjectTaskCard({ task, index }: ProjectTaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "bg-card border-border/50 shadow-sm hover:shadow-medium transition-shadow",
            snapshot.isDragging && "shadow-lg ring-2 ring-primary"
          )}
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
        </Card>
      )}
    </Draggable>
  );
}