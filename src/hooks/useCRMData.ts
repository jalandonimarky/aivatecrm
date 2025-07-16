import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Contact, Deal, Task, Profile, DashboardStats, DealNote, DealAttachment } from "@/types/crm";
import { startOfMonth, subMonths, isWithinInterval, parseISO, endOfMonth } from "date-fns";
import { useQueryClient } from "@tanstack/react-query"; // Added import

export function useCRMData() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    paidDealsValue: 0,
    completedDealsValue: 0,
    cancelledDealsValue: 0,
    pipelineValue: 0,
    totalContacts: 0,
    completedTasks: 0,
    overdueTasks: 0,
    totalTasks: 0,
    totalOneOffProjects: 0,
    totalSystemDevelopment: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient(); // Initialized useQueryClient

  // Helper to combine first and last name for display
  const getFullName = (profile: Profile) => `${profile.first_name} ${profile.last_name}`;

  // Helper to calculate percentage change
  const calculatePercentageChange = (current: number, previous: number): { value: number; trend: "up" | "down" } => {
    if (previous === 0) {
      return { value: current > 0 ? 100 : 0, trend: current > 0 ? "up" : "down" };
    }
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(parseFloat(change.toFixed(1))),
      trend: change >= 0 ? "up" : "down",
    };
  };

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
        .select("id, name, email, phone, company, position, notes, created_by, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);

      // Fetch deals with related data, notes, and attachments
      const { data: dealsData, error: dealsError } = await supabase
        .from("deals")
        .select(`
          *,
          contact:contacts(id, name, email, company, created_at, updated_at),
          assigned_user:profiles!deals_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          notes:deal_notes(id, deal_id, note_type, content, created_at, created_by, creator:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at)),
          tasks:tasks(id, title, description, status, priority, assigned_to, related_contact_id, related_deal_id, due_date, created_by, created_at, updated_at, assigned_user:profiles!tasks_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at), related_contact:contacts(id, name), related_deal:deals(id, title)),
          attachments:deal_attachments(id, deal_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at, uploader:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at))
        `)
        .order("created_at", { ascending: false });

      if (dealsError) throw dealsError;
      // Generate download URLs for attachments
      const dealsWithUrls = (dealsData || []).map(deal => ({
        ...deal,
        attachments: (deal.attachments || []).map(attachment => ({
          ...attachment,
          download_url: supabase.storage.from('deal-attachments').getPublicUrl(attachment.file_path).data.publicUrl
        }))
      }));
      setDeals(dealsWithUrls as Deal[]);

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
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error loading data",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (dealsData: Deal[], tasksData: Task[], contactsData: Contact[]) => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    // Filter data for current and previous month
    const currentMonthDeals = dealsData.filter(deal => 
      deal.created_at && isWithinInterval(parseISO(deal.created_at), { start: currentMonthStart, end: currentMonthEnd })
    );
    const prevMonthDeals = dealsData.filter(deal => 
      deal.created_at && isWithinInterval(parseISO(deal.created_at), { start: prevMonthStart, end: prevMonthEnd })
    );

    const currentMonthContacts = contactsData.filter(contact =>
      contact.created_at && isWithinInterval(parseISO(contact.created_at), { start: currentMonthStart, end: currentMonthEnd })
    );
    const prevMonthContacts = contactsData.filter(contact =>
      contact.created_at && isWithinInterval(parseISO(contact.created_at), { start: prevMonthStart, end: prevMonthEnd })
    );

    const currentMonthTasks = tasksData.filter(task =>
      task.created_at && isWithinInterval(parseISO(task.created_at), { start: currentMonthStart, end: currentMonthEnd })
    );
    const prevMonthTasks = tasksData.filter(task =>
      task.created_at && isWithinInterval(parseISO(task.created_at), { start: prevMonthStart, end: prevMonthEnd })
    );

    // Current month calculations
    const paidDealsCurrent = currentMonthDeals.filter(deal => deal.stage === 'paid');
    const completedDealsCurrent = currentMonthDeals.filter(deal => deal.stage === 'completed');
    const cancelledDealsCurrent = currentMonthDeals.filter(deal => deal.stage === 'cancelled');
    const pipelineDealsCurrent = currentMonthDeals.filter(deal => !['paid', 'completed', 'cancelled'].includes(deal.stage));
    const completedTasksCurrent = currentMonthTasks.filter(task => task.status === 'completed');
    const overdueTasksCurrent = currentMonthTasks.filter(task => 
      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
    );
    const pendingTasksCurrentCount = currentMonthTasks.length - completedTasksCurrent.length;

    const oneOffProjectsCurrent = currentMonthDeals.filter(deal => deal.tier?.startsWith('1-OFF Projects'));
    const systemDevelopmentCurrent = currentMonthDeals.filter(deal => deal.tier?.startsWith('System Development'));

    // Previous month calculations
    const paidDealsPrev = prevMonthDeals.filter(deal => deal.stage === 'paid');
    const pipelineDealsPrev = prevMonthDeals.filter(deal => !['paid', 'completed', 'cancelled'].includes(deal.stage));
    const completedTasksPrev = prevMonthTasks.filter(task => task.status === 'completed');
    const pendingTasksPrevCount = prevMonthTasks.length - completedTasksPrev.length;


    const paidDealsValueCurrent = paidDealsCurrent.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const paidDealsValuePrev = paidDealsPrev.reduce((sum, deal) => sum + (deal.value || 0), 0);

    const pipelineValueCurrent = pipelineDealsCurrent.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const pipelineValuePrev = pipelineDealsPrev.reduce((sum, deal) => sum + (deal.value || 0), 0);

    const totalContactsCurrent = currentMonthContacts.length;
    const totalContactsPrev = prevMonthContacts.length;

    setStats({
      totalRevenue: paidDealsValueCurrent,
      paidDealsValue: paidDealsValueCurrent,
      completedDealsValue: completedDealsCurrent.reduce((sum, deal) => sum + (deal.value || 0), 0),
      cancelledDealsValue: cancelledDealsCurrent.reduce((sum, deal) => sum + (deal.value || 0), 0),
      pipelineValue: pipelineValueCurrent,
      totalContacts: contactsData.length,
      totalTasks: tasksData.length,
      completedTasks: completedTasksCurrent.length,
      overdueTasks: overdueTasksCurrent.length,
      totalOneOffProjects: oneOffProjectsCurrent.length,
      totalSystemDevelopment: systemDevelopmentCurrent.length,

      // Calculate and set change metrics
      paidDealsValueChange: calculatePercentageChange(paidDealsValueCurrent, paidDealsValuePrev),
      pipelineValueChange: calculatePercentageChange(pipelineValueCurrent, pipelineValuePrev),
      totalContactsChange: calculatePercentageChange(totalContactsCurrent, totalContactsPrev),
      pendingTasksChange: calculatePercentageChange(pendingTasksCurrentCount, pendingTasksPrevCount),
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
      
      setContacts(prev => {
        const updatedContacts = [data as Contact, ...prev];
        calculateStats(deals, tasks, updatedContacts);
        return updatedContacts;
      });
      toast({
        title: "Contact created",
        description: "New contact has been added successfully.",
      });
      return data as Contact;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error creating contact",
        description: errorMessage,
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

      setContacts(prev => {
        const updatedContacts = prev.map(contact => 
          contact.id === id ? (data as Contact) : contact
        );
        calculateStats(deals, tasks, updatedContacts);
        return updatedContacts;
      });
      toast({
        title: "Contact updated",
        description: "Contact has been updated successfully.",
      });
      return data as Contact;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error updating contact",
        description: errorMessage,
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

      setContacts(prev => {
        const updatedContacts = prev.filter(contact => contact.id !== id);
        calculateStats(deals, tasks, updatedContacts);
        return updatedContacts;
      });
      toast({
        title: "Contact deleted",
        description: "Contact has been removed successfully.",
      });
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error deleting contact",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // CRUD operations for deals
  const createDeal = async (dealData: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'contact' | 'assigned_user' | 'notes' | 'tasks' | 'attachments'>) => {
    try {
      const { data, error } = await supabase
        .from("deals")
        .insert([dealData])
        .select(`
          *,
          contact:contacts(id, name, email, company, created_at, updated_at),
          assigned_user:profiles!deals_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          notes:deal_notes(id, deal_id, note_type, content, created_at, created_by, creator:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at)),
          tasks:tasks(id, title, description, status, priority, assigned_to, related_contact_id, related_deal_id, due_date, created_by, created_at, updated_at, assigned_user:profiles!tasks_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at), related_contact:contacts(id, name), related_deal:deals(id, title)),
          attachments:deal_attachments(id, deal_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at, uploader:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at))
        `)
        .single();

      if (error) throw error;

      const newDealWithUrls = {
        ...data as Deal,
        attachments: (data.attachments || []).map(attachment => ({
          ...attachment,
          download_url: supabase.storage.from('deal-attachments').getPublicUrl(attachment.file_path).data.publicUrl
        }))
      };

      setDeals(prev => {
        const updatedDeals = [newDealWithUrls, ...prev];
        calculateStats(updatedDeals, tasks, contacts);
        return updatedDeals;
      });
      toast({
        title: "Deal created",
        description: "New deal has been added successfully.",
      });
      return newDealWithUrls;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error creating deal",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateDeal = async (id: string, updates: Partial<Omit<Deal, 'contact' | 'assigned_user' | 'notes' | 'tasks' | 'attachments'>>) => {
    try {
      const { data, error } = await supabase
        .from("deals")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          contact:contacts(id, name, email, company, created_at, updated_at),
          assigned_user:profiles!deals_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          notes:deal_notes(id, deal_id, note_type, content, created_at, created_by, creator:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at)),
          tasks:tasks(id, title, description, status, priority, assigned_to, related_contact_id, related_deal_id, due_date, created_by, created_at, updated_at, assigned_user:profiles!tasks_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at), related_contact:contacts(id, name), related_deal:deals(id, title)),
          attachments:deal_attachments(id, deal_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at, uploader:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at))
        `)
        .single();

      if (error) throw error;

      const updatedDealWithUrls = {
        ...data as Deal,
        attachments: (data.attachments || []).map(attachment => ({
          ...attachment,
          download_url: supabase.storage.from('deal-attachments').getPublicUrl(attachment.file_path).data.publicUrl
        }))
      };

      setDeals(prev => {
        const updatedDeals = prev.map(deal =>
          deal.id === id ? updatedDealWithUrls : deal
        );
        calculateStats(updatedDeals, tasks, contacts);
        return updatedDeals;
      });
      queryClient.invalidateQueries({ queryKey: ['deal', id] }); // Invalidate the specific deal query
      toast({
        title: "Deal updated",
        description: "Deal has been updated successfully.",
      });
      return updatedDealWithUrls;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error updating deal",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDeal = async (id: string) => {
    try {
      // First, get all attachments for the deal to delete them from storage
      const { data: attachmentsToDelete, error: fetchAttachmentsError } = await supabase
        .from('deal_attachments')
        .select('file_path')
        .eq('deal_id', id);

      if (fetchAttachmentsError) throw fetchAttachmentsError;

      if (attachmentsToDelete && attachmentsToDelete.length > 0) {
        const filePaths = attachmentsToDelete.map(att => att.file_path);
        const { error: storageError } = await supabase.storage
          .from('deal-attachments')
          .remove(filePaths);
        
        if (storageError) {
          console.warn("Failed to delete some files from storage:", storageError.message);
          // Don't throw, proceed with database deletion as metadata will be removed anyway
        }
      }

      // Then delete the deal (which will cascade delete deal_attachments and deal_notes)
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
      queryClient.invalidateQueries({ queryKey: ['deal', id] }); // Invalidate the specific deal query
      queryClient.invalidateQueries({ queryKey: ['deals'] }); // Invalidate the main deals list
      toast({
        title: "Deal deleted",
        description: "Deal has been removed successfully.",
      });
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error deleting deal",
        description: errorMessage,
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
      // Also update the specific deal in the deals state with the new task if it's related
      setDeals(prevDeals => prevDeals.map(deal => 
        deal.id === data.related_deal_id 
          ? { ...deal, tasks: [...(deal.tasks || []), data as Task] }
          : deal
      ));
      queryClient.invalidateQueries({ queryKey: ['deal', data.related_deal_id] }); // Invalidate the specific deal query
      toast({
        title: "Task created",
        description: "New task has been added successfully.",
      });
      return data as Task;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message }).message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error creating task",
        description: errorMessage,
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
      // Also update the specific deal in the deals state with the updated task if it's related
      setDeals(prevDeals => prevDeals.map(deal => 
        deal.id === data.related_deal_id 
          ? { 
              ...deal, 
              tasks: (deal.tasks || []).map(task => 
                task.id === id ? (data as Task) : task
              )
            }
          : deal
      ));
      queryClient.invalidateQueries({ queryKey: ['deal', data.related_deal_id] }); // Invalidate the specific deal query
      toast({
        title: "Task updated",
        description: "Task has been updated successfully.",
      });
      return data as Task;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error updating task",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      // Find the deal ID associated with the task before deleting
      const taskToDelete = tasks.find(task => task.id === id);
      const relatedDealId = taskToDelete?.related_deal_id;

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
      // Also remove the task from the specific deal in the deals state if it was related
      setDeals(prevDeals => prevDeals.map(deal => 
        deal.tasks?.some(task => task.id === id)
          ? { 
              ...deal, 
              tasks: (deal.tasks || []).filter(task => task.id !== id)
            }
          : deal
      ));
      if (relatedDealId) {
        queryClient.invalidateQueries({ queryKey: ['deal', relatedDealId] }); // Invalidate the specific deal query
      }
      toast({
        title: "Task deleted",
        description: "Task has been removed successfully.",
      });
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error deleting task",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // CRUD operations for deal notes
  const createDealNote = async (dealId: string, noteType: 'business' | 'development', content: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated.");

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error("User profile not found.");

      const { data, error } = await supabase
        .from("deal_notes")
        .insert([{ deal_id: dealId, note_type: noteType, content, created_by: profileData.id }])
        .select(`
          *,
          creator:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
        `)
        .single();

      if (error) throw error;

      // Update the specific deal in the deals state with the new note
      setDeals(prevDeals => prevDeals.map(deal => 
        deal.id === dealId 
          ? { ...deal, notes: [...(deal.notes || []), data as DealNote] }
          : deal
      ));
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] }); // Invalidate the specific deal query
      toast({
        title: "Note added",
        description: "Your note has been added successfully.",
      });
      return data as DealNote;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error adding note",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateDealNote = async (noteId: string, dealId: string, updates: Partial<Omit<DealNote, 'id' | 'deal_id' | 'created_at' | 'created_by' | 'creator'>>) => {
    try {
      const { data, error } = await supabase
        .from("deal_notes")
        .update(updates)
        .eq("id", noteId)
        .select(`
          *,
          creator:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
        `)
        .single();

      if (error) throw error;

      setDeals(prevDeals => prevDeals.map(deal => 
        deal.id === dealId 
          ? { 
              ...deal, 
              notes: (deal.notes || []).map(note => 
                note.id === noteId ? (data as DealNote) : note
              )
            }
          : deal
      ));
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] }); // Invalidate the specific deal query
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully.",
      });
      return data as DealNote;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error updating note",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDealNote = async (noteId: string, dealId: string) => {
    try {
      const { error } = await supabase
        .from("deal_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      setDeals(prevDeals => prevDeals.map(deal => 
        deal.id === dealId 
          ? { 
              ...deal, 
              notes: (deal.notes || []).filter(note => note.id !== noteId)
            }
          : deal
      ));
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] }); // Invalidate the specific deal query
      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully.",
      });
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error deleting note",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // File attachment operations
  const uploadDealAttachment = async (dealId: string, file: File) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated.");

      // Fetch the profile ID for the current user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error("User profile not found.");

      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
      const filePath = `${dealId}/${profileData.id}/${fileName}`; // Structure: deal_id/profile_id/filename

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('deal-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL (for display/download)
      const { data: publicUrlData } = supabase.storage.from('deal-attachments').getPublicUrl(filePath);
      const downloadUrl = publicUrlData.publicUrl;

      // Save attachment metadata to database
      const { data: attachmentData, error: dbError } = await supabase
        .from('deal_attachments')
        .insert({
          deal_id: dealId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: profileData.id, // Use the fetched profile ID here
        })
        .select(`
          *,
          uploader:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
        `)
        .single();

      if (dbError) {
        // If DB insert fails, try to remove the uploaded file from storage
        await supabase.storage.from('deal-attachments').remove([filePath]);
        throw dbError;
      }

      const newAttachment: DealAttachment = {
        ...(attachmentData as DealAttachment),
        download_url: downloadUrl,
      };

      // Update the specific deal in the deals state with the new attachment
      setDeals(prevDeals => prevDeals.map(deal => 
        deal.id === dealId 
          ? { ...deal, attachments: [...(deal.attachments || []), newAttachment] }
          : deal
      ));
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] }); // Invalidate the specific deal query
      toast({
        title: "File uploaded",
        description: `${file.name} has been attached successfully.`,
      });
      return newAttachment;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error uploading file",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDealAttachment = async (attachmentId: string, dealId: string, filePath: string) => {
    try {
      console.log("Attempting to delete attachment:", { attachmentId, dealId, filePath });

      // Delete from Supabase Storage
      console.log("Deleting from storage:", filePath);
      const { error: storageError } = await supabase.storage
        .from('deal-attachments')
        .remove([filePath]);

      if (storageError) {
        console.error("Storage deletion error:", storageError);
        throw storageError;
      }
      console.log("Storage deletion successful.");

      // Delete metadata from database
      console.log("Deleting from database:", attachmentId);
      const { error: dbError } = await supabase
        .from('deal_attachments')
        .delete()
        .eq('id', attachmentId);

      if (dbError) {
        console.error("Database deletion error:", dbError);
        throw dbError;
      }
      console.log("Database deletion successful.");

      // Update the specific deal in the deals state by removing the attachment
      setDeals(prevDeals => prevDeals.map(deal => 
        deal.id === dealId 
          ? { 
              ...deal, 
              attachments: (deal.attachments || []).filter(att => att.id !== attachmentId)
            }
          : deal
      ));
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] }); // Invalidate the specific deal query
      toast({
        title: "File deleted",
        description: "Attachment has been removed successfully.",
      });
    } catch (error: any) {
      console.error("Caught error in deleteDealAttachment:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error deleting file",
        description: errorMessage,
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
    createDealNote,
    updateDealNote,
    deleteDealNote,
    uploadDealAttachment,
    deleteDealAttachment,
    getFullName,
  };
}