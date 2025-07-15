import { useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavLink } from "react-router-dom";
import { useCRMData } from "@/hooks/useCRMData";
import type { Deal } from "@/types/crm";
import { DealFormDialog } from "@/components/deals/DealFormDialog"; // Import the new dialog component
import { format } from "date-fns"; // Import format

export function Deals() {
  const { deals, contacts, profiles, loading, createDeal, updateDeal, deleteDeal, getFullName } = useCRMData();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDealFormDialogOpen, setIsDealFormDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const filteredDeals = deals.filter(deal =>
    deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (deal.assigned_user && getFullName(deal.assigned_user).toLowerCase().includes(searchTerm.toLowerCase())) ||
    deal.tier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDealClick = () => {
    setEditingDeal(null);
    setIsDealFormDialogOpen(true);
  };

  const handleEditDealClick = (deal: Deal) => {
    setEditingDeal(deal);
    setIsDealFormDialogOpen(true);
  };

  const handleDealFormSubmit = async (data: any) => {
    if (editingDeal) {
      await updateDeal(editingDeal.id, data);
    } else {
      await createDeal(data);
    }
    setIsDealFormDialogOpen(false);
    setEditingDeal(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this deal?")) {
      await deleteDeal(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Deals
          </h1>
          <p className="text-muted-foreground">
            Track your sales opportunities and pipeline
          </p>
        </div>

        <Button
          className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth"
          onClick={handleAddDealClick}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Deal
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Deals Table */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>All Deals ({filteredDeals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Close Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.map((deal) => (
                  <TableRow key={deal.id} className="hover:bg-muted/50 transition-smooth">
                    <TableCell className="font-medium">
                      <NavLink to={`/deals/${deal.id}`} className="text-primary hover:underline">
                        {deal.title}
                      </NavLink>
                    </TableCell>
                    <TableCell>${deal.value.toLocaleString()}</TableCell>
                    <TableCell>{deal.stage}</TableCell>
                    <TableCell>{deal.tier || "-"}</TableCell>
                    <TableCell>{deal.contact?.name || "-"}</TableCell>
                    <TableCell>{deal.assigned_user ? getFullName(deal.assigned_user) : "-"}</TableCell>
                    <TableCell>{deal.expected_close_date ? format(new Date(deal.expected_close_date), "PPP") : "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEditDealClick(deal)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(deal.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredDeals.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "No deals found matching your search." : "No deals yet. Create your first deal!"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <DealFormDialog
        isOpen={isDealFormDialogOpen}
        onOpenChange={setIsDealFormDialogOpen}
        initialData={editingDeal}
        onSubmit={handleDealFormSubmit}
        contacts={contacts}
        profiles={profiles}
        getFullName={getFullName}
      />
    </div>
  );
}