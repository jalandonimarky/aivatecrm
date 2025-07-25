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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { KanbanItem, Profile } from "@/types/crm";

interface KanbanItemFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: KanbanItem | null;
  columnId: string;
  onSubmit: (data: any) => Promise<void>;
  nextOrderIndex: number;
  profiles: Profile[];
  getFullName: (profile: Profile) => string;
}

export function KanbanItemFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  columnId,
  onSubmit,
  nextOrderIndex,
  profiles,
  getFullName,
}: KanbanItemFormDialogProps) {
  const [formData, setFormData] = useState<Partial<KanbanItem>>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const predefinedCategories = ["Real Estate", "Tech Solutions", "Creative Design"];

  const priorityLevels: { value: KanbanItem['priority_level'], label: string }[] = [
    { value: "p0", label: "P0 - Urgent" },
    { value: "p1", label: "P1 - High" },
    { value: "p2", label: "P2 - Medium" },
    { value: "p3", label: "P3 - Low" },
  ];

  const statusOptions: { value: KanbanItem['status'], label: string }[] = [
    { value: "new", label: "New" },
    { value: "in_progress", label: "In Progress" },
    { value: "closed", label: "Closed" },
  ];

  useEffect(() => {
    if (isOpen) {
      const initialCategory = initialData?.category;
      if (initialCategory && !predefinedCategories.includes(initialCategory)) {
        setIsCustomCategory(true);
      } else {
        setIsCustomCategory(false);
      }

      setFormData({
        title: initialData?.title || "",
        description: initialData?.description || "",
        category: initialData?.category || undefined,
        priority_level: initialData?.priority_level || undefined,
        status: initialData?.status || "new", // Initialize status
        assigned_to: initialData?.assigned_to || "unassigned",
        due_date: initialData?.due_date,
        event_time: initialData?.event_time || undefined,
      });
      setLoading(false);
    }
  }, [isOpen, initialData]);

  const handleInputChange = (field: keyof KanbanItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'Others') {
      setIsCustomCategory(true);
      handleInputChange('category', ''); // Clear category to allow typing
    } else {
      setIsCustomCategory(false);
      handleInputChange('category', value === 'none' ? undefined : value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.title.trim()) return;
    setLoading(true);
    try {
      const submissionData = {
        ...formData,
        order_index: initialData ? initialData.order_index : nextOrderIndex,
        column_id: columnId,
        assigned_to: formData.assigned_to === "unassigned" ? null : formData.assigned_to,
        due_date: formData.due_date ? format(new Date(formData.due_date), "yyyy-MM-dd") : null,
        status: formData.status || "new", // Ensure status is always set
      };
      await onSubmit(submissionData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[60vh] p-4">
            <div className="space-y-4">
              {/* Core Details */}
              <div className="space-y-2">
                <Label htmlFor="item-title">Title *</Label>
                <Input
                  id="item-title"
                  value={formData.title || ""}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-description">Description</Label>
                <Textarea
                  id="item-description"
                  value={formData.description || ""}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-priority">Priority Level</Label>
                  <Select
                    value={formData.priority_level || "none"}
                    onValueChange={(value) => handleInputChange('priority_level', value === "none" ? undefined : value)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {priorityLevels.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-category">Category</Label>
                  <Select
                    value={isCustomCategory ? 'Others' : formData.category || 'none'}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {predefinedCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isCustomCategory && (
                <div className="space-y-2">
                  <Label htmlFor="custom-category">Custom Category</Label>
                  <Input
                    id="custom-category"
                    value={formData.category || ''}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="Enter custom category name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="item-status">Status</Label>
                <Select
                  value={formData.status || "new"}
                  onValueChange={(value) => handleInputChange('status', value as KanbanItem['status'])}
                >
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-assigned-to">Assigned To</Label>
                <Select
                  value={formData.assigned_to || "unassigned"}
                  onValueChange={(value) => handleInputChange('assigned_to', value)}
                >
                  <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">None</SelectItem>
                    {profiles.map(profile => <SelectItem key={profile.id} value={profile.id}>{getFullName(profile)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-due-date">Due Date</Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.due_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.due_date ? format(new Date(formData.due_date), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={formData.due_date ? new Date(formData.due_date) : undefined} onSelect={(date) => { handleInputChange('due_date', date); setIsCalendarOpen(false); }} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-event-time">Time</Label>
                  <Input id="item-event-time" type="time" value={formData.event_time || ""} onChange={(e) => handleInputChange('event_time', e.target.value)} />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4">
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