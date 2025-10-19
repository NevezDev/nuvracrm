# 🔧 Solução de Problemas - Supabase

## ❌ Erro: "relation 'events' does not exist"

### **Causa do Problema**
Este erro geralmente ocorre quando:
1. A migração foi executada incorretamente
2. Há referências a tabelas que não existem
3. A migração foi executada fora de ordem

### **Solução**

#### **1. Verificar Migrações Existentes**
No Supabase Dashboard, vá para **SQL Editor** e execute:

```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%google%';
```

#### **2. Executar Migração Corrigida**
Execute a migração corrigida: `20250720000001_google_calendar_integration_fixed.sql`

#### **3. Verificar Estrutura do Banco**
```sql
-- Verificar se a tabela activities existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'activities'
);

-- Verificar se a função update_updated_at_column existe
SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'update_updated_at_column'
);
```

#### **4. Limpar e Recriar (se necessário)**
Se o problema persistir, execute:

```sql
-- Remover tabelas se existirem
DROP TABLE IF EXISTS google_calendar_synced_events CASCADE;
DROP TABLE IF EXISTS google_calendar_integrations CASCADE;

-- Executar migração novamente
-- (copie e cole o conteúdo do arquivo 20250720000001_google_calendar_integration_fixed.sql)
```

## ✅ **Verificação de Sucesso**

Após executar a migração, verifique se tudo foi criado corretamente:

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

-- Verificar índices
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename LIKE '%google%';
```

## 🔍 **Logs de Erro Comuns**

### **Erro 42P01: relation does not exist**
- **Causa**: Tabela não foi criada
- **Solução**: Executar migração novamente

### **Erro 42710: duplicate key value**
- **Causa**: Política ou índice já existe
- **Solução**: Usar `DROP IF EXISTS` antes de criar

### **Erro 42883: function does not exist**
- **Causa**: Função `update_updated_at_column` não existe
- **Solução**: Executar migração inicial primeiro

## 📋 **Checklist de Migração**

- [ ] Executar migração inicial: `20250717212812_weathered_shrine.sql`
- [ ] Executar migração do Google Calendar: `20250720000001_google_calendar_integration_fixed.sql`
- [ ] Verificar se as tabelas foram criadas
- [ ] Verificar se as políticas RLS estão ativas
- [ ] Testar inserção de dados de teste

## 🚀 **Teste Rápido**

Após a migração, teste inserindo dados de exemplo:

```sql
-- Inserir configuração de teste (substitua o user_id)
INSERT INTO google_calendar_integrations (
  user_id, 
  access_token, 
  refresh_token, 
  calendar_id
) VALUES (
  'seu-user-id-aqui',
  'test-token',
  'test-refresh-token',
  'primary'
);

-- Verificar se foi inserido
SELECT * FROM google_calendar_integrations;
```

## 📞 **Suporte**

Se o problema persistir:
1. Verifique os logs completos no Supabase Dashboard
2. Confirme que todas as migrações foram executadas
3. Verifique se não há conflitos de nomes
4. Teste em um ambiente limpo se necessário 