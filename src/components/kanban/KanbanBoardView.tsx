import React from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { KanbanColumn } from "./KanbanColumn";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { KanbanBoard as KanbanBoardType, KanbanColumn as KanbanColumnType, KanbanItem as KanbanItemType } from "@/types/crm";

interface KanbanBoardViewProps {
  board: KanbanBoardType;
  onAddColumn: (boardId: string) => void;
  onEditColumn: (column: KanbanColumnType) => void;
  onDeleteColumn: (columnId: string) => void;
  onAddItem: (columnId: string) => void;
  // Removed onEditItem and onDeleteItem props
  onReorderItemsInColumn: (columnId: string, itemIds: string[]) => Promise<void>;
  onMoveItem: (itemId: string, sourceColumnId: string, sourceIndex: number, destinationColumnId: string, destinationIndex: number) => Promise<void>;
  onReorderColumns: (boardId: string, columnIds: string[]) => Promise<void>;
  isColumnDragDisabled: boolean;
}

export function KanbanBoardView({
  board,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
  onAddItem,
  onReorderItemsInColumn,
  onMoveItem,
  onReorderColumns,
  isColumnDragDisabled,
}: KanbanBoardViewProps) {
  const { toast } = useToast();

  const sortedColumns = [...(board.columns || [])].sort((a, b) => a.order_index - b.order_index);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === "column") {
      const newColumnOrder = Array.from(sortedColumns.map(col => col.id));
      newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, draggableId);
      await onReorderColumns(board.id, newColumnOrder);
      return;
    }

    if (type === "item") {
      const startColumn = sortedColumns.find(col => col.id === source.droppableId);
      const finishColumn = sortedColumns.find(col => col.id === destination.droppableId);

      if (!startColumn || !finishColumn) {
        toast({
          title: "Drag Error",
          description: "Could not find source or destination column.",
          variant: "destructive",
        });
        return;
      }

      // Moving within the same column
      if (startColumn.id === finishColumn.id) {
        const newItems = Array.from(startColumn.items || []).sort((a, b) => a.order_index - b.order_index);
        const [reorderedItem] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, reorderedItem);
        
        const newItemIds = newItems.map(item => item.id);
        await onReorderItemsInColumn(startColumn.id, newItemIds);
      } else {
        // Moving between different columns
        await onMoveItem(
          draggableId,
          source.droppableId,
          source.index,
          destination.droppableId,
          destination.index
        );
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="all-columns" direction="horizontal" type="column">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="flex space-x-4 p-4 overflow-x-auto custom-scrollbar h-full"
          >
            {sortedColumns.map((column, index) => (
              <Draggable 
                draggableId={column.id} 
                index={index} 
                key={column.id}
                isDragDisabled={isColumnDragDisabled}
              >
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
                      // onEditItem and onDeleteItem are no longer passed here
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}