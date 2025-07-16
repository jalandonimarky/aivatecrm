export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  role: string;
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
}

export interface DealNote {
  id: string;
  deal_id: string;
  note_type: 'business' | 'development';
  content: string;
  created_at: string;
  created_by?: string;
  creator?: Profile;
}

export interface Deal {
  id: string;
  title: string;
  description?: string;
  value: number;
  stage: 'lead' | 'in_development' | 'demo' | 'discovery_call' | 'paid' | 'completed' | 'cancelled';
  tier?: string;
  contact_id?: string;
  assigned_to?: string;
  expected_close_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  assigned_user?: Profile;
  notes?: DealNote[];
  tasks?: Task[];
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
  assigned_user?: Profile;
  related_contact?: Contact;
  related_deal?: Deal;
}

export interface Notification {
  id: string;
  user_id: string;
  task_id?: string;
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
  completedDealsValue: number;
  cancelledDealsValue: number;
  pipelineValue: number;
  totalContacts: number;
  completedTasks: number;
  overdueTasks: number;
  totalTasks: number;
  totalOneOffProjects: number;
  totalSystemDevelopment: number;
  
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