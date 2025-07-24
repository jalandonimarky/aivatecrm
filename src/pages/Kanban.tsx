import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useCRMData } from "@/hooks/useCRMData";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, LayoutDashboard } from "lucide-react";
import { KanbanBoardView } from "@/components/kanban/KanbanBoardView";
import { KanbanBoardCard } from "@/components/kanban/KanbanBoardCard";
import { KanbanBoardFormDialog } from "@/components/kanban/KanbanBoardFormDialog";
import { KanbanColumnFormDialog } from "@/components/kanban/KanbanColumnFormDialog";
import { KanbanItemFormDrawer } from "@/components/kanban/KanbanItemFormDrawer"; // Keep this for the actual form
import { KanbanItemDetailsDrawer } from "@/components/kanban/KanbanItemDetailsDrawer"; // New import
import { Skeleton } from "@/components/ui/skeleton";
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
    markKanbanItemComplete, // New function
    reorderKanbanItemsInColumn,
    moveKanbanItem,
    reorderKanbanColumns,
    profiles,
    getFullName,
    refetch,
  } = useCRMData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedBoardId = searchParams.get("boardId");
  const selectedBoard = kanbanBoards.find(board => board.id === selectedBoardId);

  // Dialog states
  const [isBoardFormDialogOpen, setIsBoardFormDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<KanbanBoard | null>(null);

  const [isColumnFormDialogOpen, setIsColumnFormDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [currentBoardIdForColumn, setCurrentBoardIdForColumn] = useState<string | null>(null);

  const [isItemDetailsDrawerOpen, setIsItemDetailsDrawerOpen] = useState(false); // State for the new details drawer
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<KanbanItem | null>(null); // Item to pass to details drawer
  const [currentColumnIdForItem, setCurrentColumnIdForItem] = useState<string | null>(null); // Declared here

  // Handlers for Board operations
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

  // Handlers for Item operations
  const handleAddItemClick = (columnId: string) => {
    // When adding a new item, we still use the KanbanItemFormDrawer directly
    setSelectedItemForDetails(null); // Ensure no item is selected for details view
    setCurrentColumnIdForItem(columnId);
    setIsItemDetailsDrawerOpen(true); // Open the details drawer, which will show the form since item is null
  };

  const handleCreateItem = async (data: { title: string, description?: string, column_id: string, order_index: number, category?: string, priority_level?: KanbanItem['priority_level'], assigned_to?: string, due_date?: string }) => {
    await createKanbanItem(data);
  };

  const handleEditItemClick = (item: KanbanItem) => {
    // When editing an existing item, open the details drawer with the item
    setSelectedItemForDetails(item);
    setIsItemDetailsDrawerOpen(true);
  };

  const handleUpdateItem = async (data: { title: string, description?: string, column_id: string, order_index: number, category?: string, priority_level?: KanbanItem['priority_level'], assigned_to?: string, due_date?: string }) => {
    if (selectedItemForDetails) {
      await updateKanbanItem(selectedItemForDetails.id, data);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      await deleteKanbanItem(itemId);
      setSelectedItemForDetails(null); // Close details drawer if the item being viewed is deleted
      setIsItemDetailsDrawerOpen(false);
    }
  };

  // Reordering handlers
  const handleReorderItems = async (columnId: string, itemIds: string[]) => {
    await reorderKanbanItemsInColumn(columnId, itemIds);
  };

  const handleMoveItem = async (itemId: string, sourceColumnId: string, sourceIndex: number, destinationColumnId: string, destinationIndex: number) => {
    await moveKanbanItem(itemId, sourceColumnId, sourceIndex, destinationColumnId, destinationIndex);
  };

  const handleReorderColumns = async (boardId: string, columnIds: string[]) => {
    await reorderKanbanColumns(boardId, columnIds);
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

  return (
    <div className="space-y-6 h-full flex flex-col">
      {selectedBoard ? (
        <>
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
              onEditItem={handleEditItemClick} // This now opens the details drawer
              onDeleteItem={handleDeleteItem}
              onReorderItemsInColumn={handleReorderItems}
              onMoveItem={handleMoveItem}
              onReorderColumns={handleReorderColumns}
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

          {/* Kanban Item Details Drawer (main entry for item view/edit) */}
          {isItemDetailsDrawerOpen && (
            <KanbanItemDetailsDrawer
              isOpen={isItemDetailsDrawerOpen}
              onOpenChange={setIsItemDetailsDrawerOpen}
              item={selectedItemForDetails} // Pass the selected item
              profiles={profiles}
              getFullName={getFullName}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onMarkComplete={markKanbanItemComplete} // Pass the new function
            />
          )}
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}