export interface Profile {
  id: string;
  first_name: string; // Changed from full_name
  last_name: string;  // Added
  email: string;
  avatar_url?: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  deals?: Deal[]; // Added related deals
  tasks?: Task[]; // Added related tasks
}

export interface DealNote {
  id: string;
  deal_id: string;
  note_type: 'business' | 'development'; // Changed 'tech' to 'development'
  content: string;
  created_at: string;
  created_by?: string;
  creator?: Profile; // To store the profile of the note creator
}

export interface TaskNote { // New interface for task notes
  id: string;
  task_id: string;
  content: string;
  created_at: string;
  created_by?: string;
  creator?: Profile; // To store the profile of the note creator
}

export interface KanbanItemNote { // New interface for Kanban item notes
  id: string;
  kanban_item_id: string;
  content: string;
  created_at: string;
  created_by?: string;
  creator?: Profile; // To store the profile of the note creator
}

export interface KanbanItemAttachment {
  id: string;
  kanban_item_id: string;
  file_name: string;
  file_url: string;
  attachment_type: 'image' | 'document' | 'other';
  uploaded_by?: string;
  created_at: string;
  uploader?: Profile;
}

export interface DealAttachment { // New interface for deal attachments
  id: string;
  deal_id: string;
  file_name: string;
  file_url: string;
  attachment_type: 'image' | 'document' | 'other';
  uploaded_by?: string;
  created_at: string;
  uploader?: Profile; // To store the profile of the uploader
}

export interface Deal {
  id: string;
  title: string;
  description?: string;
  value: number;
  stage: 'lead' | 'in_development' | 'demo' | 'discovery_call' | 'paid' | 'completed' | 'cancelled'; // Updated 'proposal' to 'demo' and 'done_completed' to 'completed'
  tier?: string; // Added tier
  contact_id?: string;
  assigned_to?: string;
  expected_close_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  assigned_user?: Profile;
  notes?: DealNote[]; // Added notes array
  tasks?: Task[]; // Added tasks array
  attachments?: DealAttachment[]; // Added attachments array
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  related_contact_id?: string;
  related_deal_id?: string;
  related_kanban_item_id?: string; // New: Added related_kanban_item_id
  due_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  assigned_user?: Profile;
  related_contact?: Contact;
  related_deal?: Deal;
  related_kanban_item?: KanbanItem; // New: To store the related Kanban item
  notes?: TaskNote[]; // Added notes array for tasks
}

export interface KanbanItem {
  id: string;
  column_id: string;
  title: string;
  description?: string;
  order_index: number;
  created_by?: string;
  created_at: string;
  creator?: Profile; // To store the profile of the item creator
  category?: string; // Changed to string to allow custom categories
  priority_level?: 'p0' | 'p1' | 'p2' | 'p3'; // New: Priority level
  assigned_to?: string; // New: Assigned user ID
  assigned_user?: Profile; // New: Assigned user profile
  due_date?: string; // New: Due date for the item
  event_time?: string | null;
  column?: { name: string; board_id: string }; // Added column name for display
  notes?: KanbanItemNote[]; // New: Added notes array for Kanban items
  tasks?: Task[]; // New: Added tasks array for Kanban items
  attachments?: KanbanItemAttachment[]; // New: Added attachments array
  // Tenant Info
  client_category?: string;
  tenant_contact_full_name?: string;
  tenant_contact_phone?: string;
  tenant_contact_email?: string;
  household_composition?: string;
  pets_info?: string;
  bedrooms_needed?: number;
  bathrooms_needed?: number;
  preferred_locations?: string;
  desired_move_in_date?: string;
  // Housing Lead Info
  property_manager_name?: string;
  property_contact_phone?: string;
  property_contact_email?: string;
  property_full_address?: string;
  property_bedrooms?: number;
  property_bathrooms?: number;
  property_sq_ft?: number;
  property_mtr_approved?: boolean;
  // Project Info
  status?: 'Backlog' | 'To Do' | 'In Progress' | 'In Review' | 'Done';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  pr_link?: string | null;
}

export interface KanbanColumn {
  id: string;
  board_id: string;
  name: string;
  order_index: number;
  created_at: string;
  items?: KanbanItem[]; // Nested items
  background_color?: string | null;
}

export interface KanbanBoard {
  id: string;
  name: string;
  created_by?: string;
  created_at: string;
  columns?: KanbanColumn[]; // Nested columns
  creator?: Profile; // To store the profile of the board creator
  background_color?: string; // New: Background color for the board card
}

export interface Notification {
  id: string;
  user_id: string;
  task_id?: string;
  kanban_item_id?: string;
  message: string;
  is_read: boolean;
  created_at: string;
  kanban_items?: {
    kanban_columns?: {
      board_id: string;
    } | null;
  } | null;
}

interface ChangeMetric {
  value: number;
  trend: "up" | "down";
}

export interface DashboardStats {
  totalRevenue: number;
  paidDealsValue: number;
  completedDealsValue: number; // Renamed from doneCompletedDealsValue
  cancelledDealsValue: number;
  pipelineValue: number;
  totalContacts: number;
  completedTasks: number;
  overdueTasks: number;
  totalTasks: number;
  totalOneOffProjects: number;
  totalSystemDevelopment: number;
  
  // New fields for month-over-month changes
  paidDealsValueChange?: ChangeMetric;
  pipelineValueChange?: ChangeMetric;
  totalContactsChange?: ChangeMetric;
  pendingTasksChange?: ChangeMetric;
}

export interface DataHygieneInsights {
  missingFields: string[];
  suggestions: string[];
  dealBreakerWarning: boolean;
}