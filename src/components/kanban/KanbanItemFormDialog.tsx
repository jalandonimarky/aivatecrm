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
import { format, parseISO } from "date-fns";
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

// Define a local type for the form state to handle Date objects for the calendar
// and undefined for empty optional inputs, which will be converted to null for DB.
type KanbanItemFormState = {
  title: string;
  description: string | null;
  lead_type: 'Tenant Lead Contact' | 'Property Lead Contact' | undefined;
  client_type: 'insurance' | 'corporate' | 'individual' | undefined;
  status: 'New' | 'In Progress' | 'Closed';
  property_match: string | null;
  property_criteria: string | null;
  full_name: string | null;
  email_address: string | null;
  client_contact_info: string | null;
  family_makeup: string | null;
  pets_info: number | undefined; // Use undefined for empty input, convert to null for DB
  num_bedrooms: number | undefined;
  num_bathrooms: number | undefined;
  preferred_location: string | null;
  move_in_date: Date | undefined; // Use Date object for the form
  housing_partner_full_name: string | null;
  housing_partner_email: string | null;
  housing_partner_phone: string | null;
  property_address: string | null;
  property_beds_baths_sqft: string | null;
  mtr_approved: boolean | undefined; // Use undefined for initial state, convert to null for DB
  assigned_to: string | null;
};

