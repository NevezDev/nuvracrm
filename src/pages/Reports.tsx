import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Calendar, TrendingUp, Users, Target, DollarSign, Activity, Download, Filter, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExcelReportService, ReportData } from '../services/excelReportService';

interface ExtendedReportData extends ReportData {
  contacts: any[];
  leads: any[];
  deals: any[];
  activities: any[];
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ExtendedReportData>({
    contacts: [],
    leads: [],
    deals: [],
    activities: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // últimos 30 dias
  const [selectedReport, setSelectedReport] = useState('overview');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadReportData();
    }
  }, [user, dateRange]);

  const loadReportData = async () => {
    console.log('=== VERIFICAÇÃO DE USUÁRIO ===');
    console.log('User object:', user);
    if (!user) {
      console.error('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));



      // Buscar dados com relacionamentos para relatórios mais completos
      // TEMPORÁRIO: Removendo filtro de data para verificar se existem dados
      const [contactsResult, leadsResult, dealsResult, activitiesResult] = await Promise.all([
        supabase
          .from('contacts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('deals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('activities')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      // Handle each result individually
      const contacts = contactsResult.error && contactsResult.error.code === '42P01' ? [] : contactsResult.data || [];
      const leads = leadsResult.error && leadsResult.error.code === '42P01' ? [] : leadsResult.data || [];
      const deals = dealsResult.error && dealsResult.error.code === '42P01' ? [] : dealsResult.data || [];
      const activities = activitiesResult.error && activitiesResult.error.code === '42P01' ? [] : activitiesResult.data || [];

      // Log warnings for missing tables
      if (contactsResult.error?.code === '42P01') console.warn('Contacts table does not exist. Please run database migrations.');
      if (leadsResult.error?.code === '42P01') console.warn('Leads table does not exist. Please run database migrations.');
      if (dealsResult.error?.code === '42P01') console.warn('Deals table does not exist. Please run database migrations.');
      if (activitiesResult.error?.code === '42P01') console.warn('Activities table does not exist. Please run database migrations.');

      // Debug: Log any errors and data counts
      console.log('=== DEBUG CARREGAMENTO DE DADOS ===');
      console.log('User ID:', user.id);
      console.log('Date Range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });
      console.log('Resultados das consultas:', {
        contactsError: contactsResult.error,
        leadsError: leadsResult.error,
        dealsError: dealsResult.error,
        activitiesError: activitiesResult.error,
        contactsCount: contacts.length,
        leadsCount: leads.length,
        dealsCount: deals.length,
        activitiesCount: activities.length
      });
      
      // Log detalhado dos deals
      console.log('=== DEALS DETALHADOS ===');
      deals.forEach((deal, index) => {
        console.log(`Deal ${index + 1}:`, {
          id: deal.id,
          title: deal.title,
          value: deal.value,
          valueType: typeof deal.value,
          status: deal.status,
          created_at: deal.created_at
        });
      });
      
      // Log detalhado dos leads
      console.log('=== LEADS DETALHADOS ===');
      leads.forEach((lead, index) => {
        console.log(`Lead ${index + 1}:`, {
          id: lead.id,
          name: lead.name,
          value: lead.value,
          valueType: typeof lead.value,
          status: lead.status,
          created_at: lead.created_at
        });
      });

      setData({
        contacts,
        leads,
        deals,
        activities
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      setData({
        contacts: [],
        leads: [],
        deals: [],
        activities: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Dados para gráficos
  const getMonthlyData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthContacts = data.contacts.filter(c => {
        const createdAt = new Date(c.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length;

      const monthLeads = data.leads.filter(l => {
        const createdAt = new Date(l.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length;

      const monthDeals = data.deals.filter(d => {
        const createdAt = new Date(d.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length;

      const monthRevenue = data.deals.filter(d => {
        const createdAt = new Date(d.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd && d.status === 'closed_won';
      }).reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);

      months.push({
        name: format(date, 'MMM', { locale: ptBR }),
        contacts: monthContacts,
        leads: monthLeads,
        deals: monthDeals,
        revenue: monthRevenue
      });
    }
    return months;
  };

  const getLeadSourceData = () => {
    const sources = data.leads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  };

  const getDealStatusData = () => {
    const statuses = data.deals.reduce((acc, deal) => {
      const statusLabels = {
        prospecting: 'Prospecção',
        negotiation: 'Negociação',
        closed_won: 'Fechadas - Ganhas',
        closed_lost: 'Fechadas - Perdidas'
      };
      const label = statusLabels[deal.status as keyof typeof statusLabels] || deal.status;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444'];
    return Object.entries(statuses).map(([name, value], index) => ({ 
      name, 
      value, 
      color: colors[index % colors.length] 
    }));
  };

  const getActivityTypeData = () => {
    const types = data.activities.reduce((acc, activity) => {
      const typeLabels = {
        call: 'Ligações',
        email: 'Emails',
        meeting: 'Reuniões',
        task: 'Tarefas'
      };
      const label = typeLabels[activity.type as keyof typeof typeLabels] || activity.type;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(types).map(([name, value]) => ({ name, value }));
  };

  const getConversionFunnel = () => {
    const totalLeads = data.leads.length;
    const qualifiedLeads = data.leads.filter(l => l.status === 'qualified').length;
    const totalDeals = data.deals.length;
    const wonDeals = data.deals.filter(d => d.status === 'closed_won').length;

    return [
      { name: 'Leads', value: totalLeads, percentage: 100 },
      { name: 'Qualificados', value: qualifiedLeads, percentage: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0 },
      { name: 'Oportunidades', value: totalDeals, percentage: totalLeads > 0 ? (totalDeals / totalLeads) * 100 : 0 },
      { name: 'Fechadas', value: wonDeals, percentage: totalLeads > 0 ? (wonDeals / totalLeads) * 100 : 0 }
    ];
  };

  // Estatísticas gerais com debug
  const wonDeals = data.deals.filter(d => d.status === 'closed_won');
  console.log('Won deals for revenue calculation:', wonDeals);
  
  const totalRevenue = wonDeals.reduce((sum, deal) => {
    const value = Number(deal.value) || 0;
    console.log('Processing deal for revenue:', {
      id: deal.id,
      title: deal.title,
      value: deal.value,
      convertedValue: value,
      status: deal.status
    });
    return sum + value;
  }, 0);
  
  console.log('Final total revenue:', totalRevenue);
  
  const allDealsValue = data.deals.reduce((sum, deal) => {
    const value = Number(deal.value) || 0;
    return sum + value;
  }, 0);

  // Debug logs
  console.log('Debug Relatórios:', {
    totalContacts: data.contacts.length,
    totalLeads: data.leads.length,
    totalDeals: data.deals.length,
    wonDealsCount: wonDeals.length,
    wonDeals: wonDeals.map(d => ({ id: d.id, title: d.title, value: d.value, status: d.status })),
    allDeals: data.deals.map(d => ({ id: d.id, title: d.title, value: d.value, status: d.status })),
    totalRevenue,
    allDealsValue
  });

  const stats = {
    totalContacts: data.contacts.length,
    totalLeads: data.leads.length,
    totalDeals: data.deals.length,
    totalRevenue,
    conversionRate: data.leads.length > 0 ? (wonDeals.length / data.leads.length) * 100 : 0,
    avgDealValue: wonDeals.length > 0 ? (totalRevenue / wonDeals.length) : 0
  };

  const exportExcelReport = async (reportType: 'overview' | 'sales' | 'leads' | 'activities' | 'financial' = 'overview') => {
    setExportLoading(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));
      
      const options = {
        dateRange,
        startDate,
        endDate,
        reportType
      };

      if (reportType === 'overview') {
        ExcelReportService.generateExcelReport(data, options);
      } else {
        ExcelReportService.generateSpecificReport(data, options, reportType);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório Excel:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setExportLoading(false);
    }
  };

  const exportCSV = () => {
    const csvData = [
      ['Tipo', 'Total', 'Período'],
      ['Contatos', stats.totalContacts, `Últimos ${dateRange} dias`],
      ['Leads', stats.totalLeads, `Últimos ${dateRange} dias`],
      ['Oportunidades', stats.totalDeals, `Últimos ${dateRange} dias`],
      ['Receita Total', `R$ ${stats.totalRevenue.toLocaleString()}`, `Últimos ${dateRange} dias`],
      ['Taxa de Conversão', `${stats.conversionRate.toFixed(1)}%`, `Últimos ${dateRange} dias`],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-resumo-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
          <p className="text-gray-600 dark:text-gray-400">Análise completa do desempenho do Nuvra CRM</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
          
          {/* Dropdown de Exportação */}
          <div className="relative group">
            <button
              disabled={exportLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {exportLoading ? 'Gerando...' : 'Exportar Excel'}
            </button>
            
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-2">
                <button
                  onClick={() => exportExcelReport('overview')}
                  disabled={exportLoading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Relatório Completo
                </button>
                <button
                  onClick={() => exportExcelReport('sales')}
                  disabled={exportLoading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Relatório de Vendas
                </button>
                <button
                  onClick={() => exportExcelReport('leads')}
                  disabled={exportLoading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Relatório de Leads
                </button>
                <button
                  onClick={() => exportExcelReport('activities')}
                  disabled={exportLoading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  Relatório de Atividades
                </button>
                <button
                  onClick={() => exportExcelReport('financial')}
                  disabled={exportLoading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Relatório Financeiro
                </button>
                <hr className="my-2 border-gray-200 dark:border-gray-600" />
                <button
                  onClick={exportCSV}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV (Resumo)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Contatos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalContacts}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Leads</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalLeads}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Oportunidades</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalDeals}</p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receita</p>
              <p className="text-2xl font-bold text-emerald-600">R$ {stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Conversão</p>
              <p className="text-2xl font-bold text-orange-600">{stats.conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ticket Médio</p>
              <p className="text-2xl font-bold text-red-600">R$ {stats.avgDealValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução mensal */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Evolução Mensal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={getMonthlyData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="contacts" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="leads" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="deals" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Receita mensal */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Receita Mensal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getMonthlyData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${value}`, 'Receita']} />
              <Bar dataKey="revenue" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Origem dos leads */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Origem dos Leads</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getLeadSourceData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getLeadSourceData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status das oportunidades */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status das Oportunidades</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getDealStatusData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getDealStatusData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funil de conversão */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Funil de Conversão</h3>
        <div className="space-y-4">
          {getConversionFunnel().map((stage, index) => (
            <div key={stage.name} className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-gray-900 dark:text-white">
                {stage.name}
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-8 relative">
                <div
                  className="bg-blue-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium transition-all duration-500"
                  style={{ width: `${stage.percentage}%` }}
                >
                  {stage.percentage > 20 && `${stage.value} (${stage.percentage.toFixed(1)}%)`}
                </div>
                {stage.percentage <= 20 && (
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-900 dark:text-white">
                    {stage.value} ({stage.percentage.toFixed(1)}%)
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Atividades por tipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Atividades por Tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getActivityTypeData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resumo de performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumo de Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Leads Qualificados</span>
              <span className="text-sm font-bold text-green-600">
                {data.leads.filter(l => l.status === 'qualified').length} / {data.leads.length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Oportunidades Fechadas</span>
              <span className="text-sm font-bold text-blue-600">
                {data.deals.filter(d => d.status === 'closed_won').length} / {data.deals.length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Atividades Concluídas</span>
              <span className="text-sm font-bold text-purple-600">
                {data.activities.filter(a => a.status === 'completed').length} / {data.activities.length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Valor Médio por Deal</span>
              <span className="text-sm font-bold text-emerald-600">
                R$ {stats.avgDealValue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;