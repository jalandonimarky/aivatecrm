import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ProjectTask, Profile } from "@/types/crm";

interface ProjectTaskFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: ProjectTask | null;
  profiles: Profile[];
  getFullName: (profile: Profile) => string;
}

export function ProjectTaskFormDialog({ isOpen, onOpenChange, onSubmit, initialData, profiles, getFullName }: ProjectTaskFormDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee_id: "unassigned",
    due_date: undefined as Date | undefined,
    priority: "Medium" as ProjectTask['priority'],
    status: "On Track" as ProjectTask['status'],
    section: "To Do" as ProjectTask['section'],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || "",
        assignee_id: initialData.assignee_id || "unassigned",
        due_date: initialData.due_date ? new Date(initialData.due_date) : undefined,
        priority: initialData.priority,
        status: initialData.status,
        section: initialData.section,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        assignee_id: "unassigned",
        due_date: undefined,
        priority: "Medium",
        status: "On Track",
        section: "To Do",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      assignee_id: formData.assignee_id === "unassigned" ? null : formData.assignee_id,
      due_date: formData.due_date ? format(formData.due_date, "yyyy-MM-dd") : null,
    };
    await onSubmit(dataToSubmit);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Task Title" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} required />
          <Textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Select value={formData.assignee_id} onValueChange={(value) => setFormData(prev => ({ ...prev, assignee_id: value }))}>
              <SelectTrigger><SelectValue placeholder="Assignee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {profiles.map(p => <SelectItem key={p.id} value={p.id}>{getFullName(p)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn(!formData.due_date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? format(formData.due_date, "PPP") : "Due Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent><Calendar mode="single" selected={formData.due_date} onSelect={(d) => setFormData(prev => ({ ...prev, due_date: d }))} /></PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select value={formData.priority} onValueChange={(v: ProjectTask['priority']) => setFormData(p => ({ ...p, priority: v }))}>
              <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formData.status} onValueChange={(v: ProjectTask['status']) => setFormData(p => ({ ...p, status: v }))}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="On Track">On Track</SelectItem>
                <SelectItem value="At Risk">At Risk</SelectItem>
                <SelectItem value="Off Track">Off Track</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formData.section} onValueChange={(v: ProjectTask['section']) => setFormData(p => ({ ...p, section: v }))}>
              <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="To Do">To Do</SelectItem>
                <SelectItem value="Doing">Doing</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{initialData ? "Save Changes" : "Create Task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}