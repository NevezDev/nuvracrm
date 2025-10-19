import { supabase } from '../lib/supabase';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  content: string;
  sender_type: 'user' | 'contact';
  sender_name: string;
  sender_id?: string;
  message_type: 'text' | 'image' | 'file' | 'audio' | 'video';
  platform: 'whatsapp' | 'instagram' | 'telegram' | 'internal';
  platform_message_id?: string;
  metadata?: any;
  created_at: string;
  read: boolean;
  user_id: string;
}

export interface Conversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  contact_avatar?: string;
  platform: 'whatsapp' | 'instagram' | 'telegram' | 'internal';
}

// Configuração da API do Chatwoot
const CHATWOOT_BASE_URL = 'https://n8n-chatwoot.3kuf6w.easypanel.host';
const ACCOUNT_ID = '3';
const API_KEY = 'Vdtq5Er59Mbp5EpgrUAmiD9L';

// 🔄 Buscar conversas do Chatwoot
export async function getConversationsFromChatwoot() {
  const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations`, {
    headers: {
      api_access_token: API_KEY
    }
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar conversas');
  }

  const data = await response.json();
  return data.payload || [];
}

// 💬 Buscar mensagens de uma conversa específica
export async function getMessagesFromChatwoot(conversationId: number) {
  const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`, {
    headers: {
      api_access_token: API_KEY
    }
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar mensagens');
  }

  const data = await response.json();
  return data.payload || [];
}

// 📤 Enviar mensagem para uma conversa do Chatwoot
export async function sendMessageToChatwoot(conversationId: number, content: string) {
  const response = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      api_access_token: API_KEY
    },
    body: JSON.stringify({
      content,
      message_type: 1 // outgoing
    })
  });

  if (!response.ok) {
    throw new Error('Erro ao enviar mensagem');
  }

  return true;
}
