import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const url = new URL(req.url);
    const reportType = url.searchParams.get('type') || 'overview';
    const dateRange = url.searchParams.get('days') || '30';
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'user_id parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /reports
    if (req.method === 'GET') {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      try {
        // Buscar dados de todos os modelos
        const [contactsResult, leadsResult, dealsResult, activitiesResult] = await Promise.all([
          supabaseClient.from('contacts').select('*').eq('user_id', userId).gte('created_at', startDate.toISOString()),
          supabaseClient.from('leads').select('*').eq('user_id', userId).gte('created_at', startDate.toISOString()),
          supabaseClient.from('deals').select('*').eq('user_id', userId).gte('created_at', startDate.toISOString()),
          supabaseClient.from('activities').select('*').eq('user_id', userId).gte('created_at', startDate.toISOString())
        ]);

        const contacts = contactsResult.data || [];
        const leads = leadsResult.data || [];
        const deals = dealsResult.data || [];
        const activities = activitiesResult.data || [];

        // Calcular estatísticas
        const totalRevenue = deals
          .filter(deal => deal.status === 'closed_won')
          .reduce((sum, deal) => sum + deal.value, 0);

        const pipelineValue = deals
          .filter(deal => ['prospecting', 'negotiation'].includes(deal.status))
          .reduce((sum, deal) => sum + deal.value, 0);

        const conversionRate = leads.length > 0 
          ? (deals.filter(d => d.status === 'closed_won').length / leads.length) * 100 
          : 0;

        const avgDealValue = deals.length > 0 
          ? deals.reduce((sum, deal) => sum + deal.value, 0) / deals.length 
          : 0;

        // Estatísticas por status
        const leadsByStatus = {
          new: leads.filter(l => l.status === 'new').length,
          contacted: leads.filter(l => l.status === 'contacted').length,
          qualified: leads.filter(l => l.status === 'qualified').length,
          lost: leads.filter(l => l.status === 'lost').length
        };

        const dealsByStatus = {
          prospecting: deals.filter(d => d.status === 'prospecting').length,
          negotiation: deals.filter(d => d.status === 'negotiation').length,
          closed_won: deals.filter(d => d.status === 'closed_won').length,
          closed_lost: deals.filter(d => d.status === 'closed_lost').length
        };

        const activitiesByType = {
          call: activities.filter(a => a.type === 'call').length,
          email: activities.filter(a => a.type === 'email').length,
          meeting: activities.filter(a => a.type === 'meeting').length,
          task: activities.filter(a => a.type === 'task').length
        };

        const activitiesByStatus = {
          pending: activities.filter(a => a.status === 'pending').length,
          completed: activities.filter(a => a.status === 'completed').length,
          cancelled: activities.filter(a => a.status === 'cancelled').length
        };

        // Origem dos leads
        const leadSources = leads.reduce((acc, lead) => {
          acc[lead.source] = (acc[lead.source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Dados mensais (últimos 6 meses)
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date();
          monthDate.setMonth(monthDate.getMonth() - i);
          const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
          const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
          
          const monthContacts = contacts.filter(c => {
            const createdAt = new Date(c.created_at);
            return createdAt >= monthStart && createdAt <= monthEnd;
          }).length;

          const monthLeads = leads.filter(l => {
            const createdAt = new Date(l.created_at);
            return createdAt >= monthStart && createdAt <= monthEnd;
          }).length;

          const monthDeals = deals.filter(d => {
            const createdAt = new Date(d.created_at);
            return createdAt >= monthStart && createdAt <= monthEnd;
          }).length;

          const monthRevenue = deals.filter(d => {
            const createdAt = new Date(d.created_at);
            return createdAt >= monthStart && createdAt <= monthEnd && d.status === 'closed_won';
          }).reduce((sum, deal) => sum + deal.value, 0);

          monthlyData.push({
            month: monthDate.toISOString().slice(0, 7), // YYYY-MM
            contacts: monthContacts,
            leads: monthLeads,
            deals: monthDeals,
            revenue: monthRevenue
          });
        }

        const reportData = {
          period: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            days: parseInt(dateRange)
          },
          summary: {
            total_contacts: contacts.length,
            total_leads: leads.length,
            total_deals: deals.length,
            total_activities: activities.length,
            total_revenue: totalRevenue,
            pipeline_value: pipelineValue,
            conversion_rate: conversionRate,
            avg_deal_value: avgDealValue
          },
          leads: {
            total: leads.length,
            by_status: leadsByStatus,
            by_source: leadSources
          },
          deals: {
            total: deals.length,
            by_status: dealsByStatus,
            total_value: deals.reduce((sum, deal) => sum + deal.value, 0)
          },
          activities: {
            total: activities.length,
            by_type: activitiesByType,
            by_status: activitiesByStatus
          },
          monthly_data: monthlyData,
          funnel: {
            leads: leads.length,
            qualified_leads: leads.filter(l => l.status === 'qualified').length,
            deals: deals.length,
            won_deals: deals.filter(d => d.status === 'closed_won').length
          }
        };

        return new Response(
          JSON.stringify(reportData),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Error generating report: ' + error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})