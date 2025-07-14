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
import { ArrowLeft, Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react"; // Import new icons
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import DropdownMenu components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Import DialogFooter
import { format, parseISO } from "date-fns";
import { UserProfileCard } from "@/components/UserProfileCard";
import type { DealNote } from "@/types/crm";

export function DealDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deals, loading, createDealNote, updateDealNote, deleteDealNote, getFullName } = useCRMData();
  const [deal, setDeal] = useState<any>(null);
  const [businessNoteContent, setBusinessNoteContent] = useState("");
  const [techNoteContent, setTechNoteContent] = useState("");
  const [isAddingBusinessNote, setIsAddingBusinessNote] = useState(false);
  const [isAddingTechNote, setIsAddingTechNote] = useState(false);

  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DealNote | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [editNoteType, setEditNoteType] = useState<'business' | 'tech'>('business');

  useEffect(() => {
    if (deals.length > 0 && id) {
      const foundDeal = deals.find(d => d.id === id);
      setDeal(foundDeal);
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
    </div>
  );
}