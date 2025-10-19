import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Target, TrendingUp, Activity, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardStats {
  totalContacts: number;
  totalLeads: number;
  totalDeals: number;
  totalRevenue: number;
  pendingActivities: number;
  todayActivities: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    totalLeads: 0,
    totalDeals: 0,
    totalRevenue: 0,
    pendingActivities: 0,
    todayActivities: 0,
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [dealsByStatus, setDealsByStatus] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setDbError(null);

    const statsData = {
      totalContacts: 0,
      totalLeads: 0,
      totalDeals: 0,
      totalRevenue: 0,
      pendingActivities: 0,
      todayActivities: 0,
    };

    let deals: any[] = [];
    let activities: any[] = [];

    try {
      const contactsRes = await supabase.from('contacts').select('*', { count: 'exact' }).eq('user_id', user.id);
      if (contactsRes.error && contactsRes.error.code === '42P01') {
        console.warn('Contacts table does not exist. Please run database migrations.');
      } else if (contactsRes.error) {
        throw contactsRes.error;
      } else {
        statsData.totalContacts = contactsRes.count || 0;
      }
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      if (error.code === '42P01') {
        setDbError('Database tables not found. Please run migrations.');
      }
    }

    try {
      const leadsRes = await supabase.from('leads').select('*', { count: 'exact' }).eq('user_id', user.id);
      if (leadsRes.error && leadsRes.error.code === '42P01') {
        console.warn('Leads table does not exist. Please run database migrations.');
      } else if (leadsRes.error) {
        throw leadsRes.error;
      } else {
        statsData.totalLeads = leadsRes.count || 0;
      }
    } catch (error: any) {
      console.error('Error fetching leads:', error);
    }

    try {
      const dealsRes = await supabase.from('deals').select('*').eq('user_id', user.id);
      if (dealsRes.error && dealsRes.error.code === '42P01') {
        console.warn('Deals table does not exist. Please run database migrations.');
      } else if (dealsRes.error) {
        throw dealsRes.error;
      } else {
        deals = dealsRes.data || [];
        statsData.totalDeals = deals.length;
      }
    } catch (error: any) {
      console.error('Error fetching deals:', error);
    }

    try {
      const activitiesRes = await supabase.from('activities').select('*').eq('user_id', user.id);
      if (activitiesRes.error && activitiesRes.error.code === '42P01') {
        console.warn('Activities table does not exist. Please run database migrations.');
      } else if (activitiesRes.error) {
        throw activitiesRes.error;
      } else {
        activities = activitiesRes.data || [];
      }
    } catch (error: any) {
      console.error('Error fetching activities:', error);
    }

    const revenue = deals.filter((deal) => deal.status === 'closed_won').reduce((sum, deal) => sum + deal.value, 0);
    const pendingActivities = activities.filter((activity) => activity.status === 'pending').length;
    const today = new Date().toISOString().split('T')[0];
    const todayActivities = activities.filter((activity) => activity.due_date && activity.due_date.startsWith(today)).length;

    statsData.totalRevenue = revenue;
    statsData.pendingActivities = pendingActivities;
    statsData.todayActivities = todayActivities;

    setStats(statsData);

    const statusCounts = deals.reduce((acc, deal) => {
      acc[deal.status] = (acc[deal.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setDealsByStatus([
      { name: 'Prospecção', value: statusCounts.prospecting || 0, color: '#3B82F6' },
      { name: 'Negociação', value: statusCounts.negotiation || 0, color: '#F59E0B' },
      { name: 'Fechadas', value: statusCounts.closed_won || 0, color: '#10B981' },
      { name: 'Perdidas', value: statusCounts.closed_lost || 0, color: '#EF4444' },
    ]);

    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const monthRevenue = deals
        .filter((deal) => {
          const dealDate = new Date(deal.created_at);
          return dealDate >= monthStart && dealDate <= monthEnd && deal.status === 'closed_won';
        })
        .reduce((sum, deal) => sum + deal.value, 0);
      monthlyData.push({
        name: date.toLocaleDateString('pt-BR', { month: 'short' }),
        revenue: monthRevenue,
      });
    }
    setMonthlyRevenue(monthlyData);

    const recentActivitiesData = activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
    setRecentActivities(recentActivitiesData);
  };

  const statCards = [
    { title: 'Contatos', value: stats.totalContacts, icon: Users, color: 'blue' },
    { title: 'Leads', value: stats.totalLeads, icon: UserPlus, color: 'green' },
    { title: 'Oportunidades', value: stats.totalDeals, icon: Target, color: 'purple' },
    { title: 'Receita Total', value: `R$ ${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'emerald' },
    { title: 'Atividades Pendentes', value: stats.pendingActivities, icon: Activity, color: 'orange' },
    { title: 'Atividades Hoje', value: stats.todayActivities, icon: Calendar, color: 'red' },
  ];

  const getColorClass = (color: string) => {
    const colors = {
      blue: 'bg-purple-500',
      green: 'bg-purple-600',
      purple: 'bg-purple-500',
      emerald: 'bg-purple-600',
      orange: 'bg-purple-400',
      red: 'bg-red-500',
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500';
  };

  const filteredDealsByStatus = dealsByStatus.filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Visão geral do seu Nuvra CRM</p>
      </div>

      {dbError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Database Setup Required</h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>{dbError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
              <div className={`p-3 rounded-full ${getColorClass(card.color)}`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Receita Mensal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${value}`, 'Receita']} />
              <Bar dataKey="revenue" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Oportunidades por Status</h3>
          {filteredDealsByStatus.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              Sem dados disponíveis
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={filteredDealsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  isAnimationActive={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {filteredDealsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Atividades Recentes</h3>
        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Nenhuma atividade recente</p>
          ) : (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-shrink-0">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.type} • {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : activity.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {activity.status === 'pending' ? 'Pendente' : activity.status === 'completed' ? 'Concluída' : 'Cancelada'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
