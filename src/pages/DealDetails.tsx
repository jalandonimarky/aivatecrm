import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCRMData } from "@/hooks/useCRMData";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, Trash2, Plus, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { DealTimeline } from "@/components/deals/DealTimeline";
import { DataHygieneCard } from "@/components/deals/DataHygieneCard";
import { RallyDialog } from "@/components/deals/RallyDialog";
import { Textarea } from "@/components/ui/textarea";

export default function DealDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profiles, getFullName } = useCRMData();
  const [isRallyDialogOpen, setIsRallyDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState("");

  const { data: deal, isLoading: dealLoading } = useQuery<any>({
    queryKey: ["deal", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select(`*, contact:contacts(*), assigned_user:profiles(*)`)
        .eq("id", id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!id,
  });

  const { data: notes, isLoading: notesLoading } = useQuery<any[]>({
    queryKey: ["deal_notes", id],
    queryFn: async () => {
        const { data, error } = await supabase
            .from("deal_notes")
            .select(`*, author:profiles(id, first_name, last_name)`)
            .eq("deal_id", id)
            .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        return data || [];
    },
    enabled: !!id,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { deal_id: string; note_type: string; content: string; created_by: string | null }) => {
        const { error } = await supabase.from("deal_notes").insert(noteData);
        if (error) throw error;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["deal_notes", id] });
        setNewNote("");
        toast({ title: "Success", description: "Note added successfully." });
    },
    onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAddNote = async () => {
    if (!newNote.trim() || !deal) return;
    const { data: { user } } = await supabase.auth.getUser();
    const profile = profiles.find(p => p.user_id === user?.id);
    createNoteMutation.mutate({
      deal_id: deal.id,
      note_type: "manual",
      content: newNote,
      created_by: profile?.id || null,
    });
  };

  const handleRallySubmit = async (date: Date, time: string, note: string) => {
    if (!deal) return;

    const rallyPayload = {
        deal_id: deal.id,
        deal_title: deal.title,
        contact_name: deal.contact?.name,
        contact_email: deal.contact?.email,
        rally_date: format(date, "yyyy-MM-dd"),
        rally_time: time,
        note: note,
    };

    try {
        const { error: invokeError } = await supabase.functions.invoke('rally-trigger', {
            body: rallyPayload,
        });

        if (invokeError) throw invokeError;

        const { data: { user } } = await supabase.auth.getUser();
        const profile = profiles.find(p => p.user_id === user?.id);
        await createNoteMutation.mutateAsync({
            deal_id: deal.id,
            note_type: "rally",
            content: `Rally scheduled for ${format(date, "PPP")} at ${time}. Note: ${note}`,
            created_by: profile?.id || null,
        });

        toast({
            title: "Rally Scheduled!",
            description: "The rally has been scheduled and a note has been added.",
        });
    } catch (error: any) {
        toast({
            title: "Error Scheduling Rally",
            description: error.message,
            variant: "destructive",
        });
    }
  };

  if (dealLoading || notesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return <div>Deal not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/deals")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Deals
        </Button>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setIsRallyDialogOpen(true)}>
            Schedule Rally
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          {deal.title}
        </h1>
        <p className="text-muted-foreground">
          Value: ${deal.value.toLocaleString()} | Stage: {deal.stage}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DealTimeline deal={deal} />
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Activity Feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a new note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <Button onClick={handleAddNote} disabled={createNoteMutation.isPending}>
                  {createNoteMutation.isPending ? "Adding..." : "Add Note"}
                </Button>
              </div>
              <div className="space-y-4">
                {notes?.map((note) => (
                  <div key={note.id} className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-muted-foreground">
                        by {note.author ? getFullName(note.author) : "System"} on {format(new Date(note.created_at), "PPP p")}
                      </p>
                    </div>
                  </div>
                ))}
                {notes?.length === 0 && <p className="text-muted-foreground text-sm">No notes yet.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <DataHygieneCard deal={deal} />
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Contact:</strong> {deal.contact?.name || "N/A"}</p>
              <p><strong>Assigned To:</strong> {deal.assigned_user ? getFullName(deal.assigned_user) : "N/A"}</p>
              <p><strong>Tier:</strong> {deal.tier || "N/A"}</p>
              <p><strong>Expected Close:</strong> {deal.expected_close_date ? format(new Date(deal.expected_close_date), "PPP") : "N/A"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <RallyDialog
        isOpen={isRallyDialogOpen}
        onOpenChange={setIsRallyDialogOpen}
        onSubmit={handleRallySubmit}
        deal={deal}
      />
    </div>
  );
}