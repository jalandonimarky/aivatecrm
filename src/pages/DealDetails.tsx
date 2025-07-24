import { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom"; // Import NavLink
import { useCRMData } from "@/hooks/useCRMData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, MoreHorizontal, Edit, Trash2, CalendarIcon, Flag, FileText, Upload, Download, Paperclip } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { UserProfileCard } from "@/components/UserProfileCard";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { DealTimeline } from "@/components/deals/DealTimeline";
import { DealFormDialog } from "@/components/deals/DealFormDialog";
import { RallyDialog } from "@/components/deals/RallyDialog";
import { DataHygieneCard } from "@/components/deals/DataHygieneCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { DealNote, Task, DealAttachment, Deal } from "@/types/crm";

interface TaskFormData {
  title: string;
  description: string;
  status: Task['status'];
  priority: Task['priority'];
  assigned_to: string;
  related_contact_id: string;
  related_deal_id: string;
  related_kanban_item_id: string; // New: related_kanban_item_id
  due_date: Date | undefined;
}

interface DealDetailsFormData {
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

export function DealDetails() {
  const { deals, contacts, profiles, kanbanItems, loading, createDealNote, updateDealNote, deleteDealNote, createTask, updateTask, deleteTask, getFullName, updateDeal, deleteDeal, createDealAttachment, deleteDealAttachment } = useCRMData(); // Removed dataHygieneInsights
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const deal = deals.find(d => d.id === id);

  const [businessNoteContent, setBusinessNoteContent] = useState("");
  const [developmentNoteContent, setDevelopmentNoteContent] = useState("");
  const [isAddingBusinessNote, setIsAddingBusinessNote] = useState(false);
  const [isAddingDevelopmentNote, setIsAddingDevelopmentNote] = useState(false);

  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DealNote | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [editNoteType, setEditNoteType] = useState<'business' | 'development'>('business');

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    assigned_to: "unassigned",
    related_contact_id: "unassigned",
    related_deal_id: id || "unassigned",
    related_kanban_item_id: "unassigned", // Initialize new field
    due_date: undefined,
  });
  const [isTaskCalendarOpen, setIsTaskCalendarOpen] = useState(false); // Renamed to avoid conflict

  const [isEditDealDialogOpen, setIsEditDealDialogOpen] = useState(false);
  const [isRallyDialogOpen, setIsRallyDialogOpen] = useState(false);

  const [isUploadAttachmentDialogOpen, setIsUploadAttachmentDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<'contract' | 'receipt' | 'other'>('other');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // State for Tenant Lead Information form
  const [tenantLeadFormData, setTenantLeadFormData] = useState<DealDetailsFormData>({
    title: "", // These are from the main deal, but needed for the form dialog
    description: "",
    value: 0,
    stage: "lead",
    tier: null,
    contact_id: "unassigned",
    assigned_to: "unassigned",
    expected_close_date: undefined,
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
  const [isTenantLeadCalendarOpen, setIsTenantLeadCalendarOpen] = useState(false); // New calendar state

  const clientCategories: { value: Deal['client_category'] | 'none', label: string }[] = [
    { value: 'none', label: 'Select Category' },
    { value: 'Insurance Company', label: 'Insurance Company' },
    { value: 'Corporate Relocation', label: 'Corporate Relocation' },
    { value: 'Private Individual', label: 'Private Individual' },
  ];

  const taskStatuses: { value: Task['status'], label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const taskPriorities: { value: Task['priority'], label: string }[] = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  useEffect(() => {
    if (!loading && id && !deals.find(d => d.id === id)) {
      navigate("/deals");
    }
  }, [deals, id, loading, navigate]);

  useEffect(() => {
    if (deal) {
      setTaskFormData(prev => ({ ...prev, related_deal_id: deal.id }));
      setTenantLeadFormData({
        title: deal.title,
        description: deal.description || "",
        value: deal.value,
        stage: deal.stage,
        tier: deal.tier || null,
        contact_id: deal.contact_id || "unassigned",
        assigned_to: deal.assigned_to || "unassigned",
        expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date) : undefined,
        client_category: deal.client_category || 'none',
        tenant_contact_full_name: deal.tenant_contact_full_name || "",
        tenant_contact_phone: deal.tenant_contact_phone || "",
        tenant_contact_email: deal.tenant_contact_email || "",
        household_composition: deal.household_composition || "",
        pets_info: deal.pets_info || "",
        bedrooms_needed: deal.bedrooms_needed || undefined,
        bathrooms_needed: deal.bathrooms_needed || undefined,
        preferred_locations: deal.preferred_locations || "",
        desired_move_in_date: deal.desired_move_in_date ? new Date(deal.desired_move_in_date) : undefined,
      });
    }
  }, [deal, loading]);


  const handleAddNote = async (noteType: 'business' | 'development', content: string) => {
    if (!id || !content.trim()) return;

    try {
      await createDealNote(id, noteType, content);
      if (noteType === 'business') {
        setBusinessNoteContent("");
        setIsAddingBusinessNote(false);
      } else {
        setDevelopmentNoteContent("");
        setIsAddingDevelopmentNote(false);
      }
    } catch (error) {
      // Error handled in useCRMData hook
    }
  };

  const handleEditNoteClick = (note: DealNote) => {
    setEditingNote(note);
    setEditNoteContent(note.content);
    setEditNoteType(note.note_type);
    setIsEditNoteDialogOpen(true);
  };

  const handleUpdateNoteSubmit = async () => {
    if (!editingNote || !editNoteContent.trim()) return;

    try {
      await updateDealNote(editingNote.id, editingNote.deal_id, { content: editNoteContent, note_type: editNoteType });
      setIsEditNoteDialogOpen(false);
      setEditingNote(null);
      setEditNoteContent("");
      setEditNoteType('business');
    } catch (error) {
      // Error handled in useCRMData hook
    }
  };

  const handleDeleteNote = async (noteId: string, dealId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteDealNote(noteId, dealId);
      } catch (error) {
        // Error handled in useCRMData hook
      }
    }
  };

  const resetTaskForm = () => {
    setTaskFormData({
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      assigned_to: "unassigned",
      related_contact_id: "unassigned",
      related_deal_id: id || "unassigned",
      related_kanban_item_id: "unassigned", // Reset new field
      due_date: undefined,
    });
    setEditingTask(null);
  };

  const handleAddTaskClick = () => {
    resetTaskForm();
    setIsTaskDialogOpen(true);
  };

  const handleEditTaskClick = (task: Task) => {
    setEditingTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to || "unassigned",
      related_contact_id: task.related_contact_id || "unassigned",
      related_deal_id: task.related_deal_id || id || "unassigned",
      related_kanban_item_id: task.related_kanban_item_id || "unassigned", // Set new field for editing
      due_date: task.due_date ? new Date(task.due_date) : undefined,
    });
    setIsTaskDialogOpen(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const dataToSubmit = {
        ...taskFormData,
        due_date: taskFormData.due_date ? format(taskFormData.due_date, "yyyy-MM-dd") : null,
        assigned_to: taskFormData.assigned_to === "unassigned" ? null : taskFormData.assigned_to,
        related_contact_id: taskFormData.related_contact_id === "unassigned" ? null : taskFormData.related_contact_id,
        related_deal_id: id,
        related_kanban_item_id: taskFormData.related_kanban_item_id === "unassigned" ? null : taskFormData.related_kanban_item_id, // Handle new field
      };

      if (editingTask) {
        await updateTask(editingTask.id, dataToSubmit);
      } else {
        await createTask(dataToSubmit);
      }
      resetTaskForm();
      setIsTaskDialogOpen(false);
    } catch (error) {
      // Error handled in the hook
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        // Error handled in the hook
      }
    }
  };

  const handleEditDealClick = () => {
    setIsEditDealDialogOpen(true);
  };

  const handleUpdateDealSubmit = async (data: any) => {
    if (deal && id) {
      await updateDeal(id, data);
      setIsEditDealDialogOpen(false);
    }
  };

  const handleDeleteDeal = async () => {
    if (confirm("Are you sure you want to delete this deal? This action cannot be undone.")) {
      try {
        if (id) {
          await deleteDeal(id);
        }
      } catch (error) {
        // Error handled in useCRMData hook
      }
    }
  };

  const handleRallySubmit = async (date: Date, time: string, note: string) => {
    if (!deal) return;

    const payload = {
      rallyDate: format(date, "yyyy-MM-dd"),
      rallyTime: time,
      noteDescription: note,
      dealDetails: {
        dealId: deal.id,
        projectTitle: deal.title,
        value: deal.value,
        expectedCloseDate: deal.expected_close_date,
        relatedContact: deal.contact?.name || "N/A",
        tier: deal.tier || "N/A",
      },
    };

    try {
      const { data, error } = await supabase.functions.invoke('rally-trigger', {
        body: payload,
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Rally Scheduled",
        description: "Rally details sent successfully to the trigger endpoint.",
      });
    } catch (error: any) {
      toast({
        title: "Error Scheduling Rally",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedFile) {
      toast({
        title: "Missing Information",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    setUploadingAttachment(true);
    try {
      await createDealAttachment(id, selectedFile, attachmentType);
      setSelectedFile(null);
      setAttachmentType('other');
      setIsUploadAttachmentDialogOpen(false);
    } catch (error) {
      // Error handled in useCRMData hook
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachment: DealAttachment) => {
    if (confirm("Are you sure you want to delete this attachment? This action cannot be undone.")) {
      try {
        // The file_url contains the full path, we need to extract the path relative to the bucket
        // Assuming file_url format is like: https://<project_id>.supabase.co/storage/v1/object/public/deal-attachments/<deal_id>/<file_name>
        const pathSegments = attachment.file_url.split('/');
        const filePathInBucket = pathSegments.slice(pathSegments.indexOf('deal-attachments') + 1).join('/');
        
        await deleteDealAttachment(attachment.id, attachment.deal_id, filePathInBucket);
      } catch (error) {
        // Error handled in useCRMData hook
      }
    }
  };

  if (loading || !deal) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate("/deals")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Deals
        </Button>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

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

  const sortedNotes = (deal.notes || []).sort((a: DealNote, b: DealNote) => 
    parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime()
  );
  const businessNotes = sortedNotes.filter((note: DealNote) => note.note_type === 'business');
  const developmentNotes = sortedNotes.filter((note: DealNote) => note.note_type === 'development');

  const relatedTasks = (deal.tasks || []).sort((a: Task, b: Task) => 
    (a.due_date ? parseISO(a.due_date).getTime() : Infinity) - (b.due_date ? parseISO(b.due_date).getTime() : Infinity)
  );

  const sortedAttachments = (deal.attachments || []).sort((a: DealAttachment, b: DealAttachment) =>
    parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime()
  );

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/deals")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Deals
      </Button>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold min-w-0 mr-2">
              {deal.title}
            </CardTitle>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRallyDialogOpen(true)}
                className="bg-gradient-accent hover:bg-accent/90 text-accent-foreground shadow-glow transition-smooth active:scale-95"
              >
                <Flag className="w-4 h-4 mr-2" /> Rally
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 active:scale-95">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleEditDealClick}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Deal
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDeleteDeal}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Deal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Created: {format(parseISO(deal.created_at), "PPP")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Value</p>
              <p className="text-lg font-semibold">${deal.value.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stage</p>
              <Badge className={getStageBadgeClass(deal.stage)}>
                {deal.stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected Close Date</p>
              <p className="text-lg font-semibold">
                {deal.expected_close_date ? format(parseISO(deal.expected_close_date), "PPP") : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Related Contact</p>
              <p className="text-lg font-semibold">
                {deal.contact ? deal.contact.name : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned To</p>
              <p className="text-lg font-semibold">
                {deal.assigned_user ? getFullName(deal.assigned_user) : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tier</p>
              <p className="text-lg font-semibold">
                {deal.tier || "N/A"}
              </p>
            </div>
          </div>

          {deal.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-foreground">{deal.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Hygiene Card */}
      {deal && <DataHygieneCard deal={deal} />}

      {/* Project Timeline Section */}
      <DealTimeline deal={deal} />

      {/* Tenant Lead Information Section */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Tenant Lead Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Client Category</p>
              <p className="text-lg font-semibold">{deal.client_category || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Primary Contact Full Name</p>
              <p className="text-lg font-semibold">{deal.tenant_contact_full_name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact Phone Number</p>
              <p className="text-lg font-semibold">{deal.tenant_contact_phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact Email Address</p>
              <p className="text-lg font-semibold">{deal.tenant_contact_email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Household Composition</p>
              <p className="text-lg font-semibold">{deal.household_composition || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pets</p>
              <p className="text-lg font-semibold">{deal.pets_info || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bedrooms Needed</p>
              <p className="text-lg font-semibold">{deal.bedrooms_needed ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bathrooms Needed</p>
              <p className="text-lg font-semibold">{deal.bathrooms_needed ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Preferred Locations / Zip Codes</p>
              <p className="text-lg font-semibold">{deal.preferred_locations || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Desired Move-In Date</p>
              <p className="text-lg font-semibold">
                {deal.desired_move_in_date ? format(parseISO(deal.desired_move_in_date), "PPP") : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attachments Section */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Attachments ({sortedAttachments.length})</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsUploadAttachmentDialogOpen(true)}
            className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95"
          >
            <Upload className="w-4 h-4 mr-2" /> Upload Attachment
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAttachments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No attachments yet for this deal.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAttachments.map((attachment) => (
                    <TableRow key={attachment.id} className="hover:bg-muted/50 transition-smooth">
                      <TableCell className="font-medium flex items-center space-x-2">
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={attachment.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline"
                        >
                          {attachment.file_name}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {attachment.attachment_type.charAt(0).toUpperCase() + attachment.attachment_type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{attachment.uploader ? getFullName(attachment.uploader) : "Unknown"}</TableCell>
                      <TableCell>{format(parseISO(attachment.created_at), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 active:scale-95">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                              <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteAttachment(attachment)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Notes */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Business Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {businessNotes.length === 0 && <p className="text-muted-foreground text-sm">No business notes yet.</p>}
            {businessNotes.map((note: DealNote) => (
              <div key={note.id} className="border-b border-border/50 pb-3 last:border-b-0 last:pb-0 flex justify-between items-start">
                <div>
                  <p className="text-sm text-foreground">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Added by {note.creator ? getFullName(note.creator) : "Unknown"} on {format(parseISO(note.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 active:scale-95">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleEditNoteClick(note)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteNote(note.id, note.deal_id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            <div className="mt-4">
              {isAddingBusinessNote ? (
                <div className="space-y-2">
                  <Label htmlFor="business-note-content">Add Business Note</Label>
                  <Textarea
                    id="business-note-content"
                    value={businessNoteContent}
                    onChange={(e) => setBusinessNoteContent(e.target.value)}
                    placeholder="Type your business note here..."
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddingBusinessNote(false)}>Cancel</Button>
                    <Button onClick={() => handleAddNote('business', businessNoteContent)} className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95">Add Note</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setIsAddingBusinessNote(true)} className="w-full bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95">
                  <Plus className="w-4 h-4 mr-2" /> Add Business Note
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Development Notes */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Development Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {developmentNotes.length === 0 && <p className="text-muted-foreground text-sm">No development notes yet.</p>}
            {developmentNotes.map((note: DealNote) => (
              <div key={note.id} className="border-b border-border/50 pb-3 last:border-b-0 last:pb-0 flex justify-between items-start">
                <div>
                  <p className="text-sm text-foreground">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Added by {note.creator ? getFullName(note.creator) : "Unknown"} on {format(parseISO(note.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 active:scale-95">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleEditNoteClick(note)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteNote(note.id, note.deal_id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            <div className="mt-4">
              {isAddingDevelopmentNote ? (
                <div className="space-y-2">
                  <Label htmlFor="development-note-content">Add Development Note</Label>
                  <Textarea
                    id="development-note-content"
                    value={developmentNoteContent}
                    onChange={(e) => setDevelopmentNoteContent(e.target.value)}
                    placeholder="Type your development note here..."
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddingDevelopmentNote(false)}>Cancel</Button>
                    <Button onClick={() => handleAddNote('development', developmentNoteContent)} className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95">Add Note</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setIsAddingDevelopmentNote(true)} className="w-full bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95">
                  <Plus className="w-4 h-4 mr-2" /> Add Development Note
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Related Tasks Section */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Related Tasks ({relatedTasks.length})</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddTaskClick}
            className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Task
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatedTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No tasks related to this deal yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  relatedTasks.map((task) => (
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
                      <TableCell>{task.assigned_user ? getFullName(task.assigned_user) : "-"}</TableCell>
                      <TableCell>{task.due_date ? format(new Date(task.due_date), "PPP") : "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 active:scale-95">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleEditTaskClick(task)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Note Dialog */}
      <Dialog open={isEditNoteDialogOpen} onOpenChange={setIsEditNoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-note-content">Note Content</Label>
              <Textarea
                id="edit-note-content"
                value={editNoteContent}
                onChange={(e) => setEditNoteContent(e.target.value)}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-note-type">Note Type</Label>
              <select
                id="edit-note-type"
                value={editNoteType}
                onChange={(e) => setEditNoteType(e.target.value as 'business' | 'development')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="business">Business</option>
                <option value="development">Development</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateNoteSubmit} className="active:scale-95">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit Task" : "Add New Task"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                value={taskFormData.title}
                onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={taskFormData.description}
                onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-status">Status *</Label>
                <Select
                  value={taskFormData.status}
                  onValueChange={(value) => setTaskFormData(prev => ({ ...prev, status: value as Task['status'] }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskStatuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority *</Label>
                <Select
                  value={taskFormData.priority}
                  onValueChange={(value) => setTaskFormData(prev => ({ ...prev, priority: value as Task['priority'] }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskPriorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-assigned_to">Assigned To</Label>
                <Select
                  value={taskFormData.assigned_to}
                  onValueChange={(value) => setTaskFormData(prev => ({ ...prev, assigned_to: value }))}
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
                <Label htmlFor="task-due_date">Due Date</Label>
                <Popover open={isTaskCalendarOpen} onOpenChange={setIsTaskCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !taskFormData.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {taskFormData.due_date ? format(taskFormData.due_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={taskFormData.due_date}
                      onSelect={(date) => {
                        setTaskFormData(prev => ({ ...prev, due_date: date || undefined }));
                        setIsTaskCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-related_contact_id">Related Contact</Label>
                <Select
                  value={taskFormData.related_contact_id}
                  onValueChange={(value) => setTaskFormData(prev => ({ ...prev, related_contact_id: value }))}
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
                <Label htmlFor="task-related_deal_id">Related Deal</Label>
                <Select
                  value={taskFormData.related_deal_id}
                  onValueChange={(value) => setTaskFormData(prev => ({ ...prev, related_deal_id: value }))}
                  disabled
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a deal" />
                  </SelectTrigger>
                  <SelectContent>
                    {deals.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title} (${d.value.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* New: Related Kanban Item */}
            <div className="space-y-2">
              <Label htmlFor="task-related_kanban_item_id">Related Kanban Item</Label>
              <Select
                value={taskFormData.related_kanban_item_id}
                onValueChange={(value) => setTaskFormData(prev => ({ ...prev, related_kanban_item_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a Kanban item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">None</SelectItem>
                  {kanbanItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title} ({item.column?.name || 'No Column'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTaskDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-primary active:scale-95">
                {editingTask ? "Update" : "Create"} Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deal Edit Dialog */}
      <DealFormDialog
        isOpen={isEditDealDialogOpen}
        onOpenChange={setIsEditDealDialogOpen}
        initialData={deal}
        onSubmit={handleUpdateDealSubmit}
        contacts={contacts}
        profiles={profiles}
        getFullName={getFullName}
      />

      {/* Rally Dialog */}
      {deal && (
        <RallyDialog
          isOpen={isRallyDialogOpen}
          onOpenChange={setIsRallyDialogOpen}
          onSubmit={handleRallySubmit}
          deal={deal}
        />
      )}

      {/* Upload Attachment Dialog */}
      <Dialog open={isUploadAttachmentDialogOpen} onOpenChange={setIsUploadAttachmentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Attachment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUploadAttachment} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file-input">File</Label>
              <Input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachment-type">Attachment Type</Label>
              <Select value={attachmentType} onValueChange={(value) => setAttachmentType(value as 'contract' | 'receipt' | 'other')} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="receipt">Receipt</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadAttachmentDialogOpen(false)} type="button">
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-primary active:scale-95" disabled={uploadingAttachment}>
                {uploadingAttachment ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}