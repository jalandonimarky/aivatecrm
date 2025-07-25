import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useCRMData } from "@/hooks/useCRMData";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, LayoutDashboard, Search, Filter } from "lucide-react"; // Import Search and Filter icons
import { Input } from "@/components/ui/input"; // Import Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { KanbanBoardView } from "@/components/kanban/KanbanBoardView";
import { KanbanBoardCard } from "@/components/kanban/KanbanBoardCard";
import { KanbanBoardFormDialog } from "@/components/kanban/KanbanBoardFormDialog";
import { KanbanColumnFormDialog } from "@/components/kanban/KanbanColumnFormDialog";
import { KanbanItemFormDialog } from "@/components/kanban/KanbanItemFormDialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { KanbanBoard, KanbanColumn, KanbanItem } from "@/types/crm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function Kanban() {
  const {
    kanbanBoards,
    kanbanColumns,
    kanbanItems,
    loading,
    createKanbanBoard,
    updateKanbanBoard,
    deleteKanbanBoard,
    updateKanbanBoardColor,
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
    refetch,
  } = useCRMData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("all");

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

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

  // Filtered boards based on search and owner
  const filteredBoards = kanbanBoards.filter(board => {
    const matchesSearch = board.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = selectedOwner === "all" || board.created_by === selectedOwner;
    return matchesSearch && matchesOwner;
  });

  // Handlers for Board operations
  const handleCreateBoard = async (data: { name: string, background_color: string | null }) => {
    await createKanbanBoard(data);
  };

  const handleUpdateBoard = async (data: { name: string, background_color: string | null }) => {
    if (editingBoard) {
      await updateKanbanBoard(editingBoard.id, data);
    }
  };

  const handleEditBoardClick = (board: KanbanBoard) => {
    if (board.created_by !== currentUserId) {
      toast({
        title: "Permission Denied",
        description: "You can only edit boards that you have created.",
        variant: "destructive",
      });
    } else {
      setEditingBoard(board);
      setIsBoardFormDialogOpen(true);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    const board = kanbanBoards.find(b => b.id === boardId);
    if (board && board.created_by !== currentUserId) {
      toast({
        title: "Permission Denied",
        description: "You can only delete boards that you have created.",
        variant: "destructive",
      });
      return;
    }

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

  const handleCreateColumn = async (data: { name: string, board_id: string, order_index: number, background_color: string | null }) => {
    await createKanbanColumn(data);
  };

  const handleEditColumnClick = (column: KanbanColumn) => {
    setEditingColumn(column);
    setCurrentBoardIdForColumn(column.board_id);
    setIsColumnFormDialogOpen(true);
  };

  const handleUpdateColumn = async (data: { name: string, board_id: string, order_index: number, background_color: string | null }) => {
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
    if (confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      await deleteKanbanItem(itemId);
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

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedOwner("all");
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
          <KanbanBoardView
            board={selectedBoard}
            onAddColumn={handleAddColumnClick}
            onEditColumn={handleEditColumnClick}
            onDeleteColumn={handleDeleteColumn}
            onAddItem={handleAddItemClick}
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search boards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedOwner} onValueChange={setSelectedOwner}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {profiles.map(profile => (
              <SelectItem key={profile.id} value={profile.id}>
                {getFullName(profile)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(searchTerm !== "" || selectedOwner !== "all") && (
          <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">
            <Filter className="w-4 h-4 mr-2" /> Clear Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBoards.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">
            {searchTerm || selectedOwner !== "all"
              ? "No Kanban boards found matching your filters."
              : "No Kanban boards yet. Create your first board to get started!"}
          </p>
        ) : (
          filteredBoards.map(board => (
            <KanbanBoardCard
              key={board.id}
              board={board}
              onSelect={handleSelectBoard}
              onEdit={handleEditBoardClick}
              onDelete={handleDeleteBoard}
              onColorChange={updateKanbanBoardColor}
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