import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Deal {
  id?: string;
  title: string;
  description?: string;
  value: number;
  status: 'prospecting' | 'negotiation' | 'closed_won' | 'closed_lost';
  contact_id?: string;
  expected_close_date?: string;
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
    const dealId = pathParts[pathParts.length - 1];

    // GET /deals/:id
    if (req.method === 'GET' && dealId && dealId !== 'deals') {
      const { data, error } = await supabaseClient
        .from('deals')
        .select(`
          *,
          contacts (
            id,
            name,
            email,
            company
          )
        `)
        .eq('id', dealId)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Deal not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /deals
    if (req.method === 'GET') {
      let query = supabaseClient.from('deals').select(`
        *,
        contacts (
          id,
          name,
          email,
          company
        )
      `);

      // Filtros via query string
      const title = url.searchParams.get('title');
      const status = url.searchParams.get('status');
      const contact_id = url.searchParams.get('contact_id');
      const value_min = url.searchParams.get('value_min');
      const value_max = url.searchParams.get('value_max');
      const expected_close_after = url.searchParams.get('expected_close_after');
      const expected_close_before = url.searchParams.get('expected_close_before');
      const created_after = url.searchParams.get('created_after');
      const created_before = url.searchParams.get('created_before');

      if (title) query = query.ilike('title', `%${title}%`);
      if (status) query = query.eq('status', status);
      if (contact_id) query = query.eq('contact_id', contact_id);
      if (value_min) query = query.gte('value', parseFloat(value_min));
      if (value_max) query = query.lte('value', parseFloat(value_max));
      if (expected_close_after) query = query.gte('expected_close_date', expected_close_after);
      if (expected_close_before) query = query.lte('expected_close_date', expected_close_before);
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

    // POST /deals
    if (req.method === 'POST') {
      const body: Deal = await req.json();

      // Validação de campos obrigatórios
      if (!body.title || body.value === undefined || body.value === null) {
        return new Response(
          JSON.stringify({ error: 'Title and value are required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validação de valor
      if (body.value < 0) {
        return new Response(
          JSON.stringify({ error: 'Value must be a positive number' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validação de status
      const validStatuses = ['prospecting', 'negotiation', 'closed_won', 'closed_lost'];
      if (body.status && !validStatuses.includes(body.status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status. Must be one of: prospecting, negotiation, closed_won, closed_lost' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validação de contact_id se fornecido
      if (body.contact_id) {
        const { data: contact } = await supabaseClient
          .from('contacts')
          .select('id')
          .eq('id', body.contact_id)
          .eq('user_id', body.user_id)
          .single();

        if (!contact) {
          return new Response(
            JSON.stringify({ error: 'Contact not found or does not belong to user' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const dealData = {
        title: body.title,
        description: body.description || null,
        value: body.value,
        status: body.status || 'prospecting',
        contact_id: body.contact_id || null,
        expected_close_date: body.expected_close_date || null,
        user_id: body.user_id
      };

      const { data, error } = await supabaseClient
        .from('deals')
        .insert([dealData])
        .select(`
          *,
          contacts (
            id,
            name,
            email,
            company
          )
        `)
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