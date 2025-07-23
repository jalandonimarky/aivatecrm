import React from "react";
import { Droppable } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectTaskCard } from "./ProjectTaskCard";
import type { ProjectTask } from "@/types/crm";

interface TaskMatrixBoardViewProps {
  tasksBySection: { [key: string]: ProjectTask[] };
  sectionOrder: string[];
  onOpenDetail: (task: ProjectTask) => void; // New prop
}

export function TaskMatrixBoardView({ tasksBySection, sectionOrder, onOpenDetail }: TaskMatrixBoardViewProps) {
  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {sectionOrder.map((section) => (
        <Card key={section} className="w-80 min-w-80 flex-shrink-0 bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>{section} ({tasksBySection[section]?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <Droppable droppableId={section} type="task">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-3 min-h-[200px] rounded-md p-2 transition-colors ${
                    snapshot.isDraggingOver ? "bg-muted/50" : ""
                  }`}
                >
                  {tasksBySection[section]?.map((task, index) => (
                    <ProjectTaskCard key={task.id} task={task} index={index} onOpenDetail={onOpenDetail} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}