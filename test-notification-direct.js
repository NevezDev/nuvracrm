#!/usr/bin/env node

// Teste direto de criação de notificação
const SUPABASE_URL = 'https://hdclvugsuwaxhuaywvgd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkY2x2dWdzdXdheGh1YXl3dmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODc1NDYsImV4cCI6MjA2ODM2MzU0Nn0.HSqpn5SiprxzWqpdn3CRVrusbKjEIMIM0u4qbcwvxPs';

// Função para gerar UUID válido
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testNotificationCreation() {
  try {
    console.log('🧪 Testando criação direta de notificação...');
    
    const testUserId = generateUUID();
    console.log('📋 Usando UUID de teste:', testUserId);

    // Criar notificação diretamente
    const notificationData = {
      user_id: testUserId,
      title: 'Teste de Notificação',
      message: 'Esta é uma notificação de teste criada via API',
      type: 'info',
      read: false,
      metadata: {
        test: true,
        created_by: 'test-script'
      }
    };

    console.log('📤 Criando notificação...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(notificationData)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Erro ao criar notificação:', error);
      return;
    }

    const notification = await response.json();
    console.log('✅ Notificação criada com sucesso!');
    console.log('📋 ID da notificação:', notification[0]?.id);
    console.log('📋 Dados:', notification[0]);

    // Verificar se a notificação foi criada
    console.log('🔍 Verificando notificação criada...');
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${testUserId}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      }
    });

    const notifications = await checkResponse.json();
    console.log('📊 Notificações encontradas:', notifications.length);
    
    if (notifications.length > 0) {
      console.log('✅ Teste de notificação bem-sucedido!');
      console.log('📋 Primeira notificação:', notifications[0]);
    } else {
      console.log('⚠️ Nenhuma notificação encontrada');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testNotificationCreation();