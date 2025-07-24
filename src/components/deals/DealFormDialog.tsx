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
import type { Contact, Deal, Profile } from "@/types/crm";

interface DealFormData {
  title: string;
  description: string;
  value: number;
  stage: Deal['stage'];
  tier: string | null;
  contact_id: string;
  assigned_to: string;
  expected_close_date: Date | undefined;
  // New Tenant Lead Information fields
  client_category: Deal['client_category'] | 'none';
  tenant_contact_full_name: string;
  tenant_contact_phone: string;
  tenant_contact_email: string;
  household_composition: string;
  pets_info: string;
  bedrooms_needed: number | undefined;
  bathrooms_needed: number | undefined;
  preferred_locations: string;
  desired_move_in_date: Date | undefined;
}

interface DealFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Deal | null;
  onSubmit: (data: Omit<DealFormData, 'expected_close_date' | 'desired_move_in_date'> & { expected_close_date: string | null, desired_move_in_date: string | null }) => Promise<void>;
  contacts: Contact[];
  profiles: Profile[];
  getFullName: (profile: Profile) => string;
}

export function DealFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
  contacts,
  profiles,
  getFullName,
}: DealFormDialogProps) {
  const [formData, setFormData] = useState<DealFormData>({
    title: "",
    description: "",
    value: 0,
    stage: "lead",
    tier: null,
    contact_id: "unassigned",
    assigned_to: "unassigned",
    expected_close_date: undefined,
    // New Tenant Lead Information fields
    client_category: 'none',
    tenant_contact_full_name: "",
    tenant_contact_phone: "",
    tenant_contact_email: "",
    household_composition: "",
    pets_info: "",
    bedrooms_needed: undefined,
    bathrooms_needed: undefined,
    preferred_locations: "",
    desired_move_in_date: undefined,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTenantLeadCalendarOpen, setIsTenantLeadCalendarOpen] = useState(false); // New calendar state

  const dealStages: { value: Deal['stage'], label: string }[] = [
    { value: "lead", label: "Lead" },
    { value: "in_development", label: "In Development" },
    { value: "demo", label: "Demo" },
    { value: "discovery_call", label: "Discovery Call" },
    { value: "paid", label: "Paid" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const dealTiers: string[] = [
    "1-OFF Projects: T1",
    "1-OFF Projects: T2",
    "1-OFF Projects: T3",
    "System Development: T1",
    "System Development: T2",
    "System Development: T3",
  ];

  const clientCategories: { value: Deal['client_category'] | 'none', label: string }[] = [
    { value: 'none', label: 'Select Category' },
    { value: 'Insurance Company', label: 'Insurance Company' },
    { value: 'Corporate Relocation', label: 'Corporate Relocation' },
    { value: 'Private Individual', label: 'Private Individual' },
  ];

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || "",
        value: initialData.value,
        stage: initialData.stage,
        tier: initialData.tier || null,
        contact_id: initialData.contact_id || "unassigned",
        assigned_to: initialData.assigned_to || "unassigned",
        expected_close_date: initialData.expected_close_date ? new Date(initialData.expected_close_date) : undefined,
        // New Tenant Lead Information fields
        client_category: initialData.client_category || 'none',
        tenant_contact_full_name: initialData.tenant_contact_full_name || "",
        tenant_contact_phone: initialData.tenant_contact_phone || "",
        tenant_contact_email: initialData.tenant_contact_email || "",
        household_composition: initialData.household_composition || "",
        pets_info: initialData.pets_info || "",
        bedrooms_needed: initialData.bedrooms_needed || undefined,
        bathrooms_needed: initialData.bathrooms_needed || undefined,
        preferred_locations: initialData.preferred_locations || "",
        desired_move_in_date: initialData.desired_move_in_date ? new Date(initialData.desired_move_in_date) : undefined,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        value: 0,
        stage: "lead",
        tier: null,
        contact_id: "unassigned",
        assigned_to: "unassigned",
        expected_close_date: undefined,
        // New Tenant Lead Information fields
        client_category: 'none',
        tenant_contact_full_name: "",
        tenant_contact_phone: "",
        tenant_contact_email: "",
        household_composition: "",
        pets_info: "",
        bedrooms_needed: undefined,
        bathrooms_needed: undefined,
        preferred_locations: "",
        desired_move_in_date: undefined,
      });
    }
  }, [initialData, isOpen]); // Reset form when dialog opens or initialData changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      value: Number(formData.value),
      expected_close_date: formData.expected_close_date ? format(formData.expected_close_date, "yyyy-MM-dd") : null,
      contact_id: formData.contact_id === "unassigned" ? null : formData.contact_id,
      assigned_to: formData.assigned_to === "unassigned" ? null : formData.assigned_to,
      // New Tenant Lead Information fields
      client_category: formData.client_category === 'none' ? null : formData.client_category,
      tenant_contact_full_name: formData.tenant_contact_full_name || null,
      tenant_contact_phone: formData.tenant_contact_phone || null,
      tenant_contact_email: formData.tenant_contact_email || null,
      household_composition: formData.household_composition || null,
      pets_info: formData.pets_info || null,
      bedrooms_needed: formData.bedrooms_needed ?? null,
      bathrooms_needed: formData.bathrooms_needed ?? null,
      preferred_locations: formData.preferred_locations || null,
      desired_move_in_date: formData.desired_move_in_date ? format(formData.desired_move_in_date, "yyyy-MM-dd") : null,
    };
    await onSubmit(dataToSubmit);
    onOpenChange(false); // Close dialog after submission
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Deal" : "Add New Deal"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-semibold mt-4">Deal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value *</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage">Stage *</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value as Deal['stage'] }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent>
                  {dealStages.map(stage => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier">Tier</Label>
              <Select
                value={formData.tier || "none-tier"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tier: value === "none-tier" ? null : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none-tier">None</SelectItem>
                  {dealTiers.map(tier => (
                    <SelectItem key={tier} value={tier}>
                      {tier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_id">Related Contact</Label>
              <Select
                value={formData.contact_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, contact_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">None</SelectItem>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} ({contact.company})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_close_date">Expected Close Date</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.expected_close_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.expected_close_date ? format(formData.expected_close_date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.expected_close_date}
                  onSelect={(date) => {
                    setFormData(prev => ({ ...prev, expected_close_date: date || undefined }));
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <h3 className="text-lg font-semibold mt-6">Tenant Lead Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_category">Client Category</Label>
              <Select
                value={formData.client_category || "none"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_category: value as Deal['client_category'] | 'none' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {clientCategories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant_contact_full_name">Primary Contact Full Name</Label>
              <Input
                id="tenant_contact_full_name"
                value={formData.tenant_contact_full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, tenant_contact_full_name: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenant_contact_phone">Contact Phone Number</Label>
              <Input
                id="tenant_contact_phone"
                type="tel"
                value={formData.tenant_contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, tenant_contact_phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant_contact_email">Contact Email Address</Label>
              <Input
                id="tenant_contact_email"
                type="email"
                value={formData.tenant_contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, tenant_contact_email: e.target.value }))}
              />
            </div>
          </div>

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
            <Label htmlFor="pets_info">Pets</Label>
            <Input
              id="pets_info"
              value={formData.pets_info}
              onChange={(e) => setFormData(prev => ({ ...prev, pets_info: e.target.value }))}
              placeholder="e.g., 1 small dog (10 lbs)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms_needed">Bedrooms Needed</Label>
              <Input
                id="bedrooms_needed"
                type="number"
                min={0}
                value={formData.bedrooms_needed ?? ""}
                onChange={(e) => setFormData(prev => ({ ...prev, bedrooms_needed: e.target.value === "" ? undefined : Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms_needed">Bathrooms Needed</Label>
              <Input
                id="bathrooms_needed"
                type="number"
                min={0}
                value={formData.bathrooms_needed ?? ""}
                onChange={(e) => setFormData(prev => ({ ...prev, bathrooms_needed: e.target.value === "" ? undefined : Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_locations">Preferred Locations / Zip Codes</Label>
            <Input
              id="preferred_locations"
              value={formData.preferred_locations}
              onChange={(e) => setFormData(prev => ({ ...prev, preferred_locations: e.target.value }))}
              placeholder="e.g., Santa Monica, 90210"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desired_move_in_date">Desired Move-In Date</Label>
            <Popover open={isTenantLeadCalendarOpen} onOpenChange={setIsTenantLeadCalendarOpen}>
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
                    setIsTenantLeadCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-primary active:scale-95">
              {initialData ? "Update" : "Create"} Deal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}