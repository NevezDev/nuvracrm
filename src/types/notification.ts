export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
  category: 'lead' | 'contact' | 'deal' | 'activity' | 'system' | 'integration';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  categories: Record<string, {
    email: boolean;
    push: boolean;
    in_app: boolean;
  }>;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title_template: string;
  message_template: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
  category: 'lead' | 'contact' | 'deal' | 'activity' | 'system' | 'integration';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url_template?: string;
  action_label?: string;
  variables: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
  category: 'lead' | 'contact' | 'deal' | 'activity' | 'system' | 'integration';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
}

export interface CreateNotificationFromTemplateData {
  user_id: string;
  template_name: string;
  variables: Record<string, any>;
  expires_at?: string;
}