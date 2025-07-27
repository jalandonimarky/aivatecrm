export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_attachments: {
        Row: {
          id: string
          deal_id: string
          file_name: string
          file_url: string
          attachment_type: string
          uploaded_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          deal_id: string
          file_name: string
          file_url: string
          attachment_type: string
          uploaded_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          deal_id?: string
          file_name?: string
          file_url?: string
          attachment_type?: string
          uploaded_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_attachments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_notes: {
        Row: {
          id: string
          deal_id: string
          note_type: string
          content: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          deal_id: string
          note_type: string
          content: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          deal_id?: string
          note_type?: string
          content?: string
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          assigned_to: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          stage: string
          title: string
          updated_at: string
          value: number
          tier: string | null
        }
        Insert: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          stage?: string
          title: string
          updated_at?: string
          value?: number
          tier?: string | null
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          stage?: string
          title?: string
          updated_at?: string
          value?: number
          tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_boards: {
        Row: {
          id: string
          name: string
          created_by: string | null
          created_at: string
          background_color: string | null // Added background_color
        }
        Insert: {
          id?: string
          name: string
          created_by?: string | null
          created_at?: string
          background_color?: string | null // Added background_color
        }
        Update: {
          id?: string
          name?: string
          created_by?: string | null
          created_at?: string
          background_color?: string | null // Added background_color
        }
        Relationships: [
          {
            foreignKeyName: "kanban_boards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_columns: {
        Row: {
          id: string
          board_id: string
          name: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          board_id: string
          name: string
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          name?: string
          order_index?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_columns_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "kanban_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_items: {
        Row: {
          id: string
          column_id: string
          title: string
          description: string | null
          order_index: number
          created_by: string | null
          created_at: string
          assigned_to: string | null
          due_date: string | null
          event_time: string | null
          category: string | null
          priority_level: string | null
          client_category: string | null
          tenant_contact_full_name: string | null
          tenant_contact_phone: string | null
          tenant_contact_email: string | null
          household_composition: string | null
          pets_info: string | null
          bedrooms_needed: number | null
          bathrooms_needed: number | null
          preferred_locations: string | null
          desired_move_in_date: string | null
          lead_type: string | null
        }
        Insert: {
          id?: string
          column_id: string
          title: string
          description?: string | null
          order_index: number
          created_by?: string | null
          created_at?: string
          assigned_to?: string | null
          due_date?: string | null
          event_time?: string | null
          category?: string | null
          priority_level?: string | null
          client_category?: string | null
          tenant_contact_full_name?: string | null
          tenant_contact_phone?: string | null
          tenant_contact_email?: string | null
          household_composition?: string | null
          pets_info?: string | null
          bedrooms_needed?: number | null
          bathrooms_needed?: number | null
          preferred_locations?: string | null
          desired_move_in_date?: string | null
          lead_type?: string | null
        }
        Update: {
          id?: string
          column_id?: string
          title?: string
          description?: string | null
          order_index?: number
          created_by?: string | null
          created_at?: string
          assigned_to?: string | null
          due_date?: string | null
          event_time?: string | null
          category?: string | null
          priority_level?: string | null
          client_category?: string | null
          tenant_contact_full_name?: string | null
          tenant_contact_phone?: string | null
          tenant_contact_email?: string | null
          household_composition?: string | null
          pets_info?: string | null
          bedrooms_needed?: number | null
          bathrooms_needed?: number | null
          preferred_locations?: string | null
          desired_move_in_date?: string | null
          lead_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_items_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "kanban_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_item_attachments: {
        Row: {
          id: string
          kanban_item_id: string
          file_name: string
          file_url: string
          attachment_type: string
          uploaded_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          kanban_item_id: string
          file_name: string
          file_url: string
          attachment_type: string
          uploaded_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          kanban_item_id?: string
          file_name?: string
          file_url?: string
          attachment_type?: string
          uploaded_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_item_attachments_kanban_item_id_fkey"
            columns: ["kanban_item_id"]
            isOneToOne: false
            referencedRelation: "kanban_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_item_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_item_notes: {
        Row: {
          id: string
          kanban_item_id: string
          content: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          kanban_item_id: string
          content: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          kanban_item_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_item_notes_kanban_item_id_fkey"
            columns: ["kanban_item_id"]
            isOneToOne: false
            referencedRelation: "kanban_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_item_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          kanban_item_id: string | null
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string | null
          kanban_item_id?: string | null
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string | null
          kanban_item_id?: string | null
          message?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_kanban_item_id_fkey"
            columns: ["kanban_item_id"]
            isOneToOne: false
            referencedRelation: "kanban_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          last_name: string | null
          id: string
          role: string
          updated_at: string
          country_region: string | null // Added country_region
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          country_region?: string | null // Added country_region
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          country_region?: string | null // Added country_region
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_notes: {
        Row: {
          id: string
          task_id: string
          content: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          task_id: string
          content: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_notes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          related_contact_id: string | null
          related_deal_id: string | null
          related_kanban_item_id: string | null
          status: string
          title: string
          updated_at: string
          pr_link: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          related_contact_id?: string | null
          related_deal_id?: string | null
          related_kanban_item_id?: string | null
          status?: string
          title: string
          updated_at?: string
          pr_link?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          related_contact_id?: string | null
          related_deal_id?: string | null
          related_kanban_item_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          pr_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_contact_id_fkey"
            columns: ["related_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_deal_id_fkey"
            columns: ["related_deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_kanban_item_id_fkey"
            columns: ["related_kanban_item_id"]
            isOneToOne: false
            referencedRelation: "kanban_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
  }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const;