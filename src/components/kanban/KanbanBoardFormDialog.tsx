import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { kanbanBoardColors } from "@/lib/kanban-colors";
import type { KanbanBoard } from "@/types/crm";

interface KanbanBoardFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: KanbanBoard | null;
  onSubmit: (data: { name: string, background_color: string | null }) => Promise<void>;
}

export function KanbanBoardFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
}: KanbanBoardFormDialogProps) {
  const { theme } = useTheme();
  const [boardName, setBoardName] = useState("");
  const [selectedColorKey, setSelectedColorKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBoardName(initialData?.name || "");
      // Check if the stored value is a key or an old CSS value
      const isKey = kanbanBoardColors.some(c => c.key === initialData?.background_color);
      setSelectedColorKey(isKey ? initialData?.background_color || null : null);
      setLoading(false);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ name: boardName, background_color: selectedColorKey });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Board" : "Create New Board"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="board-name">Board Name *</Label>
            <Input
              id="board-name"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              required
            />
          </div>

          {/* Gradient Picker Section */}
          <div className="space-y-2">
            <Label>Board Color</Label>
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
              {/* None option */}
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
            <div className="text-xs text-muted-foreground mt-1">
              {selectedColorKey
                ? kanbanBoardColors.find(c => c.key === selectedColorKey)?.name || "Custom"
                : "Default (matches app theme)"}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-primary active:scale-95" disabled={loading}>
              {loading ? (initialData ? "Saving..." : "Creating...") : (initialData ? "Save Changes" : "Create Board")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}