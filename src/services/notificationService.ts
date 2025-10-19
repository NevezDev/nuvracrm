import { supabase } from '../lib/supabase';
import type {
  Notification,
  NotificationPreferences,
  NotificationTemplate,
  CreateNotificationData,
  CreateNotificationFromTemplateData
} from '../types/notification';

// Re-export types for backward compatibility
export type {
  Notification,
  NotificationPreferences,
  NotificationTemplate,
  CreateNotificationData,
  CreateNotificationFromTemplateData
};

export class NotificationService {
  // Criar notificação
  static async createNotification(data: CreateNotificationData): Promise<Notification | null> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          title: data.title,
          message: data.message,
          type: data.type,
          category: data.category,
          priority: data.priority || 'medium',
          action_url: data.action_url,
          action_label: data.action_label,
          metadata: data.metadata || {},
          expires_at: data.expires_at
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar notificação:', error);
        return null;
      }

      // Enviar notificação em tempo real
      await this.sendRealtimeNotification(notification);

      return notification;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      return null;
    }
  }

  // Criar notificação a partir de template
  static async createNotificationFromTemplate(data: CreateNotificationFromTemplateData): Promise<Notification | null> {
    try {
      // Buscar template
      const { data: template, error: templateError } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('name', data.template_name)
        .eq('active', true)
        .single();

      if (templateError || !template) {
        console.error('Template não encontrado:', data.template_name);
        return null;
      }

      // Processar template
      const title = this.processTemplate(template.title_template, data.variables);
      const message = this.processTemplate(template.message_template, data.variables);
      const action_url = template.action_url_template 
        ? this.processTemplate(template.action_url_template, data.variables)
        : undefined;

      return await this.createNotification({
        user_id: data.user_id,
        title,
        message,
        type: template.type,
        category: template.category,
        priority: template.priority,
        action_url,
        action_label: template.action_label,
        metadata: { template_name: data.template_name, variables: data.variables },
        expires_at: data.expires_at
      });
    } catch (error) {
      console.error('Erro ao criar notificação do template:', error);
      return null;
    }
  }

  // Processar template com variáveis
  private static processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, String(value));
    });
    
    return processed;
  }

  // Buscar notificações do usuário
  static async getUserNotifications(
    userId: string, 
    options: {
      limit?: number;
      offset?: number;
      unread_only?: boolean;
      category?: string;
      type?: string;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options.unread_only) {
        query = query.eq('read', false);
      }

      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar notificações:', error);
        return { notifications: [], total: 0 };
      }

      return { notifications: data || [], total: count || 0 };
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return { notifications: [], total: 0 };
    }
  }

  // Marcar notificação como lida
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
  }

  // Marcar todas as notificações como lidas
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      return false;
    }
  }

  // Deletar notificação
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Erro ao deletar notificação:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      return false;
    }
  }

  // Buscar preferências do usuário
  static async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar preferências:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
      return null;
    }
  }

  // Atualizar preferências do usuário
  static async updateUserPreferences(
    userId: string, 
    preferences: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences
        });

      if (error) {
        console.error('Erro ao atualizar preferências:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      return false;
    }
  }

  // Contar notificações não lidas
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Erro ao contar notificações não lidas:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      return 0;
    }
  }

  // Enviar notificação em tempo real
  private static async sendRealtimeNotification(notification: Notification): Promise<void> {
    try {
      // Enviar via Supabase Realtime
      await supabase
        .channel('notifications')
        .send({
          type: 'broadcast',
          event: 'new_notification',
          payload: notification
        });
    } catch (error) {
      console.error('Erro ao enviar notificação em tempo real:', error);
    }
  }

  // Limpar notificações expiradas
  static async cleanupExpiredNotifications(): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('cleanup_expired_notifications');

      if (error) {
        console.error('Erro ao limpar notificações expiradas:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Erro ao limpar notificações expiradas:', error);
      return 0;
    }
  }

  // Métodos de conveniência para criar notificações específicas
  static async notifyNewLead(userId: string, leadName: string, leadId: string): Promise<Notification | null> {
    return await this.createNotificationFromTemplate({
      user_id: userId,
      template_name: 'new_lead',
      variables: { lead_name: leadName, lead_id: leadId }
    });
  }

  static async notifyLeadStatusChanged(userId: string, leadName: string, newStatus: string, leadId: string): Promise<Notification | null> {
    return await this.createNotificationFromTemplate({
      user_id: userId,
      template_name: 'lead_status_changed',
      variables: { lead_name: leadName, new_status: newStatus, lead_id: leadId }
    });
  }

  static async notifyDealWon(userId: string, dealTitle: string, dealValue: string, dealId: string): Promise<Notification | null> {
    return await this.createNotificationFromTemplate({
      user_id: userId,
      template_name: 'deal_won',
      variables: { deal_title: dealTitle, deal_value: dealValue, deal_id: dealId }
    });
  }

  static async notifyDealLost(userId: string, dealTitle: string, dealId: string): Promise<Notification | null> {
    return await this.createNotificationFromTemplate({
      user_id: userId,
      template_name: 'deal_lost',
      variables: { deal_title: dealTitle, deal_id: dealId }
    });
  }

  static async notifyActivityReminder(userId: string, activityTitle: string, activityDate: string, activityId: string): Promise<Notification | null> {
    return await this.createNotificationFromTemplate({
      user_id: userId,
      template_name: 'activity_reminder',
      variables: { activity_title: activityTitle, activity_date: activityDate, activity_id: activityId }
    });
  }

  static async notifyActivityOverdue(userId: string, activityTitle: string, dueDate: string, activityId: string): Promise<Notification | null> {
    return await this.createNotificationFromTemplate({
      user_id: userId,
      template_name: 'activity_overdue',
      variables: { activity_title: activityTitle, due_date: dueDate, activity_id: activityId }
    });
  }

  static async notifyIntegrationError(userId: string, integrationName: string, errorMessage: string): Promise<Notification | null> {
    return await this.createNotificationFromTemplate({
      user_id: userId,
      template_name: 'integration_error',
      variables: { integration_name: integrationName, error_message: errorMessage }
    });
  }

  static async notifySystemMaintenance(userId: string, maintenanceDate: string): Promise<Notification | null> {
    return await this.createNotificationFromTemplate({
      user_id: userId,
      template_name: 'system_maintenance',
      variables: { maintenance_date: maintenanceDate }
    });
  }
}