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
import type { KanbanItem, Profile, KanbanBoard } from "@/types/crm";

interface KanbanItemFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: KanbanItem | null;
  columnId: string;
  boardProjectType: KanbanBoard['project_type']; // New prop
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
  assigned_to: string | null;
  status: KanbanItem['status'];

  // Buds & Bonfire specific fields
  lead_type: 'Tenant Lead Contact' | 'Property Lead Contact' | undefined;
  client_type: 'insurance' | 'corporate' | 'individual' | undefined;
  property_match: string | null;
  property_criteria: string | null;
  full_name: string | null;
  client_contact_info: string | null;
  family_makeup: string | null;
  pets_info: number | undefined;
  num_bedrooms: number | undefined;
  num_bathrooms: number | undefined;
  preferred_location: string | null;
  move_in_date: Date | undefined;
  housing_partner_full_name: string | null;
  housing_partner_email: string | null;
  housing_partner_phone: string | null;
  property_address: string | null;
  property_beds_baths_sqft: string | null;
  mtr_approved: boolean | undefined;

  // AiVate specific fields
  email_address: string | null;
  phone_number: string | null;
  category: string | null;
};

// Initial state for the form
const initialFormState: KanbanItemFormState = {
  title: "",
  description: null,
  assigned_to: "unassigned",
  status: 'New', // Default status for both types

  // Buds & Bonfire specific fields
  lead_type: undefined,
  client_type: undefined,
  property_match: null,
  property_criteria: null,
  full_name: null,
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

  // AiVate specific fields
  email_address: null,
  phone_number: null,
  category: null,
};

