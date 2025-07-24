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
import { Separator } from "@/components/ui/separator";
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
  const [isMoveInCalendarOpen, setIsMoveInCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const itemCategories: { value: string, label: string }[] = [
    { value: "design", label: "Design" },
    { value: "development", label: "Development" },
    { value: "marketing", label: "Marketing" },
    { value: "business", label: "Business" },
  ];

  const clientCategories: { value: string, label: string }[] = [
    { value: "Insurance Company", label: "Insurance Company" },
    { value: "Corporate Relocation", label: "Corporate Relocation" },
    { value: "Private Individual", label: "Private Individual" },
  ];

  const priorityLevels: { value: KanbanItem['priority_level'], label: string }[] = [
    { value: "p0", label: "P0 - Urgent" },
    { value: "p1", label: "P1 - High" },
    { value: "p2", label: "P2 - Medium" },
    { value: "p3", label: "P3 - Low" },
  ];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: initialData?.title || "",
        description: initialData?.description || "",
        category: initialData?.category || undefined,
        priority_level: initialData?.priority_level || undefined,
        assigned_to: initialData?.assigned_to || "unassigned",
        due_date: initialData?.due_date,
        event_time: initialData?.event_time || undefined,
        client_category: initialData?.client_category || undefined,
        tenant_contact_full_name: initialData?.tenant_contact_full_name || "",
        tenant_contact_phone: initialData?.tenant_contact_phone || "",
        tenant_contact_email: initialData?.tenant_contact_email || "",
        household_composition: initialData?.household_composition || "",
        pets_info: initialData?.pets_info || "",
        bedrooms_needed: initialData?.bedrooms_needed || undefined,
        bathrooms_needed: initialData?.bathrooms_needed || undefined,
        preferred_locations: initialData?.preferred_locations || "",
        desired_move_in_date: initialData?.desired_move_in_date,
      });
      setLoading(false);
    }
  }, [isOpen, initialData]);

  const handleInputChange = (field: keyof KanbanItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        desired_move_in_date: formData.desired_move_in_date ? format(new Date(formData.desired_move_in_date), "yyyy-MM-dd") : null,
        bedrooms_needed: formData.bedrooms_needed ? Number(formData.bedrooms_needed) : null,
        bathrooms_needed: formData.bathrooms_needed ? Number(formData.bathrooms_needed) : null,
      };
      await onSubmit(submissionData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[70vh] p-4">
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
                    value={formData.category || "none"}
                    onValueChange={(value) => handleInputChange('category', value === "none" ? undefined : value)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {itemCategories.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="client-category">Client Category</Label>
                  <Select
                    value={formData.client_category || "none"}
                    onValueChange={(value) => handleInputChange('client_category', value === "none" ? undefined : value)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select client category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {clientCategories.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
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

              <Separator className="my-6" />

              {/* Tenant Information */}
              <h3 className="text-lg font-semibold">Tenant Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenant-name">Tenant Full Name</Label>
                    <Input id="tenant-name" value={formData.tenant_contact_full_name || ""} onChange={(e) => handleInputChange('tenant_contact_full_name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-phone">Tenant Phone</Label>
                    <Input id="tenant-phone" value={formData.tenant_contact_phone || ""} onChange={(e) => handleInputChange('tenant_contact_phone', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-email">Tenant Email</Label>
                  <Input id="tenant-email" type="email" value={formData.tenant_contact_email || ""} onChange={(e) => handleInputChange('tenant_contact_email', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="household-comp">Household Composition</Label>
                  <Textarea id="household-comp" value={formData.household_composition || ""} onChange={(e) => handleInputChange('household_composition', e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pets-info">Pets Info</Label>
                  <Input id="pets-info" value={formData.pets_info || ""} onChange={(e) => handleInputChange('pets_info', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms Needed</Label>
                    <Input id="bedrooms" type="number" value={formData.bedrooms_needed || ""} onChange={(e) => handleInputChange('bedrooms_needed', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms Needed</Label>
                    <Input id="bathrooms" type="number" value={formData.bathrooms_needed || ""} onChange={(e) => handleInputChange('bathrooms_needed', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locations">Preferred Locations</Label>
                  <Input id="locations" value={formData.preferred_locations || ""} onChange={(e) => handleInputChange('preferred_locations', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="move-in-date">Desired Move-in Date</Label>
                  <Popover open={isMoveInCalendarOpen} onOpenChange={setIsMoveInCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.desired_move_in_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.desired_move_in_date ? format(new Date(formData.desired_move_in_date), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={formData.desired_move_in_date ? new Date(formData.desired_move_in_date) : undefined} onSelect={(date) => { handleInputChange('desired_move_in_date', date); setIsMoveInCalendarOpen(false); }} initialFocus />
                    </PopoverContent>
                  </Popover>
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