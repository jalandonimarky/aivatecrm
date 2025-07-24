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
import { format, parseISO, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { UserProfileCard } from "@/components/UserProfileCard";
import { KanbanPriorityBadge } from "@/components/kanban/KanbanPriorityBadge";
import { Badge } from "@/components/ui/badge";
import { KanbanItemFormDialog } from "@/components/kanban/KanbanItemFormDialog";
import { KanbanDataHygieneCard } from "@/components/kanban/KanbanDataHygieneCard";
import type { KanbanItem, KanbanItemNote } from "@/types/crm";

export function KanbanItemDetails() {
  const {
    kanbanItems,
    profiles,
    loading,
    updateKanbanItem,
    deleteKanbanItem,
    createKanbanItemNote, // New: create note function
    updateKanbanItemNote, // New: update note function
    deleteKanbanItemNote, // New: delete note function
    getFullName,
  } = useCRMData();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const item = kanbanItems.find((i) => i.id === id);

  const [isItemFormDialogOpen, setIsItemFormDialogOpen] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false); // State for adding new note
  const [newNoteContent, setNewNoteContent] = useState(""); // State for new note content
  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false); // State for edit note dialog
  const [editingNote, setEditingNote] = useState<KanbanItemNote | null>(null); // State for note being edited
  const [editNoteContent, setEditNoteContent] = useState(""); // State for edited note content

  useEffect(() => {
    if (!loading && id && !kanbanItems.find((i) => i.id === id)) {
      navigate("/kanban"); // Redirect if item not found
    }
  }, [kanbanItems, id, loading, navigate]);

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
    </div>
  );
}