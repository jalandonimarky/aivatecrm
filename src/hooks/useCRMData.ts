import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Contact, Deal, Task, Profile, DashboardStats } from "@/types/crm";

export function useCRMData() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    wonDeals: 0,
    lostDeals: 0,
    pipelineValue: 0,
    totalContacts: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles((profilesData || []) as Profile[]);

      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);

      // Fetch deals with related data
      const { data: dealsData, error: dealsError } = await supabase
        .from("deals")
        .select(`
          *,
          contact:contacts(id, name, email, company),
          assigned_user:profiles!deals_assigned_to_fkey(id, full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (dealsError) throw dealsError;
      setDeals((dealsData || []) as Deal[]);

      // Fetch tasks with related data
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email),
          related_contact:contacts(id, name, email, company),
          related_deal:deals(id, title, value)
        `)
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;
      setTasks((tasksData || []) as Task[]);

      // Calculate stats
      calculateStats((dealsData || []) as Deal[], (tasksData || []) as Task[], contactsData || []);
      
    } catch (error: any) {
      console.error("Error fetching CRM data:", error);
      toast({
        title: "Error loading data",
        description: error.message || "Failed to load CRM data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (dealsData: Deal[], tasksData: Task[], contactsData: Contact[]) => {
    const wonDeals = dealsData.filter(deal => deal.stage === 'won');
    const lostDeals = dealsData.filter(deal => deal.stage === 'lost');
    const pipelineDeals = dealsData.filter(deal => !['won', 'lost'].includes(deal.stage));
    const completedTasks = tasksData.filter(task => task.status === 'completed');
    const overdueTasks = tasksData.filter(task => 
      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
    );

    setStats({
      totalRevenue: wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      wonDeals: wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      lostDeals: lostDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      pipelineValue: pipelineDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      totalContacts: contactsData.length,
      totalTasks: tasksData.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
    });
  };

  // CRUD operations for contacts
  const createContact = async (contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .insert([contactData])
        .select()
        .single();

      if (error) throw error;
      
      setContacts(prev => [data, ...prev]);
      toast({
        title: "Contact created",
        description: "New contact has been added successfully.",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating contact",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => prev.map(contact => 
        contact.id === id ? data : contact
      ));
      toast({
        title: "Contact updated",
        description: "Contact has been updated successfully.",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating contact",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setContacts(prev => prev.filter(contact => contact.id !== id));
      toast({
        title: "Contact deleted",
        description: "Contact has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting contact",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // CRUD operations for deals
  const createDeal = async (dealData: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'contact' | 'assigned_user'>) => {
    try {
      const { data, error } = await supabase
        .from("deals")
        .insert([dealData])
        .select(`
          *,
          contact:contacts(id, name, email, company),
          assigned_user:profiles!deals_assigned_to_fkey(id, full_name, email)
        `)
        .single();

      if (error) throw error;

      setDeals(prev => {
        const updatedDeals = [data as Deal, ...prev];
        calculateStats(updatedDeals, tasks, contacts);
        return updatedDeals;
      });
      toast({
        title: "Deal created",
        description: "New deal has been added successfully.",
      });
      return data as Deal;
    } catch (error: any) {
      toast({
        title: "Error creating deal",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateDeal = async (id: string, updates: Partial<Omit<Deal, 'contact' | 'assigned_user'>>) => {
    try {
      const { data, error } = await supabase
        .from("deals")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          contact:contacts(id, name, email, company),
          assigned_user:profiles!deals_assigned_to_fkey(id, full_name, email)
        `)
        .single();

      if (error) throw error;

      setDeals(prev => {
        const updatedDeals = prev.map(deal =>
          deal.id === id ? (data as Deal) : deal
        );
        calculateStats(updatedDeals, tasks, contacts);
        return updatedDeals;
      });
      toast({
        title: "Deal updated",
        description: "Deal has been updated successfully.",
      });
      return data as Deal;
    } catch (error: any) {
      toast({
        title: "Error updating deal",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDeal = async (id: string) => {
    try {
      const { error } = await supabase
        .from("deals")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setDeals(prev => {
        const updatedDeals = prev.filter(deal => deal.id !== id);
        calculateStats(updatedDeals, tasks, contacts);
        return updatedDeals;
      });
      toast({
        title: "Deal deleted",
        description: "Deal has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting deal",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    contacts,
    deals,
    tasks,
    profiles,
    stats,
    loading,
    refetch: fetchData,
    createContact,
    updateContact,
    deleteContact,
    createDeal,
    updateDeal,
    deleteDeal,
  };
}