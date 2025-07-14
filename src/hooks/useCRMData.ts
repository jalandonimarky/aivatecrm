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
    completedTasks: 0,
    overdueTasks: 0,
    totalTasks: 0,
    totalOneOffProjects: 0, // Initialize new stats
    totalSystemDevelopment: 0, // Initialize new stats
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Helper to combine first and last name for display
  const getFullName = (profile: Profile) => `${profile.first_name} ${profile.last_name}`;

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles((profilesData || []) as Profile[]);

      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("id, name, email, phone, company, position, notes, created_by, created_at, updated_at") // Select all fields
        .order("created_at", { ascending: false });

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);

      // Fetch deals with related data
      const { data: dealsData, error: dealsError } = await supabase
        .from("deals")
        .select(`
          *,
          contact:contacts(id, name, email, company, created_at, updated_at),
          assigned_user:profiles!deals_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
        `)
        .order("created_at", { ascending: false });

      if (dealsError) throw dealsError;
      setDeals((dealsData || []) as Deal[]);

      // Fetch tasks with related data
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          related_contact:contacts(id, name, email, company, created_at, updated_at),
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
    const wonDeals = dealsData.filter(deal => deal.stage === 'paid'); // Updated stage
    const lostDeals = dealsData.filter(deal => deal.stage === 'done_completed'); // Updated stage
    const pipelineDeals = dealsData.filter(deal => !['paid', 'done_completed'].includes(deal.stage)); // Updated stages
    const completedTasks = tasksData.filter(task => task.status === 'completed');
    const overdueTasks = tasksData.filter(task => 
      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
    );

    const oneOffProjects = dealsData.filter(deal => deal.tier?.startsWith('1-OFF Projects'));
    const systemDevelopment = dealsData.filter(deal => deal.tier?.startsWith('System Development'));

    setStats({
      totalRevenue: wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      wonDeals: wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      lostDeals: lostDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      pipelineValue: pipelineDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      totalContacts: contactsData.length,
      totalTasks: tasksData.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      totalOneOffProjects: oneOffProjects.length, // Set new stat
      totalSystemDevelopment: systemDevelopment.length, // Set new stat
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
      
      setContacts(prev => [data as Contact, ...prev]);
      toast({
        title: "Contact created",
        description: "New contact has been added successfully.",
      });
      return data as Contact;
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
        contact.id === id ? (data as Contact) : contact
      ));
      toast({
        title: "Contact updated",
        description: "Contact has been updated successfully.",
      });
      return data as Contact;
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
          contact:contacts(id, name, email, company, created_at, updated_at),
          assigned_user:profiles!deals_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
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
          contact:contacts(id, name, email, company, created_at, updated_at),
          assigned_user:profiles!deals_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
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

  // CRUD operations for tasks
  const createTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'assigned_user' | 'related_contact' | 'related_deal'>) => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([taskData])
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          related_contact:contacts(id, name, email, company, created_at, updated_at),
          related_deal:deals(id, title, value)
        `)
        .single();

      if (error) throw error;

      setTasks(prev => {
        const updatedTasks = [data as Task, ...prev];
        calculateStats(deals, updatedTasks, contacts);
        return updatedTasks;
      });
      toast({
        title: "Task created",
        description: "New task has been added successfully.",
      });
      return data as Task;
    } catch (error: any) {
      toast({
        title: "Error creating task",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Omit<Task, 'assigned_user' | 'related_contact' | 'related_deal'>>) => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          related_contact:contacts(id, name, email, company, created_at, updated_at),
          related_deal:deals(id, title, value)
        `)
        .single();

      if (error) throw error;

      setTasks(prev => {
        const updatedTasks = prev.map(task =>
          task.id === id ? (data as Task) : task
        );
        calculateStats(deals, updatedTasks, contacts);
        return updatedTasks;
      });
      toast({
        title: "Task updated",
        description: "Task has been updated successfully.",
      });
      return data as Task;
    } catch (error: any) {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTasks(prev => {
        const updatedTasks = prev.filter(task => task.id !== id);
        calculateStats(deals, updatedTasks, contacts);
        return updatedTasks;
      });
      toast({
        title: "Task deleted",
        description: "Task has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting task",
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
    createTask,
    updateTask,
    deleteTask,
    getFullName, // Export the helper function
  };
}