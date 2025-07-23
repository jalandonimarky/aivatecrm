import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AivateKanbanColumn } from "@/types/crm";

interface AivateKanbanColumnFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: AivateKanbanColumn | null;
  boardId: string;
  onSubmit: (data: { name: string, board_id: string, order_index: number }) => Promise<void>;
  nextOrderIndex: number;
}

export function AivateKanbanColumnFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  boardId,
  onSubmit,
  nextOrderIndex,
}: AivateKanbanColumnFormDialogProps) {
  const [columnName, setColumnName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setColumnName(initialData?.name || "");
      setLoading(false);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!columnName.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        name: columnName,
        board_id: boardId,
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
          <DialogTitle>{initialData ? "Edit AiVate Column" : "Add New AiVate Column"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="aivate-column-name">Column Name *</Label>
            <Input
              id="aivate-column-name"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-primary active:scale-95" disabled={loading}>
              {loading ? (initialData ? "Saving..." : "Creating...") : (initialData ? "Save Changes" : "Add Column")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}