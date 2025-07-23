import { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useCRMData } from "@/hooks/useCRMData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MoreHorizontal, Edit, Trash2, Clock, CalendarIcon, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { UserProfileCard } from "@/components/UserProfileCard";
import { Badge } from "@/components/ui/badge";
import { KanbanItemFormDialog } from "@/components/kanban/KanbanItemFormDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { KanbanItem, KanbanItemActivity, KanbanBoard, KanbanItemNote } from "@/types/crm";

export function KanbanItemDetails() {
  const { kanbanItems, kanbanBoards, profiles, loading, updateKanbanItem, deleteKanbanItem, getFullName, createKanbanItemNote, updateKanbanItemNote, deleteKanbanItemNote } = useCRMData();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const kanbanItem = kanbanItems.find(item => item.id === id);
  const parentColumn = kanbanItem ? kanbanBoards.flatMap(board => board.columns || []).find(col => col.id === kanbanItem.column_id) : null;
  const parentBoard = parentColumn ? kanbanBoards.find(board => board.id === parentColumn.board_id) : null;

  const [isItemFormDialogOpen, setIsItemFormDialogOpen] = useState(false);

  const [businessNoteContent, setBusinessNoteContent] = useState("");
  const [developmentNoteContent, setDevelopmentNoteContent] = useState("");
  const [isAddingBusinessNote, setIsAddingBusinessNote] = useState(false);
  const [isAddingDevelopmentNote, setIsAddingDevelopmentNote] = useState(false);

  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<KanbanItemNote | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [editNoteType, setEditNoteType] = useState<'business' | 'development'>('business');

  useEffect(() => {
    if (!loading && id && !kanbanItems.find(item => item.id === id)) {
      navigate("/project-management"); // Redirect if item not found
    }
  }, [kanbanItems, id, loading, navigate]);

  const handleEditItemClick = () => {
    setIsItemFormDialogOpen(true);
  };

  const handleUpdateItemSubmit = async (data: any) => {
    if (kanbanItem) {
      await updateKanbanItem(kanbanItem.id, data);
      setIsItemFormDialogOpen(false);
    }
  };

  const handleDeleteItem = async () => {
    if (confirm("Are you sure you want to delete this Kanban item? This action cannot be undone.")) {
      try {
        if (id) {
          await deleteKanbanItem(id);
          navigate("/project-management"); // Navigate back to Kanban board after deletion
        }
      } catch (error) {
        // Error handled in useCRMData hook
      }
    }
  };

  const handleAddNote = async (noteType: 'business' | 'development', content: string) => {
    if (!id || !content.trim()) return;

    try {
      await createKanbanItemNote(id, noteType, content);
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

  const handleEditNoteClick = (note: KanbanItemNote) => {
    setEditingNote(note);
    setEditNoteContent(note.content);
    setEditNoteType(note.note_type);
    setIsEditNoteDialogOpen(true);
  };

  const handleUpdateNoteSubmit = async () => {
    if (!editingNote || !editNoteContent.trim()) return;

    try {
      await updateKanbanItemNote(editingNote.id, editingNote.item_id, { content: editNoteContent, note_type: editNoteType });
      setIsEditNoteDialogOpen(false);
      setEditingNote(null);
      setEditNoteContent("");
      setEditNoteType('business');
    } catch (error) {
      // Error handled in useCRMData hook
    }
  };

  const handleDeleteNote = async (noteId: string, itemId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteKanbanItemNote(noteId, itemId);
      } catch (error) {
        // Error handled in useCRMData hook
      }
    }
  };

  const getLeadTypeColorClass = (leadType?: KanbanItem['lead_type']) => {
    switch (leadType) {
      case 'Tenant Lead Contact': return "bg-primary/10 text-primary border-primary/30";
      case 'Property Lead Contact': return "bg-accent/10 text-accent border-accent/30";
      default: return "bg-muted/10 text-muted-foreground border-muted/30";
    }
  };

  const getStatusBadgeClass = (status?: KanbanItem['status'], projectType?: KanbanBoard['project_type']) => {
    if (!status) return "bg-muted text-muted-foreground";

    if (projectType === 'AiVate') {
      switch (status) {
        case 'New': return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30";
        case 'In Progress': return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
        case 'Closed': return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30";
        default: return "bg-muted text-muted-foreground";
      }
    } else { // Buds & Bonfire or Other
      switch (status) {
        case 'New': return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30";
        case 'In Progress': return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
        case 'Closed': return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30";
        default: return "bg-muted text-muted-foreground";
      }
    }
  };

  const renderActivityDetails = (activity: KanbanItemActivity) => {
    const userName = activity.user ? `${activity.user.first_name} ${activity.user.last_name}` : 'Someone';
    const details = activity.details;

    switch (activity.activity_type) {
      case 'created':
        return <p><span className="font-semibold">{userName}</span> created this card.</p>;
      case 'moved':
        return <p><span className="font-semibold">{userName}</span> moved this card from <Badge variant="secondary">{details.from || 'Unsorted'}</Badge> to <Badge variant="secondary">{details.to || 'Unsorted'}</Badge>.</p>;
      case 'updated':
        const oldVal = details.old || 'nothing';
        const newVal = details.new || 'nothing';
        return <p><span className="font-semibold">{userName}</span> updated <span className="font-medium">{details.field}</span> from "{oldVal}" to "{newVal}".</p>;
      default:
        return <p>An unknown activity occurred.</p>;
    }
  };

  if (loading || !kanbanItem || !parentBoard) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate("/project-management")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project Boards
        </Button>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const sortedActivity = [...(kanbanItem.activity || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const sortedNotes = (kanbanItem.notes || []).sort((a: KanbanItemNote, b: KanbanItemNote) => 
    parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime()
  );
  const businessNotes = sortedNotes.filter((note: KanbanItemNote) => note.note_type === 'business');
  const developmentNotes = sortedNotes.filter((note: KanbanItemNote) => note.note_type === 'development');

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/project-management")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project Boards
      </Button>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold min-w-0 mr-2">
              {kanbanItem.title}
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
            Created: {format(parseISO(kanbanItem.created_at), "PPP")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Project Type</p>
              <Badge variant="secondary">{parentBoard.project_type === 'Other' ? parentBoard.custom_project_name : parentBoard.project_type}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={getStatusBadgeClass(kanbanItem.status, parentBoard.project_type)}>
                {kanbanItem.status || "N/A"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned To</p>
              {kanbanItem.assigned_user ? (
                <UserProfileCard profile={kanbanItem.assigned_user} />
              ) : (
                <p className="text-lg font-semibold">N/A</p>
              )}
            </div>
            {parentBoard.project_type === 'AiVate' && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="text-lg font-semibold">{kanbanItem.category || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="text-lg font-semibold">{kanbanItem.email_address || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="text-lg font-semibold">{kanbanItem.phone_number || "N/A"}</p>
                </div>
                {kanbanItem.color_hex && (
                  <div>
                    <p className="text-sm text-muted-foreground">Color</p>
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full" style={{ backgroundColor: kanbanItem.color_hex }}></span>
                      <p className="text-lg font-semibold">{kanbanItem.color_hex}</p>
                    </div>
                  </div>
                )}
                {kanbanItem.due_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="text-lg font-semibold">
                      {format(parseISO(kanbanItem.due_date), "PPP")}
                    </p>
                  </div>
                )}
              </>
            )}
            {parentBoard.project_type === 'Buds & Bonfire' && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Lead Type</p>
                  <Badge className={getLeadTypeColorClass(kanbanItem.lead_type)}>
                    {kanbanItem.lead_type || "N/A"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client Type</p>
                  <p className="text-lg font-semibold">{kanbanItem.client_type || "N/A"}</p>
                </div>
                {kanbanItem.move_in_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Move-in Date</p>
                    <p className="text-lg font-semibold">
                      {format(parseISO(kanbanItem.move_in_date), "PPP")}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {kanbanItem.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-foreground">{kanbanItem.description}</p>
              </div>
            </>
          )}

          {parentBoard.project_type === 'Buds & Bonfire' && (
            <>
              <Separator />
              <h3 className="text-lg font-semibold">Tenant Lead Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="text-lg font-semibold">{kanbanItem.full_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="text-lg font-semibold">{kanbanItem.email_address || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="text-lg font-semibold">{kanbanItem.client_contact_info || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Family Make-up</p>
                  <p className="text-lg font-semibold">{kanbanItem.family_makeup || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Number of Pets</p>
                  <p className="text-lg font-semibold">{kanbanItem.pets_info !== undefined && kanbanItem.pets_info !== null ? kanbanItem.pets_info : "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Number of Bedrooms</p>
                  <p className="text-lg font-semibold">{kanbanItem.num_bedrooms !== undefined && kanbanItem.num_bedrooms !== null ? kanbanItem.num_bedrooms : "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Number of Bathrooms</p>
                  <p className="text-lg font-semibold">{kanbanItem.num_bathrooms !== undefined && kanbanItem.num_bathrooms !== null ? kanbanItem.num_bathrooms : "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preferred Location</p>
                  <p className="text-lg font-semibold">{kanbanItem.preferred_location || "N/A"}</p>
                </div>
              </div>
              {kanbanItem.property_criteria && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Property Criteria</p>
                  <p className="text-foreground">{kanbanItem.property_criteria}</p>
                </div>
              )}

              <Separator />

              <h3 className="text-lg font-semibold">Housing Lead Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="text-lg font-semibold">{kanbanItem.housing_partner_full_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="text-lg font-semibold">{kanbanItem.housing_partner_email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="text-lg font-semibold">{kanbanItem.housing_partner_phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Property Address</p>
                  <p className="text-lg font-semibold">{kanbanItem.property_address || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Beds/Baths & Sq Ft</p>
                  <p className="text-lg font-semibold">{kanbanItem.property_beds_baths_sqft || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">MTR Approved</p>
                  <p className="text-lg font-semibold">
                    {kanbanItem.mtr_approved === true ? "Yes" : kanbanItem.mtr_approved === false ? "No" : "N/A"}
                  </p>
                </div>
              </div>
              {kanbanItem.property_match && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Property Match</p>
                  <p className="text-foreground">{kanbanItem.property_match}</p>
                </div>
              )}
            </>
          )}
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
            {businessNotes.map((note: KanbanItemNote) => (
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
                      onClick={() => handleDeleteNote(note.id, note.item_id)}
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
                    <Button onClick={() => handleAddNote('business', businessNoteContent)} className="active:scale-95">Add Note</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setIsAddingBusinessNote(true)} className="w-full active:scale-95">
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
            {developmentNotes.map((note: KanbanItemNote) => (
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
                      onClick={() => handleDeleteNote(note.id, note.item_id)}
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
                    <Button onClick={() => handleAddNote('development', developmentNoteContent)} className="active:scale-95">Add Note</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setIsAddingDevelopmentNote(true)} className="w-full active:scale-95">
                  <Plus className="w-4 h-4 mr-2" /> Add Development Note
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
              <Select
                value={editNoteType}
                onValueChange={(value) => setEditNoteType(value as 'business' | 'development')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateNoteSubmit} className="active:scale-95">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isItemFormDialogOpen} onOpenChange={setIsItemFormDialogOpen}>
        {parentBoard && (
          <KanbanItemFormDialog
            isOpen={isItemFormDialogOpen}
            onOpenChange={setIsItemFormDialogOpen}
            initialData={kanbanItem}
            columnId={kanbanItem.column_id}
            boardProjectType={parentBoard.project_type}
            onSubmit={handleUpdateItemSubmit}
            nextOrderIndex={kanbanItem.order_index}
            profiles={profiles}
            getFullName={getFullName}
          />
        )}
      </Dialog>
    </div>
  );
}