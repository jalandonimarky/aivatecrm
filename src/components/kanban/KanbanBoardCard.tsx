import React from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Users } from "lucide-react";
import { UserProfileCard } from "@/components/UserProfileCard";
import type { KanbanBoard } from "@/types/crm";
import { cn } from "@/lib/utils";
import { getKanbanColor } from "@/lib/kanban-colors";

interface KanbanBoardCardProps {
  board: KanbanBoard;
  onSelect: (boardId: string) => void;
  onEdit: (board: KanbanBoard) => void;
  onDelete: (boardId: string) => void;
  onColorChange: (boardId: string, color: string | null) => void;
}

export function KanbanBoardCard({ board, onSelect, onEdit, onDelete, onColorChange }: KanbanBoardCardProps) {
  const { theme } = useTheme();

  const backgroundColor = getKanbanColor(board.background_color, theme);
  const hasCustomBg = !!backgroundColor;
  const isDarkThemeWithCustomBg = hasCustomBg && theme === 'dark';
  
  const cardStyle = backgroundColor
    ? { backgroundImage: backgroundColor }
    : {};

  return (
    <Card 
      className={cn(
        "border-border/50 hover:shadow-medium transition-smooth cursor-pointer",
        !backgroundColor && "bg-gradient-card"
      )}
      style={cardStyle}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle 
          className={cn(
            "text-lg font-semibold flex-1 min-w-0 pr-2 break-words",
            isDarkThemeWithCustomBg ? "text-white/90" : "text-accent"
          )} 
          onClick={() => onSelect(board.id)}
        >
          {board.name}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "h-8 w-8 p-0",
                backgroundColor && theme === 'dark' && "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onEdit(board)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Board
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(board.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Board
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent onClick={() => onSelect(board.id)} className="pt-0">
        <p className={cn(
          "text-sm text-muted-foreground mb-3",
          backgroundColor && theme === 'dark' && "text-white/60"
        )}>
          {board.columns?.length || 0} columns, {board.columns?.reduce((acc, col) => acc + (col.items?.length || 0), 0) || 0} items
        </p>
        {board.creator && (
          <div className={cn(
            "flex items-center space-x-2 text-sm text-muted-foreground",
            backgroundColor && theme === 'dark' && "text-white/60"
          )}>
            <Users className="w-4 h-4" />
            <UserProfileCard profile={board.creator} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}