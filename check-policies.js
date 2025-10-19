#!/usr/bin/env node

// Verificar políticas RLS ativas
const SUPABASE_URL = 'https://hdclvugsuwaxhuaywvgd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkY2x2dWdzdXdheGh1YXl3dmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODc1NDYsImV4cCI6MjA2ODM2MzU0Nn0.HSqpn5SiprxzWqpdn3CRVrusbKjEIMIM0u4qbcwvxPs';

async function checkPolicies() {
  try {
    console.log('🔍 Verificando políticas RLS...');
    
    // Verificar se a tabela notifications existe
    const response = await fetch(`${SUPABASE_URL}/rest/v1/notifications?limit=0`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      }
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      console.log('✅ Tabela notifications existe e é acessível');
    } else {
      const error = await response.json();
      console.log('❌ Erro ao acessar tabela notifications:', error);
    }

    // Verificar se a tabela notification_templates existe
    const templatesResponse = await fetch(`${SUPABASE_URL}/rest/v1/notification_templates?limit=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      }
    });

    console.log('📊 Status templates:', templatesResponse.status);
    
    if (templatesResponse.ok) {
      const templates = await templatesResponse.json();
      console.log('✅ Tabela notification_templates existe');
      console.log('📋 Templates encontrados:', templates.length);
      if (templates.length > 0) {
        console.log('📋 Primeiro template:', templates[0]);
      }
    } else {
      const error = await templatesResponse.json();
      console.log('❌ Erro ao acessar templates:', error);
    }

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

// Executar verificação
checkPolicies();