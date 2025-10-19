import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface ChatMessage {
  id?: string;
  conversation_id: string;
  content: string;
  sender_type: 'user' | 'contact';
  sender_name: string;
  sender_id?: string;
  message_type: 'text' | 'image' | 'file' | 'audio' | 'video';
  platform: 'whatsapp' | 'instagram' | 'telegram' | 'internal';
  platform_message_id?: string;
  metadata?: any;
  read?: boolean;
  user_id: string;
}

interface Conversation {
  id?: string;
  contact_name: string;
  contact_phone: string;
  contact_avatar?: string;
  platform: 'whatsapp' | 'instagram' | 'telegram' | 'internal';
  platform_contact_id?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  status?: 'active' | 'archived' | 'blocked';
  contact_id?: string;
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
    const resource = pathParts[pathParts.length - 2]; // conversations ou messages
    const id = pathParts[pathParts.length - 1];

    // GET /chat/conversations
    if (req.method === 'GET' && resource === 'conversations') {
      const userId = url.searchParams.get('user_id');
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'user_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let query = supabaseClient.from('conversations').select('*').eq('user_id', userId);

      // Filtros
      const platform = url.searchParams.get('platform');
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search');

      if (platform && platform !== 'all') query = query.eq('platform', platform);
      if (status) query = query.eq('status', status);
      if (search) {
        query = query.or(`contact_name.ilike.%${search}%,last_message.ilike.%${search}%`);
      }

      const { data, error } = await query.order('last_message_time', { ascending: false });

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

    // GET /chat/messages/:conversation_id
    if (req.method === 'GET' && resource === 'messages' && id) {
      const { data, error } = await supabaseClient
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

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

    // POST /chat/conversations
    if (req.method === 'POST' && resource === 'conversations') {
      const body: Conversation = await req.json();

      if (!body.contact_name || !body.contact_phone || !body.platform || !body.user_id) {
        return new Response(
          JSON.stringify({ error: 'contact_name, contact_phone, platform and user_id are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const conversationData = {
        contact_name: body.contact_name,
        contact_phone: body.contact_phone,
        contact_avatar: body.contact_avatar,
        platform: body.platform,
        platform_contact_id: body.platform_contact_id,
        status: body.status || 'active',
        contact_id: body.contact_id,
        user_id: body.user_id
      };

      const { data, error } = await supabaseClient
        .from('conversations')
        .insert([conversationData])
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

    // POST /chat/messages
    if (req.method === 'POST' && resource === 'messages') {
      const body: ChatMessage = await req.json();

      if (!body.conversation_id || !body.content || !body.sender_type || !body.sender_name || !body.platform || !body.user_id) {
        return new Response(
          JSON.stringify({ error: 'conversation_id, content, sender_type, sender_name, platform and user_id are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const messageData = {
        conversation_id: body.conversation_id,
        content: body.content,
        sender_type: body.sender_type,
        sender_name: body.sender_name,
        sender_id: body.sender_id,
        message_type: body.message_type || 'text',
        platform: body.platform,
        platform_message_id: body.platform_message_id,
        metadata: body.metadata || {},
        read: body.read || (body.sender_type === 'user'),
        user_id: body.user_id
      };

      const { data, error } = await supabaseClient
        .from('chat_messages')
        .insert([messageData])
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Se for mensagem do usuário, tentar enviar via integração
      if (body.sender_type === 'user') {
        try {
          await sendPlatformMessage(supabaseClient, body.conversation_id, body.content, body.platform);
        } catch (error) {
          console.error('Error sending platform message:', error);
          // Não falhar a requisição se o envio falhar
        }
      }

      return new Response(
        JSON.stringify(data),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT /chat/messages/:id/read
    if (req.method === 'PUT' && pathParts.includes('read')) {
      const messageId = pathParts[pathParts.length - 2];
      
      const { data, error } = await supabaseClient
        .from('chat_messages')
        .update({ read: true })
        .eq('id', messageId)
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
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

// Função para enviar mensagem via plataforma
async function sendPlatformMessage(
  supabaseClient: any,
  conversationId: string,
  content: string,
  platform: string
) {
  try {
    // Buscar dados da conversa
    const { data: conversation } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!conversation) return;

    // Buscar integração ativa da plataforma
    const { data: integration } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('type', platform)
      .eq('status', 'active')
      .single();

    if (!integration) {
      console.warn(`No active ${platform} integration found`);
      return;
    }

    switch (platform) {
      case 'whatsapp':
        await sendWhatsAppMessage(integration.config, conversation.contact_phone, content);
        break;
      case 'instagram':
        await sendInstagramMessage(integration.config, conversation.platform_contact_id, content);
        break;
      case 'telegram':
        await sendTelegramMessage(integration.config, conversation.platform_contact_id, content);
        break;
      default:
        // Chat interno - não precisa enviar para plataforma externa
        break;
    }
  } catch (error) {
    console.error('Error sending platform message:', error);
    throw error;
  }
}

// Enviar mensagem WhatsApp
async function sendWhatsAppMessage(config: any, phone: string, message: string) {
  const { accessToken, phoneNumberId } = config;
  
  const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message }
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send WhatsApp message');
  }

  return await response.json();
}

// Enviar mensagem Instagram
async function sendInstagramMessage(config: any, recipientId: string, message: string) {
  const { accessToken, pageId } = config;
  
  const response = await fetch(`https://graph.facebook.com/v17.0/${pageId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message }
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send Instagram message');
  }

  return await response.json();
}

// Enviar mensagem Telegram
async function sendTelegramMessage(config: any, chatId: string, message: string) {
  const { botToken } = config;
  
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send Telegram message');
  }

  return await response.json();
}