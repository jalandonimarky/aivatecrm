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
import { ArrowLeft, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { UserProfileCard } from "@/components/UserProfileCard"; // Import UserProfileCard
import type { DealNote } from "@/types/crm";

export function DealDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deals, profiles, loading, createDealNote, getFullName } = useCRMData();
  const [deal, setDeal] = useState<any>(null); // Use 'any' for now, will refine with full Deal type
  const [businessNoteContent, setBusinessNoteContent] = useState("");
  const [techNoteContent, setTechNoteContent] = useState("");
  const [isAddingBusinessNote, setIsAddingBusinessNote] = useState(false);
  const [isAddingTechNote, setIsAddingTechNote] = useState(false);

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
              <div key={note.id} className="border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
                <p className="text-sm text-foreground">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Added by {note.creator ? getFullName(note.creator) : "Unknown"} on {format(parseISO(note.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                </p>
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
              <div key={note.id} className="border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
                <p className="text-sm text-foreground">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Added by {note.creator ? getFullName(note.creator) : "Unknown"} on {format(parseISO(note.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                </p>
              </div>
            ))}
            <div className="mt-4">
              {isAddingTechNote ? (
                <div className="space-y-2">
                  <Label htmlFor="tech-note-content">Add Tech Note</Label>
                  <Textarea
                    id="tech-note-content"
                    value={techNoteContent}
                    onChange={(e) => setTechNoteContent(e.target.value)}
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
    </div>
  );
}