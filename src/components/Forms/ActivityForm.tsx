import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Activity {
  id: string;
  title: string;
  description: string | null;
  type: 'call' | 'email' | 'meeting' | 'task';
  status: 'pending' | 'completed' | 'cancelled';
  due_date: string | null;
  contact_id: string | null;
  deal_id: string | null;
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

interface ActivityFormProps {
  activity?: Activity | null;
  onClose: () => void;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ activity, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task' as 'call' | 'email' | 'meeting' | 'task',
    status: 'pending' as 'pending' | 'completed' | 'cancelled',
    due_date: '',
    contact_id: '',
    deal_id: '',
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadContacts();
      loadDeals();
    }
  }, [user]);

  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title,
        description: activity.description || '',
        type: activity.type,
        status: activity.status,
        due_date: activity.due_date ? activity.due_date.split('T')[0] : '',
        contact_id: activity.contact_id || '',
        deal_id: activity.deal_id || '',
      });
    }
  }, [activity]);

  const loadContacts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('contacts')
      .select('id, name, email, company')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('name');

    if (!error) {
      setContacts(data || []);
    }
  };

  const loadDeals = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('deals')
      .select('id, title, value')
      .eq('user_id', user.id)
      .in('status', ['prospecting', 'negotiation'])
      .order('title');

    if (!error) {
      setDeals(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const dataToSubmit = {
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        status: formData.status,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        contact_id: formData.contact_id || null,
        deal_id: formData.deal_id || null,
        user_id: user.id,
      };

      if (activity) {
        const { error } = await supabase
          .from('activities')
          .update(dataToSubmit)
          .eq('id', activity.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('activities')
          .insert([dataToSubmit]);

        if (error) throw error;
      }

      onClose();
    } catch (error) {
      console.error('Error saving activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {activity ? 'Editar Atividade' : 'Nova Atividade'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Ex: Ligar para cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Detalhes sobre a atividade..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="task">Tarefa</option>
              <option value="call">Ligação</option>
              <option value="email">Email</option>
              <option value="meeting">Reunião</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data de Vencimento
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contato Relacionado
            </label>
            <select
              name="contact_id"
              value={formData.contact_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Selecione um contato</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} {contact.company && `- ${contact.company}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Oportunidade Relacionada
            </label>
            <select
              name="deal_id"
              value={formData.deal_id}
              onChange={handleChange}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="pending">Pendente</option>
              <option value="completed">Concluída</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityForm;