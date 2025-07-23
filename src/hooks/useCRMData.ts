import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Contact, Deal, Task, Profile, DashboardStats, DealNote, TaskNote, DealAttachment, KanbanBoard, KanbanColumn, KanbanItem, Project, ProjectTask, ProjectSubtask, ProjectTaskComment, ProjectTaskDependency } from "@/types/crm";
import { format, startOfMonth, subMonths, isWithinInterval, parseISO, endOfMonth } from "date-fns";

export function useCRMData() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [kanbanBoards, setKanbanBoards] = useState<KanbanBoard[]>([]);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([]);
  const [kanbanItems, setKanbanItems] = useState<KanbanItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
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

    // With the new schema, profiles.id is directly auth.users.id
    // So, we just need to ensure a profile entry exists for the current user.
    let { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id) // Check by profiles.id (which is user.id)
      .maybeSingle();

    if (!profileData) {
      // This block should ideally not be hit if the trigger works.
      // If it is, it means the trigger failed or the profile was manually deleted.
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id, // Insert user.id directly into profiles.id
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
    
    return profileData.id; // This is the profiles.id (PK), which is what created_by should reference.
  };

  // Helper to combine first and last name for display
  const getFullName = (profile: Profile) => `${profile.first_name} ${profile.last_name}`;

  // Helper to filter out non-column properties for KanbanItem upsert
  const getKanbanItemDbPayload = (item: KanbanItem) => {
    const { creator, assigned_user, ...dbPayload } = item;
    return dbPayload;
  };

  // Helper to filter out non-column properties for KanbanColumn upsert
  const getKanbanColumnDbPayload = (column: KanbanColumn) => {
    const { items, ...dbPayload } = column; // Destructure 'items'
    return dbPayload;
  };

  // Helper to filter out non-column properties for ProjectTask upsert
  const getProjectTaskDbPayload = (task: ProjectTask) => {
    const { assignee, subtasks, comments, dependencies, is_blocked, ...dbPayload } = task;
    return dbPayload;
  };

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
        .select("id, first_name, last_name, email, avatar_url, role, created_at, updated_at")
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

      // Fetch deals with related data, notes, and attachments
      const { data: dealsData, error: dealsError } = await supabase
        .from("deals")
        .select(`
          *,
          contact:contacts(id, name, email, company, created_at, updated_at),
          assigned_user:profiles!deals_assigned_to_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          notes:deal_notes(id, deal_id, note_type, content, created_at, created_by, creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)),
          tasks:tasks(id, title, description, status, priority, assigned_to, related_contact_id, related_deal_id, due_date, created_by, created_at, updated_at, assigned_user:profiles!tasks_assigned_to_fkey(id, first_name, last_name, email), related_contact:contacts(id, name), related_deal:deals(id, title, value, stage, created_at, updated_at)),
          attachments:deal_attachments(id, deal_id, file_name, file_url, attachment_type, uploaded_by, created_at, uploader:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at))
        `)
        .order("created_at", { ascending: false });

      if (dealsError) throw dealsError;
      setDeals((dealsData || []) as any as Deal[]);

      // Fetch tasks with related data and notes
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          related_contact:contacts(id, name, email, company, created_at, updated_at),
          related_deal:deals(id, title, value, stage, created_at, updated_at),
          notes:task_notes(id, task_id, content, created_at, created_by, creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at))
        `)
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;
      setTasks((tasksData || []) as any as Task[]);

      // Fetch Kanban Boards with nested columns and items
      const { data: boardsData, error: boardsError } = await supabase
        .from("kanban_boards")
        .select(`
          *,
          creator:profiles!kanban_boards_created_by_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          columns:kanban_columns(
            *,
            items:kanban_items(
              *,
              creator:profiles!kanban_items_created_by_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
              assigned_user:profiles!kanban_items_assigned_to_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
            )
          )
        `)
        .order("created_at", { ascending: false })
        .order("order_index", { foreignTable: "columns", ascending: true })
        .order("order_index", { foreignTable: "columns.items", ascending: true });

      if (boardsError) throw boardsError;
      // Explicitly cast nested profiles to ensure correct type for 'role'
      const typedBoardsData = (boardsData || []).map(board => ({
        ...board,
        creator: board.creator ? (board.creator as Profile) : null,
        columns: (board.columns || []).map(column => ({
          ...column,
          items: (column.items || []).map(item => ({
            ...item,
            creator: item.creator ? (item.creator as Profile) : null,
            assigned_user: item.assigned_user ? (item.assigned_user as Profile) : null, // Cast assigned_user
          })),
        })),
      })) as KanbanBoard[];
      setKanbanBoards(typedBoardsData);

      // Extract all columns and items for flat state if needed elsewhere, or just use nested structure
      const allColumns: KanbanColumn[] = [];
      const allItems: KanbanItem[] = [];
      typedBoardsData.forEach(board => { // Use typedBoardsData here
        (board.columns || []).forEach(column => {
          allColumns.push(column);
          (column.items || []).forEach(item => {
            allItems.push(item);
          });
        });
      });
      setKanbanColumns(allColumns);
      setKanbanItems(allItems);

      // Fetch Projects with nested tasks, assignees, subtasks, and comments
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select(`
          *,
          tasks:project_tasks(
            *,
            assignee:profiles!project_tasks_assignee_id_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
            subtasks:project_subtasks(*, assignee:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)),
            comments:project_task_comments(*, creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)),
            dependencies:project_task_dependencies(task_id, depends_on_task_id, dependent_task:project_tasks!depends_on_task_id(id, title, status))
          )
        `)
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;
      
      // Process projects to determine 'is_blocked' status
      const processedProjects = (projectsData || []).map(project => ({
        ...project,
        tasks: (project.tasks || []).map(task => {
          const isBlocked = (task.dependencies || []).some(dep => 
            dep.dependent_task?.status !== 'Completed'
          );
          return { ...task, is_blocked: isBlocked };
        }),
      })) as Project[];

      setProjects(processedProjects);


      // Calculate stats
      calculateStats((dealsData || []) as any as Deal[], (tasksData || []) as any as Task[], (contactsData || []) as any as Contact[]);
      
    } catch (error: any) {
      console.error("Error fetching CRM data:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
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
      console.error("Error creating contact:", error); // Added console.error
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
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
      console.error("Error updating contact:", error); // Added console.error
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
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
      console.error("Error deleting contact:", error); // Added console.error
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
  const createDeal = async (dealData: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'contact' | 'assigned_user' | 'notes' | 'tasks' | 'attachments'>) => {
    try {
      const { data, error } = await supabase
        .from("deals")
        .insert([dealData])
        .select(`
          *,
          contact:contacts(id, name, email, company, created_at, updated_at),
          assigned_user:profiles!deals_assigned_to_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          notes:deal_notes(id, deal_id, note_type, content, created_at, created_by, creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)),
          tasks:tasks(id, title, description, status, priority, assigned_to, related_contact_id, related_deal_id, due_date, created_by, created_at, updated_at, assigned_user:profiles!tasks_assigned_to_fkey(id, first_name, last_name, email), related_contact:contacts(id, name), related_deal:deals(id, title, value, stage, created_at, updated_at)),
          attachments:deal_attachments(id, deal_id, file_name, file_url, attachment_type, uploaded_by, created_at, uploader:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at))
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
      console.error("Error creating deal:", error); // Added console.error
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

  const updateDeal = async (id: string, updates: Partial<Omit<Deal, 'contact' | 'assigned_user' | 'notes' | 'tasks' | 'attachments'>>) => {
    try {
      const { data, error } = await supabase
        .from("deals")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          contact:contacts(id, name, email, company, created_at, updated_at),
          assigned_user:profiles!deals_assigned_to_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          notes:deal_notes(id, deal_id, note_type, content, created_at, created_by, creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)),
          tasks:tasks(id, title, description, status, priority, assigned_to, related_contact_id, related_deal_id, due_date, created_by, created_at, updated_at, assigned_user:profiles!tasks_assigned_to_fkey(id, first_name, last_name, email), related_contact:contacts(id, name), related_deal:deals(id, title, value, stage, created_at, updated_at)),
          attachments:deal_attachments(id, deal_id, file_name, file_url, attachment_type, uploaded_by, created_at, uploader:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at))
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
      console.error("Error updating deal:", error); // Added console.error
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
      console.error("Error deleting deal:", error); // Added console.error
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
          assigned_user:profiles!tasks_assigned_to_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          related_contact:contacts(id, name, email, company, created_at, updated_at),
          related_deal:deals(id, title, value, stage, created_at, updated_at),
          notes:task_notes(id, task_id, content, created_at, created_by, creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at))
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
      console.error("Error creating task:", error); // Added console.error
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
          assigned_user:profiles!tasks_assigned_to_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          related_contact:contacts(id, name, email, company, created_at, updated_at),
          related_deal:deals(id, title, value, stage, created_at, updated_at),
          notes:task_notes(id, task_id, content, created_at, created_by, creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at))
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
      console.error("Error updating task:", error); // Added console.error
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
      console.error("Error deleting task:", error); // Added console.error
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
          creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
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
      console.error("Error adding deal note:", error); // Added console.error
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
          creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
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
      console.error("Error updating deal note:", error); // Added console.error
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
      console.error("Error deleting deal note:", error); // Added console.error
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
        .from("task_notes" as any) // Cast to any due to Supabase types not including this table
        .insert([{ task_id: taskId, content, created_by: creatorProfileId }])
        .select(`
          *,
          creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
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
      console.error("Error adding task note:", error); // Added console.error
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
        .from("task_notes" as any) // Cast to any due to Supabase types not including this table
        .update(updates)
        .eq("id", noteId)
        .select(`
          *,
          creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
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
      console.error("Error updating task note:", error); // Added console.error
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
        .from("task_notes" as any) // Cast to any due to Supabase types not including this table
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      toast({
        title: "Task note deleted",
        description: "Your task note has been deleted successfully.",
      });
      await fetchData(); // Re-fetch all data
    } catch (error: any) {
      console.error("Error deleting task note:", error); // Added console.error
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

  // CRUD operations for deal attachments
  const createDealAttachment = async (dealId: string, file: File, attachmentType: 'contract' | 'receipt' | 'other') => {
    try {
      const uploaderProfileId = await getOrCreateUserProfileId();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
      const filePath = `${dealId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('deal-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('deal-attachments')
        .getPublicUrl(filePath);

      if (!publicUrlData || !publicUrlData.publicUrl) throw new Error("Could not get public URL for uploaded file.");

      const { data, error: insertError } = await supabase
        .from('deal_attachments')
        .insert({
          deal_id: dealId,
          file_name: file.name,
          file_url: publicUrlData.publicUrl,
          attachment_type: attachmentType,
          uploaded_by: uploaderProfileId,
        })
        .select(`
          *,
          uploader:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
        `)
        .single();

      if (insertError) throw insertError;

      toast({
        title: "Attachment uploaded",
        description: "File has been successfully attached to the deal.",
      });
      await fetchData();
      return data as any as DealAttachment;
    } catch (error: any) {
      console.error("Error uploading attachment:", error);
      toast({
        title: "Error uploading attachment",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDealAttachment = async (attachmentId: string, dealId: string, filePath: string) => {
    try {
      // First, delete the record from the database
      const { error: dbError } = await supabase
        .from('deal_attachments')
        .delete()
        .eq('id', attachmentId);

      if (dbError) throw dbError;

      // Then, delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('deal-attachments')
        .remove([filePath.split('deal-attachments/')[1]]); // Extract path relative to bucket root

      if (storageError) throw storageError;

      toast({
        title: "Attachment deleted",
        description: "File and its record have been removed successfully.",
      });
      await fetchData();
    } catch (error: any) {
      console.error("Error deleting attachment:", error);
      toast({
        title: "Error deleting attachment",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // CRUD operations for Kanban Boards
  const createKanbanBoard = async (boardData: Omit<KanbanBoard, 'id' | 'created_at' | 'columns' | 'creator'>) => {
    try {
      const creatorProfileId = await getOrCreateUserProfileId(); // This is now user.id
      const { data, error } = await supabase
        .from("kanban_boards")
        .insert([{ ...boardData, created_by: creatorProfileId }]) // Use profiles.id (which is user.id)
        .select(`
          *,
          creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
        `)
        .single();

      if (error) throw error;
      toast({ title: "Board created", description: "New Kanban board added." });
      await fetchData();
      return data as any as KanbanBoard;
    } catch (error: any) {
      console.error("Error creating Kanban board:", error);
      toast({ title: "Error creating board", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateKanbanBoard = async (id: string, updates: Partial<Omit<KanbanBoard, 'columns' | 'creator'>>) => {
    try {
      const { data, error } = await supabase
        .from("kanban_boards")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
        `)
        .single();

      if (error) throw error;
      toast({ title: "Board updated", description: "Kanban board updated successfully." });
      await fetchData();
      return data as any as KanbanBoard;
    } catch (error: any) {
      console.error("Error updating Kanban board:", error);
      toast({ title: "Error updating board", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const deleteKanbanBoard = async (id: string) => {
    try {
      const { error } = await supabase
        .from("kanban_boards")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Board deleted", description: "Kanban board removed." });
      await fetchData();
    } catch (error: any) {
      console.error("Error deleting Kanban board:", error);
      toast({ title: "Error deleting board", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  // CRUD operations for Kanban Columns
  const createKanbanColumn = async (columnData: Omit<KanbanColumn, 'id' | 'created_at' | 'items'>) => {
    try {
      const { data, error } = await supabase
        .from("kanban_columns")
        .insert([columnData])
        .select(`
          *,
          items:kanban_items(
            *,
            creator:profiles!kanban_items_created_by_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
            assigned_user:profiles!kanban_items_assigned_to_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
          )
        `)
        .single();

      if (error) throw error;
      toast({ title: "Column created", description: "New Kanban column added." });
      await fetchData();
      return data as any as KanbanColumn;
    } catch (error: any) {
      console.error("Error creating Kanban column:", error);
      toast({ title: "Error creating column", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateKanbanColumn = async (id: string, updates: Partial<Omit<KanbanColumn, 'items'>>) => {
    try {
      const { data, error } = await supabase
        .from("kanban_columns")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          items:kanban_items(
            *,
            creator:profiles!kanban_items_created_by_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
            assigned_user:profiles!kanban_items_assigned_to_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
          )
        `)
        .single();

      if (error) throw error;
      toast({ title: "Column updated", description: "Kanban column updated successfully." });
      await fetchData();
      return data as any as KanbanColumn;
    } catch (error: any) {
      console.error("Error updating Kanban column:", error);
      toast({ title: "Error updating column", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const deleteKanbanColumn = async (id: string) => {
    try {
      const { error } = await supabase
        .from("kanban_columns")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Column deleted", description: "Kanban column removed." });
      await fetchData();
    } catch (error: any) {
      console.error("Error deleting Kanban column:", error);
      toast({ title: "Error deleting column", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  // CRUD operations for Kanban Items
  const createKanbanItem = async (itemData: Omit<KanbanItem, 'id' | 'created_at' | 'creator' | 'assigned_user'>) => {
    try {
      const creatorProfileId = await getOrCreateUserProfileId(); // This is now user.id
      const { data, error } = await supabase
        .from("kanban_items")
        .insert([{ 
          ...itemData, 
          created_by: creatorProfileId,
          assigned_to: itemData.assigned_to === "unassigned" ? null : itemData.assigned_to,
          due_date: itemData.due_date ? format(new Date(itemData.due_date), "yyyy-MM-dd") : null,
        }])
        .select(`
          *,
          creator:profiles!kanban_items_created_by_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          assigned_user:profiles!kanban_items_assigned_to_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
        `)
        .single();

      if (error) throw error;
      toast({ title: "Item created", description: "New Kanban item added." });
      await fetchData();
      return data as any as KanbanItem;
    } catch (error: any) {
      console.error("Error creating Kanban item:", error);
      toast({ title: "Error creating item", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateKanbanItem = async (id: string, updates: Partial<Omit<KanbanItem, 'creator' | 'assigned_user'>>) => {
    try {
      // The form sends all fields, so we can safely convert undefined/empty to null for nullable fields.
      const dataToUpdate = {
        ...updates,
        description: updates.description || null,
        category: updates.category || null,
        priority_level: updates.priority_level || null,
        assigned_to: updates.assigned_to === "unassigned" ? null : (updates.assigned_to || null),
        due_date: updates.due_date ? format(new Date(updates.due_date), "yyyy-MM-dd") : null,
        event_time: updates.event_time || null,
      };

      const { data, error } = await supabase
        .from("kanban_items")
        .update(dataToUpdate)
        .eq("id", id)
        .select(`
          *,
          creator:profiles!kanban_items_created_by_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          assigned_user:profiles!kanban_items_assigned_to_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
        `)
        .single();

      if (error) throw error;
      toast({ title: "Item updated", description: "Kanban item updated successfully." });
      await fetchData();
      return data as any as KanbanItem;
    } catch (error: any) {
      console.error("Error updating Kanban item:", error);
      toast({ title: "Error updating item", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const deleteKanbanItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("kanban_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Item deleted", description: "Kanban item removed." });
      await fetchData();
    } catch (error: any) {
      console.error("Error deleting Kanban item:", error);
      toast({ title: "Error deleting item", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  // Reordering functions
  const reorderKanbanItemsInColumn = async (columnId: string, itemIds: string[]) => {
    try {
      // Optimistically update local state
      setKanbanBoards(prevBoards => 
        prevBoards.map(board => ({
          ...board,
          columns: board.columns?.map(col => {
            if (col.id === columnId) {
              const updatedItems = itemIds.map((itemId, index) => {
                const existingItem = col.items?.find(item => item.id === itemId);
                return existingItem ? { ...existingItem, order_index: index } : null;
              }).filter(Boolean) as KanbanItem[];
              return { ...col, items: updatedItems };
            }
            return col;
          }),
        }))
      );

      // Prepare updates for Supabase
      const updates = itemIds.map((id, index) => {
        const existingItem = kanbanItems.find(item => item.id === id);
        if (!existingItem) throw new Error(`Item with ID ${id} not found for reordering.`);
        return getKanbanItemDbPayload({
          ...existingItem, // Spread existing data to include all required fields
          order_index: index,
          column_id: columnId,
        });
      });

      const { error } = await supabase
        .from('kanban_items')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;
      toast({ title: "Items reordered", description: "Kanban items reordered successfully." });
    } catch (error: any) {
      console.error("Error reordering Kanban items within column:", error);
      toast({ title: "Error reordering items", description: error.message, variant: "destructive" });
      await fetchData(); // Fallback to full fetch on error
      throw error;
    }
  };

  const moveKanbanItem = async (
    itemId: string,
    sourceColumnId: string,
    sourceIndex: number,
    destinationColumnId: string,
    destinationIndex: number
  ) => {
    try {
      let movedItem: KanbanItem | undefined;
      let sourceItemsBeforeOptimisticUpdate: KanbanItem[] = [];
      let destinationItemsBeforeOptimisticUpdate: KanbanItem[] = [];

      // Optimistically update local state
      setKanbanBoards(prevBoards => {
        const newBoards = prevBoards.map(board => {
          const newColumns = col => {
            if (col.id === sourceColumnId) {
              sourceItemsBeforeOptimisticUpdate = [...(col.items || [])].sort((a, b) => a.order_index - b.order_index);
              const newSourceItems = Array.from(sourceItemsBeforeOptimisticUpdate);
              [movedItem] = newSourceItems.splice(sourceIndex, 1);
              
              // Recalculate order_index for source column
              const updatedSourceItems = newSourceItems.map((item, index) => ({ ...item, order_index: index }));
              return { ...col, items: updatedSourceItems };
            } else if (col.id === destinationColumnId) {
              destinationItemsBeforeOptimisticUpdate = [...(col.items || [])].sort((a, b) => a.order_index - b.order_index);
              const newDestinationItems = Array.from(destinationItemsBeforeOptimisticUpdate);
              
              // Ensure movedItem is defined before inserting. If not, find it from global state.
              const itemToInsert = movedItem || kanbanItems.find(item => item.id === itemId);
              if (!itemToInsert) throw new Error("Item not found for optimistic update.");

              newDestinationItems.splice(destinationIndex, 0, { ...itemToInsert, column_id: destinationColumnId });

              // Recalculate order_index for destination column
              const updatedDestinationItems = newDestinationItems.map((item, index) => ({ ...item, order_index: index }));
              return { ...col, items: updatedDestinationItems };
            }
            return col;
          };
          return { ...board, columns: board.columns?.map(newColumns) };
        });
        return newBoards;
      });

      // Ensure movedItem is the full object for database update
      if (!movedItem) {
        movedItem = kanbanItems.find(item => item.id === itemId);
        if (!movedItem) throw new Error("Moved item not found in state for database update.");
      }

      // Prepare updates for Supabase
      const updates: KanbanItem[] = [];

      // Update the moved item's column_id and order_index
      updates.push(getKanbanItemDbPayload({
        ...movedItem, // Include all existing properties
        column_id: destinationColumnId,
        order_index: destinationIndex,
      }));

      // Recalculate and update order_index for remaining items in source column
      const finalSourceItems = sourceItemsBeforeOptimisticUpdate.filter(item => item.id !== itemId).map((item, index) => getKanbanItemDbPayload({
        ...item, // Include all existing properties
        order_index: index,
        column_id: sourceColumnId,
      }));
      updates.push(...finalSourceItems);

      // Recalculate and update order_index for items in destination column
      const finalDestinationItems = destinationItemsBeforeOptimisticUpdate.filter(item => item.id !== itemId);
      finalDestinationItems.splice(destinationIndex, 0, movedItem); // Insert at new position
      const updatedDestinationOrder = finalDestinationItems.map((item, index) => getKanbanItemDbPayload({
        ...item, // Include all existing properties
        order_index: index,
        column_id: destinationColumnId,
      }));
      updates.push(...updatedDestinationOrder);

      // Filter out duplicates (if any, though logic should prevent most)
      const uniqueUpdatesMap = new Map<string, KanbanItem>();
      for (const update of updates) {
        uniqueUpdatesMap.set(update.id, update);
      }
      const finalUpdates = Array.from(uniqueUpdatesMap.values());

      const { error } = await supabase
        .from('kanban_items')
        .upsert(finalUpdates, { onConflict: 'id' });

      if (error) throw error;
      toast({ title: "Item moved", description: "Kanban item moved successfully." });
    } catch (error: any) {
      console.error("Error moving Kanban item:", error);
      toast({ title: "Error moving item", description: error.message, variant: "destructive" });
      await fetchData(); // Fallback to full fetch on error
      throw error;
    }
  };

  const reorderKanbanColumns = async (boardId: string, columnIds: string[]) => {
    try {
      // Optimistically update local state
      setKanbanBoards(prevBoards => 
        prevBoards.map(board => {
          if (board.id === boardId) {
            const updatedColumns = columnIds.map((colId, index) => {
              const existingColumn = board.columns?.find(col => col.id === colId);
              return existingColumn ? { ...existingColumn, order_index: index } : null;
            }).filter(Boolean) as KanbanColumn[];
            return { ...board, columns: updatedColumns };
          }
          return board;
        })
      );

      // Prepare updates for Supabase
      const updates = columnIds.map((id, index) => {
        const existingColumn = kanbanColumns.find(column => column.id === id);
        if (!existingColumn) throw new Error(`Column with ID ${id} not found for reordering.`);
        return getKanbanColumnDbPayload({ // Apply the new helper here
          ...existingColumn,
          order_index: index,
          board_id: boardId,
        });
      });

      const { error } = await supabase
        .from('kanban_columns')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;
      toast({ title: "Columns reordered", description: "Kanban columns reordered successfully." });
    } catch (error: any) {
      console.error("Error reordering Kanban columns:", error);
      toast({ title: "Error reordering columns", description: error.message, variant: "destructive" });
      await fetchData(); // Fallback to full fetch on error
      throw error;
    }
  };

  // CRUD for Projects
  const createProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'owner_id' | 'tasks'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");

      const { data, error } = await supabase
        .from("projects")
        .insert([{ ...projectData, owner_id: user.id }])
        .select('*')
        .single();

      if (error) throw error;
      toast({ title: "Project created" });
      await fetchData();
      return data as Project;
    } catch (error: any) {
      toast({ title: "Error creating project", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Omit<Project, 'id' | 'created_at' | 'owner_id' | 'tasks'>>) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select('*')
        .single();

      if (error) throw error;
      toast({ title: "Project updated" });
      await fetchData();
      return data as Project;
    } catch (error: any) {
      toast({ title: "Error updating project", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  // CRUD for Project Tasks
  const createProjectTask = async (taskData: Omit<ProjectTask, 'id' | 'created_at' | 'updated_at' | 'dependencies' | 'assignee' | 'order_index' | 'subtasks' | 'comments' | 'is_blocked'>) => {
    try {
      const { data: existingTasks, error: fetchError } = await supabase
        .from('project_tasks')
        .select('order_index')
        .eq('project_id', taskData.project_id)
        .eq('section', taskData.section)
        .order('order_index', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      const nextOrderIndex = existingTasks && existingTasks.length > 0 ? (existingTasks[0].order_index ?? -1) + 1 : 0;

      const { data, error } = await supabase
        .from("project_tasks")
        .insert([{ ...taskData, order_index: nextOrderIndex }])
        .select(`
          *,
          assignee:profiles!project_tasks_assignee_id_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          subtasks:project_subtasks(*, assignee:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)),
          comments:project_task_comments(*, creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)),
          dependencies:project_task_dependencies(task_id, depends_on_task_id, dependent_task:project_tasks!depends_on_task_id(id, title, status))
        `)
        .single();

      if (error) throw error;
      toast({ title: "Task created" });
      await fetchData();
      return data as ProjectTask;
    } catch (error: any) {
      toast({ title: "Error creating task", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateProjectTask = async (id: string, updates: Partial<Omit<ProjectTask, 'id' | 'created_at' | 'updated_at' | 'dependencies' | 'assignee' | 'subtasks' | 'comments' | 'is_blocked'>>) => {
    try {
      const { data, error } = await supabase
        .from("project_tasks")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          assignee:profiles!project_tasks_assignee_id_fkey(id, first_name, last_name, email, avatar_url, role, created_at, updated_at),
          subtasks:project_subtasks(*, assignee:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)),
          comments:project_task_comments(*, creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)),
          dependencies:project_task_dependencies(task_id, depends_on_task_id, dependent_task:project_tasks!depends_on_task_id(id, title, status))
        `)
        .single();

      if (error) throw error;
      toast({ title: "Task updated" });
      await fetchData();
      return data as ProjectTask;
    } catch (error: any) {
      toast({ title: "Error updating task", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  // CRUD for Project Subtasks
  const createProjectSubtask = async (subtaskData: Omit<ProjectSubtask, 'id' | 'created_at' | 'assignee'>) => {
    try {
      const { data, error } = await supabase
        .from("project_subtasks" as any) // Cast to any due to Supabase types not including this table
        .insert([{ 
          ...subtaskData,
          assignee_id: subtaskData.assignee_id === "unassigned" ? null : subtaskData.assignee_id,
          due_date: subtaskData.due_date ? format(new Date(subtaskData.due_date), "yyyy-MM-dd") : null,
        }])
        .select(`*, assignee:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)`)
        .single();

      if (error) throw error;
      toast({ title: "Subtask added" });
      await fetchData();
      return data as ProjectSubtask;
    } catch (error: any) {
      toast({ title: "Error adding subtask", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateProjectSubtask = async (id: string, updates: Partial<Omit<ProjectSubtask, 'id' | 'created_at' | 'assignee'>>) => {
    try {
      const dataToUpdate = {
        ...updates,
        assignee_id: updates.assignee_id === "unassigned" ? null : (updates.assignee_id || null),
        due_date: updates.due_date ? format(new Date(updates.due_date), "yyyy-MM-dd") : null,
      };

      const { data, error } = await supabase
        .from("project_subtasks" as any) // Cast to any due to Supabase types not including this table
        .update(dataToUpdate)
        .eq("id", id)
        .select(`*, assignee:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)`)
        .single();

      if (error) throw error;
      toast({ title: "Subtask updated" });
      await fetchData();
      return data as ProjectSubtask;
    } catch (error: any) {
      toast({ title: "Error updating subtask", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const deleteProjectSubtask = async (id: string) => {
    try {
      const { error } = await supabase
        .from("project_subtasks" as any) // Cast to any due to Supabase types not including this table
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Subtask deleted" });
      await fetchData();
    } catch (error: any) {
      toast({ title: "Error deleting subtask", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  // CRUD for Project Task Comments
  const createProjectTaskComment = async (commentData: Omit<ProjectTaskComment, 'id' | 'created_at' | 'creator'>) => {
    try {
      const creatorProfileId = await getOrCreateUserProfileId();
      const { data, error } = await supabase
        .from("project_task_comments" as any) // Cast to any due to Supabase types not including this table
        .insert([{ ...commentData, created_by: creatorProfileId } as any]) // Cast insert payload
        .select(`
          *,
          creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
        `)
        .single();

      if (error) throw error;
      toast({ title: "Comment added" });
      await fetchData(); // Re-fetch to update UI
      return data as ProjectTaskComment;
    } catch (error: any) {
      toast({ title: "Error adding comment", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateProjectTaskComment = async (id: string, updates: Partial<Omit<ProjectTaskComment, 'id' | 'created_at' | 'created_by' | 'creator'>>) => {
    try {
      const { data, error } = await supabase
        .from("project_task_comments" as any) // Cast to any due to Supabase types not including this table
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
        `)
        .single();

      if (error) throw error;
      toast({ title: "Comment updated" });
      await fetchData(); // Re-fetch to update UI
      return data as ProjectTaskComment;
    } catch (error: any) {
      toast({ title: "Error updating comment", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const deleteProjectTaskComment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("project_task_comments" as any) // Cast to any due to Supabase types not including this table
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Comment deleted" });
      await fetchData(); // Re-fetch to update UI
    } catch (error: any) {
      toast({ title: "Error deleting comment", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  // CRUD for Project Task Dependencies
  const createProjectTaskDependency = async (taskId: string, dependsOnTaskId: string) => {
    try {
      const { data, error } = await supabase
        .from("project_task_dependencies")
        .insert([{ task_id: taskId, depends_on_task_id: dependsOnTaskId }])
        .select(`
          *,
          dependent_task:project_tasks!depends_on_task_id(id, title, status)
        `)
        .single();

      if (error) throw error;
      toast({ title: "Dependency added", description: "Task dependency created successfully." });
      await fetchData();
      return data as ProjectTaskDependency;
    } catch (error: any) {
      toast({ title: "Error adding dependency", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const deleteProjectTaskDependency = async (taskId: string, dependsOnTaskId: string) => {
    try {
      const { error } = await supabase
        .from("project_task_dependencies")
        .delete()
        .eq("task_id", taskId)
        .eq("depends_on_task_id", dependsOnTaskId);

      if (error) throw error;
      toast({ title: "Dependency removed", description: "Task dependency removed successfully." });
      await fetchData();
    } catch (error: any) {
      toast({ title: "Error removing dependency", description: error.message, variant: "destructive" });
      throw error;
    }
  };


  // Reordering for Project Tasks
  const reorderProjectTasks = async (taskId: string, section: ProjectTask['section'], newIndex: number) => {
    try {
      const project = projects.find(p => p.tasks?.some(t => t.section === section));
      if (!project || !project.tasks) return;

      const tasksInSection = project.tasks.filter(t => t.section === section).sort((a, b) => a.order_index - b.order_index);
      const movedTask = tasksInSection.find(t => t.id === taskId);
      if (!movedTask) return;

      const remainingTasks = tasksInSection.filter(t => t.id !== taskId);
      remainingTasks.splice(newIndex, 0, movedTask);

      const updates = remainingTasks.map((task, index) => getProjectTaskDbPayload({
        ...task,
        order_index: index,
      }));

      const { error } = await supabase.from('project_tasks').upsert(updates as any[]); // Cast to any[]
      if (error) throw error;

      await fetchData();
    } catch (error: any) {
      toast({ title: "Error reordering tasks", description: error.message, variant: "destructive" });
      await fetchData();
    }
  };

  const moveProjectTask = async (taskId: string, fromSection: ProjectTask['section'], toSection: ProjectTask['section'], newIndex: number) => {
    try {
      const project = projects.find(p => p.tasks?.some(t => t.id === taskId));
      if (!project || !project.tasks) return;

      // Update the moved task's section first
      await supabase.from('project_tasks').update({ section: toSection }).eq('id', taskId);
      
      // Create a temporary updated task list for reordering calculations
      const movedTask = { ...project.tasks.find(t => t.id === taskId)!, section: toSection };
      const otherTasks = project.tasks.filter(t => t.id !== taskId);
      const updatedTaskList = [...otherTasks, movedTask];

      // Reorder source section
      const sourceTasks = updatedTaskList.filter(t => t.section === fromSection).sort((a, b) => a.order_index - b.order_index);
      const sourceUpdates = sourceTasks.map((task, index) => getProjectTaskDbPayload({ ...task, order_index: index }));
      if (sourceUpdates.length > 0) {
        const { error } = await supabase.from('project_tasks').upsert(sourceUpdates as any[]); // Cast to any[]
        if (error) throw error;
      }

      // Reorder destination section
      const destTasks = updatedTaskList.filter(t => t.section === toSection).sort((a, b) => a.order_index - b.order_index);
      const destUpdates = destTasks.map((task, index) => getProjectTaskDbPayload({ ...task, order_index: index }));
      if (destUpdates.length > 0) {
        const { error } = await supabase.from('project_tasks').upsert(destUpdates as any[]); // Cast to any[]
        if (error) throw error;
      }

      await fetchData();
    } catch (error: any) {
      toast({ title: "Error moving task", description: error.message, variant: "destructive" });
      await fetchData();
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
    kanbanBoards,
    kanbanColumns,
    kanbanItems,
    projects,
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
    createDealAttachment, // Export new deal attachment functions
    deleteDealAttachment,
    createKanbanBoard,
    updateKanbanBoard,
    deleteKanbanBoard,
    createKanbanColumn,
    updateKanbanColumn,
    deleteKanbanColumn,
    createKanbanItem,
    updateKanbanItem,
    deleteKanbanItem,
    reorderKanbanItemsInColumn, // Renamed
    moveKanbanItem, // New function
    reorderKanbanColumns,
    createProject,
    updateProject,
    createProjectTask,
    updateProjectTask,
    reorderProjectTasks,
    moveProjectTask,
    createProjectSubtask, // New
    updateProjectSubtask, // New
    deleteProjectSubtask, // New
    createProjectTaskComment, // New
    updateProjectTaskComment, // New
    deleteProjectTaskComment, // New
    createProjectTaskDependency, // New
    deleteProjectTaskDependency, // New
    getFullName,
  };
}