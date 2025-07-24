import { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useCRMData } from "@/hooks/useCRMData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { Badge } from "@/components/ui/badge";
import type { Contact, Deal, Task } from "@/types/crm";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  notes: string;
}

export function ContactDetails() {
  const { contacts, loading, updateContact, deleteContact } = useCRMData(); // Destructure all needed properties
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const contact = contacts.find(c => c.id === id);

  const [isContactFormDialogOpen, setIsContactFormDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    notes: "",
  });

  useEffect(() => {
    if (!loading && id && !contacts.find(c => c.id === id)) {
      navigate("/contacts"); // Redirect if contact not found
    }
    if (contact) {
      setFormData({
        name: contact.name,
        email: contact.email || "",
        phone: contact.phone || "",
        company: contact.company || "",
        position: contact.position || "",
        notes: contact.notes || "",
      });
    }
  }, [contacts, id, loading, navigate, contact]);

  const handleEditContactClick = () => {
    setIsContactFormDialogOpen(true);
  };

  const handleUpdateContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;

    try {
      await updateContact(contact.id, formData);
      setIsContactFormDialogOpen(false);
    } catch (error) {
      // Error handled in the hook
    }
  };

  const handleDeleteContact = async () => {
    if (confirm("Are you sure you want to delete this contact? This action cannot be undone.")) {
      try {
        if (id) {
          await deleteContact(id);
          navigate("/contacts"); // Navigate back to contacts list after deletion
        }
      } catch (error) {
        // Error handled in useCRMData hook
      }
    }
  };

  const getStageBadgeClass = (stage: string) => {
    switch (stage) {
      case 'paid': return "bg-success text-success-foreground";
      case 'completed': return "bg-destructive text-destructive-foreground";
      case 'lead': return "bg-muted text-muted-foreground";
      case 'in_development': return "bg-accent text-accent-foreground";
      case 'demo': return "bg-primary text-primary-foreground";
      case 'discovery_call': return "bg-warning text-warning-foreground";
      case 'cancelled': return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading || !contact) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate("/contacts")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Contacts
        </Button>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const relatedDeals = contact.deals || [];
  const relatedTasks = contact.tasks || [];

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/contacts")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Contacts
      </Button>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold min-w-0 mr-2">
              {contact.name}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleEditContactClick}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Contact
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDeleteContact}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Contact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-muted-foreground text-sm">
            Created: {format(parseISO(contact.created_at), "PPP")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-lg font-semibold">{contact.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="text-lg font-semibold">{contact.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="text-lg font-semibold">{contact.company || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Position</p>
              <p className="text-lg font-semibold">{contact.position || "N/A"}</p>
            </div>
          </div>

          {contact.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-foreground">{contact.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Related Deals Section */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Related Deals ({relatedDeals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Close Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatedDeals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No deals related to this contact yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  relatedDeals.map((deal: Deal) => (
                    <TableRow key={deal.id} className="hover:bg-muted/50 transition-smooth">
                      <TableCell className="font-medium">
                        <NavLink to={`/deals/${deal.id}`} className="text-primary hover:underline">
                          {deal.title}
                        </NavLink>
                      </TableCell>
                      <TableCell>${deal.value.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStageBadgeClass(deal.stage)}>
                          {deal.stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>{deal.expected_close_date ? format(new Date(deal.expected_close_date), "PPP") : "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Related Tasks Section */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Related Tasks ({relatedTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatedTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No tasks related to this contact yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  relatedTasks.map((task: Task) => (
                    <TableRow key={task.id} className="hover:bg-muted/50 transition-smooth">
                      <TableCell className="font-medium">
                        <NavLink to={`/tasks/${task.id}`} className="text-primary hover:underline">
                          {task.title}
                        </NavLink>
                      </TableCell>
                      <TableCell>
                        <TaskStatusBadge status={task.status} />
                      </TableCell>
                      <TableCell>
                        <TaskPriorityBadge priority={task.priority} />
                      </TableCell>
                      <TableCell>{task.due_date ? format(new Date(task.due_date), "PPP") : "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Contact Dialog */}
      <Dialog open={isContactFormDialogOpen} onOpenChange={setIsContactFormDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                className="focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsContactFormDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-primary">
                Update Contact
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}