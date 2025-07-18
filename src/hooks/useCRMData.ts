import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Contact, Deal, Task, Profile, DashboardStats, DealNote, TaskNote } from "@/types/crm";
import { startOfMonth, subMonths, isWithinInterval, parseISO, endOfMonth } from "date-fns";

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

  // Helper to get or create a user profile ID, ensuring one always exists for the logged-in user.
  const getOrCreateUserProfileId = async (): Promise<string> => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not authenticated.");

    let { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    // If profile doesn't exist, create it now.
    if (!profileData) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || 'New',
          last_name: user.user_metadata?.last_name || 'User',
        })
        .select('id')
        .single();
      
      if (createError) throw createError;
      profileData = newProfile;
      toast({ title: "Profile created", description: "Your user profile was automatically created." });
      await fetchData(); // Refresh data after creating profile
    }

    if (!profileData || !profileData.id) throw new Error("User profile could not be found or created.");
    
    return profileData.id;
  };

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

      // Fetch contacts with related deals and tasks
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select(`
          *,
          deals:deals(id, title, value, stage, expected_close_date, created_at, updated_at),
          tasks:tasks(id, title, status, priority, due_date, created_at, updated_at)
        `)
        .order("created_at", { ascending: false });

      if (contactsError) throw contactsError;
      setContacts((contactsData || []) as any as Contact[]);

      // Fetch deals with related data, notes
      const { data: dealsData, error: dealsError } = await supabase
        .from("deals")
        .select(`
          *,
          contact:contacts(id, name, email, company, created_at, updated_at),
          assigned_user:profiles!deals_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          notes:deal_notes(id, deal_id, note_type, content, created_at, created_by, creator:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at)),
          tasks:tasks(id, title, description, status, priority, assigned_to, related_contact_id, related_deal_id, due_date, created_by, created_at, updated_at, assigned_user:profiles!tasks_assigned_to_fkey(id, user_id, first_name, last_name, email), related_contact:contacts(id, name), related_deal:deals(id, title, value, stage, created_at, updated_at))
        `)
        .order("created_at", { ascending: false });

      if (dealsError) throw dealsError;
      setDeals((dealsData || []) as any as Deal[]);

      // Fetch tasks with related data and notes
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          related_contact:contacts(id, name, email, company, created_at, updated_at),
          related_deal:deals(id, title, value, stage, created_at, updated_at),
          notes:task_notes(id, task_id, content, created_at, created_by, creator:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at))
        `)
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;
      setTasks((tasksData || []) as any as Task[]);

      // Calculate stats
      calculateStats((dealsData || []) as any as Deal[], (tasksData || []) as any as Task[], (contactsData || []) as any as Contact[]);
      
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
    const paidDealsCurrent = dealsData.filter(deal => deal.stage === 'paid'); // Changed to all deals, not just current month
    const completedDealsCurrent = dealsData.filter(deal => deal.stage === 'completed'); // Changed to all deals
    const cancelledDealsCurrent = dealsData.filter(deal => deal.stage === 'cancelled'); // Changed to all deals
    const pipelineDealsCurrent = dealsData.filter(deal => !['paid', 'completed', 'cancelled'].includes(deal.stage)); // Changed to all deals
    const completedTasksCurrent = tasksData.filter(task => task.status === 'completed'); // Changed to all tasks
    const overdueTasksCurrent = tasksData.filter(task => 
      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
    ); // Changed to all tasks
    const pendingTasksCurrentCount = tasksData.length - completedTasksCurrent.length; // Changed to all tasks

    const oneOffProjectsCurrent = dealsData.filter(deal => deal.tier?.startsWith('1-OFF Projects')); // Changed to all deals
    const systemDevelopmentCurrent = dealsData.filter(deal => deal.tier?.startsWith('System Development')); // Changed to all deals

    // Previous month calculations for change metrics
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
  const createContact = async (contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'deals' | 'tasks'>) => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .insert([contactData])
        .select(`
          *,
          deals:deals(id, title, value, stage, expected_close_date, created_at, updated_at),
          tasks:tasks(id, title, status, priority, due_date, created_at, updated_at)
        `)
        .single();

      if (error) throw error;
      
      toast({
        title: "Contact created",
        description: "New contact has been added successfully.",
      });
      await fetchData(); // Re-fetch all data
      return data as any as Contact;
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

  const updateContact = async (id: string, updates: Partial<Omit<Contact, 'deals' | 'tasks'>>) => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          deals:deals(id, title, value, stage, expected_close_date, created_at, updated_at),
          tasks:tasks(id, title, status, priority, due_date, created_at, updated_at)
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Contact updated",
        description: "Contact has been updated successfully.",
      });
      await fetchData(); // Re-fetch all data
      return data as any as Contact;
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

      toast({
        title: "Contact deleted",
        description: "Contact has been removed successfully.",
      });
      await fetchData(); // Re-fetch all data
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
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
  const createDeal = async (dealData: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'contact' | 'assigned_user' | 'notes' | 'tasks'>) => {
    try {
      const { data, error } = await supabase
        .from("deals")
        .insert([dealData])
        .select(`
          *,
          contact:contacts(id, name, email, company, created_at, updated_at),
          assigned_user:profiles!deals_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          notes:deal_notes(id, deal_id, note_type, content, created_at, created_by, creator:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at)),
          tasks:tasks(id, title, description, status, priority, assigned_to, related_contact_id, related_deal_id, due_date, created_by, created_at, updated_at, assigned_user:profiles!tasks_assigned_to_fkey(id, user_id, first_name, last_name, email), related_contact:contacts(id, name), related_deal:deals(id, title, value, stage, created_at, updated_at))
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Deal created",
        description: "New deal has been added successfully.",
      });
      await fetchData(); // Re-fetch all data
      return data as any as Deal;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
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

  const updateDeal = async (id: string, updates: Partial<Omit<Deal, 'contact' | 'assigned_user' | 'notes' | 'tasks'>>) => {
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
          tasks:tasks(id, title, description, status, priority, assigned_to, related_contact_id, related_deal_id, due_date, created_by, created_at, updated_at, assigned_user:profiles!tasks_assigned_to_fkey(id, user_id, first_name, last_name, email), related_contact:contacts(id, name), related_deal:deals(id, title, value, stage, created_at, updated_at))
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Deal updated",
        description: "Deal has been updated successfully.",
      });
      await fetchData(); // Re-fetch all data
      return data as any as Deal;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
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
      const { error } = await supabase
        .from("deals")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Deal deleted",
        description: "Deal has been removed successfully.",
      });
      await fetchData(); // Re-fetch all data
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
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
  const createTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'assigned_user' | 'related_contact' | 'related_deal' | 'notes'>) => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([taskData])
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          related_contact:contacts(id, name, email, company, created_at, updated_at),
          related_deal:deals(id, title, value, stage, created_at, updated_at),
          notes:task_notes(id, task_id, content, created_at, created_by, creator:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at))
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Task created",
        description: "New task has been added successfully.",
      });
      await fetchData(); // Re-fetch all data
      return data as any as Task;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
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

  const updateTask = async (id: string, updates: Partial<Omit<Task, 'assigned_user' | 'related_contact' | 'related_deal' | 'notes'>>) => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          related_contact:contacts(id, name, email, company, created_at, updated_at),
          related_deal:deals(id, title, value, stage, created_at, updated_at),
          notes:task_notes(id, task_id, content, created_at, created_by, creator:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at))
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Task updated",
        description: "Task has been updated successfully.",
      });
      await fetchData(); // Re-fetch all data
      return data as any as Task;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
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
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Task deleted",
        description: "Task has been removed successfully.",
      });
      await fetchData(); // Re-fetch all data
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
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
      const creatorProfileId = await getOrCreateUserProfileId();

      const { data, error } = await supabase
        .from("deal_notes")
        .insert([{ deal_id: dealId, note_type: noteType, content, created_by: creatorProfileId }])
        .select(`
          *,
          creator:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Note added",
        description: "Your note has been added successfully.",
      });
      await fetchData(); // Re-fetch all data
      return data as any as DealNote;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
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

      toast({
        title: "Note updated",
        description: "Your note has been updated successfully.",
      });
      await fetchData(); // Re-fetch all data
      return data as any as DealNote;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
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

      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully.",
      });
      await fetchData(); // Re-fetch all data
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
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

  // CRUD operations for task notes
  const createTaskNote = async (taskId: string, content: string) => {
    try {
      const creatorProfileId = await getOrCreateUserProfileId();

      const { data, error } = await supabase
        .from("task_notes" as any)
        .insert([{ task_id: taskId, content, created_by: creatorProfileId }])
        .select(`
          *,
          creator:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Task note added",
        description: "Your task note has been added successfully.",
      });
      await fetchData(); // Re-fetch all data
      return data as any as TaskNote;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error adding task note",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTaskNote = async (noteId: string, taskId: string, updates: Partial<Omit<TaskNote, 'id' | 'task_id' | 'created_at' | 'created_by' | 'creator'>>) => {
    try {
      const { data, error } = await supabase
        .from("task_notes" as any)
        .update(updates)
        .eq("id", noteId)
        .select(`
          *,
          creator:profiles(id, user_id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Task note updated",
        description: "Your task note has been updated successfully.",
      });
      await fetchData(); // Re-fetch all data
      return data as any as TaskNote;
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error updating task note",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTaskNote = async (noteId: string, taskId: string) => {
    try {
      const { error } = await supabase
        .from("task_notes" as any)
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      toast({
        title: "Task note deleted",
        description: "Your task note has been deleted successfully.",
      });
      await fetchData(); // Re-fetch all data
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error deleting task note",
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
    createTaskNote, // Export new task note functions
    updateTaskNote,
    deleteTaskNote,
    getFullName,
  };
}