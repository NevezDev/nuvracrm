# 🚀 Guia de Migração - Google Calendar Integration

## 📋 Passo a Passo

### **1. Acesse o Supabase Dashboard**
- Vá para [supabase.com](https://supabase.com)
- Faça login na sua conta
- Selecione seu projeto

### **2. Abra o SQL Editor**
- No menu lateral, clique em **"SQL Editor"**
- Clique em **"New query"**

### **3. Execute a Migração**
Copie e cole o conteúdo do arquivo `20250720000002_google_calendar_simple.sql`:

```sql
-- Migração simplificada para integração com Google Calendar
-- Data: 2025-07-20

-- Criar função update_updated_at_column se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabela para configurações de integração do Google Calendar
CREATE TABLE IF NOT EXISTS google_calendar_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  calendar_id text NOT NULL DEFAULT 'primary',
  sync_enabled boolean DEFAULT true,
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela para rastrear eventos sincronizados
CREATE TABLE IF NOT EXISTS google_calendar_synced_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_event_id text NOT NULL,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_direction text NOT NULL CHECK (sync_direction IN ('google_to_crm', 'crm_to_google')),
  last_sync timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(google_event_id, activity_id)
);

-- Habilitar RLS
ALTER TABLE google_calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_synced_events ENABLE ROW LEVEL SECURITY;

-- Políticas para google_calendar_integrations
CREATE POLICY "Users can read own google calendar integrations"
  ON google_calendar_integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own google calendar integrations"
  ON google_calendar_integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own google calendar integrations"
  ON google_calendar_integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own google calendar integrations"
  ON google_calendar_integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para google_calendar_synced_events
CREATE POLICY "Users can read own synced events"
  ON google_calendar_synced_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own synced events"
  ON google_calendar_synced_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own synced events"
  ON google_calendar_synced_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own synced events"
  ON google_calendar_synced_events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS google_calendar_integrations_user_id_idx ON google_calendar_integrations(user_id);
CREATE INDEX IF NOT EXISTS google_calendar_synced_events_user_id_idx ON google_calendar_synced_events(user_id);
CREATE INDEX IF NOT EXISTS google_calendar_synced_events_google_event_id_idx ON google_calendar_synced_events(google_event_id);
CREATE INDEX IF NOT EXISTS google_calendar_synced_events_activity_id_idx ON google_calendar_synced_events(activity_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_google_calendar_integrations_updated_at BEFORE UPDATE ON google_calendar_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_calendar_synced_events_updated_at BEFORE UPDATE ON google_calendar_synced_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **4. Clique em "Run"**
- Clique no botão **"Run"** para executar a migração
- Aguarde a execução completar

### **5. Verificar Sucesso**
Execute este SQL para verificar se tudo foi criado:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('google_calendar_integrations', 'google_calendar_synced_events');

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE '%google%';
```

## ✅ **Resultado Esperado**

Você deve ver:
- ✅ 2 tabelas criadas: `google_calendar_integrations` e `google_calendar_synced_events`
- ✅ 8 políticas RLS criadas
- ✅ 4 índices criados
- ✅ 2 triggers criados

## 🎯 **Próximos Passos**

1. **Configure as credenciais** do Google no `.env.local`
2. **Teste a integração** na agenda do Nuvra CRM
3. **Conecte sua conta** Google

## 🆘 **Se Houver Erro**

Se aparecer algum erro:
1. **Copie a mensagem exata** do erro
2. **Verifique se a tabela `activities` existe**
3. **Execute primeiro a migração inicial** se necessário

A migração simplificada deve funcionar sem problemas! 🚀 