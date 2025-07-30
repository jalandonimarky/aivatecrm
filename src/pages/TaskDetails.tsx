import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCRMData } from "@/hooks/useCRMData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MoreHorizontal, Edit, Trash2, CalendarIcon, Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NavLink } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { UserProfileCard } from "@/components/UserProfileCard";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import type { Task, TaskNote } from "@/types/crm"; // Import TaskNote

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

export function TaskDetails() {
  const { tasks, contacts, deals, profiles, kanbanItems, loading, updateTask, deleteTask, createTaskNote, updateTaskNote, deleteTaskNote, getFullName } = useCRMData(); // Destructure all needed properties
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const task = tasks.find(t => t.id === id);

  const [isTaskFormDialogOpen, setIsTaskFormDialogOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    assigned_to: "unassigned",
    related_contact_id: "unassigned",
    related_deal_id: "unassigned",
    related_kanban_item_id: "unassigned", // Initialize new field
    due_date: undefined,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<TaskNote | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");

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
    if (!loading && id && !tasks.find(t => t.id === id)) {
      navigate("/tasks"); // Redirect if task not found
    }
    if (task) {
      setTaskFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        assigned_to: task.assigned_to || "unassigned",
        related_contact_id: task.related_contact_id || "unassigned",
        related_deal_id: task.related_deal_id || "unassigned",
        related_kanban_item_id: task.related_kanban_item_id || "unassigned", // Set new field for editing
        due_date: task.due_date ? new Date(task.due_date) : undefined,
      });
    }
  }, [tasks, id, loading, navigate, task]);

  const handleEditTaskClick = () => {
    setIsTaskFormDialogOpen(true);
  };

  const handleUpdateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      const dataToSubmit = {
        ...taskFormData,
        due_date: taskFormData.due_date ? format(taskFormData.due_date, "yyyy-MM-dd") : null,
        assigned_to: taskFormData.assigned_to === "unassigned" ? null : taskFormData.assigned_to,
        related_contact_id: taskFormData.related_contact_id === "unassigned" ? null : taskFormData.related_contact_id,
        related_deal_id: taskFormData.related_deal_id === "unassigned" ? null : taskFormData.related_deal_id,
        related_kanban_item_id: taskFormData.related_kanban_item_id === "unassigned" ? null : taskFormData.related_kanban_item_id, // Handle new field
      };
      await updateTask(task.id, dataToSubmit);
      setIsTaskFormDialogOpen(false);
    } catch (error) {
      // Error handled in the hook
    }
  };

  const handleDeleteTask = async () => {
    if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      try {
        if (id) {
          await deleteTask(id);
          navigate("/tasks"); // Navigate back to tasks list after deletion
        }
      } catch (error) {
        // Error handled in useCRMData hook
      }
    }
  };

  const handleAddNote = async () => {
    if (!id || !newNoteContent.trim()) return;

    try {
      await createTaskNote(id, newNoteContent);
      setNewNoteContent("");
      setIsAddingNote(false);
    } catch (error) {
      // Error handled in useCRMData hook
    }
  };

  const handleEditNoteClick = (note: TaskNote) => {
    setEditingNote(note);
    setEditNoteContent(note.content);
    setIsEditNoteDialogOpen(true);
  };

  const handleUpdateNoteSubmit = async () => {
    if (!editingNote || !editNoteContent.trim()) return;

    try {
      await updateTaskNote(editingNote.id, editingNote.task_id, { content: editNoteContent });
      setIsEditNoteDialogOpen(false);
      setEditingNote(null);
      setEditNoteContent("");
    } catch (error) {
      // Error handled in useCRMData hook
    }
  };

  const handleDeleteNote = async (noteId: string, taskId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteTaskNote(noteId, taskId);
      } catch (error) {
        // Error handled in useCRMData hook
      }
    }
  };

  if (loading || !task) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const sortedNotes = (task.notes || []).sort((a: TaskNote, b: TaskNote) => 
    parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime()
  );

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold min-w-0 mr-2">
              {task.title}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 active:scale-95">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleEditTaskClick}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDeleteTask}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-muted-foreground text-sm">
            Created: {format(parseISO(task.created_at), "PPP")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <TaskStatusBadge status={task.status} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>
              <TaskPriorityBadge priority={task.priority} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned To</p>
              {task.assigned_user ? (
                <UserProfileCard profile={task.assigned_user} />
              ) : (
                <p className="text-lg font-semibold">N/A</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="text-lg font-semibold">
                {task.due_date ? format(parseISO(task.due_date), "PPP") : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Related Contact</p>
              <p className="text-lg font-semibold">
                {task.related_contact ? (
                  <NavLink to={`/contacts/${task.related_contact.id}`} className="hover:underline">
                    {task.related_contact.name}
                  </NavLink>
                ) : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Related Deal</p>
              <p className="text-lg font-semibold">
                {task.related_deal ? (
                  <NavLink to={`/deals/${task.related_deal.id}`} className="hover:underline">
                    {task.related_deal.title}
                  </NavLink>
                ) : "N/A"}
              </p>
            </div>
            {/* New: Related Kanban Item */}
            <div>
              <p className="text-sm text-muted-foreground">Related Kanban Item</p>
              <p className="text-lg font-semibold">
                {task.related_kanban_item ? (
                  <NavLink to={`/kanban/items/${task.related_kanban_item.id}`} className="hover:underline">
                    {task.related_kanban_item.title}
                  </NavLink>
                ) : "N/A"}
              </p>
            </div>
          </div>

          {task.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-foreground">{task.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Task Notes/Activity Section */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Task Activity ({sortedNotes.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedNotes.length === 0 && <p className="text-muted-foreground text-sm">No activity notes yet for this task.</p>}
          {sortedNotes.map((note: TaskNote) => (
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
                    onClick={() => handleDeleteNote(note.id, note.task_id)}
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
                <Label htmlFor="new-note-content">Add New Activity Note</Label>
                <Textarea
                  id="new-note-content"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Type your activity note here..."
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingNote(false)}>Cancel</Button>
                  <Button onClick={handleAddNote} className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95">Add Note</Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setIsAddingNote(true)} className="w-full bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95">
                <Plus className="w-4 h-4 mr-2" /> Add Activity Note
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Note Dialog */}
      <Dialog open={isEditNoteDialogOpen} onOpenChange={setIsEditNoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task Note</DialogTitle>
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

      {/* Edit Task Dialog (existing) */}
      <Dialog open={isTaskFormDialogOpen} onOpenChange={setIsTaskFormDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateTaskSubmit} className="space-y-4">
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
                onClick={() => setIsTaskFormDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-primary active:scale-95">
                Update Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}