import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, Clock, Users, Phone, Mail, Target, Save, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const appointmentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['call', 'email', 'meeting', 'task']),
  due_date: z.string().min(1, 'Data é obrigatória'),
  due_time: z.string().min(1, 'Horário é obrigatório'),
  duration: z.number().min(15, 'Duração mínima é 15 minutos').max(480, 'Duração máxima é 8 horas'),
  contact_id: z.string().optional(),
  deal_id: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  appointment?: any;
  onClose: () => void;
  initialDate?: Date;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

interface Deal {
  id: string;
  title: string;
  value: number;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  appointment, 
  onClose, 
  initialDate 
}) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: appointment?.title || '',
      description: appointment?.description || '',
      type: appointment?.type || 'meeting',
      due_date: appointment?.due_date 
        ? new Date(appointment.due_date).toISOString().split('T')[0]
        : initialDate 
        ? initialDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      due_time: appointment?.due_date 
        ? new Date(appointment.due_date).toTimeString().slice(0, 5)
        : '09:00',
      duration: 60,
      contact_id: appointment?.contact_id || '',
      deal_id: appointment?.deal_id || '',
    },
  });

  const watchType = watch('type');

  useEffect(() => {
    loadContacts();
    loadDeals();
  }, []);

  const loadContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, email, company')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error loading contacts:', error);
      } else {
        setContacts(data || []);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadDeals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('deals')
        .select('id, title, value')
        .eq('user_id', user.id)
        .not('status', 'eq', 'closed_lost')
        .order('title');

      if (error) {
        console.error('Error loading deals:', error);
      } else {
        setDeals(data || []);
      }
    } catch (error) {
      console.error('Error loading deals:', error);
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    if (!user) return;

    setLoading(true);

    try {
      // Combinar data e hora
      const dateTime = new Date(`${data.due_date}T${data.due_time}`);
      const dueDate = dateTime.toISOString();

      const appointmentData = {
        title: data.title,
        description: data.description,
        type: data.type,
        due_date: dueDate,
        contact_id: data.contact_id || null,
        deal_id: data.deal_id || null,
        user_id: user.id,
      };

      let error;
      if (appointment?.id) {
        // Atualizar compromisso existente
        const { error: updateError } = await supabase
          .from('activities')
          .update(appointmentData)
          .eq('id', appointment.id);

        error = updateError;
      } else {
        // Criar novo compromisso
        const { error: insertError } = await supabase
          .from('activities')
          .insert([appointmentData]);

        error = insertError;
      }

      if (error) {
        console.error('Error saving appointment:', error);
        alert('Erro ao salvar compromisso. Tente novamente.');
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert('Erro ao salvar compromisso. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'task': return <Target className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'call': return 'Ligação';
      case 'email': return 'Email';
      case 'meeting': return 'Reunião';
      case 'task': return 'Tarefa';
      default: return type;
    }
  };

  const durationOptions = [
    { value: 15, label: '15 minutos' },
    { value: 30, label: '30 minutos' },
    { value: 45, label: '45 minutos' },
    { value: 60, label: '1 hora' },
    { value: 90, label: '1 hora e 30 minutos' },
    { value: 120, label: '2 horas' },
    { value: 180, label: '3 horas' },
    { value: 240, label: '4 horas' },
    { value: 300, label: '5 horas' },
    { value: 360, label: '6 horas' },
    { value: 420, label: '7 horas' },
    { value: 480, label: '8 horas' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {appointment ? 'Editar Compromisso' : 'Novo Compromisso'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título *
            </label>
            <input
              type="text"
              {...register('title')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Digite o título do compromisso"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Tipo de Compromisso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Compromisso *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['call', 'email', 'meeting', 'task'] as const).map((type) => (
                <label
                  key={type}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    watchType === type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    value={type}
                    {...register('type')}
                    className="sr-only"
                  />
                  {getTypeIcon(type)}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {getTypeLabel(type)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data *
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="date"
                  {...register('due_date')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Horário *
              </label>
              <div className="relative">
                <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="time"
                  {...register('due_time')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              {errors.due_time && (
                <p className="mt-1 text-sm text-red-600">{errors.due_time.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duração
              </label>
              <select
                {...register('duration', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Digite uma descrição do compromisso"
            />
          </div>

          {/* Relacionamentos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contato Relacionado
              </label>
              <select
                {...register('contact_id')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Selecione um contato</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} {contact.company && `(${contact.company})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Oportunidade Relacionada
              </label>
              <select
                {...register('deal_id')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Selecione uma oportunidade</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.title} - R$ {deal.value.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {appointment ? 'Atualizar' : 'Criar'} Compromisso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm; 