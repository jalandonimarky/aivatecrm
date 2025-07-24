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
import type { KanbanItem } from "@/types/crm";

interface TenantInfoFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: KanbanItem;
  onSubmit: (data: Partial<KanbanItem>) => Promise<void>;
}

export function TenantInfoFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
}: TenantInfoFormDialogProps) {
  const [formData, setFormData] = useState<Partial<KanbanItem>>({});
  const [isMoveInCalendarOpen, setIsMoveInCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const clientCategories: { value: string, label: string }[] = [
    { value: "Insurance Company", label: "Insurance Company" },
    { value: "Corporate Relocation", label: "Corporate Relocation" },
    { value: "Private Individual", label: "Private Individual" },
  ];

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        client_category: initialData.client_category || undefined,
        tenant_contact_full_name: initialData.tenant_contact_full_name || "",
        tenant_contact_phone: initialData.tenant_contact_phone || "",
        tenant_contact_email: initialData.tenant_contact_email || "",
        household_composition: initialData.household_composition || "",
        pets_info: initialData.pets_info || "",
        bedrooms_needed: initialData.bedrooms_needed || undefined,
        bathrooms_needed: initialData.bathrooms_needed || undefined,
        preferred_locations: initialData.preferred_locations || "",
        desired_move_in_date: initialData.desired_move_in_date,
      });
      setLoading(false);
    }
  }, [isOpen, initialData]);

  const handleInputChange = (field: keyof KanbanItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submissionData = {
        ...formData,
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
          <DialogTitle>Edit Tenant Information</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[70vh] p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-category">Client Category</Label>
                <Select
                  value={formData.client_category || "none"}
                  onValueChange={(value) => handleInputChange('client_category', value === "none" ? undefined : value)}
                >
                  <SelectTrigger className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none border-border">
                    <SelectValue placeholder="Select client category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {clientCategories.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant-name">Tenant Full Name</Label>
                  <Input id="tenant-name" value={formData.tenant_contact_full_name || ""} onChange={(e) => handleInputChange('tenant_contact_full_name', e.target.value)} className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-phone">Tenant Phone</Label>
                  <Input id="tenant-phone" value={formData.tenant_contact_phone || ""} onChange={(e) => handleInputChange('tenant_contact_phone', e.target.value)} className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant-email">Tenant Email</Label>
                <Input id="tenant-email" type="email" value={formData.tenant_contact_email || ""} onChange={(e) => handleInputChange('tenant_contact_email', e.target.value)} className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="household-comp">Household Composition</Label>
                <Textarea id="household-comp" value={formData.household_composition || ""} onChange={(e) => handleInputChange('household_composition', e.target.value)} rows={2} className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pets-info">Do you have pets? If yes, how many?</Label>
                <Input id="pets-info" value={formData.pets_info || ""} onChange={(e) => handleInputChange('pets_info', e.target.value)} className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none border-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms Needed</Label>
                  <Input id="bedrooms" type="number" value={formData.bedrooms_needed || ""} onChange={(e) => handleInputChange('bedrooms_needed', e.target.value)} className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms Needed</Label>
                  <Input id="bathrooms" type="number" value={formData.bathrooms_needed || ""} onChange={(e) => handleInputChange('bathrooms_needed', e.target.value)} className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locations">Preferred Locations</Label>
                <Input id="locations" value={formData.preferred_locations || ""} onChange={(e) => handleInputChange('preferred_locations', e.target.value)} className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="move-in-date">Desired Move-in Date</Label>
                <Popover open={isMoveInCalendarOpen} onOpenChange={setIsMoveInCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none border-border", !formData.desired_move_in_date && "text-muted-foreground")}>
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
          </ScrollArea>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-primary active:scale-95" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}