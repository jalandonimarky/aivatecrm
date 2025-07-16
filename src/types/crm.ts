export interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
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
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  title: string;
  description?: string;
  value: number;
  stage: string;
  contact_id?: string;
  assigned_to?: string;
  expected_close_date?: string;
  created_at: string;
  updated_at: string;
  tier?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to?: string;
  related_contact_id?: string;
  related_deal_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  task_id?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface DataHygieneInsights {
  missingFields: string[];
  suggestions: string[];
  dealBreakerWarning: boolean;
}