import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCRMData } from "@/hooks/useCRMData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, MoreHorizontal, Edit, Trash2, CalendarIcon } from "lucide-react"; // Import new icons
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import DropdownMenu components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Import DialogFooter
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Import Popover components
import { Calendar } from "@/components/ui/calendar"; // Import Calendar
import { Input } from "@/components/ui/input"; // Import Input
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Import Table components
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils"; // Import cn for conditional classnames
import { UserProfileCard } from "@/components/UserProfileCard";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { DealGanttChart } from "@/components/deals/DealGanttChart"; // Import the new Gantt chart component
import type { DealNote, Task } from "@/types/crm";

interface TaskFormData {
  title: string;
  description: string;
  status: Task['status'];
  priority: Task['priority'];
  assigned_to: string;
  related_contact_id: string;
  related_deal_id: string;
  due_date: Date | undefined;
}

export function DealDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deals, contacts, profiles, loading, createDealNote, updateDealNote, deleteDealNote, createTask, updateTask, deleteTask, getFullName } = useCRMData();
  const [deal, setDeal] = useState<any>(null);
  const [businessNoteContent, setBusinessNoteContent] = useState("");
  const [techNoteContent, setTechNoteContent] = useState("");
  const [isAddingBusinessNote, setIsAddingBusinessNote] = useState(false);
  const [isAddingTechNote, setIsAddingTechNote] = useState(false);

  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DealNote | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [editNoteType, setEditNoteType] = useState<'business' | 'tech'>('business');

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    assigned_to: "unassigned",
    related_contact_id: "unassigned",
    related_deal_id: id || "unassigned", // Pre-fill with current deal ID
    due_date: undefined,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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
    if (deals.length > 0 && id) {
      const foundDeal = deals.find(d => d.id === id);
      setDeal(foundDeal);
      // Ensure related_deal_id is set when deal is loaded
      setTaskFormData(prev => ({ ...prev, related_deal_id: id }));
    }
  }, [deals, id]);

  const handleAddNote = async (noteType: 'business' | 'tech', content: string) => {
    if (!id || !content.trim()) return;

    try {
      await createDealNote(id, noteType, content);
      if (noteType === 'business') {
        setBusinessNoteContent("");
        setIsAddingBusinessNote(false);
      } else {
        setTechNoteContent("");
        setIsAddingTechNote(false);
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
      related_deal_id: id || "unassigned", // Always pre-fill with current deal ID
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
      related_deal_id: task.related_deal_id || id || "unassigned", // Ensure it's the current deal ID
      due_date: task.due_date ? new Date(task.due_date) : undefined,
    });
    setIsTaskDialogOpen(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return; // Ensure deal ID exists

    try {
      const dataToSubmit = {
        ...taskFormData,
        due_date: taskFormData.due_date ? format(taskFormData.due_date, "yyyy-MM-dd") : null,
        assigned_to: taskFormData.assigned_to === "unassigned" ? null : taskFormData.assigned_to,
        related_contact_id: taskFormData.related_contact_id === "unassigned" ? null : taskFormData.related_contact_id,
        related_deal_id: id, // Ensure this is always the current deal's ID
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
      case 'done_completed': return "bg-destructive text-destructive-foreground";
      case 'lead': return "bg-muted text-muted-foreground";
      case 'in_development': return "bg-accent text-accent-foreground";
      case 'proposal': return "bg-primary text-primary-foreground";
      case 'discovery_call': return "bg-warning text-warning-foreground";
      case 'cancelled': return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const sortedNotes = (deal.notes || []).sort((a: DealNote, b: DealNote) => 
    parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime()
  );
  const businessNotes = sortedNotes.filter((note: DealNote) => note.note_type === 'business');
  const techNotes = sortedNotes.filter((note: DealNote) => note.note_type === 'tech');

  const relatedTasks = (deal.tasks || []).sort((a: Task, b: Task) => 
    (a.due_date ? parseISO(a.due_date).getTime() : Infinity) - (b.due_date ? parseISO(b.due_date).getTime() : Infinity)
  );

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/deals")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Deals
      </Button>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center justify-between">
            {deal.title}
            <Badge className={getStageBadgeClass(deal.stage)}>
              {deal.stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </CardTitle>
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

      {/* Task Timeline (Gantt Chart) */}
      <DealGanttChart tasks={relatedTasks} profiles={profiles} />

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
                    <Button variant="ghost" className="h-8 w-8 p-0">
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
                    <Button onClick={() => handleAddNote('business', businessNoteContent)}>Add Note</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setIsAddingBusinessNote(true)} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Add Business Note
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tech Notes */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tech Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {techNotes.length === 0 && <p className="text-muted-foreground text-sm">No tech notes yet.</p>}
            {techNotes.map((note: DealNote) => (
              <div key={note.id} className="border-b border-border/50 pb-3 last:border-b-0 last:pb-0 flex justify-between items-start">
                <div>
                  <p className="text-sm text-foreground">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Added by {note.creator ? getFullName(note.creator) : "Unknown"} on {format(parseISO(note.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
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
              {isAddingTechNote ? (
                <div className="space-y-2">
                  <Label htmlFor="tech-note-content">Add Tech Note</Label>
                  <Textarea
                    id="tech-note-content"
                    value={techNoteContent}
                    onChange={(e) => setTechNoteContent(prev => e.target.value)}
                    placeholder="Type your technical note here..."
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddingTechNote(false)}>Cancel</Button>
                    <Button onClick={() => handleAddNote('tech', techNoteContent)}>Add Note</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setIsAddingTechNote(true)} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Add Tech Note
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
            className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth"
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
                      <TableCell className="font-medium">{task.title}</TableCell>
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
                            <Button variant="ghost" className="h-8 w-8 p-0">
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
                onChange={(e) => setEditNoteType(e.target.value as 'business' | 'tech')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="business">Business</option>
                <option value="tech">Tech</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateNoteSubmit}>Save Changes</Button>
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
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
                        setIsCalendarOpen(false);
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
                  disabled // Disable as it's pre-filled by the current deal
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a deal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">None</SelectItem>
                    {deals.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title} (${d.value.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTaskDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-primary">
                {editingTask ? "Update" : "Create"} Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}