import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationService } from '../services/notificationService';
import type { Notification, NotificationPreferences } from '../types/notification';
import { supabase } from '../lib/supabase';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  preferences: NotificationPreferences | null;
  loadNotifications: (options?: {
    limit?: number;
    offset?: number;
    unread_only?: boolean;
    category?: string;
    type?: string;
  }) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Carregar notificações
  const loadNotifications = useCallback(async (options: {
    limit?: number;
    offset?: number;
    unread_only?: boolean;
    category?: string;
    type?: string;
  } = {}) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { notifications: data } = await NotificationService.getUserNotifications(user.id, options);
      
      if (options.offset && options.offset > 0) {
        // Adicionar às notificações existentes (paginação)
        setNotifications(prev => [...prev, ...data]);
      } else {
        // Substituir notificações (primeira carga ou refresh)
        setNotifications(data);
      }
    } catch (err) {
      setError('Erro ao carregar notificações');
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Atualizar contador de não lidas
  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const count = await NotificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error('Erro ao atualizar contador de não lidas:', err);
    }
  }, [user]);

  // Marcar como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const success = await NotificationService.markAsRead(notificationId);
      
      if (success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
        await refreshUnreadCount();
      }
    } catch (err) {
      setError('Erro ao marcar notificação como lida');
      console.error('Erro ao marcar como lida:', err);
    }
  }, [refreshUnreadCount]);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const success = await NotificationService.markAllAsRead(user.id);
      
      if (success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      setError('Erro ao marcar todas as notificações como lidas');
      console.error('Erro ao marcar todas como lidas:', err);
    }
  }, [user]);

  // Deletar notificação
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const success = await NotificationService.deleteNotification(notificationId);
      
      if (success) {
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        );
        await refreshUnreadCount();
      }
    } catch (err) {
      setError('Erro ao deletar notificação');
      console.error('Erro ao deletar notificação:', err);
    }
  }, [refreshUnreadCount]);

  // Carregar preferências
  const loadPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const prefs = await NotificationService.getUserPreferences(user.id);
      setPreferences(prefs);
    } catch (err) {
      console.error('Erro ao carregar preferências:', err);
    }
  }, [user]);

  // Atualizar preferências
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user) return;

    try {
      const success = await NotificationService.updateUserPreferences(user.id, newPreferences);
      
      if (success) {
        setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
      }
    } catch (err) {
      setError('Erro ao atualizar preferências');
      console.error('Erro ao atualizar preferências:', err);
    }
  }, [user]);

  // Configurar listener para notificações em tempo real
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on('broadcast', { event: 'new_notification' }, (payload) => {
        const notification = payload.payload as Notification;
        
        // Verificar se a notificação é para o usuário atual
        if (notification.user_id === user.id) {
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Mostrar notificação do navegador se permitido
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
              tag: notification.id
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadNotifications({ limit: 20 });
      refreshUnreadCount();
      loadPreferences();
    }
  }, [user, loadNotifications, refreshUnreadCount, loadPreferences]);

  // Solicitar permissão para notificações do navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    refreshUnreadCount
  };
};

// Hook para criar notificações facilmente
export const useCreateNotification = () => {
  const { user } = useAuth();

  const createNotification = useCallback(async (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'reminder' = 'info',
    category: 'lead' | 'contact' | 'deal' | 'activity' | 'system' | 'integration' = 'system',
    options?: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      action_url?: string;
      action_label?: string;
      metadata?: Record<string, any>;
      expires_at?: string;
    }
  ) => {
    if (!user) return null;

    return await NotificationService.createNotification({
      user_id: user.id,
      title,
      message,
      type,
      category,
      priority: options?.priority,
      action_url: options?.action_url,
      action_label: options?.action_label,
      metadata: options?.metadata,
      expires_at: options?.expires_at
    });
  }, [user]);

  return { createNotification };
};