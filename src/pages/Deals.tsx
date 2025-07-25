import { useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Filter } from "lucide-react";
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
import { DealFormDialog } from "@/components/deals/DealFormDialog";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DealStageBadge } from "@/components/deals/DealStageBadge"; // Import new badge
import { DealTierBadge } from "@/components/deals/DealTierBadge"; // Import new badge

export function Deals() {
  const { deals, contacts, profiles, loading, createDeal, updateDeal, deleteDeal, getFullName } = useCRMData(); // Destructure all needed properties
  const [searchTerm, setSearchTerm] = useState("");
  const [isDealFormDialogOpen, setIsDealFormDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  // Filter states
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [selectedAssignedTo, setSelectedAssignedTo] = useState<string>("all");

  const dealStages: { value: Deal['stage'], label: string }[] = [
    { value: "lead", label: "Lead" },
    { value: "in_development", label: "In Development" },
    { value: "demo", label: "Demo" },
    { value: "discovery_call", label: "Discovery Call" },
    { value: "paid", label: "Paid" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const dealTiers: string[] = [
    "1-OFF Projects: T1",
    "1-OFF Projects: T2",
    "1-OFF Projects: T3",
    "System Development: T1",
    "System Development: T2",
    "System Development: T3",
  ];

  const filteredDeals = deals.filter(deal => {
    const matchesSearch =
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.assigned_user && getFullName(deal.assigned_user).toLowerCase().includes(searchTerm.toLowerCase())) ||
      deal.tier?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage = selectedStage === "all" || deal.stage === selectedStage;
    const matchesTier = selectedTier === "all" || deal.tier === selectedTier;
    const matchesAssignedTo = selectedAssignedTo === "all" || deal.assigned_to === selectedAssignedTo;

    return matchesSearch && matchesStage && matchesTier && matchesAssignedTo;
  });

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

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedStage("all");
    setSelectedTier("all");
    setSelectedAssignedTo("all");
    // Note: The original code had a recursive call here. Removed it.
    // handleClearFilters(); 
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
          className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95"
          onClick={handleAddDealClick}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Deal
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedStage} onValueChange={setSelectedStage}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {dealStages.map(stage => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTier} onValueChange={setSelectedTier}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {dealTiers.map(tier => (
              <SelectItem key={tier} value={tier}>
                {tier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedAssignedTo} onValueChange={setSelectedAssignedTo}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by Assigned To" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {profiles.map(profile => (
              <SelectItem key={profile.id} value={profile.id}>
                {getFullName(profile)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(searchTerm !== "" || selectedStage !== "all" || selectedTier !== "all" || selectedAssignedTo !== "all") && (
          <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">
            <Filter className="w-4 h-4 mr-2" /> Clear Filters
          </Button>
        )}
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
                      <NavLink to={`/deals/${deal.id}`} className="bg-gradient-primary bg-clip-text text-transparent hover:underline">
                        {deal.title}
                      </NavLink>
                    </TableCell>
                    <TableCell>${deal.value.toLocaleString()}</TableCell>
                    <TableCell>
                      <DealStageBadge stage={deal.stage} />
                    </TableCell>
                    <TableCell>
                      <DealTierBadge tier={deal.tier} />
                    </TableCell>
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
                {searchTerm || selectedStage !== "all" || selectedTier !== "all" || selectedAssignedTo !== "all"
                  ? "No deals found matching your filters."
                  : "No deals yet. Create your first deal!"}
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