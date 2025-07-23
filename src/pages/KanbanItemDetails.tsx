import { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useCRMData } from "@/hooks/useCRMData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MoreHorizontal, Edit, Trash2, Clock, CalendarIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog } from "@/components/ui/dialog";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { UserProfileCard } from "@/components/UserProfileCard";
import { Badge } from "@/components/ui/badge";
import { KanbanItemFormDialog } from "@/components/kanban/KanbanItemFormDialog";
import type { KanbanItem, KanbanItemActivity } from "@/types/crm";

export function KanbanItemDetails() {
  const { kanbanItems, profiles, loading, updateKanbanItem, deleteKanbanItem, getFullName } = useCRMData();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const kanbanItem = kanbanItems.find(item => item.id === id);

  const [isItemFormDialogOpen, setIsItemFormDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && id && !kanbanItems.find(item => item.id === id)) {
      navigate("/kanban"); // Redirect if item not found
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
          navigate("/kanban"); // Navigate back to Kanban board after deletion
        }
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

  const getStatusBadgeClass = (status?: KanbanItem['status']) => {
    switch (status) {
      case 'New': return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30";
      case 'In Progress': return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
      case 'Closed': return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30";
      default: return "bg-muted text-muted-foreground";
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

  if (loading || !kanbanItem) {
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

  const sortedActivity = [...(kanbanItem.activity || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/kanban")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Kanban
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
              <p className="text-sm text-muted-foreground">Lead Type</p>
              <Badge className={getLeadTypeColorClass(kanbanItem.lead_type)}>
                {kanbanItem.lead_type || "N/A"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Client Type</p>
              <p className="text-lg font-semibold">{kanbanItem.client_type || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={getStatusBadgeClass(kanbanItem.status)}>
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
            {kanbanItem.move_in_date && (
              <div>
                <p className="text-sm text-muted-foreground">Move-in Date</p>
                <p className="text-lg font-semibold">
                  {format(parseISO(kanbanItem.move_in_date), "PPP")}
                </p>
              </div>
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

          <Separator />

          {/* Tenant Leads Info */}
          <h3 className="text-lg font-semibold">Tenant Lead Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p> {/* New field */}
              <p className="text-lg font-semibold">{kanbanItem.full_name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email Address</p> {/* New field */}
              <p className="text-lg font-semibold">{kanbanItem.email_address || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone Number</p> {/* Changed label */}
              <p className="text-lg font-semibold">{kanbanItem.client_contact_info || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Family Make-up</p>
              <p className="text-lg font-semibold">{kanbanItem.family_makeup || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Number of Pets</p> {/* Changed label */}
              <p className="text-lg font-semibold">{kanbanItem.pets_info !== undefined && kanbanItem.pets_info !== null ? kanbanItem.pets_info : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Number of Bedrooms</p> {/* New field */}
              <p className="text-lg font-semibold">{kanbanItem.num_bedrooms !== undefined && kanbanItem.num_bedrooms !== null ? kanbanItem.num_bedrooms : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Number of Bathrooms</p> {/* New field */}
              <p className="text-lg font-semibold">{kanbanItem.num_bathrooms !== undefined && kanbanItem.num_bathrooms !== null ? kanbanItem.num_bathrooms : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Preferred Location</p> {/* Changed label */}
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

          {/* Housing Leads Info */}
          <h3 className="text-lg font-semibold">Housing Lead Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Housing Partner Contact Info</p>
              <p className="text-lg font-semibold">{kanbanItem.housing_partner_contact_info || "N/A"}</p>
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
        </CardContent>
      </Card>

      {/* Activity Log Section */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Activity Log ({sortedActivity.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedActivity.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity yet for this item.</p>
          ) : (
            sortedActivity.map((activity: KanbanItemActivity) => (
              <div key={activity.id} className="border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
                <div className="text-sm text-foreground">
                  {renderActivityDetails(activity)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3 inline-block mr-1" />
                  {format(parseISO(activity.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Edit Item Dialog */}
      <Dialog open={isItemFormDialogOpen} onOpenChange={setIsItemFormDialogOpen}>
        <KanbanItemFormDialog
          isOpen={isItemFormDialogOpen}
          onOpenChange={setIsItemFormDialogOpen}
          initialData={kanbanItem}
          columnId={kanbanItem.column_id} // Pass current columnId
          onSubmit={handleUpdateItemSubmit}
          nextOrderIndex={kanbanItem.order_index} // Pass current order_index
          profiles={profiles}
          getFullName={getFullName}
        />
      </Dialog>
    </div>
  );
}