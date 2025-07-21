import React from "react";
import { Draggable } from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { UserProfileCard } from "@/components/UserProfileCard";
import type { KanbanItem as KanbanItemType } from "@/types/crm";

interface KanbanItemProps {
  item: KanbanItemType;
  index: number;
  onEdit: (item: KanbanItemType) => void;
  onDelete: (itemId: string) => void;
}

export function KanbanItem({ item, index, onEdit, onDelete }: KanbanItemProps) {
  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-3 bg-gradient-card border-border/50 shadow-sm ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-foreground text-sm flex-1 min-w-0 break-words pr-2">
                {item.title}
              </h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {item.description && (
              <p className="text-muted-foreground text-xs mb-2 line-clamp-2">
                {item.description}
              </p>
            )}
            {item.creator && (
              <div className="mt-3">
                <UserProfileCard profile={item.creator} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}