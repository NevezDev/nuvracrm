import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, Clock, CheckCircle, XCircle, Phone, Mail, Users, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ActivityForm from '../components/Forms/ActivityForm';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Activity {
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
  contacts?: {
    name: string;
    email: string;
    company: string | null;
  };
  deals?: {
    title: string;
    value: number;
  };
}

const Activities: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user]);

  const loadActivities = async () => {
    if (!user) return;

    try {
      // First try with relationships
      let { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          contacts (
            name,
            email,
            company
          ),
          deals (
            title,
            value
          )
        `)
        .eq('user_id', user.id)
        .order('due_date', { ascending: true, nullsLast: true });

      // If relationship error, try without relationships
      if (error && (error.code === 'PGRST200' || error.message?.includes('relationship'))) {
        console.warn('Relationships not found, loading activities without related data');
        const simpleQuery = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', user.id)
          .order('due_date', { ascending: true, nullsLast: true });
        
        data = simpleQuery.data;
        error = simpleQuery.error;
      }

      if (error) {
        if (error.code === '42P01') {
          console.warn('Activities table does not exist. Please run database migrations.');
          setActivities([]);
        } else {
          console.error('Error loading activities:', error);
        }
      } else {
        setActivities(data || []);
      }
    } catch (error) {
      console.warn('Could not load activities, using empty list:', error);
      setActivities([]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta atividade?')) return;

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '42P01') {
          console.warn('Activities table does not exist. Please run database migrations.');
        } else {
          console.error('Error deleting activity:', error);
        }
      } else {
        loadActivities();
      }
    } catch (error) {
      console.warn('Could not delete activity:', error);
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingActivity(null);
    loadActivities();
  };

  const handleStatusChange = async (activityId: string, newStatus: Activity['status']) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update({ status: newStatus })
        .eq('id', activityId);

      if (error) {
        if (error.code === '42P01') {
          console.warn('Activities table does not exist. Please run database migrations.');
        } else {
          console.error('Error updating activity status:', error);
        }
      } else {
        loadActivities();
      }
    } catch (error) {
      console.warn('Could not update activity status:', error);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.contacts?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.deals?.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type: Activity['type']) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'task': return <Target className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'call': return 'bg-blue-100 text-blue-800';
      case 'email': return 'bg-green-100 text-green-800';
      case 'meeting': return 'bg-purple-100 text-purple-800';
      case 'task': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: Activity['type']) => {
    switch (type) {
      case 'call': return 'Ligação';
      case 'email': return 'Email';
      case 'meeting': return 'Reunião';
      case 'task': return 'Tarefa';
      default: return type;
    }
  };

  const getStatusLabel = (status: Activity['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getDueDateLabel = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const date = new Date(dueDate);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    if (isPast(date)) return 'Atrasada';
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const getDueDateColor = (dueDate: string | null) => {
    if (!dueDate) return 'text-gray-500';
    
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return 'text-red-600';
    if (isToday(date)) return 'text-orange-600';
    if (isTomorrow(date)) return 'text-blue-600';
    return 'text-gray-600';
  };

  const activityStats = {
    total: activities.length,
    pending: activities.filter(a => a.status === 'pending').length,
    completed: activities.filter(a => a.status === 'completed').length,
    overdue: activities.filter(a => a.due_date && isPast(new Date(a.due_date)) && !isToday(new Date(a.due_date)) && a.status === 'pending').length,
    today: activities.filter(a => a.due_date && isToday(new Date(a.due_date)) && a.status === 'pending').length,
    tomorrow: activities.filter(a => a.due_date && isTomorrow(new Date(a.due_date)) && a.status === 'pending').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Atividades</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie suas tarefas e compromissos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Atividade
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activityStats.total}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">{activityStats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Concluídas</p>
              <p className="text-2xl font-bold text-green-600">{activityStats.completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Atrasadas</p>
              <p className="text-2xl font-bold text-red-600">{activityStats.overdue}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hoje</p>
              <p className="text-2xl font-bold text-orange-600">{activityStats.today}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Amanhã</p>
              <p className="text-2xl font-bold text-blue-600">{activityStats.tomorrow}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar atividades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
        >
          <option value="all">Todos os tipos</option>
          <option value="call">Ligações</option>
          <option value="email">Emails</option>
          <option value="meeting">Reuniões</option>
          <option value="task">Tarefas</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="completed">Concluídas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

      {/* Lista de atividades */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Atividade</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Relacionado</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Data</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    Nenhuma atividade encontrada
                  </td>
                </tr>
              ) : (
                filteredActivities.map((activity) => (
                  <tr key={activity.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                        {activity.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(activity.type)}`}>
                          {getTypeIcon(activity.type)}
                          {getTypeLabel(activity.type)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {activity.contacts && (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {activity.contacts.name}
                            {activity.contacts.company && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                {activity.contacts.company}
                              </span>
                            )}
                          </div>
                        )}
                        {activity.deals && (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {activity.deals.title}
                            <span className="text-xs text-emerald-600 block">
                              R$ {activity.deals.value.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {!activity.contacts && !activity.deals && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">Sem relacionamento</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {activity.due_date ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm font-medium ${getDueDateColor(activity.due_date)}`}>
                            {getDueDateLabel(activity.due_date)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">Sem data</span>
                      )}
                    </td>
                    <td className="p-4">
                      <select
                        value={activity.status}
                        onChange={(e) => handleStatusChange(activity.id, e.target.value as Activity['status'])}
                        className={`text-xs font-medium rounded-full px-2.5 py-0.5 border-0 ${getStatusColor(activity.status)}`}
                      >
                        <option value="pending">Pendente</option>
                        <option value="completed">Concluída</option>
                        <option value="cancelled">Cancelada</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStatusChange(activity.id, activity.status === 'completed' ? 'pending' : 'completed')}
                          className={`p-2 rounded-lg transition-colors ${
                            activity.status === 'completed'
                              ? 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                              : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                          title={activity.status === 'completed' ? 'Marcar como pendente' : 'Marcar como concluída'}
                        >
                          {activity.status === 'completed' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(activity)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(activity.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <ActivityForm
          activity={editingActivity}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default Activities;