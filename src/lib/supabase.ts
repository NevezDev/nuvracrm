import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          company: string | null;
          position: string | null;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          position?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          company?: string | null;
          position?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          company: string | null;
          source: string;
          status: 'new' | 'contacted' | 'qualified' | 'lost';
          interest_level: 'muito_frio' | 'frio' | 'morno' | 'quente' | 'muito_quente';
          value: number | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          source: string;
          status?: 'new' | 'contacted' | 'qualified' | 'lost';
          interest_level?: 'muito_frio' | 'frio' | 'morno' | 'quente' | 'muito_quente';
          value?: number | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          company?: string | null;
          source?: string;
          status?: 'new' | 'contacted' | 'qualified' | 'lost';
          interest_level?: 'muito_frio' | 'frio' | 'morno' | 'quente' | 'muito_quente';
          value?: number | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      deals: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          value: number;
          status: 'prospecting' | 'negotiation' | 'closed_won' | 'closed_lost';
          contact_id: string;
          expected_close_date: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          value: number;
          status?: 'prospecting' | 'negotiation' | 'closed_won' | 'closed_lost';
          contact_id: string;
          expected_close_date?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          value?: number;
          status?: 'prospecting' | 'negotiation' | 'closed_won' | 'closed_lost';
          contact_id?: string;
          expected_close_date?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          type: 'call' | 'email' | 'meeting' | 'task';
          status: 'pending' | 'completed' | 'cancelled';
          due_date: string | null;
          contact_id: string | null;
          deal_id: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          type: 'call' | 'email' | 'meeting' | 'task';
          status?: 'pending' | 'completed' | 'cancelled';
          due_date?: string | null;
          contact_id?: string | null;
          deal_id?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          type?: 'call' | 'email' | 'meeting' | 'task';
          status?: 'pending' | 'completed' | 'cancelled';
          due_date?: string | null;
          contact_id?: string | null;
          deal_id?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          theme: 'light' | 'dark';
          notifications: boolean;
          language: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: 'light' | 'dark';
          notifications?: boolean;
          language?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: 'light' | 'dark';
          notifications?: boolean;
          language?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      integrations: {
        Row: {
          id: string;
          name: string;
          type: string;
          config: any;
          status: 'active' | 'inactive' | 'error';
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          config?: any;
          status?: 'active' | 'inactive' | 'error';
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          config?: any;
          status?: 'active' | 'inactive' | 'error';
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      integration_logs: {
        Row: {
          id: string;
          integration_id: string;
          action: string;
          status: 'success' | 'error' | 'pending';
          request_data: any;
          response_data: any;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          integration_id: string;
          action: string;
          status: 'success' | 'error' | 'pending';
          request_data?: any;
          response_data?: any;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          integration_id?: string;
          action?: string;
          status?: 'success' | 'error' | 'pending';
          request_data?: any;
          response_data?: any;
          error_message?: string | null;
          created_at?: string;
        };
      };
      webhooks: {
        Row: {
          id: string;
          name: string;
          url: string;
          events: string[];
          secret: string | null;
          active: boolean;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          url: string;
          events?: string[];
          secret?: string | null;
          active?: boolean;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          url?: string;
          events?: string[];
          secret?: string | null;
          active?: boolean;
          user_id?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
          category: 'lead' | 'contact' | 'deal' | 'activity' | 'system' | 'integration';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          read: boolean;
          action_url: string | null;
          action_label: string | null;
          metadata: any;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
          category: 'lead' | 'contact' | 'deal' | 'activity' | 'system' | 'integration';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          read?: boolean;
          action_url?: string | null;
          action_label?: string | null;
          metadata?: any;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: 'info' | 'success' | 'warning' | 'error' | 'reminder';
          category?: 'lead' | 'contact' | 'deal' | 'activity' | 'system' | 'integration';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          read?: boolean;
          action_url?: string | null;
          action_label?: string | null;
          metadata?: any;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          email_enabled: boolean;
          push_enabled: boolean;
          in_app_enabled: boolean;
          categories: any;
          quiet_hours_start: string;
          quiet_hours_end: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_enabled?: boolean;
          push_enabled?: boolean;
          in_app_enabled?: boolean;
          categories?: any;
          quiet_hours_start?: string;
          quiet_hours_end?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_enabled?: boolean;
          push_enabled?: boolean;
          in_app_enabled?: boolean;
          categories?: any;
          quiet_hours_start?: string;
          quiet_hours_end?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_templates: {
        Row: {
          id: string;
          name: string;
          title_template: string;
          message_template: string;
          type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
          category: 'lead' | 'contact' | 'deal' | 'activity' | 'system' | 'integration';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          action_url_template: string | null;
          action_label: string | null;
          variables: any;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          title_template: string;
          message_template: string;
          type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
          category: 'lead' | 'contact' | 'deal' | 'activity' | 'system' | 'integration';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          action_url_template?: string | null;
          action_label?: string | null;
          variables?: any;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          title_template?: string;
          message_template?: string;
          type?: 'info' | 'success' | 'warning' | 'error' | 'reminder';
          category?: 'lead' | 'contact' | 'deal' | 'activity' | 'system' | 'integration';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          action_url_template?: string | null;
          action_label?: string | null;
          variables?: any;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};