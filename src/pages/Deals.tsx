import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, DollarSign, User, Building } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DealForm from '../components/Forms/DealForm';

interface Deal {
  id: string;
  title: string;
  description: string | null;
  value: number;
  status: 'prospecting' | 'negotiation' | 'closed_won' | 'closed_lost';
  contact_id: string | null;
  expected_close_date: string | null;
  created_at: string;
  updated_at: string;
  contacts?: {
    name: string;
    email: string;
    company: string | null;
  };
}

const Deals: React.FC = () => {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  useEffect(() => {
    if (user) {
      loadDeals();
    }
  }, [user]);

  const loadDeals = async () => {
    if (!user) return;

    try {
      // First try with relationships
      let { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          contacts (
            name,
            email,
            company
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // If relationship error, try without relationships
      if (error && (error.code === 'PGRST200' || error.message?.includes('relationship'))) {
        console.warn('Contacts relationship not found, loading deals without contact info');
        const simpleQuery = await supabase
          .from('deals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        data = simpleQuery.data;
        error = simpleQuery.error;
      }

      if (error) {
        if (error.code === '42P01') {
          console.warn('Deals table does not exist. Please run database migrations.');
          setDeals([]);
        } else {
          console.error('Error loading deals:', error);
        }
      } else {
        setDeals(data || []);
      }
    } catch (error) {
      console.warn('Could not load deals, using empty list:', error);
      setDeals([]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta oportunidade?')) return;

    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '42P01') {
          console.warn('Deals table does not exist. Please run database migrations.');
        } else {
          console.error('Error deleting deal:', error);
        }
      } else {
        loadDeals();
      }
    } catch (error) {
      console.warn('Could not delete deal:', error);
    }
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDeal(null);
    loadDeals();
  };

  const handleStatusChange = async (dealId: string, newStatus: Deal['status']) => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({ status: newStatus })
        .eq('id', dealId);

      if (error) {
        if (error.code === '42P01') {
          console.warn('Deals table does not exist. Please run database migrations.');
        } else {
          console.error('Error updating deal status:', error);
        }
      } else {
        loadDeals();
      }
    } catch (error) {
      console.warn('Could not update deal status:', error);
    }
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.contacts?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.contacts?.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || deal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Deal['status']) => {
    switch (status) {
      case 'prospecting': return 'bg-blue-100 text-blue-800';
      case 'negotiation': return 'bg-yellow-100 text-yellow-800';
      case 'closed_won': return 'bg-green-100 text-green-800';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Deal['status']) => {
    switch (status) {
      case 'prospecting': return 'Prospecção';
      case 'negotiation': return 'Negociação';
      case 'closed_won': return 'Fechada - Ganha';
      case 'closed_lost': return 'Fechada - Perdida';
      default: return status;
    }
  };

  const dealStats = {
    total: deals.length,
    prospecting: deals.filter(d => d.status === 'prospecting').length,
    negotiation: deals.filter(d => d.status === 'negotiation').length,
    won: deals.filter(d => d.status === 'closed_won').length,
    lost: deals.filter(d => d.status === 'closed_lost').length,
    totalValue: deals.reduce((sum, deal) => sum + deal.value, 0),
    wonValue: deals.filter(d => d.status === 'closed_won').reduce((sum, deal) => sum + deal.value, 0),
    pipelineValue: deals.filter(d => ['prospecting', 'negotiation'].includes(d.status)).reduce((sum, deal) => sum + deal.value, 0)
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Oportunidades</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie suas oportunidades de negócio</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Oportunidade
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Oportunidades</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dealStats.total}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pipeline</p>
              <p className="text-2xl font-bold text-blue-600">R$ {dealStats.pipelineValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fechadas - Ganhas</p>
              <p className="text-2xl font-bold text-green-600">R$ {dealStats.wonValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-purple-600">
                {dealStats.total > 0 ? Math.round((dealStats.won / dealStats.total) * 100) : 0}%
              </p>
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
            placeholder="Pesquisar oportunidades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
        >
          <option value="all">Todos os status</option>
          <option value="prospecting">Prospecção</option>
          <option value="negotiation">Negociação</option>
          <option value="closed_won">Fechada - Ganha</option>
          <option value="closed_lost">Fechada - Perdida</option>
        </select>
      </div>

      {/* Lista de oportunidades */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Oportunidade</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Contato</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Valor</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Data Prevista</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    Nenhuma oportunidade encontrada
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal) => (
                  <tr key={deal.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{deal.title}</p>
                        {deal.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                            {deal.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Criada em {new Date(deal.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      {deal.contacts ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">{deal.contacts.name}</span>
                          </div>
                          {deal.contacts.company && (
                            <div className="flex items-center gap-2 mt-1">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">{deal.contacts.company}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">Sem contato</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-emerald-600">
                        R$ {deal.value.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      {deal.expected_close_date ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {new Date(deal.expected_close_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">Não definida</span>
                      )}
                    </td>
                    <td className="p-4">
                      <select
                        value={deal.status}
                        onChange={(e) => handleStatusChange(deal.id, e.target.value as Deal['status'])}
                        className={`text-xs font-medium rounded-full px-2.5 py-0.5 border-0 ${getStatusColor(deal.status)}`}
                      >
                        <option value="prospecting">Prospecção</option>
                        <option value="negotiation">Negociação</option>
                        <option value="closed_won">Fechada - Ganha</option>
                        <option value="closed_lost">Fechada - Perdida</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(deal)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(deal.id)}
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
        <DealForm
          deal={editingDeal}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default Deals;