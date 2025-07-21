import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { KanbanItem } from "@/types/crm";

interface KanbanItemFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: KanbanItem | null;
  columnId: string;
  onSubmit: (data: { title: string, description?: string, column_id: string, order_index: number }) => Promise<void>;
  nextOrderIndex: number;
}

export function KanbanItemFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  columnId,
  onSubmit,
  nextOrderIndex,
}: KanbanItemFormDialogProps) {
  const [itemTitle, setItemTitle] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setItemTitle(initialData?.title || "");
      setItemDescription(initialData?.description || "");
      setLoading(false);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        title: itemTitle,
        description: itemDescription,
        column_id: columnId,
        order_index: initialData ? initialData.order_index : nextOrderIndex,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="item-title">Item Title *</Label>
            <Input
              id="item-title"
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-description">Description</Label>
            <Textarea
              id="item-description"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-primary active:scale-95" disabled={loading}>
              {loading ? (initialData ? "Saving..." : "Creating...") : (initialData ? "Save Changes" : "Add Item")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}