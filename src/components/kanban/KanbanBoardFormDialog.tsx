import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { KanbanBoard } from "@/types/crm";

interface KanbanBoardFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: KanbanBoard | null;
  onSubmit: (data: { name: string, project_type: KanbanBoard['project_type'], custom_project_name?: string | null }) => Promise<void>;
}

export function KanbanBoardFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
}: KanbanBoardFormDialogProps) {
  const [boardName, setBoardName] = useState("");
  const [projectType, setProjectType] = useState<KanbanBoard['project_type']>('Buds & Bonfire');
  const [customProjectName, setCustomProjectName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBoardName(initialData?.name || "");
      setProjectType(initialData?.project_type || 'Buds & Bonfire');
      setCustomProjectName(initialData?.custom_project_name || null);
      setLoading(false);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim()) return;
    if (projectType === 'Other' && !customProjectName?.trim()) {
      alert("Please enter a custom project name.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: boardName,
        project_type: projectType,
        custom_project_name: projectType === 'Other' ? customProjectName : null,
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
          <div className="space-y-2">
            <Label htmlFor="project-type">Project Type *</Label>
            <Select value={projectType} onValueChange={(value: KanbanBoard['project_type']) => {
              setProjectType(value);
              if (value !== 'Other') {
                setCustomProjectName(null);
              }
            }} required>
              <SelectTrigger>
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Buds & Bonfire">Buds & Bonfire</SelectItem>
                <SelectItem value="AiVate">AiVate</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {projectType === 'Other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-project-name">Custom Project Name *</Label>
              <Input
                id="custom-project-name"
                value={customProjectName || ""}
                onChange={(e) => setCustomProjectName(e.target.value)}
                required
              />
            </div>
          )}
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