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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { KanbanItem, Profile } from "@/types/crm";

interface KanbanItemFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: KanbanItem | null;
  columnId: string;
  onSubmit: (data: Omit<KanbanItem, 'id' | 'created_at' | 'creator' | 'assigned_user' | 'activity'>) => Promise<void>;
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

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: initialData?.title || "",
        description: initialData?.description || "",
        lead_type: initialData?.lead_type || undefined,
        client_type: initialData?.client_type || undefined,
        status: initialData?.status || 'New',
        property_match: initialData?.property_match || "",
        property_criteria: initialData?.property_criteria || "",
        full_name: initialData?.full_name || "", // New field
        email_address: initialData?.email_address || "", // New field
        client_contact_info: initialData?.client_contact_info || "", // Phone Number
        family_makeup: initialData?.family_makeup || "",
        pets_info: initialData?.pets_info || undefined, // Changed to number
        num_bedrooms: initialData?.num_bedrooms || undefined, // New field
        num_bathrooms: initialData?.num_bathrooms || undefined, // New field
        preferred_location: initialData?.preferred_location || "", // Renamed label
        move_in_date: initialData?.move_in_date ? new Date(initialData.move_in_date).toISOString() : undefined,
        housing_partner_contact_info: initialData?.housing_partner_contact_info || "",
        property_address: initialData?.property_address || "",
        property_beds_baths_sqft: initialData?.property_beds_baths_sqft || "",
        mtr_approved: initialData?.mtr_approved || false,
        assigned_to: initialData?.assigned_to || "unassigned",
      });
      setLoading(false);
    }
  }, [isOpen, initialData]);

  const handleValueChange = (key: keyof KanbanItem, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;
    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        column_id: columnId,
        order_index: initialData ? initialData.order_index : nextOrderIndex,
        // Ensure numeric fields are handled as numbers or null
        pets_info: formData.pets_info === null || formData.pets_info === undefined ? null : Number(formData.pets_info),
        num_bedrooms: formData.num_bedrooms === null || formData.num_bedrooms === undefined ? null : Number(formData.num_bedrooms),
        num_bathrooms: formData.num_bathrooms === null || formData.num_bathrooms === undefined ? null : Number(formData.num_bathrooms),
      } as Omit<KanbanItem, 'id' | 'created_at' | 'creator' | 'assigned_user' | 'activity'>;
      
      await onSubmit(dataToSubmit);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Lead" : "Create New Lead"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[70vh] pr-6">
            <div className="space-y-4 py-4">
              {/* Main Details */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={formData.title || ""} onChange={(e) => handleValueChange('title', e.target.value)} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Lead Type</Label>
                  <Select value={formData.lead_type} onValueChange={(v) => handleValueChange('lead_type', v)}>
                    <SelectTrigger><SelectValue placeholder="Select lead type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tenant Lead Contact">Tenant Lead Contact</SelectItem>
                      <SelectItem value="Property Lead Contact">Property Lead Contact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Client Type</Label>
                  <Select value={formData.client_type} onValueChange={(v) => handleValueChange('client_type', v)}>
                    <SelectTrigger><SelectValue placeholder="Select client type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => handleValueChange('status', v)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Select value={formData.assigned_to} onValueChange={(v) => handleValueChange('assigned_to', v)}>
                  <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">None</SelectItem>
                    {profiles.map(p => <SelectItem key={p.id} value={p.id}>{getFullName(p)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description || ""} onChange={(e) => handleValueChange('description', e.target.value)} rows={2} />
              </div>

              <Separator className="my-4" />

              {/* Tenant Leads Info */}
              <h3 className="text-lg font-semibold">Tenant Lead Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label> {/* New field */}
                  <Input value={formData.full_name || ""} onChange={(e) => handleValueChange('full_name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label> {/* New field */}
                  <Input type="email" value={formData.email_address || ""} onChange={(e) => handleValueChange('email_address', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label> {/* Changed label and type */}
                  <Input type="tel" value={formData.client_contact_info || ""} onChange={(e) => handleValueChange('client_contact_info', e.target.value)} placeholder="(555) 555-5555" />
                </div>
                <div className="space-y-2">
                  <Label>Move-in Date</Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.move_in_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.move_in_date ? format(new Date(formData.move_in_date), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.move_in_date ? new Date(formData.move_in_date) : undefined} onSelect={(d) => { handleValueChange('move_in_date', d); setIsCalendarOpen(false); }} initialFocus /></PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Family Make-up</Label>
                  <Input value={formData.family_makeup || ""} onChange={(e) => handleValueChange('family_makeup', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Number of Pets (Optional)</Label> {/* Changed label and type */}
                  <Input type="number" value={formData.pets_info || ""} onChange={(e) => handleValueChange('pets_info', e.target.value === '' ? undefined : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Number of Bedrooms</Label> {/* New field */}
                  <Input type="number" value={formData.num_bedrooms || ""} onChange={(e) => handleValueChange('num_bedrooms', e.target.value === '' ? undefined : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Number of Bathrooms</Label> {/* New field */}
                  <Input type="number" step="0.5" value={formData.num_bathrooms || ""} onChange={(e) => handleValueChange('num_bathrooms', e.target.value === '' ? undefined : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Location</Label> {/* Changed label */}
                  <Input value={formData.preferred_location || ""} onChange={(e) => handleValueChange('preferred_location', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Property Criteria</Label>
                <Textarea value={formData.property_criteria || ""} onChange={(e) => handleValueChange('property_criteria', e.target.value)} rows={3} />
              </div>

              <Separator className="my-4" />

              {/* Housing Leads Info */}
              <h3 className="text-lg font-semibold">Housing Lead Info</h3>
              <div className="space-y-2">
                <Label>Housing Partner Contact Info</Label>
                <Input value={formData.housing_partner_contact_info || ""} onChange={(e) => handleValueChange('housing_partner_contact_info', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Property Address</Label>
                <Input value={formData.property_address || ""} onChange={(e) => handleValueChange('property_address', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Beds/Baths & Sq Ft</Label>
                  <Input value={formData.property_beds_baths_sqft || ""} onChange={(e) => handleValueChange('property_beds_baths_sqft', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>MTR Approved</Label>
                  <Select value={formData.mtr_approved ? "yes" : "no"} onValueChange={(v) => handleValueChange('mtr_approved', v === 'yes')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Property Match</Label>
                <Textarea value={formData.property_match || ""} onChange={(e) => handleValueChange('property_match', e.target.value)} rows={3} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">Cancel</Button>
            <Button type="submit" className="bg-gradient-primary active:scale-95" disabled={loading}>
              {loading ? (initialData ? "Saving..." : "Creating...") : (initialData ? "Save Changes" : "Add Item")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}