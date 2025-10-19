import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Activity {
  id?: string;
  title: string;
  description?: string;
  type: 'call' | 'email' | 'meeting' | 'task';
  status: 'pending' | 'completed' | 'cancelled';
  due_date?: string;
  contact_id?: string;
  deal_id?: string;
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
      Deno.env.get('SUPABASE_URL') ?? 'https://ukeoflberlzhfqmvukwi.supabase.co',
      Deno.env.get('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZW9mbGJlcmx6aGZxbXZ1a3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1OTc0NzAsImV4cCI6MjA2NTE3MzQ3MH0._DganS7vCm4POieMeh-S55tkVsSKRFAFdv1z1aARZ2A') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const activityId = pathParts[pathParts.length - 1];

    // GET /activities/:id
    if (req.method === 'GET' && activityId && activityId !== 'activities') {
      const { data, error } = await supabaseClient
        .from('activities')
        .select(`
          *,
          contacts (
            id,
            name,
            email,
            company
          ),
          deals (
            id,
            title,
            value
          )
        `)
        .eq('id', activityId)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Activity not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /activities
    if (req.method === 'GET') {
      let query = supabaseClient.from('activities').select(`
        *,
        contacts (
          id,
          name,
          email,
          company
        ),
        deals (
          id,
          title,
          value
        )
      `);

      // Filtros via query string
      const title = url.searchParams.get('title');
      const type = url.searchParams.get('type');
      const status = url.searchParams.get('status');
      const contact_id = url.searchParams.get('contact_id');
      const deal_id = url.searchParams.get('deal_id');
      const due_after = url.searchParams.get('due_after');
      const due_before = url.searchParams.get('due_before');
      const created_after = url.searchParams.get('created_after');
      const created_before = url.searchParams.get('created_before');

      if (title) query = query.ilike('title', `%${title}%`);
      if (type) query = query.eq('type', type);
      if (status) query = query.eq('status', status);
      if (contact_id) query = query.eq('contact_id', contact_id);
      if (deal_id) query = query.eq('deal_id', deal_id);
      if (due_after) query = query.gte('due_date', due_after);
      if (due_before) query = query.lte('due_date', due_before);
      if (created_after) query = query.gte('created_at', created_after);
      if (created_before) query = query.lte('created_at', created_before);

      const { data, error } = await query.order('due_date', { ascending: true, nullsLast: true });

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

    // POST /activities
    if (req.method === 'POST') {
      const body: Activity = await req.json();

      // Validação de campos obrigatórios
      if (!body.title || !body.type) {
        return new Response(
          JSON.stringify({ error: 'Title and type are required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validação de tipo
      const validTypes = ['call', 'email', 'meeting', 'task'];
      if (!validTypes.includes(body.type)) {
        return new Response(
          JSON.stringify({ error: 'Invalid type. Must be one of: call, email, meeting, task' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validação de status
      const validStatuses = ['pending', 'completed', 'cancelled'];
      if (body.status && !validStatuses.includes(body.status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status. Must be one of: pending, completed, cancelled' }),
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

      // Validação de deal_id se fornecido
      if (body.deal_id) {
        const { data: deal } = await supabaseClient
          .from('deals')
          .select('id')
          .eq('id', body.deal_id)
          .eq('user_id', body.user_id)
          .single();

        if (!deal) {
          return new Response(
            JSON.stringify({ error: 'Deal not found or does not belong to user' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const activityData = {
        title: body.title,
        description: body.description || null,
        type: body.type,
        status: body.status || 'pending',
        due_date: body.due_date || null,
        contact_id: body.contact_id || null,
        deal_id: body.deal_id || null,
        user_id: body.user_id
      };

      const { data, error } = await supabaseClient
        .from('activities')
        .insert([activityData])
        .select(`
          *,
          contacts (
            id,
            name,
            email,
            company
          ),
          deals (
            id,
            title,
            value
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