import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Calendar as CalendarIcon, X, Phone, Mail, Users, Target, Edit, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { googleCalendarService, type GoogleCalendarEvent } from '../services/googleCalendarService';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

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
  google_event_id?: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Activity;
  isGoogleEvent?: boolean;
}

// Componente personalizado para os eventos
const CustomEvent = ({ event }: { event: CalendarEvent }) => {
  const activity = event.resource;
  
  const getTypeIcon = (type: Activity['type']) => {
    switch (type) {
      case 'call': return <Phone className="w-3 h-3" />;
      case 'email': return <Mail className="w-3 h-3" />;
      case 'meeting': return <Users className="w-3 h-3" />;
      case 'task': return <Target className="w-3 h-3" />;
      default: return <Target className="w-3 h-3" />;
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

  return (
    <div className="p-1 text-xs h-full overflow-hidden">
      <div className="flex items-center gap-1 mb-1">
        {getTypeIcon(activity.type)}
        <span className="font-medium truncate">{activity.title}</span>
        {event.isGoogleEvent && (
          <ExternalLink className="w-2 h-2 text-blue-500" />
        )}
      </div>
      <div className="text-xs opacity-90 mb-1">
        {getTypeLabel(activity.type)} • {format(event.start, 'HH:mm')}
      </div>
      {activity.description && (
        <div className="text-xs opacity-80 leading-tight line-clamp-2 bg-black bg-opacity-10 rounded px-1 py-0.5">
          {activity.description}
        </div>
      )}
    </div>
  );
};

const Agenda: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'meeting' as Activity['type'],
    status: 'pending' as Activity['status'],
    due_date: '',
    due_time: '09:00',
    syncWithGoogle: false
  });

  useEffect(() => {
    if (user) {
      loadActivities();
      // Reativar Google Calendar de forma segura
      checkGoogleConnection();
    }
  }, [user]);

  const checkGoogleConnection = async () => {
    try {
      const connected = await googleCalendarService.initialize();
      setIsGoogleConnected(connected);
      if (connected) {
        await loadGoogleEvents();
      }
    } catch (error) {
      console.error('Erro ao verificar conexão Google:', error);
      setIsGoogleConnected(false);
    }
  };

  const loadActivities = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Erro ao carregar atividades:', error);
        return;
      }

      setActivities(data || []);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleEvents = async () => {
    if (!isGoogleConnected) return;

    try {
      const events = await googleCalendarService.listEvents();
      setGoogleEvents(events);
    } catch (error) {
      console.error('Erro ao carregar eventos Google:', error);
      // Não deixar o erro quebrar a aplicação
      setGoogleEvents([]);
    }
  };

  const handleSyncGoogle = async () => {
    if (!isGoogleConnected) return;

    setSyncing(true);
    try {
      await loadGoogleEvents();
      // Aqui você pode implementar a lógica de sincronização bidirecional
      // Por enquanto, apenas recarrega os eventos
    } catch (error) {
      console.error('Erro na sincronização:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const activity = event.resource;
    const dueDate = new Date(activity.due_date!);
    
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      description: activity.description || '',
      type: activity.type,
      status: activity.status,
      due_date: format(dueDate, 'yyyy-MM-dd'),
      due_time: format(dueDate, 'HH:mm'),
      syncWithGoogle: !!activity.google_event_id
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const dueDateTime = new Date(`${formData.due_date}T${formData.due_time}`);
      
      if (editingActivity) {
        // Atualizar atividade existente
        const { error } = await supabase
          .from('activities')
          .update({
            title: formData.title,
            description: formData.description,
            type: formData.type,
            status: formData.status,
            due_date: dueDateTime.toISOString(),
          })
          .eq('id', editingActivity.id);

        if (error) {
          console.error('Erro ao atualizar atividade:', error);
          return;
        }

        // Sincronizar com Google Calendar se necessário
        if (formData.syncWithGoogle && isGoogleConnected && editingActivity.google_event_id) {
          try {
            await googleCalendarService.updateEvent(editingActivity.google_event_id, {
              title: formData.title,
              description: formData.description || '',
              startDate: dueDateTime.toISOString(),
              endDate: new Date(dueDateTime.getTime() + 60 * 60 * 1000).toISOString(),
            });
          } catch (error) {
            console.error('Erro ao atualizar evento Google:', error);
          }
        }
      } else {
        // Criar nova atividade
        const { data: activity, error } = await supabase
          .from('activities')
          .insert({
            title: formData.title,
            description: formData.description,
            type: formData.type,
            status: formData.status,
            due_date: dueDateTime.toISOString(),
            user_id: user.id,
          })
          .select()
          .single();

        if (error) {
          console.error('Erro ao criar atividade:', error);
          return;
        }

        // Sincronizar com Google Calendar se solicitado
        if (formData.syncWithGoogle && isGoogleConnected) {
          try {
            const googleEvent = await googleCalendarService.createEvent({
              title: formData.title,
              description: formData.description || '',
              startDate: dueDateTime.toISOString(),
              endDate: new Date(dueDateTime.getTime() + 60 * 60 * 1000).toISOString(),
            });

            // Atualizar atividade com o ID do evento Google
            await supabase
              .from('activities')
              .update({ google_event_id: googleEvent.id })
              .eq('id', activity.id);
          } catch (error) {
            console.error('Erro ao criar evento Google:', error);
          }
        }
      }

      // Limpar formulário e fechar modal
      setFormData({
        title: '',
        description: '',
        type: 'meeting',
        status: 'pending',
        due_date: '',
        due_time: '09:00',
        syncWithGoogle: false
      });
      setEditingActivity(null);
      setShowForm(false);
      
      // Recarregar dados
      loadActivities();
      if (isGoogleConnected) {
        loadGoogleEvents();
      }
    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
    }
  };

  const handleDelete = async () => {
    if (!editingActivity) return;
    
    if (!confirm('Tem certeza que deseja excluir esta atividade?')) return;

    try {
      // Excluir do Google Calendar se sincronizado
      if (editingActivity.google_event_id && isGoogleConnected) {
        try {
          await googleCalendarService.deleteEvent(editingActivity.google_event_id);
        } catch (error) {
          console.error('Erro ao excluir evento Google:', error);
        }
      }

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', editingActivity.id);

      if (error) {
        console.error('Erro ao excluir atividade:', error);
        return;
      }

      setEditingActivity(null);
      setShowForm(false);
      loadActivities();
      if (isGoogleConnected) {
        loadGoogleEvents();
      }
    } catch (error) {
      console.error('Erro ao excluir atividade:', error);
    }
  };

  // Combinar atividades do CRM e eventos do Google Calendar
  const calendarEvents: CalendarEvent[] = [
    // Atividades do CRM
    ...activities
      .filter(activity => activity.due_date)
      .map(activity => ({
        id: activity.id,
        title: activity.title,
        start: new Date(activity.due_date!),
        end: new Date(new Date(activity.due_date!).getTime() + 60 * 60 * 1000),
        resource: activity,
        isGoogleEvent: !!activity.google_event_id,
      })),
    // Eventos do Google Calendar (apenas os que não estão no CRM)
    ...googleEvents
      .filter(googleEvent => !activities.some(activity => activity.google_event_id === googleEvent.id))
      .map(googleEvent => ({
        id: `google-${googleEvent.id}`,
        title: googleEvent.summary,
        start: new Date(googleEvent.start.dateTime),
        end: new Date(googleEvent.end.dateTime),
        resource: {
          id: `google-${googleEvent.id}`,
          title: googleEvent.summary,
          description: googleEvent.description || null,
          type: 'meeting' as Activity['type'],
          status: 'pending' as Activity['status'],
          due_date: googleEvent.start.dateTime,
          contact_id: null,
          deal_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          google_event_id: googleEvent.id,
        },
        isGoogleEvent: true,
      }))
  ];

  const getEventStyle = (event: CalendarEvent) => {
    const activity = event.resource;
    let backgroundColor = '#3B82F6'; // azul padrão

    if (event.isGoogleEvent) {
      backgroundColor = '#8B5CF6'; // roxo para eventos Google
    } else {
      switch (activity.type) {
        case 'call':
          backgroundColor = '#10B981'; // verde
          break;
        case 'email':
          backgroundColor = '#F59E0B'; // amarelo
          break;
        case 'meeting':
          backgroundColor = '#8B5CF6'; // roxo
          break;
        case 'task':
          backgroundColor = '#EF4444'; // vermelho
          break;
      }
    }

    return {
      style: {
        backgroundColor,
        color: 'white',
        borderRadius: '4px',
        border: 'none',
        padding: '2px 4px',
        minHeight: '60px',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'flex-start',
      },
    };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Agenda
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Calendário de atividades e compromissos
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isGoogleConnected && (
              <button
                onClick={handleSyncGoogle}
                disabled={syncing}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                title="Sincronizar com Google Calendar"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </button>
            )}
            <button 
              onClick={() => {
                setEditingActivity(null);
                setFormData({
                  title: '',
                  description: '',
                  type: 'meeting',
                  status: 'pending',
                  due_date: '',
                  due_time: '09:00',
                  syncWithGoogle: false
                });
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Atividade
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activities.length}</p>
            </div>
            <CalendarIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">
              {activities.filter(a => a.status === 'pending').length}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Concluídas</p>
            <p className="text-2xl font-bold text-green-600">
              {activities.filter(a => a.status === 'completed').length}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Google Calendar</p>
            <p className="text-2xl font-bold text-purple-600">
              {googleEvents.length}
            </p>
          </div>
        </div>
      </div>

      {/* Calendário */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          eventPropGetter={getEventStyle}
          onSelectEvent={handleSelectEvent}
          components={{
            event: CustomEvent,
          }}
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Lista",
            date: "Data",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "Não há eventos neste período.",
            showMore: (total: number) => `+${total} mais`,
          }}
          defaultView="month"
          views={['month', 'week', 'day', 'agenda']}
          step={60}
          timeslots={1}
          min={new Date(0, 0, 0, 8, 0, 0)}
          max={new Date(0, 0, 0, 20, 0, 0)}
        />
      </div>

      {/* Modal Nova/Editar Atividade */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingActivity(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as Activity['type']})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="meeting">Reunião</option>
                    <option value="call">Ligação</option>
                    <option value="email">Email</option>
                    <option value="task">Tarefa</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as Activity['status']})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="pending">Pendente</option>
                    <option value="completed">Concluída</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={formData.due_time}
                    onChange={(e) => setFormData({...formData, due_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              {isGoogleConnected && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="syncWithGoogle"
                    checked={formData.syncWithGoogle}
                    onChange={(e) => setFormData({...formData, syncWithGoogle: e.target.checked})}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="syncWithGoogle" className="text-sm text-gray-700 dark:text-gray-300">
                    Sincronizar com Google Calendar
                  </label>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {editingActivity ? 'Atualizar' : 'Criar'}
                </button>
                {editingActivity && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingActivity(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda; 