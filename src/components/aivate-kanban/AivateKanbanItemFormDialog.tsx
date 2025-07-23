import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AivateKanbanItem, Profile } from "@/types/crm";

interface AivateKanbanItemFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: AivateKanbanItem | null;
  columnId: string;
  onSubmit: (data: Omit<AivateKanbanItem, 'id' | 'created_at' | 'creator' | 'assigned_user'>) => Promise<void>;
  nextOrderIndex: number;
  profiles: Profile[];
  getFullName: (profile: Profile) => string;
}

type AivateKanbanItemFormState = {
  title: string;
  description: string | null;
  email_address: string | null;
  phone_number: string | null;
  status: 'New' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
  assigned_to: string | null;
  category: string | null;
};

const initialFormState: AivateKanbanItemFormState = {
  title: "",
  description: null,
  email_address: null,
  phone_number: null,
  status: 'New',
  assigned_to: "unassigned",
  category: null,
};

export function AivateKanbanItemFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  columnId,
  onSubmit,
  nextOrderIndex,
  profiles,
  getFullName,
}: AivateKanbanItemFormDialogProps) {
  const [formData, setFormData] = useState<AivateKanbanItemFormState>(initialFormState);
  const [loading, setLoading] = useState(false);

  const itemStatuses: AivateKanbanItemFormState['status'][] = ['New', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
  const itemCategories: string[] = ['Website', 'Mobile App', 'CRM', 'Other'];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: initialData?.title || "",
        description: initialData?.description || null,
        email_address: initialData?.email_address || null,
        phone_number: initialData?.phone_number || null,
        status: initialData?.status || 'New',
        assigned_to: initialData?.assigned_to || "unassigned",
        category: initialData?.category || null,
      });
      setLoading(false);
    } else {
      setFormData(initialFormState);
    }
  }, [isOpen, initialData]);

  const handleValueChange = (key: keyof AivateKanbanItemFormState, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;
    setLoading(true);
    try {
      const dataToSubmit: Omit<AivateKanbanItem, 'id' | 'created_at' | 'creator' | 'assigned_user'> = {
        column_id: columnId,
        order_index: initialData ? initialData.order_index : nextOrderIndex,
        title: formData.title,
        description: formData.description,
        email_address: formData.email_address,
        phone_number: formData.phone_number,
        status: formData.status,
        assigned_to: formData.assigned_to === "unassigned" ? null : (formData.assigned_to || null),
        category: formData.category,
        created_by: initialData?.created_by || null,
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
          <DialogTitle>{initialData ? "Edit AiVate Project" : "Create New AiVate Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[70vh] pr-6">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input id="title" value={formData.title || ""} onChange={(e) => handleValueChange('title', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description || ""} onChange={(e) => handleValueChange('description', e.target.value)} rows={3} />
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(v) => handleValueChange('status', v)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      {itemStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category || "null"} onValueChange={(v) => handleValueChange('category', v === "null" ? null : v)}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">None</SelectItem>
                      {itemCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Select value={formData.assigned_to || "unassigned"} onValueChange={(v) => handleValueChange('assigned_to', v)}>
                  <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">None</SelectItem>
                    {profiles.map(p => <SelectItem key={p.id} value={p.id}>{getFullName(p)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">Cancel</Button>
            <Button type="submit" className="bg-gradient-primary active:scale-95" disabled={loading}>
              {loading ? (initialData ? "Saving..." : "Creating...") : (initialData ? "Save Changes" : "Add Project")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}