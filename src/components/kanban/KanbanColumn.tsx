import React from "react";
import { Droppable } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { KanbanItem } from "./KanbanItem";
import type { KanbanColumn as KanbanColumnType, KanbanItem as KanbanItemType } from "@/types/crm";

interface KanbanColumnProps {
  column: KanbanColumnType;
  onAddItem: (columnId: string) => void;
  onEditColumn: (column: KanbanColumnType) => void;
  onDeleteColumn: (columnId: string) => void;
  onEditItem: (item: KanbanItemType) => void;
  onDeleteItem: (itemId: string) => void;
}

export function KanbanColumn({
  column,
  onAddItem,
  onEditColumn,
  onDeleteColumn,
  onEditItem,
  onDeleteItem,
}: KanbanColumnProps) {
  const sortedItems = [...(column.items || [])].sort((a, b) => a.order_index - b.order_index);

  return (
    <Card className="flex flex-col w-80 min-w-80 max-h-[calc(100vh-180px)] bg-gradient-card border-border/50 shadow-medium">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex-1 min-w-0 pr-2 break-words">
          {column.name} ({sortedItems.length})
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
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
      </CardHeader>
      <CardContent className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <Droppable droppableId={column.id} type="item">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`min-h-[50px] ${snapshot.isDraggingOver ? "bg-muted/30 rounded-md" : ""}`}
            >
              {sortedItems.map((item, index) => (
                <KanbanItem
                  key={item.id}
                  item={item}
                  index={index}
                  onEdit={onEditItem}
                  onDelete={onDeleteItem}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        <Button
          variant="outline"
          className="w-full mt-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          onClick={() => onAddItem(column.id)}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </CardContent>
    </Card>
  );
}