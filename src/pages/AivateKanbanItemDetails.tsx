import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCRMData } from "@/hooks/useCRMData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MoreHorizontal, Edit, Trash2, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { UserProfileCard } from "@/components/UserProfileCard";
import { Badge } from "@/components/ui/badge";
import { AivateKanbanItemFormDialog } from "@/components/aivate-kanban/AivateKanbanItemFormDialog";
import type { AivateKanbanItem } from "@/types/crm";

export function AivateKanbanItemDetails() {
  const { aivateKanbanItems, profiles, loading, updateAivateKanbanItem, deleteAivateKanbanItem, getFullName } = useCRMData();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const kanbanItem = aivateKanbanItems.find(item => item.id === id);

  const [isItemFormDialogOpen, setIsItemFormDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && id && !aivateKanbanItems.find(item => item.id === id)) {
      navigate("/project-management/aivate"); // Redirect if item not found
    }
  }, [aivateKanbanItems, id, loading, navigate]);

  const handleEditItemClick = () => {
    setIsItemFormDialogOpen(true);
  };

  const handleUpdateItemSubmit = async (data: any) => {
    if (kanbanItem) {
      await updateAivateKanbanItem(kanbanItem.id, data);
      setIsItemFormDialogOpen(false);
    }
  };

  const handleDeleteItem = async () => {
    if (confirm("Are you sure you want to delete this AiVate project? This action cannot be undone.")) {
      try {
        if (id) {
          await deleteAivateKanbanItem(id);
          navigate("/project-management/aivate"); // Navigate back to Kanban board after deletion
        }
      } catch (error) {
        // Error handled in useCRMData hook
      }
    }
  };

  const getStatusBadgeClass = (status: AivateKanbanItem['status']) => {
    switch (status) {
      case 'New': return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30";
      case 'In Progress': return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
      case 'Completed': return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30";
      case 'On Hold': return "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30";
      case 'Cancelled': return "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading || !kanbanItem) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate("/project-management/aivate")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to AiVate Projects
        </Button>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/project-management/aivate")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to AiVate Projects
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
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDeleteItem}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
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
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={getStatusBadgeClass(kanbanItem.status)}>
                {kanbanItem.status || "N/A"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="text-lg font-semibold">{kanbanItem.category || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned To</p>
              {kanbanItem.assigned_user ? (
                <UserProfileCard profile={kanbanItem.assigned_user} />
              ) : (
                <p className="text-lg font-semibold">N/A</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email Address</p>
              <p className="text-lg font-semibold">{kanbanItem.email_address || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <p className="text-lg font-semibold">{kanbanItem.phone_number || "N/A"}</p>
            </div>
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
        </CardContent>
      </Card>

      {/* Edit Item Dialog */}
      <Dialog open={isItemFormDialogOpen} onOpenChange={setIsItemFormDialogOpen}>
        <AivateKanbanItemFormDialog
          isOpen={isItemFormDialogOpen}
          onOpenChange={setIsItemFormDialogOpen}
          initialData={kanbanItem}
          columnId={kanbanItem.column_id}
          onSubmit={handleUpdateItemSubmit}
          nextOrderIndex={kanbanItem.order_index}
          profiles={profiles}
          getFullName={getFullName}
        />
      </Dialog>
    </div>
  );
}