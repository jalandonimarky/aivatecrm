import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { KanbanColumn } from "./KanbanColumn";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { KanbanTrashCan } from "./KanbanTrashCan"; // Import the new component
import type { KanbanBoard as KanbanBoardType, KanbanColumn as KanbanColumnType, KanbanItem as KanbanItemType } from "@/types/crm";

interface KanbanBoardViewProps {
  board: KanbanBoardType;
  onAddColumn: (boardId: string) => void;
  onEditColumn: (column: KanbanColumnType) => void;
  onDeleteColumn: (columnId: string) => void;
  onAddItem: (columnId: string) => void;
  onDeleteItem: (itemId: string) => Promise<void>; // New prop for deleting items
  onReorderItemsInColumn: (columnId: string, itemIds: string[]) => Promise<void>;
  onMoveItem: (itemId: string, sourceColumnId: string, sourceIndex: number, destinationColumnId: string, destinationIndex: number) => Promise<void>;
  onReorderColumns: (boardId: string, columnIds: string[]) => Promise<void>;
}

export function KanbanBoardView({
  board,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
  onAddItem,
  onDeleteItem, // Destructure new prop
  onReorderItemsInColumn,
  onMoveItem,
  onReorderColumns,
}: KanbanBoardViewProps) {
  const { toast } = useToast();
  const TRASH_CAN_ID = "kanban-trash-can"; // Unique ID for the trash can

  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  const sortedColumns = [...(board.columns || [])].sort((a, b) => a.order_index - b.order_index);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) {
      return;
    }

    // Dropped on trash can
    if (destination.droppableId === TRASH_CAN_ID && type === "item") {
      setItemToDeleteId(draggableId);
      setIsConfirmDeleteDialogOpen(true);
      return; // Stop further processing here, wait for confirmation
    }

    // Dropped back to original position or invalid drop
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

  const handleConfirmDelete = async () => {
    if (itemToDeleteId) {
      await onDeleteItem(itemToDeleteId);
      setItemToDeleteId(null);
    }
    setIsConfirmDeleteDialogOpen(false);
  };

  const handleCancelDelete = () => {
    setItemToDeleteId(null);
    setIsConfirmDeleteDialogOpen(false);
    // No need to explicitly re-render or revert, react-beautiful-dnd handles the snap-back
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
            <div className="flex-shrink-0 w-80 min-w-80 flex flex-col space-y-4">
              <Button
                variant="outline"
                className="w-full h-1/2 border-dashed border-2 border-muted-foreground/50 text-muted-foreground hover:bg-muted/20 transition-smooth"
                onClick={() => onAddColumn(board.id)}
              >
                <Plus className="w-5 h-5 mr-2" /> Add New Column
              </Button>
              <KanbanTrashCan id={TRASH_CAN_ID} /> {/* Add the trash can */}
            </div>
          </div>
        )}
      </Droppable>

      {/* Confirmation Dialog for Deletion */}
      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this Kanban item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DragDropContext>
  );
}