export function KanbanItemFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  columnId,
  boardProjectType, // Use new prop
  onSubmit,
  nextOrderIndex,
  profiles,
  getFullName,
}: KanbanItemFormDialogProps) {
  const [formData, setFormData] = useState<KanbanItemFormState>(initialFormState);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const budsBonfireStatuses: KanbanItem['status'][] = ['New', 'In Progress', 'Closed'];
  const aivateStatuses: KanbanItem['status'][] = ['New', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
  const aivateCategories: string[] = ['Website', 'Mobile App', 'CRM', 'Other'];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: initialData?.title || "",
        description: initialData?.description || null,
        assigned_to: initialData?.assigned_to || "unassigned",
        status: initialData?.status || 'New',

        // Buds & Bonfire specific fields
        lead_type: initialData?.lead_type || undefined,
        client_type: initialData?.client_type || undefined,
        property_match: initialData?.property_match || null,
        property_criteria: initialData?.property_criteria || null,
        full_name: initialData?.full_name || null,
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

        // AiVate specific fields
        email_address: initialData?.email_address || null,
        phone_number: initialData?.phone_number || null,
        category: initialData?.category || null,
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
        assigned_to: formData.assigned_to === "unassigned" ? null : (formData.assigned_to || null),
        created_by: initialData?.created_by || null, // Ensure created_by is passed if updating existing item

        // Buds & Bonfire specific fields (send as null if not applicable)
        lead_type: boardProjectType === 'Buds & Bonfire' ? (formData.lead_type || null) : null,
        client_type: boardProjectType === 'Buds & Bonfire' ? (formData.client_type || null) : null,
        property_match: boardProjectType === 'Buds & Bonfire' ? (formData.property_match || null) : null,
        property_criteria: boardProjectType === 'Buds & Bonfire' ? (formData.property_criteria || null) : null,
        full_name: boardProjectType === 'Buds & Bonfire' ? (formData.full_name || null) : null,
        client_contact_info: boardProjectType === 'Buds & Bonfire' ? (formData.client_contact_info || null) : null,
        family_makeup: boardProjectType === 'Buds & Bonfire' ? (formData.family_makeup || null) : null,
        pets_info: boardProjectType === 'Buds & Bonfire' ? (formData.pets_info === undefined ? null : formData.pets_info) : null,
        num_bedrooms: boardProjectType === 'Buds & Bonfire' ? (formData.num_bedrooms === undefined ? null : formData.num_bedrooms) : null,
        num_bathrooms: boardProjectType === 'Buds & Bonfire' ? (formData.num_bathrooms === undefined ? null : formData.num_bathrooms) : null,
        preferred_location: boardProjectType === 'Buds & Bonfire' ? (formData.preferred_location || null) : null,
        move_in_date: boardProjectType === 'Buds & Bonfire' ? (formData.move_in_date ? format(formData.move_in_date, "yyyy-MM-dd") : null) : null,
        housing_partner_full_name: boardProjectType === 'Buds & Bonfire' ? (formData.housing_partner_full_name || null) : null,
        housing_partner_email: boardProjectType === 'Buds & Bonfire' ? (formData.housing_partner_email || null) : null,
        housing_partner_phone: boardProjectType === 'Buds & Bonfire' ? (formData.housing_partner_phone || null) : null,
        property_address: boardProjectType === 'Buds & Bonfire' ? (formData.property_address || null) : null,
        property_beds_baths_sqft: boardProjectType === 'Buds & Bonfire' ? (formData.property_beds_baths_sqft || null) : null,
        mtr_approved: boardProjectType === 'Buds & Bonfire' ? (formData.mtr_approved === undefined ? null : formData.mtr_approved) : null,

        // AiVate specific fields (send as null if not applicable)
        email_address: boardProjectType === 'AiVate' ? (formData.email_address || null) : null,
        phone_number: boardProjectType === 'AiVate' ? (formData.phone_number || null) : null,
        category: boardProjectType === 'AiVate' ? (formData.category || null) : null,
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
          <DialogTitle>{initialData ? "Edit Item" : "Create New Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[70vh] pr-6">
            <div className="space-y-4 py-4">
              {/* Main Details (Common to all project types) */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={formData.title || ""} onChange={(e) => handleValueChange('title', e.target.value)} required className="focus-visible:ring-0 focus-visible:ring-offset-0" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status || "New"} onValueChange={(v) => handleValueChange('status', v as KanbanItem['status'])}>
                    <SelectTrigger className="focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {boardProjectType === 'Buds & Bonfire' && budsBonfireStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                      {boardProjectType === 'AiVate' && aivateStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                      {boardProjectType === 'Other' && (
                        <>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="On Hold">On Hold</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Select value={formData.assigned_to || "unassigned"} onValueChange={(v) => handleValueChange('assigned_to', v)}>
                    <SelectTrigger className="focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">None</SelectItem>
                      {profiles.map(p => <SelectItem key={p.id} value={p.id}>{getFullName(p)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description || ""} onChange={(e) => handleValueChange('description', e.target.value)} rows={2} className="focus-visible:ring-0 focus-visible:ring-offset-0" />
              </div>

              {/* Conditional Fields based on Project Type */}
              {boardProjectType === 'Buds & Bonfire' && (
                <>
                  <Separator className="my-4" />
                  <h3 className="text-lg font-semibold">Buds & Bonfire Specific Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Lead Type</Label>
                      <Select value={formData.lead_type} onValueChange={(v) => handleValueChange('lead_type', v)}>
                        <SelectTrigger className="focus:ring-0 focus:ring-offset-0">
                          <SelectValue placeholder="Select lead type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tenant Lead Contact">Tenant Lead Contact</SelectItem>
                          <SelectItem value="Property Lead Contact">Property Lead Contact</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Client Type</Label>
                      <Select value={formData.client_type} onValueChange={(v) => handleValueChange('client_type', v)}>
                        <SelectTrigger className="focus:ring-0 focus:ring-offset-0">
                          <SelectValue placeholder="Select client type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="insurance">Insurance</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                          <SelectItem value="individual">Individual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Move-in Date</Label>
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal focus-visible:ring-0 focus-visible:ring-offset-0", !formData.move_in_date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.move_in_date ? format(formData.move_in_date, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.move_in_date} onSelect={(d) => { handleValueChange('move_in_date', d || undefined); setIsCalendarOpen(false); }} initialFocus /></PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={formData.full_name || ""} onChange={(e) => handleValueChange('full_name', e.target.value)} className="focus-visible:ring-0 focus-visible:ring-offset-0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input type="tel" value={formData.client_contact_info || ""} onChange={(e) => handleValueChange('client_contact_info', e.target.value)} placeholder="(555) 555-5555" className="focus-visible:ring-0 focus-visible:ring-offset-0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Family Make-up</Label>
                      <Input value={formData.family_makeup || ""} onChange={(e) => handleValueChange('family_makeup', e.target.value)} className="focus-visible:ring-0 focus-visible:ring-offset-0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Pets (Optional)</Label>
                      <Input type="number" value={formData.pets_info === undefined ? "" : formData.pets_info} onChange={(e) => handleValueChange('pets_info', e.target.value === '' ? undefined : Number(e.target.value))} className="focus-visible:ring-0 focus-visible:ring-offset-0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Bedrooms</Label>
                      <Input type="number" value={formData.num_bedrooms === undefined ? "" : formData.num_bedrooms} onChange={(e) => handleValueChange('num_bedrooms', e.target.value === '' ? undefined : Number(e.target.value))} className="focus-visible:ring-0 focus-visible:ring-offset-0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Bathrooms</Label>
                      <Input type="number" step="0.5" value={formData.num_bathrooms === undefined ? "" : formData.num_bathrooms} onChange={(e) => handleValueChange('num_bathrooms', e.target.value === '' ? undefined : Number(e.target.value))} className="focus-visible:ring-0 focus-visible:ring-offset-0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Location</Label>
                      <Input value={formData.preferred_location || ""} onChange={(e) => handleValueChange('preferred_location', e.target.value)} className="focus-visible:ring-0 focus-visible:ring-offset-0" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Property Criteria</Label>
                    <Textarea value={formData.property_criteria || ""} onChange={(e) => handleValueChange('property_criteria', e.target.value)} rows={3} className="focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>

                  <Separator className="my-4" />

                  <h3 className="text-lg font-semibold">Housing Lead Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Housing Partner Full Name</Label>
                      <Input value={formData.housing_partner_full_name || ""} onChange={(e) => handleValueChange('housing_partner_full_name', e.target.value)} className="focus-visible:ring-0 focus-visible:ring-offset-0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Housing Partner Email Address</Label>
                      <Input type="email" value={formData.housing_partner_email || ""} onChange={(e) => handleValueChange('housing_partner_email', e.target.value)} className="focus-visible:ring-0 focus-visible:ring-offset-0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Housing Partner Phone Number</Label>
                      <Input type="tel" value={formData.housing_partner_phone || ""} onChange={(e) => handleValueChange('housing_partner_phone', e.target.value)} placeholder="(555) 555-5555" className="focus-visible:ring-0 focus-visible:ring-offset-0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Property Address</Label>
                      <Input value={formData.property_address || ""} onChange={(e) => handleValueChange('property_address', e.target.value)} className="focus-visible:ring-0 focus-visible:ring-offset-0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Beds/Baths & Sq Ft</Label>
                      <Input value={formData.property_beds_baths_sqft || ""} onChange={(e) => handleValueChange('property_beds_baths_sqft', e.target.value)} className="focus-visible:ring-0 focus-visible:ring-offset-0" />
                    </div>
                    <div className="space-y-2">
                      <Label>MTR Approved</Label>
                      <Select value={formData.mtr_approved === undefined ? "undefined" : (formData.mtr_approved ? "yes" : "no")} onValueChange={(v) => handleValueChange('mtr_approved', v === 'undefined' ? undefined : (v === 'yes'))}>
                        <SelectTrigger className="focus:ring-0 focus-visible:ring-offset-0">
                          <SelectValue />
                        </SelectTrigger>
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
                    <Textarea value={formData.property_match || ""} onChange={(e) => handleValueChange('property_match', e.target.value)} rows={3} className="focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>
                </>
              )}

              {boardProjectType === 'AiVate' && (
                <>
                  <Separator className="my-4" />
                  <h3 className="text-lg font-semibold">AiVate Specific Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email_address">Email Address</Label>
                      <Input type="email" id="email_address" value={formData.email_address || ""} onChange={(e) => handleValueChange('email_address', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input type="tel" id="phone_number" value={formData.phone_number || ""} onChange={(e) => handleValueChange('phone_number', e.target.value)} placeholder="(555) 555-5555" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category || "null"} onValueChange={(v) => handleValueChange('category', v === "null" ? null : v)}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">None</SelectItem>
                        {aivateCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {boardProjectType === 'Other' && (
                <>
                  <Separator className="my-4" />
                  <h3 className="text-lg font-semibold">Additional Details</h3>
                  <p className="text-sm text-muted-foreground">
                    You can add custom fields to your database for "Other" project types if needed.
                  </p>
                  {/* You might add generic textareas or inputs here for 'Other' if desired */}
                </>
              )}
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