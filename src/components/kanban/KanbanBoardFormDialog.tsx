import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { KanbanBoard } from "@/types/crm";

interface KanbanBoardFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: KanbanBoard | null;
  onSubmit: (data: { name: string, background_color: string | null }) => Promise<void>;
}

// Only light, soft gradients for a gentle, eye-pleasing look
const gradientOptions = [
  {
    name: "Mint to White",
    value: "linear-gradient(135deg, #b9fbc0 0%, #ffffff 100%)",
  },
  {
    name: "Sky Blue to White",
    value: "linear-gradient(135deg, #dbeafe 0%, #ffffff 100%)",
  },
  {
    name: "Peach to White",
    value: "linear-gradient(135deg, #ffe5b4 0%, #ffffff 100%)",
  },
  {
    name: "Lavender to White",
    value: "linear-gradient(135deg, #e9d5ff 0%, #ffffff 100%)",
  },
  {
    name: "Soft Yellow to White",
    value: "linear-gradient(135deg, #fef9c3 0%, #ffffff 100%)",
  },
  {
    name: "Blush to White",
    value: "linear-gradient(135deg, #ffe4e6 0%, #ffffff 100%)",
  },
];

export function KanbanBoardFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
}: KanbanBoardFormDialogProps) {
  const [boardName, setBoardName] = useState("");
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBoardName(initialData?.name || "");
      setSelectedGradient(initialData?.background_color || null);
      setLoading(false);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ name: boardName, background_color: selectedGradient });
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
              {gradientOptions.map((gradient) => (
                <div
                  key={gradient.value}
                  className={cn(
                    "w-full h-10 rounded-md cursor-pointer border-2 border-transparent transition-all flex items-center justify-center",
                    selectedGradient === gradient.value && "border-primary ring-2 ring-primary"
                  )}
                  style={{ backgroundImage: gradient.value }}
                  onClick={() => setSelectedGradient(gradient.value)}
                  title={gradient.name}
                />
              ))}
              {/* None option */}
              <div
                className={cn(
                  "w-full h-10 rounded-md cursor-pointer border-2 border-transparent flex items-center justify-center text-muted-foreground text-xs bg-muted",
                  !selectedGradient && "border-primary ring-2 ring-primary"
                )}
                onClick={() => setSelectedGradient(null)}
                title="Default"
              >
                <span className="text-sm font-medium">None</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {selectedGradient
                ? gradientOptions.find(g => g.value === selectedGradient)?.name || "Custom"
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