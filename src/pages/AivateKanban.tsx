import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCRMData } from "@/hooks/useCRMData";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AivateKanbanBoardView } from "@/components/aivate-kanban/AivateKanbanBoardView";
import { AivateKanbanBoardFormDialog } from "@/components/aivate-kanban/AivateKanbanBoardFormDialog";
import { AivateKanbanColumnFormDialog } from "@/components/aivate-kanban/AivateKanbanColumnFormDialog";
import { AivateKanbanItemFormDialog } from "@/components/aivate-kanban/AivateKanbanItemFormDialog";
import { AivateKanbanBoardCard } from "@/components/aivate-kanban/AivateKanbanBoardCard"; // Import new AivateKanbanBoardCard
import type { AivateKanbanBoard, AivateKanbanColumn, AivateKanbanItem } from "@/types/crm";

export function AivateKanban() {
  const {
    aivateKanbanBoards,
    aivateKanbanColumns,
    aivateKanbanItems,
    loading,
    createAivateKanbanBoard,
    updateAivateKanbanBoard,
    deleteAivateKanbanBoard,
    createAivateKanbanColumn,
    updateAivateKanbanColumn,
    deleteAivateKanbanColumn,
    createAivateKanbanItem,
    updateAivateKanbanItem,
    deleteAivateKanbanItem,
    reorderAivateKanbanItemsInColumn,
    moveAivateKanbanItem,
    reorderAivateKanbanColumns,
    profiles,
    getFullName,
  } = useCRMData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedBoardId = searchParams.get("boardId");
  const selectedBoard = aivateKanbanBoards.find(board => board.id === selectedBoardId);

  // Dialog states
  const [isBoardFormDialogOpen, setIsBoardFormDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<AivateKanbanBoard | null>(null);

  const [isColumnFormDialogOpen, setIsColumnFormDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<AivateKanbanColumn | null>(null);
  const [currentBoardIdForColumn, setCurrentBoardIdForColumn] = useState<string | null>(null);

  const [isItemFormDialogOpen, setIsItemFormDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AivateKanbanItem | null>(null);
  const [currentColumnIdForItem, setCurrentColumnIdForItem] = useState<string | null>(null);

  // Handlers for Board operations
  const handleCreateBoard = async (data: { name: string }) => {
    await createAivateKanbanBoard(data);
  };

  const handleUpdateBoard = async (data: { name: string }) => {
    if (editingBoard) {
      await updateAivateKanbanBoard(editingBoard.id, data);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (confirm("Are you sure you want to delete this board and all its columns and items? This action cannot be undone.")) {
      await deleteAivateKanbanBoard(boardId);
      if (selectedBoardId === boardId) {
        setSearchParams({}); // Clear boardId from URL if deleted
      }
    }
  };

  const handleSelectBoard = (boardId: string) => {
    setSearchParams({ boardId });
  };

  const handleBackToBoards = () => {
    setSearchParams({});
  };

  // Handlers for Column operations
  const handleAddColumnClick = (boardId: string) => {
    setEditingColumn(null);
    setCurrentBoardIdForColumn(boardId);
    setIsColumnFormDialogOpen(true);
  };

  const handleCreateColumn = async (data: { name: string, board_id: string, order_index: number }) => {
    await createAivateKanbanColumn(data);
  };

  const handleEditColumnClick = (column: AivateKanbanColumn) => {
    setEditingColumn(column);
    setCurrentBoardIdForColumn(column.board_id);
    setIsColumnFormDialogOpen(true);
  };

  const handleUpdateColumn = async (data: { name: string, board_id: string, order_index: number }) => {
    if (editingColumn) {
      await updateAivateKanbanColumn(editingColumn.id, data);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (confirm("Are you sure you want to delete this column and all its items? This action cannot be undone.")) {
      await deleteAivateKanbanColumn(columnId);
    }
  };

  // Handlers for Item operations
  const handleAddItemClick = (columnId: string) => {
    setEditingItem(null);
    setCurrentColumnIdForItem(columnId);
    setIsItemFormDialogOpen(true);
  };

  const handleCreateItem = async (data: any) => {
    await createAivateKanbanItem(data);
  };

  const handleEditItemClick = (item: AivateKanbanItem) => {
    setEditingItem(item);
    setCurrentColumnIdForItem(item.column_id);
    setIsItemFormDialogOpen(true);
  };

  const handleUpdateItem = async (data: any) => {
    if (editingItem) {
      await updateAivateKanbanItem(editingItem.id, data);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      await deleteAivateKanbanItem(itemId);
    }
  };

  // Reordering handlers
  const handleReorderItems = async (columnId: string, itemIds: string[]) => {
    await reorderAivateKanbanItemsInColumn(columnId, itemIds);
  };

  const handleMoveItem = async (itemId: string, sourceColumnId: string, sourceIndex: number, destinationColumnId: string, destinationIndex: number) => {
    await moveAivateKanbanItem(itemId, sourceColumnId, sourceIndex, destinationColumnId, destinationIndex);
  };

  const handleReorderColumns = async (boardId: string, columnIds: string[]) => {
    await reorderAivateKanbanColumns(boardId, columnIds);
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
          <AivateKanbanBoardView
            board={selectedBoard}
            onAddColumn={handleAddColumnClick}
            onEditColumn={handleEditColumnClick}
            onDeleteColumn={handleDeleteColumn}
            onAddItem={handleAddItemClick}
            onEditItem={handleEditItemClick}
            onDeleteItem={handleDeleteItem}
            onReorderItemsInColumn={handleReorderItems}
            onMoveItem={handleMoveItem}
            onReorderColumns={handleReorderColumns}
          />
        </div>

        {/* Column Form Dialog */}
        {currentBoardIdForColumn && (
          <AivateKanbanColumnFormDialog
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
          <AivateKanbanItemFormDialog
            isOpen={isItemFormDialogOpen}
            onOpenChange={setIsItemFormDialogOpen}
            initialData={editingItem}
            columnId={currentColumnIdForItem}
            onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
            nextOrderIndex={aivateKanbanColumns.find(col => col.id === currentColumnIdForItem)?.items?.length || 0}
            profiles={profiles}
            getFullName={getFullName}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AiVate Projects
          </h1>
          <p className="text-muted-foreground">
            Organize your AiVate projects with Kanban boards
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
        {aivateKanbanBoards.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">
            No AiVate Kanban boards yet. Create your first board to get started!
          </p>
        ) : (
          aivateKanbanBoards.map(board => (
            <AivateKanbanBoardCard // Changed to AivateKanbanBoardCard
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
      <AivateKanbanBoardFormDialog
        isOpen={isBoardFormDialogOpen}
        onOpenChange={setIsBoardFormDialogOpen}
        initialData={editingBoard}
        onSubmit={editingBoard ? handleUpdateBoard : handleCreateBoard}
      />
    </div>
  );
}