import React, { useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Calendar as CalendarIcon, Clock, MessageSquare } from "lucide-react";
import { UserProfileCard } from "@/components/UserProfileCard";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { KanbanItem as KanbanItemType, KanbanItemNote } from "@/types/crm";

interface KanbanItemProps {
  item: KanbanItemType;
  index: number;
  onEdit: (item: KanbanItemType) => void;
  onDelete: (itemId: string) => void;
  onCreateNote: (itemId: string, content: string) => Promise<KanbanItemNote>;
}

export function KanbanItem({ item, index, onEdit, onDelete, onCreateNote }: KanbanItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const getLeadTypeColorClass = (leadType?: KanbanItemType['lead_type']) => {
    switch (leadType) {
      case 'Tenant Lead Contact': return "border-l-4 border-primary";
      case 'Property Lead Contact': return "border-l-4 border-accent";
      default: return "border-l-4 border-transparent";
    }
  };

  const getStatusBadgeClass = (status?: KanbanItemType['status']) => {
    switch (status) {
      case 'New': return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30";
      case 'In Progress': return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
      case 'Closed': return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-radix-popper-content-wrapper]') || target.closest('textarea')) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    setIsAddingNote(true);
    await onCreateNote(item.id, newNoteContent);
    setNewNoteContent("");
    setIsAddingNote(false);
  };

  const sortedNotes = [...(item.notes || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "relative bg-gradient-card border-border/50 shadow-sm transition-all duration-200 ease-in-out cursor-pointer",
            getLeadTypeColorClass(item.lead_type),
            snapshot.isDragging ? "z-50 shadow-lg ring-2 ring-primary" : "hover:z-40 hover:-translate-y-1",
            isExpanded ? "z-30" : ""
          )}
          onClick={toggleExpand}
        >
          <CardContent className="p-3">
            <div className="flex items-start justify-between mb-1">
              <h4 className="font-semibold text-foreground text-sm flex-1 min-w-0 pr-2 break-words">{item.title}</h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onEdit(item)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {item.status && <Badge className={cn("text-xs px-2 py-0.5", getStatusBadgeClass(item.status))}>{item.status}</Badge>}
              {item.lead_type && <Badge variant="secondary" className="text-xs px-2 py-0.5">{item.lead_type}</Badge>}
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{formatDistanceToNow(new Date(item.created_at))} ago</span>
              </div>
              {item.assigned_user && <UserProfileCard profile={item.assigned_user} />}
            </div>

            {isExpanded && (
              <div className="mt-4 border-t border-border/50 pt-3">
                <h5 className="text-sm font-semibold mb-2">Activity Log</h5>
                <div className="space-y-2 mb-3">
                  <Textarea placeholder="Add a comment..." value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} rows={2} />
                  <Button size="sm" onClick={handleAddNote} disabled={isAddingNote || !newNoteContent.trim()}>{isAddingNote ? "Adding..." : "Add Comment"}</Button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-3 custom-scrollbar">
                  {sortedNotes.length > 0 ? sortedNotes.map(note => (
                    <div key={note.id} className="text-xs">
                      <p className="font-semibold">{note.creator?.first_name} {note.creator?.last_name}</p>
                      <p className="text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                      <p className="text-muted-foreground/70 mt-1">{format(new Date(note.created_at), "MMM dd, yyyy 'at' p")}</p>
                    </div>
                  )) : <p className="text-xs text-muted-foreground text-center py-2">No activity yet.</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}