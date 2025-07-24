import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock, CheckSquare, Edit, Trash2, Plus, MessageSquare, ListChecks } from "lucide-react";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { UserProfileCard } from "@/components/UserProfileCard";
import { KanbanPriorityBadge } from "./KanbanPriorityBadge";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { KanbanItem, Profile } from "@/types/crm";

interface KanbanItemDetailsViewProps {
  item: KanbanItem;
  profiles: Profile[];
  getFullName: (profile: Profile) => string;
  onEditClick: (item: KanbanItem) => void;
  onDeleteClick: (itemId: string) => void;
  onMarkComplete: (itemId: string, isCompleted: boolean) => void;
}

export function KanbanItemDetailsView({
  item,
  profiles,
  getFullName,
  onEditClick,
  onDeleteClick,
  onMarkComplete,
}: KanbanItemDetailsViewProps) {
  const assignedUser = profiles.find(p => p.id === item.assigned_to);
  const isCompleted = item.category === 'done'; // Assuming 'done' category means completed

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Header with Title and Actions */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <h2 className="text-2xl font-bold text-foreground flex-1 min-w-0 pr-4 break-words">
          {item.title}
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant={isCompleted ? "secondary" : "default"}
            onClick={() => onMarkComplete(item.id, !isCompleted)}
            className={cn(
              "transition-smooth",
              isCompleted ? "bg-success text-success-foreground hover:bg-success/90" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            {isCompleted ? "Mark Incomplete" : "Mark Complete"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Edit className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditClick(item)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Item
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteClick(item.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Assignee</Label>
          {assignedUser ? (
            <UserProfileCard profile={assignedUser} />
          ) : (
            <p className="text-foreground">Unassigned</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Due Date</Label>
          <div className="flex items-center text-foreground">
            <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
            {item.due_date ? format(new Date(item.due_date), "PPP") : "No due date"}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Category</Label>
          {item.category ? (
            <Badge variant="secondary" className="text-sm px-2 py-1">
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Badge>
          ) : (
            <p className="text-foreground">None</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Priority</Label>
          {item.priority_level ? (
            <KanbanPriorityBadge priority={item.priority_level} />
          ) : (
            <p className="text-foreground">None</p>
          )}
        </div>
        {item.event_time && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Time</Label>
            <div className="flex items-center text-foreground">
              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
              {format(parse(item.event_time, 'HH:mm:ss', new Date()), 'p')}
            </div>
          </div>
        )}
      </div>

      {item.description && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Description</Label>
            <p className="text-foreground text-sm">{item.description}</p>
          </div>
        </>
      )}

      <Separator />

      {/* Subtasks Section (Placeholder) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <ListChecks className="w-5 h-5 mr-2 text-muted-foreground" /> Subtasks
          </h3>
          <Button variant="ghost" size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Subtask
          </Button>
        </div>
        <div className="text-muted-foreground text-sm">
          No subtasks yet.
        </div>
      </div>

      <Separator />

      {/* Comments Section (Placeholder) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-muted-foreground" /> Comments
        </h3>
        <div className="space-y-2">
          <Textarea placeholder="Add a comment..." rows={3} />
          <Button size="sm" className="bg-gradient-primary">Add Comment</Button>
        </div>
        <div className="text-muted-foreground text-sm">
          No comments yet.
        </div>
      </div>
    </div>
  );
}