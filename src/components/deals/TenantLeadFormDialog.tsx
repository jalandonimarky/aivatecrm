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
import type { Deal } from "@/types/crm";

interface TenantLeadFormData {
  client_category: Deal['client_category'] | 'none';
  primary_contact_full_name: string;
  contact_phone_number: string;
  contact_email_address: string;
  household_composition: string;
  pets: string;
  bedrooms_needed: number | '';
  bathrooms_needed: number | '';
  preferred_locations_zip_codes: string;
  desired_move_in_date: Date | undefined;
}

interface TenantLeadFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Deal | null;
  onSubmit: (data: Partial<Deal>) => Promise<void>;
}

export function TenantLeadFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
}: TenantLeadFormDialogProps) {
  const [formData, setFormData] = useState<TenantLeadFormData>({
    client_category: 'none',
    primary_contact_full_name: '',
    contact_phone_number: '',
    contact_email_address: '',
    household_composition: '',
    pets: '',
    bedrooms_needed: '',
    bathrooms_needed: '',
    preferred_locations_zip_codes: '',
    desired_move_in_date: undefined,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const clientCategories = [
    { value: "Insurance Company", label: "Insurance Company" },
    { value: "Corporate Relocation", label: "Corporate Relocation" },
    { value: "Private Individual", label: "Private Individual" },
  ];

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        client_category: initialData.client_category || 'none',
        primary_contact_full_name: initialData.primary_contact_full_name || '',
        contact_phone_number: initialData.contact_phone_number || '',
        contact_email_address: initialData.contact_email_address || '',
        household_composition: initialData.household_composition || '',
        pets: initialData.pets || '',
        bedrooms_needed: initialData.bedrooms_needed ?? '',
        bathrooms_needed: initialData.bathrooms_needed ?? '',
        preferred_locations_zip_codes: initialData.preferred_locations_zip_codes || '',
        desired_move_in_date: initialData.desired_move_in_date ? new Date(initialData.desired_move_in_date) : undefined,
      });
    } else if (!isOpen) {
      // Reset form when dialog closes
      setFormData({
        client_category: 'none',
        primary_contact_full_name: '',
        contact_phone_number: '',
        contact_email_address: '',
        household_composition: '',
        pets: '',
        bedrooms_needed: '',
        bathrooms_needed: '',
        preferred_locations_zip_codes: '',
        desired_move_in_date: undefined,
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSubmit: Partial<Deal> = {
      client_category: formData.client_category === 'none' ? null : formData.client_category,
      primary_contact_full_name: formData.primary_contact_full_name || null,
      contact_phone_number: formData.contact_phone_number || null,
      contact_email_address: formData.contact_email_address || null,
      household_composition: formData.household_composition || null,
      pets: formData.pets || null,
      bedrooms_needed: formData.bedrooms_needed === '' ? null : Number(formData.bedrooms_needed),
      bathrooms_needed: formData.bathrooms_needed === '' ? null : Number(formData.bathrooms_needed),
      preferred_locations_zip_codes: formData.preferred_locations_zip_codes || null,
      desired_move_in_date: formData.desired_move_in_date ? format(formData.desired_move_in_date, "yyyy-MM-dd") : null,
    };

    try {
      await onSubmit(dataToSubmit);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Tenant Lead Fields</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client_category">Client Category</Label>
            <Select
              value={formData.client_category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, client_category: value as Deal['client_category'] | 'none' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {clientCategories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_contact_full_name">Primary Contact Full Name</Label>
              <Input
                id="primary_contact_full_name"
                value={formData.primary_contact_full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone_number">Contact Phone Number</Label>
              <Input
                id="contact_phone_number"
                type="tel"
                value={formData.contact_phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone_number: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email_address">Contact Email Address</Label>
            <Input
              id="contact_email_address"
              type="email"
              value={formData.contact_email_address}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_email_address: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="household_composition">Household Composition</Label>
              <Input
                id="household_composition"
                value={formData.household_composition}
                onChange={(e) => setFormData(prev => ({ ...prev, household_composition: e.target.value }))}
                placeholder="e.g., 2 adults, 2 children (ages 8 & 12)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pets">Pets</Label>
              <Input
                id="pets"
                value={formData.pets}
                onChange={(e) => setFormData(prev => ({ ...prev, pets: e.target.value }))}
                placeholder="e.g., 1 small dog (10 lbs)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms_needed">Bedrooms Needed</Label>
              <Input
                id="bedrooms_needed"
                type="number"
                min="0"
                value={formData.bedrooms_needed}
                onChange={(e) => setFormData(prev => ({ ...prev, bedrooms_needed: e.target.value === '' ? '' : Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms_needed">Bathrooms Needed</Label>
              <Input
                id="bathrooms_needed"
                type="number"
                min="0"
                value={formData.bathrooms_needed}
                onChange={(e) => setFormData(prev => ({ ...prev, bathrooms_needed: e.target.value === '' ? '' : Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_locations_zip_codes">Preferred Locations / Zip Codes</Label>
            <Textarea
              id="preferred_locations_zip_codes"
              value={formData.preferred_locations_zip_codes}
              onChange={(e) => setFormData(prev => ({ ...prev, preferred_locations_zip_codes: e.target.value }))}
              placeholder="e.g., Santa Monica, 90210"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desired_move_in_date">Desired Move-In Date</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.desired_move_in_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.desired_move_in_date ? format(formData.desired_move_in_date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.desired_move_in_date}
                  onSelect={(date) => {
                    setFormData(prev => ({ ...prev, desired_move_in_date: date || undefined }));
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
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