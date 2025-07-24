import React from "react";
import { Droppable, Draggable } from "react-beautiful-dnd"; // Removed DragDropContext, DropResult
import { KanbanColumn } from "./KanbanColumn";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { KanbanBoard as KanbanBoardType, KanbanColumn as KanbanColumnType } from "@/types/crm"; // KanbanItemType is not directly used here

interface KanbanBoardViewProps {
  board: KanbanBoardType;
  onAddColumn: (boardId: string) => void;
  onEditColumn: (column: KanbanColumnType) => void;
  onDeleteColumn: (columnId: string) => void;
  onAddItem: (columnId: string) => void;
  // Removed onEditItem and onDeleteItem props
  // These reordering functions are now handled by the parent Kanban.tsx's onDragEnd
  // They are not directly called from KanbanBoardView anymore.
  // So, we can remove them from props.
  // onReorderItemsInColumn: (columnId: string, itemIds: string[]) => Promise<void>;
  // onMoveItem: (itemId: string, sourceColumnId: string, sourceIndex: number, destinationColumnId: string, destinationIndex: number) => Promise<void>;
  // onReorderColumns: (boardId: string, columnIds: string[]) => Promise<void>;
}

export function KanbanBoardView({
  board,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
  onAddItem,
  // Removed reordering props
}: KanbanBoardViewProps) {
  const sortedColumns = [...(board.columns || [])].sort((a, b) => a.order_index - b.order_index);

  return (
    <Droppable droppableId="all-columns" direction="horizontal" type="column">
      {(provided) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="flex space-x-4 p-4 overflow-x-auto custom-scrollbar h-full"
        >
          {sortedColumns.map((column, index) => (
            <Draggable draggableId={column.id} index={index} key={column.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className="flex-shrink-0"
                >
                  <KanbanColumn
                    column={column}
                    onAddItem={onAddItem}
                    onEditColumn={onEditColumn}
                    onDeleteColumn={onDeleteColumn}
                  />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
          <div className="flex-shrink-0 w-80 min-w-80">
            <Button
              variant="outline"
              className="w-full h-full border-dashed border-2 border-muted-foreground/50 text-muted-foreground hover:bg-muted/20 transition-smooth"
              onClick={() => onAddColumn(board.id)}
            >
              <Plus className="w-5 h-5 mr-2" /> Add New Column
            </Button>
          </div>
        </div>
      )}
    </Droppable>
  );
}