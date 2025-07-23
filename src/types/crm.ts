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

export interface DealAttachment { // New interface for deal attachments
  id: string;
  deal_id: string;
  file_name: string;
  file_url: string;
  attachment_type: 'contract' | 'receipt' | 'other'; // Added 'other' for flexibility
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
  due_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  parent_task_id?: string | null; // For sub-tasks
  order_index?: number; // For drag-and-drop ordering
  assigned_user?: Profile;
  related_contact?: Contact;
  related_deal?: Deal;
  notes?: TaskNote[]; // Added notes array for tasks
  sub_tasks?: Task[]; // For nesting in the UI
}

export interface KanbanItemActivity {
  id: string;
  item_id: string;
  user_id: string;
  activity_type: 'created' | 'updated' | 'moved';
  details: {
    title?: string;
    field?: string;
    old?: any;
    new?: any;
    from?: string;
    to?: string;
  };
  created_at: string;
  user?: Profile;
}

export interface KanbanItem {
  id: string;
  column_id: string;
  title: string;
  description?: string;
  order_index: number;
  created_by?: string;
  created_at: string;
  creator?: Profile;
  assigned_to?: string;
  assigned_user?: Profile;
  
  // New and updated fields
  lead_type?: 'Tenant Lead Contact' | 'Property Lead Contact';
  client_type?: 'insurance' | 'corporate' | 'individual';
  status?: 'New' | 'In Progress' | 'Closed';
  property_match?: string;
  property_criteria?: string;
  client_contact_info?: string;
  family_makeup?: string;
  pets_info?: string;
  beds_baths_needed?: string;
  preferred_location?: string;
  move_in_date?: string;
  housing_partner_contact_info?: string;
  property_address?: string;
  property_beds_baths_sqft?: string;
  mtr_approved?: boolean;
  activity?: KanbanItemActivity[];
}

export interface KanbanColumn {
  id: string;
  board_id: string;
  name: string;
  order_index: number;
  created_at: string;
  items?: KanbanItem[]; // Nested items
}

export interface KanbanBoard {
  id: string;
  name: string;
  created_by?: string;
  created_at: string;
  columns?: KanbanColumn[]; // Nested columns
  creator?: Profile; // To store the profile of the board creator
}

export interface Notification {
  id: string;
  user_id: string;
  task_id?: string;
  kanban_item_id?: string; // Added kanban_item_id
  message: string;
  is_read: boolean;
  created_at: string;
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