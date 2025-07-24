import React from "react";
import { Droppable } from "react-beautiful-dnd";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface KanbanDeleteZoneProps {
  isDraggingItem: boolean;
  onConfirmDelete: () => void; // This will be called when user confirms deletion
  isOpen: boolean; // For controlling the AlertDialog
  onOpenChange: (open: boolean) => void; // For controlling the AlertDialog
}

export function KanbanDeleteZone({ isDraggingItem, onConfirmDelete, isOpen, onOpenChange }: KanbanDeleteZoneProps) {
  return (
    <>
      <Droppable droppableId="kanban-delete-zone" isDropDisabled={!isDraggingItem}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "fixed bottom-4 left-4 p-4 rounded-full transition-all duration-200 ease-in-out",
              "flex items-center justify-center",
              "z-50", // Ensure it's above other content
              isDraggingItem ? "opacity-100" : "opacity-0 pointer-events-none", // Only visible when dragging
              snapshot.isDraggingOver
                ? "bg-destructive/80 text-destructive-foreground scale-110 shadow-lg"
                : "bg-muted/50 text-muted-foreground scale-100"
            )}
          >
            <Trash2 className="h-8 w-8" />
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}