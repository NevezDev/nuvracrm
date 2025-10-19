import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Integration {
  id?: string;
  name: string;
  type: string;
  config: any;
  status: 'active' | 'inactive' | 'error';
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
    const integrationId = pathParts[pathParts.length - 1];

    // GET /integrations/:id
    if (req.method === 'GET' && integrationId && integrationId !== 'integrations') {
      const { data, error } = await supabaseClient
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Integration not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /integrations
    if (req.method === 'GET') {
      let query = supabaseClient.from('integrations').select('*');

      // Filtros via query string
      const name = url.searchParams.get('name');
      const type = url.searchParams.get('type');
      const status = url.searchParams.get('status');
      const created_after = url.searchParams.get('created_after');
      const created_before = url.searchParams.get('created_before');

      if (name) query = query.ilike('name', `%${name}%`);
      if (type) query = query.eq('type', type);
      if (status) query = query.eq('status', status);
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

    // POST /integrations
    if (req.method === 'POST') {
      const body: Integration = await req.json();

      // Validação de campos obrigatórios
      if (!body.name || !body.type) {
        return new Response(
          JSON.stringify({ error: 'Name and type are required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validação de tipos válidos
      const validTypes = ['whatsapp', 'n8n', 'zapier', 'slack', 'sendgrid', 'webhook'];
      if (!validTypes.includes(body.type)) {
        return new Response(
          JSON.stringify({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validação de status
      const validStatuses = ['active', 'inactive', 'error'];
      if (body.status && !validStatuses.includes(body.status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status. Must be one of: active, inactive, error' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const integrationData = {
        name: body.name,
        type: body.type,
        config: body.config || {},
        status: body.status || 'inactive',
        user_id: body.user_id
      };

      const { data, error } = await supabaseClient
        .from('integrations')
        .insert([integrationData])
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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