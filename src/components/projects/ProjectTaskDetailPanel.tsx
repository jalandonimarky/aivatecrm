import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Plus, Edit, Trash2, MessageSquare, CheckSquare, User, Link, Unlink, Lock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { UserProfileCard } from "@/components/UserProfileCard";
import { ProjectTaskPriorityBadge } from "./ProjectTaskPriorityBadge";
import { ProjectTaskStatusBadge } from "./ProjectTaskStatusBadge";
import { useCRMData } from "@/hooks/useCRMData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ProjectTask, Profile, ProjectSubtask, ProjectTaskComment, ProjectTaskDependency } from "@/types/crm";

interface ProjectTaskDetailPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: ProjectTask | null;
  profiles: Profile[];
  getFullName: (profile: Profile) => string;
}

export function ProjectTaskDetailPanel({
  isOpen,
  onOpenChange,
  task,
  profiles,
  getFullName,
}: ProjectTaskDetailPanelProps) {
  const {
    projects, // Need projects to find other tasks for dependencies
    updateProjectTask,
    createProjectSubtask,
    updateProjectSubtask,
    deleteProjectSubtask,
    createProjectTaskComment,
    updateProjectTaskComment,
    deleteProjectTaskComment,
    createProjectTaskDependency, // New
    deleteProjectTaskDependency, // New
    refetch, // To refresh data after changes
  } = useCRMData();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee_id: "unassigned",
    due_date: undefined as Date | undefined,
    priority: "Medium" as ProjectTask['priority'],
    status: "On Track" as ProjectTask['status'],
    section: "To Do" as ProjectTask['section'],
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState<string | undefined>(undefined);
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState<Date | undefined>(undefined);
  const [isSubtaskCalendarOpen, setIsSubtaskCalendarOpen] = useState(false);

  const [newCommentContent, setNewCommentContent] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [localComments, setLocalComments] = useState<ProjectTaskComment[]>([]);

  const [isAddingDependency, setIsAddingDependency] = useState(false);
  const [selectedDependencyTask, setSelectedDependencyTask] = useState<string | undefined>(undefined);

  const taskPriorities: { value: ProjectTask['priority'], label: string }[] = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
  ];

  const taskStatuses: { value: ProjectTask['status'], label: string }[] = [
    { value: "On Track", label: "On Track" },
    { value: "At Risk", label: "At Risk" },
    { value: "Off Track", label: "Off Track" },
    { value: "Completed", label: "Completed" },
  ];

  const taskSections: { value: ProjectTask['section'], label: string }[] = [
    { value: "To Do", label: "To Do" },
    { value: "Doing", label: "Doing" },
    { value: "Done", label: "Done" },
  ];

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        assignee_id: task.assignee_id || "unassigned",
        due_date: task.due_date ? parseISO(task.due_date) : undefined,
        priority: task.priority,
        status: task.status,
        section: task.section,
      });
      setLocalComments(task.comments || []);
    } else {
      // Reset form when no task is selected (e.g., panel closes)
      setFormData({
        title: "",
        description: "",
        assignee_id: "unassigned",
        due_date: undefined,
        priority: "Medium",
        status: "On Track",
        section: "To Do",
      });
      setNewSubtaskTitle("");
      setNewSubtaskAssignee(undefined);
      setNewSubtaskDueDate(undefined);
      setNewCommentContent("");
      setIsEditingDescription(false);
      setLocalComments([]);
      setIsAddingDependency(false);
      setSelectedDependencyTask(undefined);
    }
  }, [task]);

  useEffect(() => {
    if (!task?.id) return;

    const channel = supabase
      .channel(`project_task_comments:${task.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_task_comments', filter: `task_id=eq.${task.id}` },
        async (payload) => {
          // Re-fetch comments to ensure creator profile is included
          const { data, error } = await supabase
            .from('project_task_comments')
            .select('*, creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)')
            .eq('task_id', task.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error("Error fetching real-time comments:", error);
            toast({ title: "Error", description: "Failed to update comments in real-time.", variant: "destructive" });
          } else {
            setLocalComments(data || []);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [task?.id, toast]);


  const handleUpdateTask = async (field: keyof typeof formData, value: any) => {
    if (!task) return;
    const updatedFormData = { ...formData, [field]: value };
    setFormData(updatedFormData); // Optimistic update

    const dataToSubmit = {
      ...updatedFormData,
      due_date: updatedFormData.due_date ? format(updatedFormData.due_date, "yyyy-MM-dd") : null,
      assignee_id: updatedFormData.assignee_id === "unassigned" ? null : updatedFormData.assignee_id,
      description: updatedFormData.description || null, // Ensure empty string becomes null
    };

    try {
      await updateProjectTask(task.id, dataToSubmit);
      toast({ title: "Task updated", description: `${field} updated successfully.` });
    } catch (error: any) {
      toast({ title: "Error updating task", description: error.message, variant: "destructive" });
      // Revert optimistic update on error
      if (task) {
        setFormData({
          title: task.title,
          description: task.description || "",
          assignee_id: task.assignee_id || "unassigned",
          due_date: task.due_date ? parseISO(task.due_date) : undefined,
          priority: task.priority,
          status: task.status,
          section: task.section,
        });
      }
    }
  };

  const handleMarkAsComplete = async () => {
    if (!task) return;

    // Check for uncompleted subtasks
    const uncompletedSubtasks = (task.subtasks || []).filter(sub => !sub.is_completed);
    if (uncompletedSubtasks.length > 0) {
      toast({
        title: "Cannot Complete Task",
        description: `Please complete all ${uncompletedSubtasks.length} subtask(s) first.`,
        variant: "destructive",
      });
      return;
    }

    // Check for uncompleted dependencies
    const uncompletedDependencies = (task.dependencies || []).filter(dep => 
      dep.dependent_task?.status !== 'Completed'
    );
    if (uncompletedDependencies.length > 0) {
      toast({
        title: "Cannot Complete Task",
        description: `This task is blocked by ${uncompletedDependencies.length} uncompleted dependency task(s).`,
        variant: "destructive",
      });
      return;
    }

    if (confirm("Are you sure you want to mark this task as complete and move it to 'Done'?")) {
      try {
        await updateProjectTask(task.id, { status: "Completed", section: "Done" });
        toast({ title: "Task Completed", description: "Task moved to 'Done' section." });
        onOpenChange(false); // Close panel after completion
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    }
  };

  const handleAddSubtask = async () => {
    if (!task || !newSubtaskTitle.trim()) return;
    try {
      await createProjectSubtask({ 
        task_id: task.id, 
        title: newSubtaskTitle, 
        is_completed: false,
        assignee_id: newSubtaskAssignee === "unassigned" ? undefined : newSubtaskAssignee,
        due_date: newSubtaskDueDate ? format(newSubtaskDueDate, "yyyy-MM-dd") : undefined,
      });
      setNewSubtaskTitle("");
      setNewSubtaskAssignee(undefined);
      setNewSubtaskDueDate(undefined);
    } catch (error: any) {
      toast({ title: "Error adding subtask", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleSubtaskComplete = async (subtask: ProjectSubtask) => {
    if (!task) return;
    try {
      await updateProjectSubtask(subtask.id, { is_completed: !subtask.is_completed });
    } catch (error: any) {
      toast({ title: "Error updating subtask", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateSubtaskField = async (subtask: ProjectSubtask, field: 'assignee_id' | 'due_date', value: any) => {
    if (!task) return;
    try {
      const dataToUpdate = {
        [field]: field === 'due_date' && value ? format(value, "yyyy-MM-dd") : (value === "unassigned" ? null : value),
      };
      await updateProjectSubtask(subtask.id, dataToUpdate);
      toast({ title: "Subtask updated", description: `Subtask ${field.replace('_', ' ')} updated.` });
    } catch (error: any) {
      toast({ title: "Error updating subtask", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task) return;
    if (confirm("Are you sure you want to delete this subtask?")) {
      try {
        await deleteProjectSubtask(subtaskId);
      } catch (error: any) {
        toast({ title: "Error deleting subtask", description: error.message, variant: "destructive" });
      }
    }
  };

  const handleAddComment = async () => {
    if (!task || !newCommentContent.trim()) return;
    try {
      await createProjectTaskComment({ task_id: task.id, content: newCommentContent });
      setNewCommentContent("");
    } catch (error: any) {
      toast({ title: "Error adding comment", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!task) return;
    if (confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteProjectTaskComment(commentId);
      } catch (error: any) {
        toast({ title: "Error deleting comment", description: error.message, variant: "destructive" });
      }
    }
  };

  const handleAddDependency = async () => {
    if (!task || !selectedDependencyTask) return;
    if (task.id === selectedDependencyTask) {
      toast({
        title: "Invalid Dependency",
        description: "A task cannot depend on itself.",
        variant: "destructive",
      });
      return;
    }
    if ((task.dependencies || []).some(dep => dep.depends_on_task_id === selectedDependencyTask)) {
      toast({
        title: "Duplicate Dependency",
        description: "This dependency already exists.",
        variant: "warning",
      });
      return;
    }
    try {
      await createProjectTaskDependency(task.id, selectedDependencyTask);
      setSelectedDependencyTask(undefined);
      setIsAddingDependency(false);
    } catch (error: any) {
      toast({ title: "Error adding dependency", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteDependency = async (dependsOnTaskId: string) => {
    if (!task) return;
    if (confirm("Are you sure you want to remove this dependency?")) {
      try {
        await deleteProjectTaskDependency(task.id, dependsOnTaskId);
      } catch (error: any) {
        toast({ title: "Error removing dependency", description: error.message, variant: "destructive" });
      }
    }
  };

  if (!task) {
    return null; // Or a loading skeleton if preferred
  }

  const sortedSubtasks = [...(task.subtasks || [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const sortedComments = [...(localComments || [])].sort((a, b) => parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime());
  const sortedDependencies = [...(task.dependencies || [])].sort((a, b) => a.dependent_task?.title.localeCompare(b.dependent_task?.title || '') || 0);

  // Get all other tasks in the same project for dependency selection
  const currentProject = projects.find(p => p.id === task.project_id);
  const otherTasksInProject = (currentProject?.tasks || []).filter(t => t.id !== task.id);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold flex items-center">
            {task.title}
            {task.is_blocked && (
              <Lock className="w-5 h-5 ml-2 text-destructive" />
            )}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Manage details, subtasks, and comments for this project task.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4"> {/* Added negative margin to counteract scrollbar padding */}
          <div className="space-y-6 py-4">
            {/* Task Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Title</Label>
                <Input
                  id="task-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  onBlur={() => handleUpdateTask("title", formData.title)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                {isEditingDescription ? (
                  <Textarea
                    id="task-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    onBlur={() => {
                      handleUpdateTask("description", formData.description);
                      setIsEditingDescription(false);
                    }}
                    autoFocus
                    rows={4}
                  />
                ) : (
                  <div
                    className="min-h-[80px] p-3 border border-input rounded-md text-sm text-foreground bg-background cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    {formData.description || <span className="text-muted-foreground">Add a description...</span>}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-assignee">Assigned To</Label>
                  <Select
                    value={formData.assignee_id}
                    onValueChange={(value) => handleUpdateTask("assignee_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee">
                        {task.assignee ? getFullName(task.assignee) : "Unassigned"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {profiles.map(profile => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {getFullName(profile)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-due-date">Due Date</Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.due_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.due_date ? format(formData.due_date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.due_date}
                        onSelect={(date) => {
                          handleUpdateTask("due_date", date || undefined);
                          setIsCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: ProjectTask['priority']) => handleUpdateTask("priority", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority">
                        <ProjectTaskPriorityBadge priority={formData.priority} />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {taskPriorities.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: ProjectTask['status']) => handleUpdateTask("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status">
                        <ProjectTaskStatusBadge status={formData.status} />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {taskStatuses.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-section">Section</Label>
                <Select
                  value={formData.section}
                  onValueChange={(value: ProjectTask['section']) => handleUpdateTask("section", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section">
                      {formData.section}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {taskSections.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Dependencies Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Link className="w-5 h-5 mr-2 text-primary" /> Dependencies ({sortedDependencies.length})
              </h3>
              <div className="space-y-2">
                {sortedDependencies.length === 0 && (
                  <p className="text-muted-foreground text-sm">No dependencies set for this task.</p>
                )}
                {sortedDependencies.map(dep => (
                  <div key={dep.depends_on_task_id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        "text-sm font-medium",
                        dep.dependent_task?.status === 'Completed' ? "line-through text-muted-foreground" : "text-foreground"
                      )}>
                        {dep.dependent_task?.title || "Unknown Task"}
                      </span>
                      {dep.dependent_task?.status !== 'Completed' && (
                        <Lock className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteDependency(dep.depends_on_task_id)} className="h-8 w-8 text-destructive">
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                {isAddingDependency ? (
                  <div className="space-y-2">
                    <Label htmlFor="dependency-task">Add Dependency</Label>
                    <Select
                      value={selectedDependencyTask}
                      onValueChange={setSelectedDependencyTask}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a task to depend on" />
                      </SelectTrigger>
                      <SelectContent>
                        {otherTasksInProject.length === 0 && (
                          <p className="p-2 text-muted-foreground">No other tasks in this project.</p>
                        )}
                        {otherTasksInProject.map(otherTask => (
                          <SelectItem key={otherTask.id} value={otherTask.id}>
                            {otherTask.title} ({otherTask.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddingDependency(false)}>Cancel</Button>
                      <Button onClick={handleAddDependency} disabled={!selectedDependencyTask}>Add Dependency</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setIsAddingDependency(true)} className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Add Dependency
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Subtasks Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <CheckSquare className="w-5 h-5 mr-2 text-primary" /> Subtasks ({sortedSubtasks.filter(s => s.is_completed).length}/{sortedSubtasks.length})
              </h3>
              <div className="space-y-2">
                {sortedSubtasks.length === 0 && (
                  <p className="text-muted-foreground text-sm">No subtasks yet. Add one below!</p>
                )}
                {sortedSubtasks.map(subtask => (
                  <div key={subtask.id} className="flex flex-col p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`subtask-${subtask.id}`}
                          checked={subtask.is_completed}
                          onCheckedChange={() => handleToggleSubtaskComplete(subtask)}
                        />
                        <Label
                          htmlFor={`subtask-${subtask.id}`}
                          className={cn("text-sm", subtask.is_completed && "line-through text-muted-foreground")}
                        >
                          {subtask.title}
                        </Label>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSubtask(subtask.id)} className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pl-6">
                      <div className="flex items-center space-x-2">
                        {subtask.assignee && (
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{getFullName(subtask.assignee)}</span>
                          </div>
                        )}
                        {subtask.due_date && (
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-3 h-3" />
                            <span>{format(parseISO(subtask.due_date), "MMM dd")}</span>
                          </div>
                        )}
                      </div>
                      {/* Add edit options for subtask assignee/due date if needed */}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="New subtask title"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={newSubtaskAssignee || "unassigned"}
                    onValueChange={(value) => setNewSubtaskAssignee(value === "unassigned" ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {profiles.map(profile => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {getFullName(profile)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Popover open={isSubtaskCalendarOpen} onOpenChange={setIsSubtaskCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newSubtaskDueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newSubtaskDueDate ? format(newSubtaskDueDate, "PPP") : <span>Due Date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newSubtaskDueDate}
                        onSelect={(date) => {
                          setNewSubtaskDueDate(date || undefined);
                          setIsSubtaskCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Add Subtask
                </Button>
              </div>
            </div>

            <Separator />

            {/* Comments Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-primary" /> Comments ({sortedComments.length})
              </h3>
              <div className="space-y-4">
                {sortedComments.length === 0 && (
                  <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
                )}
                {sortedComments.map(comment => (
                  <div key={comment.id} className="border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
                    <p className="text-sm text-foreground mb-1">{comment.content}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{comment.creator ? getFullName(comment.creator) : "Unknown User"}</span>
                        <span>&bull;</span>
                        <span>{format(parseISO(comment.created_at), "MMM dd, yyyy 'at' hh:mm a")}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteComment(comment.id)} className="h-6 w-6">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                  rows={2}
                />
                <Button onClick={handleAddComment} disabled={!newCommentContent.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {task.status !== "Completed" && (
            <Button onClick={handleMarkAsComplete} className="bg-gradient-primary">
              Mark as Complete
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}