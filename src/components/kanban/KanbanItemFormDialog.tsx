import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Changed from Drawer
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

interface KanbanItemFormDialogProps { // Changed interface name
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: KanbanItem | null;
  columnId: string;
  onSubmit: (data: {
    title: string,
    description?: string,
    column_id: string,
    order_index: number,
    category?: string,
    priority_level?: KanbanItem['priority_level'],
    assigned_to?: string,
    due_date?: string,
    event_time?: string,
    // New Tenant Lead Information fields
    client_category?: KanbanItem['client_category'],
    tenant_contact_full_name?: string,
    tenant_contact_phone?: string,
    tenant_contact_email?: string,
    household_composition?: string,
    pets_info?: string,
    bedrooms_needed?: number,
    bathrooms_needed?: number,
    preferred_locations?: string,
    desired_move_in_date?: string
  }) => Promise<void>;
  nextOrderIndex: number;
  profiles: Profile[];
  getFullName: (profile: Profile) => string;
}

export function KanbanItemFormDialog({ // Changed export name
  isOpen,
  onOpenChange,
  initialData,
  columnId,
  onSubmit,
  nextOrderIndex,
  profiles,
  getFullName,
}: KanbanItemFormDialogProps) {
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

  // Tenant Lead Information states
  const [clientCategory, setClientCategory] = useState<KanbanItem['client_category'] | 'none'>('none');
  const [tenantContactFullName, setTenantContactFullName] = useState("");
  const [tenantContactPhone, setTenantContactPhone] = useState("");
  const [tenantContactEmail, setTenantContactEmail] = useState("");
  const [householdComposition, setHouseholdComposition] = useState("");
  const [petsInfo, setPetsInfo] = useState("");
  const [bedroomsNeeded, setBedroomsNeeded] = useState<number | undefined>(undefined);
  const [bathroomsNeeded, setBathroomsNeeded] = useState<number | undefined>(undefined);
  const [preferredLocations, setPreferredLocations] = useState("");
  const [desiredMoveInDate, setDesiredMoveInDate] = useState<Date | undefined>(undefined);
  const [isTenantLeadCalendarOpen, setIsTenantLeadCalendarOpen] = useState(false);

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

  const clientCategoriesOptions: { value: KanbanItem['client_category'] | 'none', label: string }[] = [
    { value: 'none', label: 'Select Category' },
    { value: 'Insurance Company', label: 'Insurance Company' },
    { value: 'Corporate Relocation', label: 'Corporate Relocation' },
    { value: 'Private Individual', label: 'Private Individual' },
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

      // Set Tenant Lead Information fields
      setClientCategory(initialData?.client_category || 'none');
      setTenantContactFullName(initialData?.tenant_contact_full_name || "");
      setTenantContactPhone(initialData?.tenant_contact_phone || "");
      setTenantContactEmail(initialData?.tenant_contact_email || "");
      setHouseholdComposition(initialData?.household_composition || "");
      setPetsInfo(initialData?.pets_info || "");
      setBedroomsNeeded(initialData?.bedrooms_needed || undefined);
      setBathroomsNeeded(initialData?.bathrooms_needed || undefined);
      setPreferredLocations(initialData?.preferred_locations || "");
      setDesiredMoveInDate(initialData?.desired_move_in_date ? new Date(initialData.desired_move_in_date) : undefined);
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
        // Tenant Lead Information fields
        client_category: clientCategory === 'none' ? undefined : clientCategory,
        tenant_contact_full_name: tenantContactFullName || undefined,
        tenant_contact_phone: tenantContactPhone || undefined,
        tenant_contact_email: tenantContactEmail || undefined,
        household_composition: householdComposition || undefined,
        pets_info: petsInfo || undefined,
        bedrooms_needed: bedroomsNeeded || undefined,
        bathrooms_needed: bathroomsNeeded || undefined,
        preferred_locations: preferredLocations || undefined,
        desired_move_in_date: desiredMoveInDate ? format(desiredMoveInDate, "yyyy-MM-dd") : undefined,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}> {/* Changed from Drawer */}
      <DialogContent className="sm:max-w-[600px]"> {/* Changed from DrawerContent */}
        <DialogHeader> {/* Changed from DrawerHeader */}
          <DialogTitle>{initialData ? "Edit Item" : "Add New Item"}</DialogTitle> {/* Changed from DrawerTitle */}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4"> {/* Removed px-4 and flex-1 */}
          <h3 className="text-lg font-semibold">Item Details</h3>
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

          <h3 className="text-lg font-semibold mt-6">Tenant Lead Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_category">Client Category</Label>
              <Select
                value={clientCategory || "none"}
                onValueChange={(value) => setClientCategory(value as KanbanItem['client_category'] | 'none')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {clientCategoriesOptions.map(category => (
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
                value={tenantContactFullName}
                onChange={(e) => setTenantContactFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenant_contact_phone">Contact Phone Number</Label>
              <Input
                id="tenant_contact_phone"
                type="tel"
                value={tenantContactPhone}
                onChange={(e) => setTenantContactPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant_contact_email">Contact Email Address</Label>
              <Input
                id="tenant_contact_email"
                type="email"
                value={tenantContactEmail}
                onChange={(e) => setTenantContactEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="household_composition">Household Composition</Label>
            <Input
              id="household_composition"
              value={householdComposition}
              onChange={(e) => setHouseholdComposition(e.target.value)}
              placeholder="e.g., 2 adults, 2 children (ages 8 & 12)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pets_info">Pets</Label>
            <Input
              id="pets_info"
              value={petsInfo}
              onChange={(e) => setPetsInfo(e.target.value)}
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
                value={bedroomsNeeded ?? ""}
                onChange={(e) => setBedroomsNeeded(e.target.value === "" ? undefined : Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms_needed">Bathrooms Needed</Label>
              <Input
                id="bathrooms_needed"
                type="number"
                min={0}
                value={bathroomsNeeded ?? ""}
                onChange={(e) => setBathroomsNeeded(e.target.value === "" ? undefined : Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_locations">Preferred Locations / Zip Codes</Label>
            <Input
              id="preferred_locations"
              value={preferredLocations}
              onChange={(e) => setPreferredLocations(e.target.value)}
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
                    !desiredMoveInDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {desiredMoveInDate ? format(desiredMoveInDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={desiredMoveInDate}
                  onSelect={(date) => {
                    setDesiredMoveInDate(date || undefined);
                    setIsTenantLeadCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter> {/* Changed from DrawerFooter */}
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