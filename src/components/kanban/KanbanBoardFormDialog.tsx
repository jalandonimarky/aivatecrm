import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils"; // Import cn for utility classes
import type { KanbanBoard } from "@/types/crm";

interface KanbanBoardFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: KanbanBoard | null;
  onSubmit: (data: { name: string, background_color: string | null }) => Promise<void>; // Updated onSubmit signature
}

const lightColors = [
  "#FDE68A", // light yellow
  "#BFDBFE", // light blue
  "#C7D2FE", // light indigo
  "#FBCFE8", // light pink
  "#D1FAE5", // light mint
  "#FEF9C3", // soft cream
];

export function KanbanBoardFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
}: KanbanBoardFormDialogProps) {
  const [boardName, setBoardName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null); // New state for color
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBoardName(initialData?.name || "");
      setSelectedColor(initialData?.background_color || null); // Initialize selected color
      setLoading(false);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ name: boardName, background_color: selectedColor }); // Pass selected color
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

          {/* Color Picker Section */}
          <div className="space-y-2">
            <Label>Board Color</Label>
            <div className="grid grid-cols-4 gap-2"> {/* Adjusted grid for better layout */}
              {lightColors.map((color) => (
                <div
                  key={color}
                  className={cn(
                    "w-full h-10 rounded-md cursor-pointer border-2 border-transparent transition-all flex items-center justify-center",
                    selectedColor === color && "border-primary ring-2 ring-primary"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  title={color}
                />
              ))}
              <div
                className={cn(
                  "w-full h-10 rounded-md cursor-pointer border-2 border-transparent flex items-center justify-center text-muted-foreground text-xs",
                  !selectedColor && "border-primary ring-2 ring-primary"
                )}
                style={{ backgroundColor: "hsl(var(--muted))" }}
                onClick={() => setSelectedColor(null)}
                title="Clear Color"
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
              {loading ? (initialData ? "Saving..." : "Creating...") : (initialData ? "Save Changes" : "Create Board")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}