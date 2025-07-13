export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
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
}

export interface Deal {
  id: string;
  title: string;
  description?: string;
  value: number;
  stage: 'prospect' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  contact_id?: string;
  assigned_to?: string;
  expected_close_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  assigned_user?: Profile;
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

export interface DashboardStats {
  totalRevenue: number;
  wonDeals: number;
  lostDeals: number;
  pipelineValue: number;
  totalContacts: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}