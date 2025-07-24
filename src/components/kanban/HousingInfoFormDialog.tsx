import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { KanbanItem } from "@/types/crm";

interface HousingInfoFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: KanbanItem;
  onSubmit: (data: Partial<KanbanItem>) => Promise<void>;
}

export function HousingInfoFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
}: HousingInfoFormDialogProps) {
  const [formData, setFormData] = useState<Partial<KanbanItem>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        property_manager_name: initialData.property_manager_name || "",
        property_contact_phone: initialData.property_contact_phone || "",
        property_contact_email: initialData.property_contact_email || "",
        property_full_address: initialData.property_full_address || "",
        property_bedrooms: initialData.property_bedrooms || undefined,
        property_bathrooms: initialData.property_bathrooms || undefined,
        property_sq_ft: initialData.property_sq_ft || undefined,
        property_mtr_approved: initialData.property_mtr_approved || false,
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
        property_bedrooms: formData.property_bedrooms ? Number(formData.property_bedrooms) : null,
        property_bathrooms: formData.property_bathrooms ? Number(formData.property_bathrooms) : null,
        property_sq_ft: formData.property_sq_ft ? Number(formData.property_sq_ft) : null,
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
          <DialogTitle>Edit Housing Lead Information</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[70vh] p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prop-manager-name">Property Manager / Host Name</Label>
                <Input id="prop-manager-name" value={formData.property_manager_name || ""} onChange={(e) => handleInputChange('property_manager_name', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prop-phone">Contact Phone Number</Label>
                  <Input id="prop-phone" type="tel" value={formData.property_contact_phone || ""} onChange={(e) => handleInputChange('property_contact_phone', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prop-email">Contact Email Address *</Label>
                  <Input id="prop-email" type="email" value={formData.property_contact_email || ""} onChange={(e) => handleInputChange('property_contact_email', e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-address">Property Full Address</Label>
                <Input id="prop-address" value={formData.property_full_address || ""} onChange={(e) => handleInputChange('property_full_address', e.target.value)} placeholder="Street, Unit, City, State, ZIP" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prop-bedrooms">Bedrooms</Label>
                  <Input id="prop-bedrooms" type="number" min="0" value={formData.property_bedrooms || ""} onChange={(e) => handleInputChange('property_bedrooms', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prop-bathrooms">Bathrooms</Label>
                  <Input id="prop-bathrooms" type="number" min="0" value={formData.property_bathrooms || ""} onChange={(e) => handleInputChange('property_bathrooms', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prop-sqft">Square Footage (Approx.)</Label>
                  <Input id="prop-sqft" type="number" min="0" value={formData.property_sq_ft || ""} onChange={(e) => handleInputChange('property_sq_ft', e.target.value)} placeholder="e.g., 1200" />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="mtr-approved" checked={formData.property_mtr_approved || false} onCheckedChange={(checked) => handleInputChange('property_mtr_approved', checked)} />
                <Label htmlFor="mtr-approved">MTR-Approved Property</Label>
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