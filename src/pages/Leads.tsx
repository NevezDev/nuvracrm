import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Phone, Mail, Building, TrendingUp, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LeadForm from '../components/Forms/LeadForm';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface Lead {
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
}

const Leads: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'lista' | 'origem'>('lista');

  useEffect(() => {
    if (user) {
      loadLeads();
    }
  }, [user]);

  const loadLeads = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          console.warn('Leads table does not exist. Please run database migrations.');
          setLeads([]);
        } else {
          console.error('Error loading leads:', error);
        }
      } else {
        setLeads(data || []);
      }
    } catch (error) {
      console.warn('Could not load leads, using empty list:', error);
      setLeads([]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '42P01') {
          console.warn('Leads table does not exist. Please run database migrations.');
        } else {
          console.error('Error deleting lead:', error);
        }
      } else {
        loadLeads();
      }
    } catch (error) {
      console.warn('Could not delete lead:', error);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLead(null);
    loadLeads();
  };

  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) {
        if (error.code === '42P01') {
          console.warn('Leads table does not exist. Please run database migrations.');
        } else {
          console.error('Error updating lead status:', error);
        }
      } else {
        loadLeads();
      }
    } catch (error) {
      console.warn('Could not update lead status:', error);
    }
  };

  const convertToContact = async (lead: Lead) => {
    if (!confirm('Converter este lead em contato?')) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .insert({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          status: 'active',
          user_id: user?.id
        });

      if (error) {
        if (error.code === '42P01') {
          console.warn('Contacts table does not exist. Please run database migrations.');
          alert('Erro: Tabelas do banco de dados não encontradas. Execute as migrações.');
        } else {
          console.error('Error converting lead to contact:', error);
        }
      } else {
        await handleStatusChange(lead.id, 'qualified');
        alert('Lead convertido em contato com sucesso!');
      }
    } catch (error) {
      console.warn('Could not convert lead to contact:', error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.source.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'new': return 'bg-primary-100 text-primary-800';
    case 'contacted': return 'bg-yellow-100 text-yellow-800';
    case 'qualified': return 'bg-primary-200 text-primary-900';
    case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInterestLevelDisplay = (level: Lead['interest_level']) => {
    switch (level) {
      case 'muito_frio':
        return { icon: '🧊', text: 'Muito Frio', color: 'text-primary-600 dark:text-primary-400' };
      case 'frio':
        return { icon: '❄️', text: 'Frio', color: 'text-cyan-600 dark:text-cyan-400' };
      case 'morno':
        return { icon: '🌡️', text: 'Morno', color: 'text-yellow-600 dark:text-yellow-400' };
      case 'quente':
        return { icon: '🔥', text: 'Quente', color: 'text-orange-600 dark:text-orange-400' };
      case 'muito_quente':
        return { icon: '🌋', text: 'Muito Quente', color: 'text-red-600 dark:text-red-400' };
      default:
        return { icon: '🌡️', text: 'Morno', color: 'text-yellow-600 dark:text-yellow-400' };
    }
  };

  const getStatusLabel = (status: Lead['status']) => {
    switch (status) {
      case 'new': return 'Novo';
      case 'contacted': return 'Contatado';
      case 'qualified': return 'Qualificado';
      case 'lost': return 'Perdido';
      default: return status;
    }
  };

  const leadStats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    lost: leads.filter(l => l.status === 'lost').length,
    totalValue: leads.reduce((sum, lead) => sum + (lead.value || 0), 0)
  };

  const getLeadSourceData = () => {
    const sources = leads.reduce((acc, lead) => {
      const key = lead.source || 'Outros';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  };

  const leadSourceColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#A3E635', '#22C55E', '#E11D48'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie seus leads e oportunidades</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Lead
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{leadStats.total}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Novos</p>
              <p className="text-2xl font-bold text-primary-600">{leadStats.new}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Contatados</p>
              <p className="text-2xl font-bold text-yellow-600">{leadStats.contacted}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Qualificados</p>
              <p className="text-2xl font-bold text-primary-700">{leadStats.qualified}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Perdidos</p>
              <p className="text-2xl font-bold text-red-600">{leadStats.lost}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
              <p className="text-lg font-bold text-primary-600">R$ {leadStats.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Abas da página */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('lista')}
          className={`px-4 py-2 rounded-lg border ${activeTab === 'lista' ? 'bg-primary-600 text-white border-primary-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
          Lista
        </button>
        <button
          onClick={() => setActiveTab('origem')}
          className={`px-4 py-2 rounded-lg border ${activeTab === 'origem' ? 'bg-primary-600 text-white border-primary-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
          Origem dos Leads
        </button>
      </div>

      {activeTab === 'origem' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mt-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Origem dos Leads</h3>
          <div className="w-full" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getLeadSourceData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  dataKey="value"
                >
                  {getLeadSourceData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={leadSourceColors[index % leadSourceColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar leads..."
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
          <option value="new">Novos</option>
          <option value="contacted">Contatados</option>
          <option value="qualified">Qualificados</option>
          <option value="lost">Perdidos</option>
        </select>
      </div>

      {/* Lista de leads */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Lead</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Contato</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Empresa</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Origem</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Nível de Interesse</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Valor</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    Nenhum lead encontrado
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 dark:text-primary-400 font-medium">
                            {lead.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">{lead.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {lead.company && (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">{lead.company}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-900 dark:text-white capitalize">{lead.source}</span>
                    </td>
                    <td className="p-4">
                      {(() => {
                        const interestDisplay = getInterestLevelDisplay(lead.interest_level);
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{interestDisplay.icon}</span>
                            <span className={`text-sm font-medium ${interestDisplay.color}`}>
                              {interestDisplay.text}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-4">
                      {lead.value && (
                        <span className="text-sm font-medium text-primary-600">
                          R$ {lead.value.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as Lead['status'])}
                        className={`text-xs font-medium rounded-full px-2.5 py-0.5 border-0 ${getStatusColor(lead.status)}`}
                      >
                        <option value="new">Novo</option>
                        <option value="contacted">Contatado</option>
                        <option value="qualified">Qualificado</option>
                        <option value="lost">Perdido</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => convertToContact(lead)}
                          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          title="Converter em contato"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(lead)}
                          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
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
        <LeadForm
          lead={editingLead}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default Leads;