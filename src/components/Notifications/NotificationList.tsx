import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Filter, RefreshCw, Eye, EyeOff, Calendar, User, DollarSign, Activity, Settings, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification } from '../../types/notification';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FilterType = 'all' | 'unread' | 'read';
type CategoryFilter = 'all' | 'lead' | 'contact' | 'deal' | 'activity' | 'system' | 'integration';

const NotificationList: React.FC = () => {
  const { notifications, markAsRead, deleteNotification, loading, loadNotifications } = useNotifications();
  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    const matchesReadFilter = 
      filter === 'all' || 
      (filter === 'read' && notification.read_at) ||
      (filter === 'unread' && !notification.read_at);
    
    const matchesCategoryFilter = 
      categoryFilter === 'all' || 
      notification.category === categoryFilter;
    
    return matchesReadFilter && matchesCategoryFilter;
  });

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
    setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
  };

  const handleBulkMarkAsRead = async () => {
    for (const id of selectedNotifications) {
      await markAsRead(id);
    }
    setSelectedNotifications([]);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedNotifications) {
      await deleteNotification(id);
    }
    setSelectedNotifications([]);
  };

  const toggleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredNotifications.map(n => n.id);
    setSelectedNotifications(visibleIds);
  };

  const clearSelection = () => {
    setSelectedNotifications([]);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lead': return <User className="w-4 h-4" />;
      case 'contact': return <User className="w-4 h-4" />;
      case 'deal': return <DollarSign className="w-4 h-4" />;
      case 'activity': return <Activity className="w-4 h-4" />;
      case 'system': return <Settings className="w-4 h-4" />;
      case 'integration': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'lead': return 'text-blue-500';
      case 'contact': return 'text-green-500';
      case 'deal': return 'text-purple-500';
      case 'activity': return 'text-orange-500';
      case 'system': return 'text-gray-500';
      case 'integration': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-300';
    }
  };

  const formatNotificationTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), {
      addSuffix: true,
      locale: ptBR
    });
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;
  const totalCount = notifications.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando notificações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notificações</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {unreadCount} não lidas de {totalCount} total
          </p>
        </div>
        <button
          onClick={loadNotifications}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filtro de Status */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todas</option>
              <option value="unread">Não lidas</option>
              <option value="read">Lidas</option>
            </select>
          </div>

          {/* Filtro de Categoria */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Categoria:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todas</option>
              <option value="lead">Leads</option>
              <option value="contact">Contatos</option>
              <option value="deal">Negócios</option>
              <option value="activity">Atividades</option>
              <option value="system">Sistema</option>
              <option value="integration">Integrações</option>
            </select>
          </div>

          {/* Ações em lote */}
          {selectedNotifications.length > 0 && (
            <div className="flex items-center space-x-2 ml-auto">
              <span className="text-sm text-gray-500">
                {selectedNotifications.length} selecionadas
              </span>
              <button
                onClick={handleBulkMarkAsRead}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
              >
                <Check className="w-3 h-3" />
                <span>Marcar como lidas</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Excluir</span>
              </button>
              <button
                onClick={clearSelection}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Limpar seleção
              </button>
            </div>
          )}
        </div>

        {/* Seleção rápida */}
        {filteredNotifications.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={selectAllVisible}
              className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
            >
              Selecionar todas visíveis ({filteredNotifications.length})
            </button>
          </div>
        )}
      </div>

      {/* Lista de Notificações */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma notificação encontrada
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'unread' 
                ? 'Você não tem notificações não lidas no momento.'
                : filter === 'read'
                ? 'Você não tem notificações lidas.'
                : 'Você não tem notificações ainda.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border-l-4 ${
                getPriorityColor(notification.priority)
              } border-r border-t border-b border-gray-200 dark:border-gray-700 p-4 transition-all hover:shadow-md ${
                !notification.read_at ? 'bg-primary-50 dark:bg-primary-900/20' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Checkbox de seleção */}
                <input
                  type="checkbox"
                  checked={selectedNotifications.includes(notification.id)}
                  onChange={() => toggleSelectNotification(notification.id)}
                  className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />

                {/* Ícone da categoria */}
                <div className={`mt-1 ${getCategoryColor(notification.category)}`}>
                  {getCategoryIcon(notification.category)}
                </div>

                {/* Conteúdo da notificação */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      
                      {/* Metadados */}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatNotificationTime(notification.created_at)}</span>
                        </span>
                        
                        <span className="capitalize">
                          Prioridade: {notification.priority}
                        </span>
                        
                        {notification.read_at && (
                          <span className="flex items-center space-x-1 text-green-600">
                            <Eye className="w-3 h-3" />
                            <span>Lida</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.read_at && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                          title="Marcar como lida"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Excluir notificação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginação (se necessário) */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {filteredNotifications.length} de {totalCount} notificações
          </p>
          
          {/* Aqui você pode adicionar controles de paginação se necessário */}
        </div>
      )}
    </div>
  );
};

export default NotificationList;