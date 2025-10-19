import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Contact {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  status: 'active' | 'inactive';
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
    const contactId = pathParts[pathParts.length - 1];

    // GET /contacts/:id
    if (req.method === 'GET' && contactId && contactId !== 'contacts') {
      const { data, error } = await supabaseClient
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Contact not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /contacts
    if (req.method === 'GET') {
      let query = supabaseClient.from('contacts').select('*');

      // Filtros via query string
      const name = url.searchParams.get('name');
      const email = url.searchParams.get('email');
      const company = url.searchParams.get('company');
      const status = url.searchParams.get('status');
      const created_after = url.searchParams.get('created_after');
      const created_before = url.searchParams.get('created_before');

      if (name) query = query.ilike('name', `%${name}%`);
      if (email) query = query.ilike('email', `%${email}%`);
      if (company) query = query.ilike('company', `%${company}%`);
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

    // POST /contacts
    if (req.method === 'POST') {
      const body: Contact = await req.json();

      // Validação de campos obrigatórios
      if (!body.name || !body.email) {
        return new Response(
          JSON.stringify({ error: 'Name and email are required fields' }),
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

      const contactData = {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        company: body.company || null,
        position: body.position || null,
        status: body.status || 'active',
        user_id: body.user_id
      };

      const { data, error } = await supabaseClient
        .from('contacts')
        .insert([contactData])
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