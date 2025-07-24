import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Users, Palette } from "lucide-react"; // Import Palette here
import { UserProfileCard } from "@/components/UserProfileCard";
import { BoardColorPicker } from "./BoardColorPicker"; // Import the new component
import type { KanbanBoard } from "@/types/crm";

interface KanbanBoardCardProps {
  board: KanbanBoard;
  onSelect: (boardId: string) => void;
  onEdit: (board: KanbanBoard) => void;
  onDelete: (boardId: string) => void;
  onColorChange: (boardId: string, color: string | null) => void; // New prop
}

export function KanbanBoardCard({ board, onSelect, onEdit, onDelete, onColorChange }: KanbanBoardCardProps) {
  return (
    <Card 
      className="bg-gradient-card border-border/50 hover:shadow-medium transition-smooth cursor-pointer"
      style={board.background_color ? { backgroundColor: board.background_color } : {}} // Apply background color
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex-1 min-w-0 pr-2 break-words" onClick={() => onSelect(board.id)}>
          {board.name}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onEdit(board)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Board
            </DropdownMenuItem>
            {/* The BoardColorPicker now takes the DropdownMenuItem as its trigger */}
            <BoardColorPicker
              currentColor={board.background_color}
              onSelectColor={(color) => onColorChange(board.id, color)}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}> {/* Prevent default close of DropdownMenu */}
                  <Palette className="mr-2 h-4 w-4" />
                  <span>Change Board Color</span>
                </DropdownMenuItem>
              }
            />
            <DropdownMenuItem onClick={() => onDelete(board.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Board
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent onClick={() => onSelect(board.id)} className="pt-0">
        <p className="text-sm text-muted-foreground mb-3">
          {board.columns?.length || 0} columns, {board.columns?.reduce((acc, col) => acc + (col.items?.length || 0), 0) || 0} items
        </p>
        {board.creator && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <UserProfileCard profile={board.creator} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}