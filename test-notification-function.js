#!/usr/bin/env node

// Teste da função SQL create_lead_notification
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

async function testNotificationFunction() {
  try {
    console.log('🧪 Testando função SQL create_lead_notification...');
    
    const testUserId = generateUUID();
    const testLeadId = generateUUID();
    console.log('📋 Usando UUID de usuário:', testUserId);
    console.log('📋 Usando UUID de lead:', testLeadId);

    // Simular dados de um lead
    const leadData = {
      id: testLeadId,
      name: 'João Silva',
      email: 'joao@exemplo.com',
      user_id: testUserId
    };

    // Chamar a função SQL via RPC
    console.log('📤 Chamando função create_lead_notification...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_lead_notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_user_id: testUserId,
        p_lead_name: leadData.name,
        p_lead_id: testLeadId
      })
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Erro ao chamar função:', error);
      
      // Tentar criar notificação manualmente usando INSERT
      console.log('🔄 Tentando inserção manual...');
      await testManualInsert(testUserId, leadData);
      return;
    }

    const result = await response.json();
    console.log('✅ Função executada com sucesso!');
    console.log('📋 Resultado:', result);

    // Verificar se a notificação foi criada
    await checkNotifications(testUserId);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

async function testManualInsert(userId, leadData) {
  try {
    // Primeiro, buscar o template
    const templateResponse = await fetch(`${SUPABASE_URL}/rest/v1/notification_templates?name=eq.new_lead`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      }
    });

    const templates = await templateResponse.json();
    if (!templates || templates.length === 0) {
      console.error('❌ Template new_lead não encontrado');
      return;
    }

    const template = templates[0];
    console.log('📋 Template encontrado:', template.name);

    // Criar notificação manualmente
    const notification = {
      user_id: userId,
      title: template.title_template,
      message: template.message_template.replace('{{lead_name}}', leadData.name),
      type: template.type,
      read: false,
      metadata: {
        lead_id: leadData.id,
        lead_name: leadData.name,
        template_used: template.name
      }
    };

    console.log('📤 Inserindo notificação manualmente...');
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(notification)
    });

    if (!insertResponse.ok) {
      const error = await insertResponse.json();
      console.error('❌ Erro na inserção manual:', error);
      return;
    }

    const result = await insertResponse.json();
    console.log('✅ Notificação inserida manualmente!');
    console.log('📋 Notificação criada:', result[0]);

  } catch (error) {
    console.error('❌ Erro na inserção manual:', error);
  }
}

async function checkNotifications(userId) {
  try {
    console.log('🔍 Verificando notificações criadas...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${userId}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      }
    });

    const notifications = await response.json();
    console.log('📊 Notificações encontradas:', notifications.length);
    
    if (notifications.length > 0) {
      console.log('✅ Notificações criadas com sucesso!');
      notifications.forEach((notif, index) => {
        console.log(`📋 Notificação ${index + 1}:`, {
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.type
        });
      });
    } else {
      console.log('⚠️ Nenhuma notificação encontrada');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar notificações:', error);
  }
}

// Executar teste
testNotificationFunction();