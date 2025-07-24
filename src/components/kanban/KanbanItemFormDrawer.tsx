import React, { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"; // Changed from Dialog
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
import type { KanbanItem, Profile } from "@/types/crm";

interface KanbanItemFormDrawerProps { // Renamed interface
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: KanbanItem | null;
  columnId: string;
  onSubmit: (data: { title: string, description?: string, column_id: string, order_index: number, category?: string, priority_level?: KanbanItem['priority_level'], assigned_to?: string, due_date?: string, event_time?: string }) => Promise<void>;
  nextOrderIndex: number;
  profiles: Profile[]; // Pass profiles for assigned_to dropdown
  getFullName: (profile: Profile) => string; // Pass getFullName helper
}

export function KanbanItemFormDrawer({ // Renamed component
  isOpen,
  onOpenChange,
  initialData,
  columnId,
  onSubmit,
  nextOrderIndex,
  profiles,
  getFullName,
}: KanbanItemFormDrawerProps) {
  const [itemTitle, setItemTitle] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategory, setItemCategory] = useState<string | undefined>(undefined);
  const [customCategory, setCustomCategory] = useState("");
  const [itemPriorityLevel, setItemPriorityLevel] = useState<KanbanItem['priority_level'] | undefined>(undefined);
  const [itemAssignedTo, setItemAssignedTo] = useState<string | undefined>(undefined);
  const [itemDueDate, setItemDueDate] = useState<Date | undefined>(undefined);
  const [itemEventTime, setItemEventTime] = useState<string | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const itemCategories: { value: string, label: string }[] = [
    { value: "design", label: "Design" },
    { value: "development", label: "Development" },
    { value: "marketing", label: "Marketing" },
    { value: "business", label: "Business" },
    { value: "other", label: "Other" },
  ];

  const priorityLevels: { value: KanbanItem['priority_level'], label: string }[] = [
    { value: "p0", label: "P0 - Urgent" },
    { value: "p1", label: "P1 - High" },
    { value: "p2", label: "P2 - Medium" },
    { value: "p3", label: "P3 - Low" },
  ];

  useEffect(() => {
    if (isOpen) {
      setItemTitle(initialData?.title || "");
      setItemDescription(initialData?.description || "");
      setItemPriorityLevel(initialData?.priority_level || undefined);
      setItemAssignedTo(initialData?.assigned_to || "unassigned");
      setItemDueDate(initialData?.due_date ? new Date(initialData.due_date) : undefined);
      setItemEventTime(initialData?.event_time || undefined);
      setLoading(false);

      const predefinedCategories = itemCategories.map(c => c.value);
      if (initialData?.category && !predefinedCategories.includes(initialData.category)) {
        setItemCategory("other");
        setCustomCategory(initialData.category);
      } else {
        setItemCategory(initialData?.category || undefined);
        setCustomCategory("");
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;
    setLoading(true);
    try {
      const finalCategory = itemCategory === 'other' ? customCategory : itemCategory;

      await onSubmit({
        title: itemTitle,
        description: itemDescription,
        column_id: columnId,
        order_index: initialData ? initialData.order_index : nextOrderIndex,
        category: finalCategory,
        priority_level: itemPriorityLevel,
        assigned_to: itemAssignedTo === "unassigned" ? undefined : itemAssignedTo,
        due_date: itemDueDate ? format(itemDueDate, "yyyy-MM-dd") : undefined,
        event_time: itemEventTime || undefined,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange} direction="right"> {/* Changed to Drawer */}
      <DrawerContent className="w-full max-w-md h-full mt-0 rounded-none"> {/* Adjusted for side panel */}
        <DrawerHeader>
          <DrawerTitle>{initialData ? "Edit Item" : "Add New Item"}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4 px-4 overflow-y-auto flex-1"> {/* Added px-4 and overflow-y-auto */}
          <div className="space-y-2">
            <Label htmlFor="item-title">Title *</Label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-priority">Priority Level</Label>
              <Select
                value={itemPriorityLevel || "none"}
                onValueChange={(value) => setItemPriorityLevel(value === "none" ? undefined : value as KanbanItem['priority_level'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {priorityLevels.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-category">Category</Label>
              <Select
                value={itemCategory || "none"}
                onValueChange={(value) => setItemCategory(value === "none" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {itemCategories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {itemCategory === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-category">Custom Category</Label>
              <Input
                id="custom-category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category name"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-assigned-to">Assigned To</Label>
              <Select
                value={itemAssignedTo || "unassigned"}
                onValueChange={(value) => setItemAssignedTo(value === "unassigned" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">None</SelectItem>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {getFullName(profile)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-due-date">Due Date</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !itemDueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {itemDueDate ? format(itemDueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={itemDueDate}
                    onSelect={(date) => {
                      setItemDueDate(date || undefined);
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-event-time">Time</Label>
            <Input
              id="item-event-time"
              type="time"
              value={itemEventTime || ""}
              onChange={(e) => setItemEventTime(e.target.value)}
            />
          </div>

          <DrawerFooter className="flex-shrink-0 px-0"> {/* Adjusted for drawer */}
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-primary active:scale-95" disabled={loading}>
              {loading ? (initialData ? "Saving..." : "Creating...") : (initialData ? "Save Changes" : "Add Item")}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}