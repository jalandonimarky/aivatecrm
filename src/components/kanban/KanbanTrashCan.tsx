import React from "react";
import { Droppable } from "react-beautiful-dnd";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanTrashCanProps {
  id: string;
}

export function KanbanTrashCan({ id }: KanbanTrashCanProps) {
  return (
    <Droppable droppableId={id} type="item">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            "flex-shrink-0 w-48 min-w-48 h-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors duration-200",
            snapshot.isDraggingOver
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-muted-foreground/50 bg-muted/10 text-muted-foreground"
          )}
        >
          <Trash2 className="w-10 h-10 mb-2" />
          <p className="text-sm font-medium">Drag here to delete</p>
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}