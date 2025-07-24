import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { kanbanBoardColors } from "@/lib/kanban-colors";
import type { KanbanColumn } from "@/types/crm";

interface KanbanColumnFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: KanbanColumn | null;
  boardId: string;
  onSubmit: (data: { name: string, board_id: string, order_index: number, background_color: string | null }) => Promise<void>;
  nextOrderIndex: number;
}

export function KanbanColumnFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  boardId,
  onSubmit,
  nextOrderIndex,
}: KanbanColumnFormDialogProps) {
  const { theme } = useTheme();
  const [columnName, setColumnName] = useState("");
  const [selectedColorKey, setSelectedColorKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setColumnName(initialData?.name || "");
      const isKey = kanbanBoardColors.some(c => c.key === initialData?.background_color);
      setSelectedColorKey(isKey ? initialData?.background_color || null : null);
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
        background_color: selectedColorKey,
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
          <DialogTitle>{initialData ? "Edit Column" : "Add New Column"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="column-name">Column Name *</Label>
            <Input
              id="column-name"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Column Color</Label>
            <div className="grid grid-cols-3 gap-2">
              {kanbanBoardColors.map((color) => (
                <div
                  key={color.key}
                  className={cn(
                    "w-full h-10 rounded-md cursor-pointer border-2 border-transparent transition-all flex items-center justify-center",
                    selectedColorKey === color.key && "border-primary ring-2 ring-primary"
                  )}
                  style={{ backgroundImage: theme === 'dark' ? color.dark : color.light }}
                  onClick={() => setSelectedColorKey(color.key)}
                  title={color.name}
                />
              ))}
              <div
                className={cn(
                  "w-full h-10 rounded-md cursor-pointer border-2 border-transparent flex items-center justify-center text-muted-foreground text-xs bg-muted",
                  !selectedColorKey && "border-primary ring-2 ring-primary"
                )}
                onClick={() => setSelectedColorKey(null)}
                title="Default"
              >
                <span className="text-sm font-medium">None</span>
              </div>
            </div>
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