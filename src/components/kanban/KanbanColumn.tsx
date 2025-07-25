import React from "react";
import { useTheme } from "next-themes";
import { Droppable } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { KanbanItem } from "./KanbanItem";
import { cn } from "@/lib/utils";
import { getKanbanColor } from "@/lib/kanban-colors";
import type { KanbanColumn as KanbanColumnType } from "@/types/crm";

interface KanbanColumnProps {
  column: KanbanColumnType;
  onAddItem: (columnId: string) => void;
  onEditColumn: (column: KanbanColumnType) => void;
  onDeleteColumn: (columnId: string) => void;
}

export function KanbanColumn({
  column,
  onAddItem,
  onEditColumn,
  onDeleteColumn,
}: KanbanColumnProps) {
  const { theme } = useTheme();
  const sortedItems = [...(column.items || [])].sort((a, b) => a.order_index - b.order_index);

  const backgroundColor = getKanbanColor(column.background_color, theme);
  const hasCustomBg = !!backgroundColor;
  const isDarkThemeWithCustomBg = hasCustomBg && theme === 'dark';

  const cardStyle = backgroundColor ? { backgroundImage: backgroundColor } : {};
  

  return (
    <Card 
      className={cn(
        "flex flex-col w-80 min-w-80 max-h-[calc(100vh-180px)] border-border/50 shadow-medium",
        !hasCustomBg && "bg-gradient-card"
      )}
      style={cardStyle}
    >
      <CardHeader className="flex flex-col space-y-0 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "text-lg font-semibold flex-1 min-w-0 pr-2 break-words",
            isDarkThemeWithCustomBg ? "text-white/90" : "text-accent"
          )}>
            {column.name}
          </CardTitle>
          <span className={cn(
            "text-muted-foreground text-sm font-medium",
            isDarkThemeWithCustomBg && "text-white/60"
          )}>
            {sortedItems.length}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "h-8 w-8 p-0",
                  isDarkThemeWithCustomBg && "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEditColumn(column)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Column
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteColumn(column.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <Droppable droppableId={column.id} type="item">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`min-h-[50px] space-y-4 ${snapshot.isDraggingOver ? "bg-muted/30 rounded-md" : ""}`}
            >
              {sortedItems.map((item, index) => (
                <KanbanItem
                  key={item.id}
                  item={item}
                  index={index}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        <Button
          variant="outline"
          className={cn(
            "w-full mt-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground border-[hsl(var(--foreground)/0.5)]",
            isDarkThemeWithCustomBg && "bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
          )}
          onClick={() => onAddItem(column.id)}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </CardContent>
    </Card>
  );
}