import { useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCRMData } from "@/hooks/useCRMData";
import type { Contact } from "@/types/crm";
import { NavLink } from "react-router-dom"; // Import NavLink

export function Contacts() {
  const { contacts, loading, createContact, updateContact, deleteContact } = useCRMData(); // Destructure all needed properties
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    notes: "",
  });

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await updateContact(editingContact.id, formData);
      } else {
        await createContact(formData);
      }
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      position: "",
      notes: "",
    });
    setEditingContact(null);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone || "",
      company: contact.company || "",
      position: contact.position || "",
      notes: contact.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      await deleteContact(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Contacts
          </h1>
          <p className="text-muted-foreground">
            Manage your contacts and customer relationships
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95"
              onClick={resetForm}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? "Edit Contact" : "Add New Contact"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Added sm:grid-cols-2 */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Added sm:grid-cols-2 */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-primary active:scale-95">
                  {editingContact ? "Update" : "Create"} Contact
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contacts Table */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>All Contacts ({filteredContacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto"> {/* Added overflow-x-auto */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id} className="hover:bg-muted/50 transition-smooth">
                    <TableCell className="font-medium">
                      <NavLink to={`/contacts/${contact.id}`} className="bg-gradient-primary bg-clip-text text-transparent hover:underline">
                        {contact.name}
                      </NavLink>
                    </TableCell>
                    <TableCell>{contact.email || "-"}</TableCell>
                    <TableCell>{contact.company || "-"}</TableCell>
                    <TableCell>{contact.position || "-"}</TableCell>
                    <TableCell>{contact.phone || "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEdit(contact)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(contact.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredContacts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "No contacts found matching your search." : "No contacts yet. Create your first contact!"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}