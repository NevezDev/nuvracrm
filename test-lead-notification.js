// Script para testar a criação de lead via API e verificar se notificações são geradas
// Este script simula o que o n8n faria ao criar um lead

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

// Função para obter um user_id válido do sistema
async function getUserId() {
  try {
    // Primeiro, vamos tentar obter um lead existente para pegar o user_id
    const response = await fetch(`${SUPABASE_URL}/rest/v1/leads?limit=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      }
    });

    const leads = await response.json();
    
    if (leads && leads.length > 0) {
      console.log('📋 Usando user_id de lead existente:', leads[0].user_id);
      return leads[0].user_id;
    }

    // Se não há leads, vamos tentar contatos
    const contactResponse = await fetch(`${SUPABASE_URL}/rest/v1/contacts?limit=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      }
    });

    const contacts = await contactResponse.json();
    
    if (contacts && contacts.length > 0) {
      console.log('📋 Usando user_id de contato existente:', contacts[0].user_id);
      return contacts[0].user_id;
    }

    // Se não há dados, gerar um UUID válido para teste
    const testUserId = generateUUID();
    console.log('⚠️ Nenhum usuário encontrado, usando UUID de teste:', testUserId);
    return testUserId;

  } catch (error) {
    console.error('❌ Erro ao obter user_id:', error);
    return generateUUID();
  }
}

async function testLeadCreation() {
  try {
    console.log('🧪 Testando criação de lead via API...');
    
    // Dados do lead de teste (simulando dados do n8n)
    const leadData = {
      name: 'João Silva (Teste n8n)',
      email: 'joao.teste@example.com',
      phone: '(11) 99999-9999',
      company: 'Empresa Teste Ltda',
      source: 'n8n Automation',
      status: 'new',
      value: 5000,
      user_id: await getUserId() // Obter ID do usuário automaticamente
    };

    // Fazer requisição para a Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Lead criado com sucesso:', result);
      
      // Aguardar um pouco para o trigger processar
      console.log('⏳ Aguardando processamento do trigger...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se a notificação foi criada
      const notificationResponse = await fetch(`${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${leadData.user_id}&order=created_at.desc&limit=1`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      const notifications = await notificationResponse.json();
      
      if (notifications && notifications.length > 0) {
        const latestNotification = notifications[0];
        if (latestNotification.category === 'lead' && latestNotification.metadata?.lead_id === result.id) {
          console.log('🔔 Notificação criada com sucesso:', latestNotification);
          console.log('✅ Teste concluído com sucesso! As notificações estão funcionando.');
        } else {
          console.log('⚠️ Notificação encontrada, mas não corresponde ao lead criado:', latestNotification);
        }
      } else {
        console.log('❌ Nenhuma notificação foi criada para o lead.');
      }
      
    } else {
      console.error('❌ Erro ao criar lead:', result);
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testLeadCreation();