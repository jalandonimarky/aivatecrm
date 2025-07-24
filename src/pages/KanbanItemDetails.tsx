import React, { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useCRMData } from "@/hooks/useCRMData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MoreHorizontal, Edit, Trash2, Calendar as CalendarIcon, Clock, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { format, parseISO, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { UserProfileCard } from "@/components/UserProfileCard";
import { KanbanPriorityBadge } from "@/components/kanban/KanbanPriorityBadge";
import { Badge } from "@/components/ui/badge";
import { KanbanItemFormDialog } from "@/components/kanban/KanbanItemFormDialog";
import { KanbanDataHygieneCard } from "@/components/kanban/KanbanDataHygieneCard";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge"; // Import TaskStatusBadge
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge"; // Import TaskPriorityBadge
import type { KanbanItem, KanbanItemNote, Task } from "@/types/crm";

interface TaskFormData {
  title: string;
  description: string;
  status: Task['status'];
  priority: Task['priority'];
  assigned_to: string;
  related_contact_id: string;
  related_deal_id: string;
  related_kanban_item_id: string;
  due_date: Date | undefined;
}

export function KanbanItemDetails() {
  const {
    kanbanItems,
    profiles,
    contacts, // Added contacts
    deals, // Added deals
    loading,
    updateKanbanItem,
    deleteKanbanItem,
    createKanbanItemNote,
    updateKanbanItemNote,
    deleteKanbanItemNote,
    createTask, // Added createTask
    updateTask, // Added updateTask
    deleteTask, // Added deleteTask
    getFullName,
  } = useCRMData();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const item = kanbanItems.find((i) => i.id === id);

  const [isItemFormDialogOpen, setIsItemFormDialogOpen] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<KanbanItemNote | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false); // State for task dialog
  const [editingTask, setEditingTask] = useState<Task | null>(null); // State for task being edited
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({ // State for task form data
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    assigned_to: "unassigned",
    related_contact_id: "unassigned",
    related_deal_id: "unassigned",
    related_kanban_item_id: id || "unassigned", // Pre-fill with current Kanban item ID
    due_date: undefined,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); // State for task due date calendar

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
    if (!loading && id && !kanbanItems.find((i) => i.id === id)) {
      navigate("/kanban"); // Redirect if item not found
    }
  }, [kanbanItems, id, loading, navigate]);

  useEffect(() => {
    if (item) {
      setTaskFormData(prev => ({ ...prev, related_kanban_item_id: item.id }));
    }
  }, [item]);

  const handleEditItemClick = () => {
    setIsItemFormDialogOpen(true);
  };

  const handleUpdateItemSubmit = async (data: any) => {
    if (!item) return;
    await updateKanbanItem(item.id, data);
    setIsItemFormDialogOpen(false);
  };

  const handleDeleteItem = async () => {
    if (confirm("Are you sure you want to delete this Kanban item? This action cannot be undone.")) {
      try {
        if (id) {
          await deleteKanbanItem(id);
          navigate("/kanban");
        }
      } catch (error) {
        // Error handled in useCRMData hook
      }
    }
  };

  const handleAddNote = async () => {
    if (!id || !newNoteContent.trim()) return;

    try {
      await createKanbanItemNote(id, newNoteContent);
      setNewNoteContent("");
      setIsAddingNote(false);
    } catch (error) {
      // Error handled in useCRMData hook
    }
  };

  const handleEditNoteClick = (note: KanbanItemNote) => {
    setEditingNote(note);
    setEditNoteContent(note.content);
    setIsEditNoteDialogOpen(true);
  };

  const handleUpdateNoteSubmit = async () => {
    if (!editingNote || !editNoteContent.trim()) return;

    try {
      await updateKanbanItemNote(editingNote.id, editingNote.kanban_item_id, { content: editNoteContent });
      setIsEditNoteDialogOpen(false);
      setEditingNote(null);
      setEditNoteContent("");
    } catch (error) {
      // Error handled in useCRMData hook
    }
  };

  const handleDeleteNote = async (noteId: string, kanbanItemId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteKanbanItemNote(noteId, kanbanItemId);
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
      related_deal_id: "unassigned",
      related_kanban_item_id: id || "unassigned", // Always pre-fill with current Kanban item ID
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
      related_deal_id: task.related_deal_id || "unassigned",
      related_kanban_item_id: task.related_kanban_item_id || id || "unassigned", // Set for editing, default to current Kanban item
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
        related_deal_id: taskFormData.related_deal_id === "unassigned" ? null : taskFormData.related_deal_id,
        related_kanban_item_id: id, // Ensure it's linked to the current Kanban item
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

  const getCategoryColorClass = (category?: KanbanItem['category']) => {
    switch (category?.toLowerCase()) {
      case 'design': return "bg-primary/20 text-primary border-primary";
      case 'development': return "bg-accent/20 text-accent border-accent";
      case 'marketing': return "bg-warning/20 text-warning border-warning";
      case 'business': return "bg-success/20 text-success border-success";
      case 'other': return "bg-muted/20 text-muted-foreground border-muted";
      default: return "bg-secondary/20 text-secondary-foreground border-secondary";
    }
  };

  if (loading || !item) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate("/kanban")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Kanban
        </Button>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const sortedNotes = (item.notes || []).sort((a: KanbanItemNote, b: KanbanItemNote) => 
    parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime()
  );

  const relatedTasks = (item.tasks || []).sort((a: Task, b: Task) => 
    (a.due_date ? parseISO(a.due_date).getTime() : Infinity) - (b.due_date ? parseISO(b.due_date).getTime() : Infinity)
  );

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/kanban")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Kanban
      </Button>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold min-w-0 mr-2">
              {item.title}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 active:scale-95">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleEditItemClick}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Item
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteItem}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Item
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-muted-foreground text-sm">
            Created: {format(parseISO(item.created_at), "PPP")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Column</p>
              <p className="text-lg font-semibold">{item.column?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>
              {item.priority_level ? (
                <KanbanPriorityBadge priority={item.priority_level} />
              ) : (
                <p className="text-lg font-semibold">N/A</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              {item.category ? (
                <Badge variant="outline" className={cn("text-sm px-2 py-0.5", getCategoryColorClass(item.category))}>
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </Badge>
              ) : (
                <p className="text-lg font-semibold">N/A</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned To</p>
              {item.assigned_user ? (
                <UserProfileCard profile={item.assigned_user} />
              ) : (
                <p className="text-lg font-semibold">N/A</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="text-lg font-semibold">
                {item.due_date ? format(parseISO(item.due_date), "PPP") : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Event Time</p>
              <p className="text-lg font-semibold">
                {item.event_time ? format(parse(item.event_time, 'HH:mm:ss', new Date()), 'p') : "N/A"}
              </p>
            </div>
          </div>

          {item.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-foreground">{item.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Kanban Data Hygiene Card */}
      {item && <KanbanDataHygieneCard item={item} />}

      {/* Kanban Item Notes Section */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Notes ({sortedNotes.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedNotes.length === 0 && <p className="text-muted-foreground text-sm">No notes yet for this item.</p>}
          {sortedNotes.map((note: KanbanItemNote) => (
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
                    onClick={() => handleDeleteNote(note.id, note.kanban_item_id)}
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
            {isAddingNote ? (
              <div className="space-y-2">
                <Label htmlFor="new-note-content">Add New Note</Label>
                <Textarea
                  id="new-note-content"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Type your note here..."
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingNote(false)}>Cancel</Button>
                  <Button onClick={handleAddNote} className="active:scale-95">Add Note</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setIsAddingNote(true)} className="w-full active:scale-95">
                <Plus className="w-4 h-4 mr-2" /> Add Note
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
                      No tasks related to this Kanban item yet.
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateNoteSubmit} className="active:scale-95">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kanban Item Form Dialog for editing */}
      {item && (
        <KanbanItemFormDialog
          isOpen={isItemFormDialogOpen}
          onOpenChange={setIsItemFormDialogOpen}
          initialData={item}
          columnId={item.column_id}
          onSubmit={handleUpdateItemSubmit}
          nextOrderIndex={item.order_index}
          profiles={profiles}
          getFullName={getFullName}
        />
      )}

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
                disabled // Disable if pre-filled from Kanban item details
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
    </div>
  );
}