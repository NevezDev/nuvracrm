import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Lead {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
  value?: number;
  created_at?: string;
  updated_at?: string;
  user_id: string;
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
    const pathParts = url.pathname.split('/');
    const leadId = pathParts[pathParts.length - 1];

    // GET /leads/:id
    if (req.method === 'GET' && leadId && leadId !== 'leads') {
      const { data, error } = await supabaseClient
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Lead not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /leads
    if (req.method === 'GET') {
      let query = supabaseClient.from('leads').select('*');

      // Filtros via query string
      const name = url.searchParams.get('name');
      const email = url.searchParams.get('email');
      const company = url.searchParams.get('company');
      const source = url.searchParams.get('source');
      const status = url.searchParams.get('status');
      const value_min = url.searchParams.get('value_min');
      const value_max = url.searchParams.get('value_max');
      const created_after = url.searchParams.get('created_after');
      const created_before = url.searchParams.get('created_before');

      if (name) query = query.ilike('name', `%${name}%`);
      if (email) query = query.ilike('email', `%${email}%`);
      if (company) query = query.ilike('company', `%${company}%`);
      if (source) query = query.ilike('source', `%${source}%`);
      if (status) query = query.eq('status', status);
      if (value_min) query = query.gte('value', parseFloat(value_min));
      if (value_max) query = query.lte('value', parseFloat(value_max));
      if (created_after) query = query.gte('created_at', created_after);
      if (created_before) query = query.lte('created_at', created_before);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data, count: data?.length || 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /leads
    if (req.method === 'POST') {
      const body: Lead = await req.json();

      // Validação de campos obrigatórios
      if (!body.name || !body.email || !body.source) {
        return new Response(
          JSON.stringify({ error: 'Name, email and source are required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validação de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validação de status
      const validStatuses = ['new', 'contacted', 'qualified', 'lost'];
      if (body.status && !validStatuses.includes(body.status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status. Must be one of: new, contacted, qualified, lost' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const leadData = {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        company: body.company || null,
        source: body.source,
        status: body.status || 'new',
        value: body.value || 0,
        user_id: body.user_id
      };

      const { data, error } = await supabaseClient
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Criar notificação para o novo lead (fallback caso o trigger SQL não funcione)
      try {
        await supabaseClient
          .from('notifications')
          .insert([{
            user_id: data.user_id,
            title: 'Novo Lead Recebido',
            message: `Um novo lead ${data.name} foi adicionado ao sistema.`,
            type: 'info',
            category: 'lead',
            priority: 'medium',
            action_url: `/leads/${data.id}`,
            action_label: 'Ver Lead',
            metadata: {
              lead_id: data.id,
              lead_name: data.name,
              lead_email: data.email,
              lead_source: data.source,
              lead_status: data.status
            },
            read: false
          }]);
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Não falhar a criação do lead se a notificação falhar
      }

      return new Response(
        JSON.stringify(data),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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