import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
}

interface DealFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Deal | null;
  onSubmit: (data: Omit<DealFormData, 'expected_close_date'> & { expected_close_date: string | null }) => Promise<void>;
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
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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
    };
    await onSubmit(dataToSubmit);
    onOpenChange(false); // Close dialog after submission
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Deal" : "Add New Deal"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="flex justify-end space-x-2">
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}