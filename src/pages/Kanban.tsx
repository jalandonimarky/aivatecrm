import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCRMData } from "@/hooks/useCRMData";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { KanbanBoardView } from "@/components/kanban/KanbanBoardView";
import { KanbanBoardCard } from "@/components/kanban/KanbanBoardCard";
import { KanbanBoardFormDialog } from "@/components/kanban/KanbanBoardFormDialog";
import { KanbanColumnFormDialog } from "@/components/kanban/KanbanColumnFormDialog";
import { KanbanItemFormDialog } from "@/components/kanban/KanbanItemFormDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DragDropContext, Droppable, Draggable, DropResult, DragStart } from "react-beautiful-dnd"; // Import DragStart
import { KanbanDeleteZone } from "@/components/kanban/KanbanDeleteZone"; // New import
import { useToast } from "@/hooks/use-toast"; // Import useToast for drag errors
import type { KanbanBoard, KanbanColumn, KanbanItem } from "@/types/crm";

export function Kanban() {
  const {
    kanbanBoards,
    kanbanColumns,
    kanbanItems,
    loading,
    createKanbanBoard,
    updateKanbanBoard,
    deleteKanbanBoard,
    createKanbanColumn,
    updateKanbanColumn,
    deleteKanbanColumn,
    createKanbanItem,
    updateKanbanItem,
    deleteKanbanItem,
    reorderKanbanItemsInColumn,
    moveKanbanItem,
    reorderKanbanColumns,
    profiles,
    getFullName,
  } = useCRMData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast(); // Initialize useToast

  const selectedBoardId = searchParams.get("boardId");
  const selectedBoard = kanbanBoards.find(board => board.id === selectedBoardId);

  // Dialog states
  const [isBoardFormDialogOpen, setIsBoardFormDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<KanbanBoard | null>(null);

  const [isColumnFormDialogOpen, setIsColumnFormDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [currentBoardIdForColumn, setCurrentBoardIdForColumn] = useState<string | null>(null);

  const [isItemFormDialogOpen, setIsItemFormDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KanbanItem | null>(null);
  const [currentColumnIdForItem, setCurrentColumnIdForItem] = useState<string | null>(null);

  // Drag-to-delete states
  const [isDraggingKanbanItem, setIsDraggingKanbanItem] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  // Handlers for Board operations (existing)
  const handleCreateBoard = async (data: { name: string }) => {
    await createKanbanBoard(data);
  };

  const handleUpdateBoard = async (data: { name: string }) => {
    if (editingBoard) {
      await updateKanbanBoard(editingBoard.id, data);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (confirm("Are you sure you want to delete this board and all its columns and items? This action cannot be undone.")) {
      await deleteKanbanBoard(boardId);
      if (selectedBoardId === boardId) {
        setSearchParams({});
      }
    }
  };

  const handleSelectBoard = (boardId: string) => {
    setSearchParams({ boardId });
  };

  const handleBackToBoards = () => {
    setSearchParams({});
  };

  // Handlers for Column operations (existing)
  const handleAddColumnClick = (boardId: string) => {
    setEditingColumn(null);
    setCurrentBoardIdForColumn(boardId);
    setIsColumnFormDialogOpen(true);
  };

  const handleCreateColumn = async (data: { name: string, board_id: string, order_index: number }) => {
    await createKanbanColumn(data);
  };

  const handleEditColumnClick = (column: KanbanColumn) => {
    setEditingColumn(column);
    setCurrentBoardIdForColumn(column.board_id);
    setIsColumnFormDialogOpen(true);
  };

  const handleUpdateColumn = async (data: { name: string, board_id: string, order_index: number }) => {
    if (editingColumn) {
      await updateKanbanColumn(editingColumn.id, data);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (confirm("Are you sure you want to delete this column and all its items? This action cannot be undone.")) {
      await deleteKanbanColumn(columnId);
    }
  };

  // Handlers for Item operations (existing)
  const handleAddItemClick = (columnId: string) => {
    setEditingItem(null);
    setCurrentColumnIdForItem(columnId);
    setIsItemFormDialogOpen(true);
  };

  const handleCreateItem = async (data: { title: string, description?: string, column_id: string, order_index: number, category?: string, priority_level?: KanbanItem['priority_level'], assigned_to?: string, due_date?: string }) => {
    await createKanbanItem(data);
  };

  const handleEditItemClick = (item: KanbanItem) => {
    setEditingItem(item);
    setCurrentColumnIdForItem(item.column_id);
    setIsItemFormDialogOpen(true);
  };

  const handleUpdateItem = async (data: { title: string, description?: string, column_id: string, order_index: number, category?: string, priority_level?: KanbanItem['priority_level'], assigned_to?: string, due_date?: string }) => {
    if (editingItem) {
      await updateKanbanItem(editingItem.id, data);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteKanbanItem(itemId);
  };

  // Drag and Drop Handlers
  const onDragStart = (start: DragStart) => {
    if (start.type === "item") {
      setIsDraggingKanbanItem(true);
      setDraggedItemId(start.draggableId);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    setIsDraggingKanbanItem(false);
    setDraggedItemId(null);

    const { destination, source, draggableId, type } = result;

    // 1. Dropped on the delete zone
    if (destination && destination.droppableId === "kanban-delete-zone") {
      setItemToDeleteId(draggableId);
      setIsConfirmDeleteDialogOpen(true);
      return; // Stop further processing
    }

    // 2. Dropped outside any valid droppable area (not delete zone)
    if (!destination) {
      return;
    }

    // 3. Dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // 4. Column reordering
    if (type === "column") {
      if (!selectedBoard) return; // Should not happen if we are in board view
      const newColumnOrder = Array.from(selectedBoard.columns.map(col => col.id));
      newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, draggableId);
      await reorderKanbanColumns(selectedBoard.id, newColumnOrder);
      return;
    }

    // 5. Item reordering/moving
    if (type === "item") {
      if (!selectedBoard) return; // Should not happen if we are in board view
      const startColumn = selectedBoard.columns.find(col => col.id === source.droppableId);
      const finishColumn = selectedBoard.columns.find(col => col.id === destination.droppableId);

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
        await reorderKanbanItemsInColumn(startColumn.id, newItemIds);
      } else {
        // Moving between different columns
        await moveKanbanItem(
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
      await deleteKanbanItem(itemToDeleteId);
      setItemToDeleteId(null);
      setIsConfirmDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (selectedBoard) {
    return (
      <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
        <div className="space-y-6 h-full flex flex-col">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleBackToBoards}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Boards
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {selectedBoard.name}
            </h1>
            <Button
              className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95"
              onClick={() => handleAddColumnClick(selectedBoard.id)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Column
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <KanbanBoardView
              board={selectedBoard}
              onAddColumn={handleAddColumnClick}
              onEditColumn={handleEditColumnClick}
              onDeleteColumn={handleDeleteColumn}
              onAddItem={handleAddItemClick}
              // Reordering functions are now handled by onDragEnd in this component
            />
          </div>

          {/* Column Form Dialog */}
          {currentBoardIdForColumn && (
            <KanbanColumnFormDialog
              isOpen={isColumnFormDialogOpen}
              onOpenChange={setIsColumnFormDialogOpen}
              initialData={editingColumn}
              boardId={currentBoardIdForColumn}
              onSubmit={editingColumn ? handleUpdateColumn : handleCreateColumn}
              nextOrderIndex={selectedBoard.columns?.length || 0}
            />
          )}

          {/* Item Form Dialog */}
          {currentColumnIdForItem && (
            <KanbanItemFormDialog
              isOpen={isItemFormDialogOpen}
              onOpenChange={setIsItemFormDialogOpen}
              initialData={editingItem}
              columnId={currentColumnIdForItem}
              onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
              nextOrderIndex={kanbanColumns.find(col => col.id === currentColumnIdForItem)?.items?.length || 0}
              profiles={profiles}
              getFullName={getFullName}
            />
          )}
        </div>
        {isDraggingKanbanItem && (
          <KanbanDeleteZone
            isDraggingItem={isDraggingKanbanItem}
            onConfirmDelete={handleConfirmDelete}
            isOpen={isConfirmDeleteDialogOpen}
            onOpenChange={setIsConfirmDeleteDialogOpen}
          />
        )}
      </DragDropContext>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Project Management
          </h1>
          <p className="text-muted-foreground">
            Organize your projects with Kanban boards
          </p>
        </div>
        <Button
          className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95"
          onClick={() => { setEditingBoard(null); setIsBoardFormDialogOpen(true); }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Board
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kanbanBoards.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">
            No Kanban boards yet. Create your first board to get started!
          </p>
        ) : (
          kanbanBoards.map(board => (
            <KanbanBoardCard
              key={board.id}
              board={board}
              onSelect={handleSelectBoard}
              onEdit={(b) => { setEditingBoard(b); setIsBoardFormDialogOpen(true); }}
              onDelete={handleDeleteBoard}
            />
          ))
        )}
      </div>

      {/* Board Form Dialog */}
      <KanbanBoardFormDialog
        isOpen={isBoardFormDialogOpen}
        onOpenChange={setIsBoardFormDialogOpen}
        initialData={editingBoard}
        onSubmit={editingBoard ? handleUpdateBoard : handleCreateBoard}
      />
    </div>
  );
}