// Initial state for the form
const initialFormState: KanbanItemFormState = {
  title: "",
  description: null,
  lead_type: undefined,
  client_type: undefined,
  status: 'New',
  property_match: null,
  property_criteria: null,
  full_name: null,
  email_address: null,
  client_contact_info: null,
  family_makeup: null,
  pets_info: undefined,
  num_bedrooms: undefined,
  num_bathrooms: undefined,
  preferred_location: null,
  move_in_date: undefined,
  housing_partner_full_name: null,
  housing_partner_email: null,
  housing_partner_phone: null,
  property_address: null,
  property_beds_baths_sqft: null,
  mtr_approved: undefined,
  assigned_to: "unassigned",
};

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
  const [formData, setFormData] = useState<KanbanItemFormState>(initialFormState);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: initialData?.title || "",
        description: initialData?.description || null,
        lead_type: initialData?.lead_type || undefined,
        client_type: initialData?.client_type || undefined,
        status: initialData?.status || 'New',
        property_match: initialData?.property_match || null,
        property_criteria: initialData?.property_criteria || null,
        full_name: initialData?.full_name || null,
        email_address: initialData?.email_address || null,
        client_contact_info: initialData?.client_contact_info || null,
        family_makeup: initialData?.family_makeup || null,
        pets_info: initialData?.pets_info === null ? undefined : initialData?.pets_info,
        num_bedrooms: initialData?.num_bedrooms === null ? undefined : initialData?.num_bedrooms,
        num_bathrooms: initialData?.num_bathrooms === null ? undefined : initialData?.num_bathrooms,
        preferred_location: initialData?.preferred_location || null,
        move_in_date: initialData?.move_in_date ? parseISO(initialData.move_in_date) : undefined,
        housing_partner_full_name: initialData?.housing_partner_full_name || null,
        housing_partner_email: initialData?.housing_partner_email || null,
        housing_partner_phone: initialData?.housing_partner_phone || null,
        property_address: initialData?.property_address || null,
        property_beds_baths_sqft: initialData?.property_beds_baths_sqft || null,
        mtr_approved: initialData?.mtr_approved === null ? undefined : initialData?.mtr_approved,
        assigned_to: initialData?.assigned_to || "unassigned",
      });
      setLoading(false);
    } else {
      // Reset form when dialog closes
      setFormData(initialFormState);
    }
  }, [isOpen, initialData]);

  const handleValueChange = (key: keyof KanbanItemFormState, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;
    setLoading(true);
    try {
      // Prepare data for submission, converting Date to string | null and undefined to null
      const dataToSubmit: Omit<KanbanItem, 'id' | 'created_at' | 'creator' | 'assigned_user' | 'activity'> = {
        column_id: columnId, // Required
        order_index: initialData ? initialData.order_index : nextOrderIndex, // Required
        title: formData.title, // Required
        status: formData.status || 'New', // Required
        
        description: formData.description,
        lead_type: formData.lead_type || null,
        client_type: formData.client_type || null,
        property_match: formData.property_match || null,
        property_criteria: formData.property_criteria || null,
        full_name: formData.full_name || null,
        email_address: formData.email_address || null,
        client_contact_info: formData.client_contact_info || null,
        family_makeup: formData.family_makeup || null,
        pets_info: formData.pets_info === undefined ? null : formData.pets_info,
        num_bedrooms: formData.num_bedrooms === undefined ? null : formData.num_bedrooms,
        num_bathrooms: formData.num_bathrooms === undefined ? null : formData.num_bathrooms,
        preferred_location: formData.preferred_location || null,
        move_in_date: formData.move_in_date ? format(formData.move_in_date, "yyyy-MM-dd") : null,
        housing_partner_full_name: formData.housing_partner_full_name || null,
        housing_partner_email: formData.housing_partner_email || null,
        housing_partner_phone: formData.housing_partner_phone || null,
        property_address: formData.property_address || null,
        property_beds_baths_sqft: formData.property_beds_baths_sqft || null,
        mtr_approved: formData.mtr_approved === undefined ? null : formData.mtr_approved,
        assigned_to: formData.assigned_to === "unassigned" ? null : (formData.assigned_to || null),
        created_by: initialData?.created_by || null, // Ensure created_by is passed if updating existing item
      };
      
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
                <Select value={formData.assigned_to || "unassigned"} onValueChange={(v) => handleValueChange('assigned_to', v)}>
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
                  <Label>Full Name</Label>
                  <Input value={formData.full_name || ""} onChange={(e) => handleValueChange('full_name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" value={formData.email_address || ""} onChange={(e) => handleValueChange('email_address', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input type="tel" value={formData.client_contact_info || ""} onChange={(e) => handleValueChange('client_contact_info', e.target.value)} placeholder="(555) 555-5555" />
                </div>
                <div className="space-y-2">
                  <Label>Move-in Date</Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.move_in_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.move_in_date ? format(formData.move_in_date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.move_in_date} onSelect={(d) => { handleValueChange('move_in_date', d || undefined); setIsCalendarOpen(false); }} initialFocus /></PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Family Make-up</Label>
                  <Input value={formData.family_makeup || ""} onChange={(e) => handleValueChange('family_makeup', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Number of Pets (Optional)</Label>
                  <Input type="number" value={formData.pets_info === undefined ? "" : formData.pets_info} onChange={(e) => handleValueChange('pets_info', e.target.value === '' ? undefined : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Number of Bedrooms</Label>
                  <Input type="number" value={formData.num_bedrooms === undefined ? "" : formData.num_bedrooms} onChange={(e) => handleValueChange('num_bedrooms', e.target.value === '' ? undefined : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Number of Bathrooms</Label>
                  <Input type="number" step="0.5" value={formData.num_bathrooms === undefined ? "" : formData.num_bathrooms} onChange={(e) => handleValueChange('num_bathrooms', e.target.value === '' ? undefined : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Location</Label>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={formData.housing_partner_full_name || ""} onChange={(e) => handleValueChange('housing_partner_full_name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" value={formData.housing_partner_email || ""} onChange={(e) => handleValueChange('housing_partner_email', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input type="tel" value={formData.housing_partner_phone || ""} onChange={(e) => handleValueChange('housing_partner_phone', e.target.value)} placeholder="(555) 555-5555" />
                </div>
                <div className="space-y-2">
                  <Label>Property Address</Label>
                  <Input value={formData.property_address || ""} onChange={(e) => handleValueChange('property_address', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Beds/Baths & Sq Ft</Label>
                  <Input value={formData.property_beds_baths_sqft || ""} onChange={(e) => handleValueChange('property_beds_baths_sqft', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>MTR Approved</Label>
                  <Select value={formData.mtr_approved === undefined ? "undefined" : (formData.mtr_approved ? "yes" : "no")} onValueChange={(v) => handleValueChange('mtr_approved', v === 'undefined' ? undefined : (v === 'yes'))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="undefined">N/A</SelectItem>
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