import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Profile, Contact, Deal, Task } from "@/types/crm";
import type { Database } from "@/integrations/supabase/types";

// Helper to get full name
const getFullName = (profile: Profile) => {
  if (!profile) return "Unassigned";
  return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
};

export const useCRMData = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetching data
  const { data: profiles = [], isLoading: profilesLoading } = useQuery<Profile[]>({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("*").order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: deals = [], isLoading: dealsLoading } = useQuery<any[]>({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          contact:contacts(*),
          assigned_user:profiles!deals_assigned_to_fkey(*)
        `)
        .order('created_at', { ascending: false });
      if (error) {
        console.error("Error fetching deals:", error);
        throw new Error(error.message);
      }
      return data || [];
    },
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(*),
          related_contact:contacts(*),
          related_deal:deals(*)
        `)
        .order('created_at', { ascending: false });
      if (error) {
        console.error("Error fetching tasks:", error);
        throw new Error(error.message);
      }
      return data || [];
    },
  });

  const loading = profilesLoading || contactsLoading || dealsLoading || tasksLoading;

  // Mutations
  const useCreateMutation = (tableName: keyof Database['public']['Tables'], successMessage: string) => {
    return useMutation({
      mutationFn: async (newData: any) => {
        const { error } = await supabase.from(tableName).insert(newData);
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["deals"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        toast({ title: "Success", description: successMessage });
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  };

  const useUpdateMutation = (tableName: keyof Database['public']['Tables'], successMessage: string) => {
    return useMutation({
      mutationFn: async ({ id, ...updateData }: { id: string, [key: string]: any }) => {
        const { error } = await supabase.from(tableName).update(updateData).eq("id", id);
        if (error) throw error;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["deals"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        queryClient.invalidateQueries({ queryKey: [tableName.slice(0, -1), variables.id] });
        toast({ title: "Success", description: successMessage });
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  };

  const useDeleteMutation = (tableName: keyof Database['public']['Tables'], successMessage: string) => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from(tableName).delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["deals"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        toast({ title: "Success", description: successMessage });
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  };

  const createContact = useCreateMutation("contacts", "Contact created successfully.").mutateAsync;
  const updateContact = useUpdateMutation("contacts", "Contact updated successfully.").mutateAsync;
  const deleteContact = useDeleteMutation("contacts", "Contact deleted successfully.").mutateAsync;

  const createDeal = useCreateMutation("deals", "Deal created successfully.").mutateAsync;
  const updateDeal = useUpdateMutation("deals", "Deal updated successfully.").mutateAsync;
  const deleteDeal = useDeleteMutation("deals", "Deal deleted successfully.").mutateAsync;

  const createTask = useCreateMutation("tasks", "Task created successfully.").mutateAsync;
  const updateTask = useUpdateMutation("tasks", "Task updated successfully.").mutateAsync;
  const deleteTask = useDeleteMutation("tasks", "Task deleted successfully.").mutateAsync;

  // Stats calculation
  const stats = {
    paidDealsValue: deals.filter(d => d.stage === 'paid').reduce((sum, d) => sum + d.value, 0),
    pipelineValue: deals.filter(d => !['paid', 'completed', 'cancelled'].includes(d.stage)).reduce((sum, d) => sum + d.value, 0),
    totalContacts: contacts.length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    overdueTasks: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length,
    completedDealsValue: deals.filter(d => d.stage === 'completed').reduce((sum, d) => sum + d.value, 0),
    cancelledDealsValue: deals.filter(d => d.stage === 'cancelled').reduce((sum, d) => sum + d.value, 0),
    totalOneOffProjects: deals.filter(d => d.tier?.startsWith('1-OFF')).length,
    totalSystemDevelopment: deals.filter(d => d.tier?.startsWith('System Development')).length,
    paidDealsValueChange: { value: 12, trend: 'up' as const },
    pipelineValueChange: { value: 5, trend: 'down' as const },
    totalContactsChange: { value: 8, trend: 'up' as const },
    pendingTasksChange: { value: 3, trend: 'down' as const },
  };

  return {
    profiles,
    contacts,
    deals,
    tasks,
    loading,
    stats,
    createContact,
    updateContact,
    deleteContact,
    createDeal,
    updateDeal,
    deleteDeal,
    createTask,
    updateTask,
    deleteTask,
    getFullName,
  };
};