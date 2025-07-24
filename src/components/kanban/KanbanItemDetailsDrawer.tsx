import React, { useState, useEffect } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { KanbanItemDetailsView } from "./KanbanItemDetailsView";
import { KanbanItemFormDrawer } from "./KanbanItemFormDrawer"; // The existing form drawer
import type { KanbanItem, Profile } from "@/types/crm";

interface KanbanItemDetailsDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: KanbanItem | null; // The item to display/edit
  profiles: Profile[];
  getFullName: (profile: Profile) => string;
  onUpdateItem: (data: { title: string, description?: string, column_id: string, order_index: number, category?: string, priority_level?: KanbanItem['priority_level'], assigned_to?: string, due_date?: string, event_time?: string }) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onMarkComplete: (itemId: string, isCompleted: boolean) => Promise<void>;
}

export function KanbanItemDetailsDrawer({
  isOpen,
  onOpenChange,
  item,
  profiles,
  getFullName,
  onUpdateItem,
  onDeleteItem,
  onMarkComplete,
}: KanbanItemDetailsDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false); // Reset to view mode when drawer closes
    }
  }, [isOpen]);

  const handleEditClick = (itemToEdit: KanbanItem) => {
    setIsEditing(true);
  };

  const handleFormSubmit = async (data: any) => {
    await onUpdateItem(data);
    setIsEditing(false); // Go back to view mode after update
  };

  const handleFormOpenChange = (open: boolean) => {
    if (!open) {
      setIsEditing(false); // If the form drawer closes, go back to view mode
    }
  };

  if (!item) return null; // Don't render if no item is provided

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="w-full md:w-1/2 lg:w-1/3 max-w-sm h-full mt-0 rounded-none">
          {/* KanbanItemDetailsView is always rendered inside this drawer */}
          <KanbanItemDetailsView
            item={item}
            profiles={profiles}
            getFullName={getFullName}
            onEditClick={handleEditClick}
            onDeleteClick={onDeleteItem}
            onMarkComplete={onMarkComplete}
          />
        </DrawerContent>
      </Drawer>

      {/* The existing KanbanItemFormDrawer is opened on top for editing */}
      {isEditing && (
        <KanbanItemFormDrawer
          isOpen={isEditing}
          onOpenChange={handleFormOpenChange}
          initialData={item}
          columnId={item.column_id} // Pass current columnId
          onSubmit={handleFormSubmit}
          nextOrderIndex={item.order_index} // Pass current order_index
          profiles={profiles}
          getFullName={getFullName}
        />
      )}
    </>
  );
}