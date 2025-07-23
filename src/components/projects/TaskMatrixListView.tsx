import React from "react";
import { Droppable } from "react-beautiful-dnd";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProjectTaskCard } from "./ProjectTaskCard";
import type { ProjectTask } from "@/types/crm";

interface TaskMatrixListViewProps {
  tasksBySection: { [key: string]: ProjectTask[] };
  sectionOrder: string[];
}

export function TaskMatrixListView({ tasksBySection, sectionOrder }: TaskMatrixListViewProps) {
  return (
    <Accordion type="multiple" defaultValue={sectionOrder} className="w-full space-y-4">
      {sectionOrder.map((section) => (
        <AccordionItem value={section} key={section} className="bg-gradient-card border border-border/50 rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-lg font-semibold">
            {section} ({tasksBySection[section]?.length || 0})
          </AccordionTrigger>
          <AccordionContent className="px-4 py-2">
            <Droppable droppableId={section} type="task">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-3 min-h-[50px] rounded-md p-2 transition-colors ${
                    snapshot.isDraggingOver ? "bg-muted/50" : ""
                  }`}
                >
                  {tasksBySection[section]?.map((task, index) => (
                    <ProjectTaskCard key={task.id} task={task} index={index} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}